/* ================================================================
   ÁRBOL FAMILIAR — voice notes (js/arbol-voice.js)

   A grandparent tells a story, a kid (or a parent) records it on the
   iPad, and it is kept with that person in the tree. The recording goes
   to the family server's file store (vps/family-files.js, the same one
   as the photos: PUT/GET/DELETE /api/files/arbol/<id>); never to this
   repo. The tree keeps only the list, per person, in the part an import
   never touches:

     P[id].a.voice = [{ id, type, t, by, who, dur, w, kids, ts, size }]
       id    32 hex characters (crypto), the file on the server
       type  audio/webm (Chrome), audio/mp4 (Safari, Voice Memos),
             audio/ogg or audio/mpeg
       t     the title ("Cuando la abuela era niña"), plain text
       by    the kid key that recorded it ('' for a parent)
       who   that kid's first name, to show "recorded by Lucía"
       dur   seconds; w  the loudness, 48 digits 0-9 (the waveform)
       kids  1 = the kids may hear it, 0 = parents only
       ts    when it was recorded; size in bytes

   ArbolVoice
     supported()             can this browser record?
     typeOf(file)            an audio file's type, or ''
     Recorder({ onTick })    .start() -> Promise, .stop() -> Promise<take>,
                             .cancel(); onTick({ sec, level }) ~10x a second
                             take = { blob, type, dur, w }
     upload(take, meta)      -> Promise<entry>
     fromFile(file)          an audio file (Voice Memos) -> Promise<take>
     list(tree, pid)         the valid entries
     Player                  .toggle(entry, onState), .stop(), .current()
                             onState({ id, playing, p (0..1), err })
     bars(w)                 48 heights 0..1 from w (or a flat line)
     fmt(sec)                "2:05"
   ================================================================ */
var ArbolVoice = (function() {
  'use strict';

  var MAX_SEC = 600;                 // 10 minutes: ~5 MB at 64 kbit/s, well under the server's 25 MB
  var MAX_BYTES = 25 * 1024 * 1024;
  var BARS = 48;
  // AAC in MP4 first: every device plays it (Safari records it; Chrome can too, else WebM/Opus)
  var CANDIDATES = ['audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];
  var TYPES = { 'audio/webm': 1, 'audio/mp4': 1, 'audio/ogg': 1, 'audio/mpeg': 1 };

  function files() { return typeof ArbolFiles !== 'undefined' ? ArbolFiles : null; }

  function supported() {
    try {
      return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && typeof MediaRecorder !== 'undefined');
    } catch (e) { return false; }
  }
  function recType() {
    if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return '';
    for (var i = 0; i < CANDIDATES.length; i++) { try { if (MediaRecorder.isTypeSupported(CANDIDATES[i])) return CANDIDATES[i]; } catch (e) {} }
    return '';
  }
  // The stored type: no codecs, and the names browsers use for an .m4a.
  function baseType(t) {
    t = String(t || '').split(';')[0].trim().toLowerCase();
    if (t === 'audio/x-m4a' || t === 'audio/m4a' || t === 'audio/aac-mp4') return 'audio/mp4';
    if (t === 'audio/mp3') return 'audio/mpeg';
    if (t === 'video/webm') return 'audio/webm';       // some browsers label an audio-only recording so
    return TYPES[t] ? t : '';
  }
  function typeOf(file) {
    var t = baseType(file && file.type), n = String((file && file.name) || '').toLowerCase();
    if (t) return t;
    if (/\.(m4a|mp4)$/.test(n)) return 'audio/mp4';
    if (/\.mp3$/.test(n)) return 'audio/mpeg';
    if (/\.webm$/.test(n)) return 'audio/webm';
    if (/\.(ogg|oga|opus)$/.test(n)) return 'audio/ogg';
    return '';
  }

  // 48 loudness samples (0..1) -> "0123..." (one digit each)
  function pack(levels) {
    if (!levels.length) return '';
    var out = '', i, n = levels.length, peak = 0;
    for (i = 0; i < n; i++) peak = Math.max(peak, levels[i]);
    peak = peak || 1;
    for (i = 0; i < BARS; i++) {
      var a = Math.floor(i * n / BARS), b = Math.max(a + 1, Math.floor((i + 1) * n / BARS)), m = 0, j;
      for (j = a; j < b && j < n; j++) m = Math.max(m, levels[j]);
      out += String(Math.max(0, Math.min(9, Math.round(m / peak * 9))));
    }
    return out;
  }
  function bars(w) {
    var out = [], i;
    w = /^[0-9]{8,96}$/.test(String(w || '')) ? String(w) : '';
    for (i = 0; i < BARS; i++) out.push(w ? 0.12 + 0.88 * (Number(w.charAt(Math.floor(i * w.length / BARS))) / 9) : 0.18);
    return out;
  }
  function fmt(sec) {
    sec = Math.max(0, Math.round(Number(sec) || 0));
    return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
  }

  // ---------------------------------------------------------------
  // Recording
  // ---------------------------------------------------------------
  function Recorder(opts) {
    opts = opts || {};
    var self = this, stream = null, rec = null, chunks = [], levels = [], ctx = null, an = null, buf = null;
    var t0 = 0, timer = null, done = null, type = '', cancelled = false;

    function level() {
      if (!an) return 0;
      var i, s = 0;
      if (an.getFloatTimeDomainData) {
        buf = buf && buf.length === an.fftSize ? buf : new Float32Array(an.fftSize);
        an.getFloatTimeDomainData(buf);
        for (i = 0; i < buf.length; i++) s += buf[i] * buf[i];
      } else {
        var b = new Uint8Array(an.fftSize);
        an.getByteTimeDomainData(b);
        for (i = 0; i < b.length; i++) { var v = (b[i] - 128) / 128; s += v * v; }
        buf = b;
      }
      return Math.min(1, Math.sqrt(s / buf.length) * 3.2);      // speech sits around 0.05-0.3 RMS
    }
    function tick() {
      var sec = (Date.now() - t0) / 1000, l = level();
      levels.push(l);
      if (opts.onTick) { try { opts.onTick({ sec: sec, level: l }); } catch (e) {} }
      if (sec >= MAX_SEC) self.stop().catch(function() {});   // the caller's own stop() gets the take
    }
    function release() {
      if (timer) { clearInterval(timer); timer = null; }
      if (stream) { try { stream.getTracks().forEach(function(t) { t.stop(); }); } catch (e) {} stream = null; }
      if (ctx) { try { ctx.close(); } catch (e) {} ctx = null; an = null; }
    }

    this.start = function() {
      if (!supported()) return Promise.reject(new Error('unsupported'));
      return navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }).then(function(s) {
        stream = s;
        type = recType();
        var o = { audioBitsPerSecond: 64000 };
        if (type) o.mimeType = type;
        try { rec = new MediaRecorder(s, o); } catch (e) { rec = new MediaRecorder(s); }
        rec.ondataavailable = function(ev) { if (ev.data && ev.data.size) chunks.push(ev.data); };
        done = new Promise(function(resolve) { rec.onstop = function() { resolve(); }; });
        try {
          var AC = window.AudioContext || window.webkitAudioContext;
          if (AC) {
            ctx = new AC();
            an = ctx.createAnalyser(); an.fftSize = 1024;
            ctx.createMediaStreamSource(s).connect(an);
            if (ctx.resume) ctx.resume().catch(function() {});
          }
        } catch (e) { ctx = null; an = null; }
        rec.start(1000);
        t0 = Date.now();
        timer = setInterval(tick, 100);
      }, function(e) {
        var n = e && e.name;
        throw new Error(n === 'NotAllowedError' || n === 'SecurityError' ? 'denied' : n === 'NotFoundError' ? 'nomic' : 'failed');
      });
    };
    var stopping = null;
    this.stop = function() {
      if (!rec) return Promise.reject(new Error('not started'));
      if (stopping) return stopping;          // once only: the 10-minute limit and the Stop button can both ask
      var dur = (Date.now() - t0) / 1000;
      if (timer) { clearInterval(timer); timer = null; }
      if (rec.state !== 'inactive') { try { rec.stop(); } catch (e) {} }
      stopping = done.then(function() {
        release();
        if (cancelled) throw new Error('cancelled');
        var t = baseType(rec.mimeType || type) || baseType(chunks[0] && chunks[0].type) || 'audio/webm';
        var blob = new Blob(chunks, { type: t });
        if (!blob.size) throw new Error('empty');
        return { blob: blob, type: t, dur: Math.round(Math.min(MAX_SEC, dur)), w: pack(levels) };
      });
      return stopping;
    };
    this.cancel = function() {
      cancelled = true;
      if (rec && rec.state !== 'inactive') { try { rec.stop(); } catch (e) {} }
      release();
    };
    this.active = function() { return !!(rec && rec.state === 'recording'); };
  }

  // An audio file a parent already has (Voice Memos, WhatsApp export as .m4a/.mp3).
  function fromFile(file) {
    var t = typeOf(file);
    if (!t) return Promise.reject(new Error('type'));
    if (file.size > MAX_BYTES) return Promise.reject(new Error('size'));
    return new Promise(function(resolve) {
      var u = URL.createObjectURL(file), a = new Audio(), fin = false;
      function end(d) { if (fin) return; fin = true; try { URL.revokeObjectURL(u); } catch (e) {} resolve({ blob: file, type: t, dur: Math.round(isFinite(d) ? d : 0), w: '' }); }
      a.preload = 'metadata';
      a.onloadedmetadata = function() { end(a.duration); };
      a.onerror = function() { end(0); };
      setTimeout(function() { end(0); }, 4000);
      a.src = u;
    });
  }

  function upload(take, meta) {
    meta = meta || {};
    var F = files();
    if (!F) return Promise.reject(new Error('no file store'));
    if (!take || !take.blob || take.blob.size > MAX_BYTES) return Promise.reject(new Error('size'));
    return F.put(take.blob, take.type).then(function(id) {
      return {
        id: id, type: take.type,
        t: String(meta.t || '').replace(/\s+/g, ' ').trim().slice(0, 80),
        by: String(meta.by || '').slice(0, 40), who: String(meta.who || '').slice(0, 30),
        dur: Math.max(0, Math.round(take.dur || 0)), w: take.w || '',
        kids: meta.kids === 0 ? 0 : 1, ts: Date.now(), size: take.blob.size
      };
    });
  }

  function list(tree, pid) {
    var p = tree && tree.P && tree.P[pid], v = p && p.a && Array.isArray(p.a.voice) ? p.a.voice : [];
    return v.filter(function(x) { return x && /^[a-f0-9]{32}$/.test(String(x.id)); })
      .slice().sort(function(a, b) { return (b.ts || 0) - (a.ts || 0); });
  }

  // ---------------------------------------------------------------
  // Playing: the file is fetched and played from memory (a blob URL),
  // so the server needs no byte ranges and Safari plays it all the same.
  // ---------------------------------------------------------------
  var Player = (function() {
    var audio = null, cur = null, cb = null, urls = {}, order = [], loading = null;
    function emit(o) { if (cb) { try { cb(o); } catch (e) {} } }
    function el() {
      if (audio) return audio;
      audio = new Audio();
      audio.preload = 'auto';
      audio.addEventListener('timeupdate', function() { if (cur) emit({ id: cur, playing: !audio.paused, p: audio.duration && isFinite(audio.duration) ? audio.currentTime / audio.duration : 0, t: audio.currentTime }); });
      audio.addEventListener('ended', function() { var id = cur; cur = null; emit({ id: id, playing: false, p: 0, ended: true }); });
      audio.addEventListener('pause', function() { if (cur) emit({ id: cur, playing: false, p: audio.duration && isFinite(audio.duration) ? audio.currentTime / audio.duration : 0, paused: true }); });
      audio.addEventListener('error', function() { if (cur) { var id = cur; cur = null; emit({ id: id, playing: false, p: 0, err: 'play' }); } });
      return audio;
    }
    function blobUrl(entry) {
      if (urls[entry.id]) return Promise.resolve(urls[entry.id]);
      var F = files(), u = F ? F.url(entry.id) : '';
      if (!u) return Promise.reject(new Error('bad id'));
      return fetch(u).then(function(res) {
        if (!res.ok) throw new Error('http ' + res.status);
        return res.blob();
      }).then(function(b) {
        var x = URL.createObjectURL(b.type ? b : new Blob([b], { type: entry.type }));
        urls[entry.id] = x; order.push(entry.id);
        while (order.length > 6) { var old = order.shift(); if (old !== cur) { try { URL.revokeObjectURL(urls[old]); } catch (e) {} delete urls[old]; } }
        return x;
      });
    }
    function stop() {
      var id = cur;
      cur = null; loading = null;
      if (audio) { try { audio.pause(); } catch (e) {} }
      if (id) emit({ id: id, playing: false, p: 0, stopped: true });
    }
    function toggle(entry, onState) {
      var a = el();
      if (cur === entry.id && !a.paused) { a.pause(); return; }
      if (cur === entry.id && a.paused && a.src) { cb = onState || cb; a.play().catch(function() { emit({ id: entry.id, playing: false, err: 'play' }); }); return; }
      stop();
      cb = onState || null; cur = entry.id; loading = entry.id;
      emit({ id: entry.id, playing: false, loading: true, p: 0 });
      blobUrl(entry).then(function(u) {
        if (loading !== entry.id) return;
        loading = null;
        a.src = u;
        return a.play().then(function() { emit({ id: entry.id, playing: true, p: 0 }); });
      }).catch(function(e) {
        if (cur !== entry.id) return;
        cur = null; loading = null;
        emit({ id: entry.id, playing: false, p: 0, err: e && /^http/.test(e.message) ? 'missing' : 'play' });
      });
    }
    // A take not yet uploaded (the preview after recording).
    function playBlob(blob, onState) {
      stop();
      var a = el(), u = URL.createObjectURL(blob);
      cb = onState || null; cur = '_take';
      a.src = u;
      a.play().then(function() { emit({ id: '_take', playing: true, p: 0 }); }, function() { emit({ id: '_take', playing: false, err: 'play' }); });
      return u;
    }
    function forget() {
      stop();
      Object.keys(urls).forEach(function(k) { try { URL.revokeObjectURL(urls[k]); } catch (e) {} });
      urls = {}; order = [];
      if (audio) { try { audio.removeAttribute('src'); audio.load(); } catch (e) {} }
    }
    return { toggle: toggle, stop: stop, playBlob: playBlob, forget: forget, current: function() { return cur; } };
  })();

  return { supported: supported, typeOf: typeOf, baseType: baseType, Recorder: Recorder, fromFile: fromFile, upload: upload, list: list, Player: Player, bars: bars, fmt: fmt, pack: pack, MAX_SEC: MAX_SEC, BARS: BARS };
})();
if (typeof window !== 'undefined') window.ArbolVoice = ArbolVoice;
if (typeof module !== 'undefined' && module.exports) module.exports = ArbolVoice;
