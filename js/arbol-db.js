/* ================================================================
   ÁRBOL FAMILIAR — where the tree lives (js/arbol-db.js)

   A big family tree (20,000 people from a 10 MB GEDCOM is about 9 MB
   of JSON) does not fit in localStorage: an iPad gives each site about
   5 million characters there, and every app in the suite shares them.
   So the tree is kept in IndexedDB, which allows far more, and synced
   to the family server on its own, compressed and in pieces, because
   the server takes at most 5 MB per request.

   ArbolDB (this device)
     get()            -> Promise<{ tree, ts } | null>
     put(tree, ts)    -> Promise<true>   (rejects if it cannot be saved)
     clear()          -> Promise
     A tree an older version left in localStorage (zs_family_tree) is
     moved here by migrate(), and localStorage is then cleared.

   ArbolSync (the family server, household bucket "_household")
     family_tree        the manifest: { v:2, ts, parts, enc, len, people }
                        (or { v:2, ts, empty:1 } once a parent deletes it)
     family_tree_1..n   the pieces: { i, ts, d: '<text>' }
     enc is 'gzip64' (gzip, then base64) where the browser can compress,
     else 'json'. Pieces are written first and the manifest last, and every
     piece carries the manifest's ts, so a reader never mixes two uploads.
     A tree stored by the first version (a plain v1 tree under
     family_tree) is still read.
   ================================================================ */
(function(root) {
  'use strict';

  var KEY = 'zs_family_tree';              // the old localStorage key, and the server item name below
  var ITEM = 'family_tree';
  var KID = '_household';
  var DB_NAME = 'zs_arbol', STORE = 'kv';
  var PART_CHARS = 1000000;                // ≤ 3 MB as UTF-8 even for raw JSON: under the server's 5 MB
  var TIMEOUT = 60000;

  // ---------------------------------------------------------------
  // IndexedDB, with localStorage as the fallback where it is missing
  // ---------------------------------------------------------------
  var dbp = null;
  function hasIdb() { try { return typeof indexedDB !== 'undefined' && !!indexedDB; } catch (e) { return false; } }
  function open() {
    if (dbp) return dbp;
    dbp = new Promise(function(resolve, reject) {
      if (!hasIdb()) { reject(new Error('no indexedDB')); return; }
      var req;
      try { req = indexedDB.open(DB_NAME, 1); } catch (e) { reject(e); return; }
      req.onupgradeneeded = function() { req.result.createObjectStore(STORE); };
      req.onsuccess = function() { resolve(req.result); };
      req.onerror = function() { reject(req.error || new Error('indexedDB open failed')); };
      req.onblocked = function() { reject(new Error('indexedDB blocked')); };
    });
    dbp.catch(function() { dbp = null; });
    return dbp;
  }
  function tx(mode, fn) {
    return open().then(function(db) {
      return new Promise(function(resolve, reject) {
        var t = db.transaction(STORE, mode), s = t.objectStore(STORE), out;
        fn(s, function(v) { out = v; });
        t.oncomplete = function() { resolve(out); };
        t.onerror = function() { reject(t.error || new Error('indexedDB error')); };
        t.onabort = function() { reject(t.error || new Error('indexedDB aborted')); };
      });
    });
  }

  function lsGet() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var t = JSON.parse(raw);
      return t && typeof t === 'object' ? { tree: t, ts: t._ts || 0 } : null;
    } catch (e) { return null; }
  }

  // A tree left in localStorage (by the first version, or a test) moves to IndexedDB.
  function migrate() {
    var old = lsGet();
    if (!old) return Promise.resolve(false);
    if (!hasIdb()) return Promise.resolve(false);
    return put(old.tree, old.ts || Date.now()).then(function() {
      try { localStorage.removeItem(KEY); } catch (e) {}
      return true;
    }, function() { return false; });
  }

  function get() {
    return migrate().then(function() {
      if (!hasIdb()) return lsGet();
      return tx('readonly', function(s, set) {
        var r = s.get('tree');
        r.onsuccess = function() { set(r.result || null); };
      }).then(function(rec) {
        return rec && rec.tree ? { tree: rec.tree, ts: rec.ts || 0 } : null;
      }, function() { return lsGet(); });
    });
  }

  function put(tree, ts) {
    ts = ts || Date.now();
    if (!hasIdb()) {
      return new Promise(function(resolve, reject) {
        try { var c = Object.assign({}, tree, { _ts: ts }); localStorage.setItem(KEY, JSON.stringify(c)); resolve(true); }
        catch (e) { reject(e); }
      });
    }
    return tx('readwrite', function(s) { s.put({ tree: tree, ts: ts }, 'tree'); }).then(function() { return true; });
  }

  function clear() {
    try { localStorage.removeItem(KEY); } catch (e) {}
    if (!hasIdb()) return Promise.resolve();
    return tx('readwrite', function(s) { s.delete('tree'); }).catch(function() {});
  }

  // ---------------------------------------------------------------
  // Compression (gzip + base64), where the browser has it
  // ---------------------------------------------------------------
  function canGzip() { return typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined' && typeof Blob !== 'undefined' && typeof Response !== 'undefined'; }
  function toB64(bytes) {
    var s = '', i, step = 0x8000;
    for (i = 0; i < bytes.length; i += step) s += String.fromCharCode.apply(null, bytes.subarray(i, i + step));
    return btoa(s);
  }
  function fromB64(b64) {
    var s = atob(b64), out = new Uint8Array(s.length), i;
    for (i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  }
  function encode(text) {
    if (!canGzip()) return Promise.resolve({ enc: 'json', data: text });
    var stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
    return new Response(stream).arrayBuffer().then(function(buf) { return { enc: 'gzip64', data: toB64(new Uint8Array(buf)) }; },
      function() { return { enc: 'json', data: text }; });
  }
  function decode(enc, data) {
    if (enc === 'json') return Promise.resolve(data);
    if (enc !== 'gzip64') return Promise.reject(new Error('unknown encoding'));
    if (!canGzip()) return Promise.reject(new Error('this browser cannot read a compressed tree'));
    var stream = new Blob([fromB64(data)]).stream().pipeThrough(new DecompressionStream('gzip'));
    return new Response(stream).text();
  }
  function split(data) {
    var parts = [], i;
    for (i = 0; i < data.length; i += PART_CHARS) parts.push(data.slice(i, i + PART_CHARS));
    return parts.length ? parts : [''];
  }

  // ---------------------------------------------------------------
  // The server
  // ---------------------------------------------------------------
  function cs() { return typeof CloudSync !== 'undefined' ? CloudSync : null; }
  function online() { var c = cs(); return !!(c && c.online && c.server && (!c.isConfigured || c.isConfigured())); }
  function url(item) { return cs().server + '/api/kids/' + KID + '/' + item; }
  function req(item, opts) {
    opts = opts || {};
    var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = ctl ? setTimeout(function() { ctl.abort(); }, TIMEOUT) : null;
    if (ctl) opts.signal = ctl.signal;
    return fetch(url(item), opts).then(function(res) {
      if (timer) clearTimeout(timer);
      if (!res.ok) throw new Error('http ' + res.status);
      return res.json().catch(function() { return null; });
    }, function(e) { if (timer) clearTimeout(timer); throw e; });
  }
  function putItem(item, body) {
    return req(item, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  }

  // Upload a tree (or null, to delete it). Resolves true when the manifest is saved.
  function push(tree, ts) {
    if (!online()) return Promise.resolve(false);
    ts = ts || Date.now();
    if (!tree) return putItem(ITEM, { v: 2, ts: ts, empty: 1 }).then(function() { return true; });
    var people = tree.P ? Object.keys(tree.P).length : 0;
    return encode(JSON.stringify(tree)).then(function(e) {
      var parts = split(e.data), chain = Promise.resolve();
      parts.forEach(function(d, i) {
        chain = chain.then(function() { return putItem(ITEM + '_' + (i + 1), { i: i + 1, ts: ts, d: d }); });
      });
      return chain.then(function() {
        return putItem(ITEM, { v: 2, ts: ts, parts: parts.length, enc: e.enc, len: e.data.length, people: people });
      }).then(function() { return true; });
    });
  }

  function parseTs(v) {
    if (typeof v === 'number') return v;
    var t = Date.parse(v || '');
    return isNaN(t) ? 0 : t;
  }

  // What the server holds. Resolves:
  //   null                     nothing there (or offline)
  //   { ts, tree:null, empty } a parent deleted it
  //   { ts, tree, manifest }   when it is newer than sinceTs (else { ts, same:true })
  function pull(sinceTs) {
    if (!online()) return Promise.resolve(null);
    return req(ITEM).then(function(m) {
      if (!m || typeof m !== 'object') return null;
      if (m.P && typeof m.P === 'object') {          // a v1 tree, stored whole
        var ts1 = parseTs(m._syncedAt), t1 = Object.assign({}, m);
        delete t1._syncedAt;
        if (!Object.keys(t1.P).length) return { ts: ts1, tree: null, empty: true };
        return ts1 > (sinceTs || 0) ? { ts: ts1, tree: t1 } : { ts: ts1, same: true };
      }
      if (m.v !== 2) return null;
      var ts = Number(m.ts) || 0;
      if (ts <= (sinceTs || 0)) return { ts: ts, same: true };
      if (m.empty) return { ts: ts, tree: null, empty: true };
      var n = m.parts | 0, i, gets = [];
      if (n < 1 || n > 500) throw new Error('bad manifest');
      for (i = 1; i <= n; i++) gets.push(req(ITEM + '_' + i));
      return Promise.all(gets).then(function(parts) {
        var data = '';
        parts.forEach(function(p, k) {
          if (!p || Number(p.ts) !== ts || (p.i | 0) !== k + 1 || typeof p.d !== 'string') throw new Error('the pieces do not match (an upload may be under way)');
          data += p.d;
        });
        if (m.len != null && data.length !== m.len) throw new Error('the tree is incomplete');
        return decode(m.enc, data);
      }).then(function(text) {
        var t = JSON.parse(text);
        if (!t || typeof t !== 'object' || !t.P) throw new Error('not a tree');
        return { ts: ts, tree: t, manifest: m };
      });
    });
  }

  var db = { get: get, put: put, clear: clear, migrate: migrate, KEY: KEY };
  var sync = { push: push, pull: pull, online: online, encode: encode, decode: decode, PART_CHARS: PART_CHARS, ITEM: ITEM };
  root.ArbolDB = db;
  root.ArbolSync = sync;
})(typeof window !== 'undefined' ? window : this);
