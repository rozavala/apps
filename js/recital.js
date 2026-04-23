/* ================================================================
   RECITAL RECORDER — recital.js
   A shared module that lets music apps (Little Maestro, Guitar Jam)
   capture a short local audio clip per child. Recordings are stored
   in IndexedDB (blobs are too large for localStorage) and surfaced
   in the Parent Dashboard.

   Mount with: RecitalRecorder.mount({ appId: 'piano', title: 'Little Maestro' })

   Public API:
     - mount(opts)     → injects a floating record button
     - list(filterFn)  → Promise<Array<recording>>  (newest first)
     - play(id)        → Promise<HTMLAudioElement>
     - remove(id)      → Promise<void>
     - getCount(user)  → Promise<number>  (for badges / stats)

   Privacy:
     - All audio stays in IndexedDB on-device. No upload, no cloud.
     - Max clip length: 120 seconds. Max clips per kid per app: 10.
   ================================================================ */

var RecitalRecorder = (function() {
  'use strict';

  var DB_NAME = 'zs_recitals';
  var STORE = 'clips';
  var DB_VERSION = 1;
  var MAX_CLIP_MS = 120 * 1000;
  var MAX_PER_USER_PER_APP = 10;

  var _dbPromise = null;

  function _openDB() {
    if (_dbPromise) return _dbPromise;
    _dbPromise = new Promise(function(resolve, reject) {
      if (!('indexedDB' in window)) { reject(new Error('IndexedDB unavailable')); return; }
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function(e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains(STORE)) {
          var store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
          store.createIndex('userApp', ['user', 'app'], { unique: false });
          store.createIndex('user', 'user', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
      req.onsuccess = function() { resolve(req.result); };
      req.onerror = function() { reject(req.error); };
    });
    return _dbPromise;
  }

  function _add(record) {
    return _openDB().then(function(db) {
      return new Promise(function(resolve, reject) {
        var tx = db.transaction(STORE, 'readwrite');
        var store = tx.objectStore(STORE);
        var req = store.add(record);
        req.onsuccess = function() { resolve(req.result); };
        req.onerror = function() { reject(req.error); };
      });
    });
  }

  function list(filterFn) {
    return _openDB().then(function(db) {
      return new Promise(function(resolve, reject) {
        var tx = db.transaction(STORE, 'readonly');
        var store = tx.objectStore(STORE);
        var req = store.openCursor(null, 'prev');
        var results = [];
        req.onsuccess = function(e) {
          var cursor = e.target.result;
          if (cursor) {
            var v = cursor.value;
            if (!filterFn || filterFn(v)) results.push(v);
            cursor.continue();
          } else {
            resolve(results);
          }
        };
        req.onerror = function() { reject(req.error); };
      });
    });
  }

  function remove(id) {
    return _openDB().then(function(db) {
      return new Promise(function(resolve, reject) {
        var tx = db.transaction(STORE, 'readwrite');
        var req = tx.objectStore(STORE).delete(id);
        req.onsuccess = function() { resolve(); };
        req.onerror = function() { reject(req.error); };
      });
    });
  }

  function _get(id) {
    return _openDB().then(function(db) {
      return new Promise(function(resolve, reject) {
        var tx = db.transaction(STORE, 'readonly');
        var req = tx.objectStore(STORE).get(id);
        req.onsuccess = function() { resolve(req.result); };
        req.onerror = function() { reject(req.error); };
      });
    });
  }

  function play(id) {
    return _get(id).then(function(rec) {
      if (!rec) throw new Error('Recording not found');
      var url = URL.createObjectURL(rec.blob);
      var audio = new Audio(url);
      audio.addEventListener('ended', function() { URL.revokeObjectURL(url); });
      audio.play().catch(function() {});
      return audio;
    });
  }

  function getCount(userName) {
    if (!userName) {
      var u = typeof getActiveUser === 'function' ? getActiveUser() : null;
      userName = u ? u.name : null;
    }
    if (!userName) return Promise.resolve(0);
    return list(function(r) { return r.user === userName; }).then(function(arr) { return arr.length; });
  }

  function _pruneIfOverCap(user, app) {
    return list(function(r) { return r.user === user && r.app === app; }).then(function(recs) {
      if (recs.length <= MAX_PER_USER_PER_APP) return;
      // recs are newest-first; drop the oldest beyond the cap.
      var toDelete = recs.slice(MAX_PER_USER_PER_APP);
      return Promise.all(toDelete.map(function(r) { return remove(r.id); }));
    });
  }

  // ── Mount: inject a floating recorder UI ──

  function _css(once) {
    if (document.getElementById('rr-styles')) return;
    var style = document.createElement('style');
    style.id = 'rr-styles';
    style.textContent = [
      '.rr-fab{position:fixed;right:16px;bottom:16px;z-index:900;display:flex;flex-direction:column;align-items:flex-end;gap:8px;font-family:var(--font-body,sans-serif);}',
      '.rr-fab-btn{width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;font-size:1.6rem;background:linear-gradient(135deg,#EF4444,#F87171);color:#fff;box-shadow:0 8px 24px -6px rgba(239,68,68,0.55);transition:transform 0.2s;}',
      '.rr-fab-btn:hover{transform:scale(1.06);} .rr-fab-btn:active{transform:scale(0.96);}',
      '.rr-fab-btn.recording{background:linear-gradient(135deg,#DC2626,#F87171);animation:rr-pulse 1s ease-in-out infinite;}',
      '@keyframes rr-pulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.5);}50%{box-shadow:0 0 0 14px rgba(239,68,68,0);}}',
      '.rr-panel{background:#1A1A3E;border:1.5px solid rgba(255,255,255,0.1);border-radius:16px;padding:12px 14px;color:#F0EDFF;font-size:0.85rem;font-weight:700;display:flex;flex-direction:column;gap:8px;min-width:220px;box-shadow:0 16px 40px -10px rgba(0,0,0,0.6);}',
      '.rr-timer{font-family:var(--font-display,\'Baloo 2\');font-size:1.3rem;color:#F87171;text-align:center;}',
      '.rr-row{display:flex;gap:6px;}',
      '.rr-row button{flex:1;padding:6px 10px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:#F0EDFF;font-weight:700;font-size:0.78rem;cursor:pointer;}',
      '.rr-row button:hover{background:rgba(255,255,255,0.1);}',
      '.rr-row button.primary{background:linear-gradient(135deg,#7C3AED,#A78BFA);border-color:transparent;}',
      '.rr-hint{color:#8B86B0;font-size:0.72rem;font-weight:600;}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function mount(opts) {
    opts = opts || {};
    var appId = opts.appId || 'unknown';
    var appTitle = opts.title || 'Recital';

    var user = typeof getActiveUser === 'function' ? getActiveUser() : null;
    if (!user) return; // no profile, no recording

    if (typeof isGuestUser === 'function' && isGuestUser()) return; // never record guests

    if (!('MediaRecorder' in window)) return;
    if (document.getElementById('rr-fab')) return;

    _css();

    var container = document.createElement('div');
    container.className = 'rr-fab';
    container.id = 'rr-fab';

    var panel = document.createElement('div');
    panel.className = 'rr-panel';
    panel.style.display = 'none';
    panel.innerHTML =
      '<div class="rr-timer" id="rr-timer">00:00</div>' +
      '<div class="rr-row">' +
        '<button id="rr-stop" class="primary">⏹ Stop & Save</button>' +
        '<button id="rr-cancel">✕ Cancel</button>' +
      '</div>' +
      '<div class="rr-hint">Saved locally to Parent Dashboard.</div>';

    var btn = document.createElement('button');
    btn.className = 'rr-fab-btn';
    btn.id = 'rr-record-btn';
    btn.type = 'button';
    btn.title = 'Record recital';
    btn.setAttribute('aria-label', 'Record recital');
    btn.innerHTML = '🎙';

    container.appendChild(panel);
    container.appendChild(btn);
    document.body.appendChild(container);

    var mediaRecorder = null;
    var chunks = [];
    var stream = null;
    var startedAt = 0;
    var tickInterval = null;
    var stopTimer = null;

    function _fmt(ms) {
      var s = Math.floor(ms / 1000);
      var m = Math.floor(s / 60);
      s = s % 60;
      return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }
    function _tick() {
      var el = document.getElementById('rr-timer');
      if (el) el.textContent = _fmt(Date.now() - startedAt);
    }

    function _cleanup() {
      if (tickInterval) { clearInterval(tickInterval); tickInterval = null; }
      if (stopTimer) { clearTimeout(stopTimer); stopTimer = null; }
      if (stream) { stream.getTracks().forEach(function(t) { t.stop(); }); stream = null; }
      mediaRecorder = null;
      chunks = [];
      btn.classList.remove('recording');
      panel.style.display = 'none';
      btn.innerHTML = '🎙';
    }

    function _start() {
      if (mediaRecorder) return;
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Microphone access is not available in this browser.');
        return;
      }
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(function(s) {
          stream = s;
          try {
            mediaRecorder = new MediaRecorder(stream);
          } catch (e) {
            alert('Recording not supported by this browser.');
            _cleanup();
            return;
          }
          chunks = [];
          mediaRecorder.ondataavailable = function(ev) {
            if (ev.data && ev.data.size > 0) chunks.push(ev.data);
          };
          mediaRecorder.onstop = function() {
            var duration = Date.now() - startedAt;
            var blob = new Blob(chunks, { type: chunks[0] && chunks[0].type ? chunks[0].type : 'audio/webm' });
            var record = {
              user: user.name,
              app: appId,
              appTitle: appTitle,
              createdAt: Date.now(),
              duration: duration,
              mime: blob.type,
              blob: blob
            };
            _add(record).then(function() {
              if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
                ActivityLog.log(appTitle, '🎙', 'Recorded recital (' + _fmt(duration) + ')');
              }
              return _pruneIfOverCap(user.name, appId);
            }).catch(function(e) {
              console.warn('[RecitalRecorder] save failed', e);
            });
            _cleanup();
          };
          mediaRecorder.start();
          startedAt = Date.now();
          btn.classList.add('recording');
          btn.innerHTML = '●';
          panel.style.display = '';
          _tick();
          tickInterval = setInterval(_tick, 250);
          stopTimer = setTimeout(_stop, MAX_CLIP_MS);
        })
        .catch(function() {
          alert('Please allow microphone access to record.');
          _cleanup();
        });
    }

    function _stop() {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        try { mediaRecorder.stop(); } catch (e) {}
      } else {
        _cleanup();
      }
    }

    function _cancel() {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        // Drop chunks before stopping
        chunks = [];
        try {
          mediaRecorder.onstop = null;
          mediaRecorder.stop();
        } catch (e) {}
      }
      _cleanup();
    }

    btn.addEventListener('click', function() {
      if (mediaRecorder) { _stop(); return; }
      _start();
    });
    panel.querySelector('#rr-stop').addEventListener('click', _stop);
    panel.querySelector('#rr-cancel').addEventListener('click', _cancel);
  }

  return {
    mount: mount,
    list: list,
    play: play,
    remove: remove,
    getCount: getCount
  };
})();
