/* ================================================================
   ÁRBOL FAMILIAR — photos and documents per person (js/arbol-files.js)

   A parent attaches pictures or scanned documents (a marriage or baptism
   record, a letter, a portrait) to a person in the tree. The files go to
   the family server (vps/family-files.js: PUT/GET/DELETE
   /api/files/arbol/<id>); the tree keeps only the list, per person, in
   the part an import never touches:

     P[id].a.files = [{ id, th, type, t, kids, ts, size }]
       id    32 hex characters, made here (crypto)
       th    a small JPEG preview's id (photos only)
       type  the stored type (photos are re-saved as JPEG when the browser can read them)
       t     the parent's title ("Acta de matrimonio"), plain text
       kids  1 = the kids may see it, 0 = parents only
       ts    when it was added; size in bytes

   Photos are made smaller before upload (2,400 px on the long side is
   plenty for a scan to stay readable), and a 360 px preview is made for
   the gallery. A photo the browser cannot read (HEIC outside Safari) and
   PDFs go up as they are. 25 MB at most per file, as on the server.
   ================================================================ */
var ArbolFiles = (function() {
  'use strict';

  var MAX = 25 * 1024 * 1024, BIG = 2400, THUMB = 360;
  var TYPES = { 'image/jpeg': 1, 'image/png': 1, 'image/webp': 1, 'image/heic': 1, 'image/heif': 1, 'application/pdf': 1 };

  function newId() {
    var b = new Uint8Array(16), s = '', i;
    crypto.getRandomValues(b);
    for (i = 0; i < b.length; i++) s += (b[i] < 16 ? '0' : '') + b[i].toString(16);
    return s;
  }
  function server() { return typeof CloudSync !== 'undefined' ? CloudSync.server : ''; }
  function url(id) { return /^[a-f0-9]{32}$/.test(String(id)) ? server() + '/api/files/arbol/' + id : ''; }

  // What a file is, by its type or (when the browser leaves it blank, as for HEIC) its name.
  function typeOf(file) {
    var t = String(file.type || '').toLowerCase(), n = String(file.name || '').toLowerCase();
    if (t === 'image/jpg') t = 'image/jpeg';
    if (TYPES[t]) return t;
    if (/\.(jpe?g)$/.test(n)) return 'image/jpeg';
    if (/\.png$/.test(n)) return 'image/png';
    if (/\.webp$/.test(n)) return 'image/webp';
    if (/\.heic$/.test(n)) return 'image/heic';
    if (/\.heif$/.test(n)) return 'image/heif';
    if (/\.pdf$/.test(n)) return 'application/pdf';
    return '';
  }

  function decode(blob) {
    return new Promise(function(resolve) {
      var u = URL.createObjectURL(blob), img = new Image();
      img.onload = function() { resolve(img); };
      img.onerror = function() { URL.revokeObjectURL(u); resolve(null); };
      img.src = u;
    });
  }
  function toJpeg(img, max, q) {
    var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height, k = Math.min(1, max / Math.max(w, h));
    var c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
    var g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);      // transparent PNGs on white
    g.drawImage(img, 0, 0, c.width, c.height);
    return new Promise(function(resolve) {
      c.toBlob(function(b) { c.width = c.height = 0; resolve(b); }, 'image/jpeg', q);   // free the canvas memory (iPad)
    });
  }

  // -> Promise<{ main:{blob,type}, thumb:{blob,type}|null }>, or rejects with Error('type'|'size')
  function prepare(file) {
    var type = typeOf(file);
    if (!type) return Promise.reject(new Error('type'));
    if (type === 'application/pdf') {
      if (file.size > MAX) return Promise.reject(new Error('size'));
      return Promise.resolve({ main: { blob: file, type: type }, thumb: null });
    }
    return decode(file).then(function(img) {
      if (!img) {                                     // e.g. HEIC where the browser cannot show it
        if (file.size > MAX) throw new Error('size');
        return { main: { blob: file, type: type }, thumb: null };
      }
      return Promise.all([toJpeg(img, BIG, 0.86), toJpeg(img, THUMB, 0.74)]).then(function(r) {
        try { URL.revokeObjectURL(img.src); } catch (e) {}
        // bigger than 2,400 px: always the smaller copy; otherwise whichever file is smaller
        var tooBig = Math.max(img.naturalWidth || 0, img.naturalHeight || 0) > BIG;
        var main = r[0] && (tooBig || r[0].size < file.size) ? { blob: r[0], type: 'image/jpeg' } : { blob: file, type: type };
        if (main.blob.size > MAX) throw new Error('size');
        return { main: main, thumb: r[1] ? { blob: r[1], type: 'image/jpeg' } : null };
      });
    });
  }

  function put(blob, type) {
    var id = newId();
    return fetch(url(id), { method: 'PUT', headers: { 'Content-Type': type }, body: blob }).then(function(res) {
      if (!res.ok) throw new Error('http ' + res.status);
      return id;
    });
  }

  // Prepare and upload one file. -> Promise<entry> for P[id].a.files
  function upload(file, title, kids) {
    return prepare(file).then(function(p) {
      return put(p.main.blob, p.main.type).then(function(id) {
        var entry = { id: id, type: p.main.type, t: String(title || '').replace(/\s+/g, ' ').trim().slice(0, 80), kids: kids ? 1 : 0, ts: Date.now(), size: p.main.blob.size };
        if (!p.thumb) return entry;
        return put(p.thumb.blob, p.thumb.type).then(function(th) { entry.th = th; return entry; }, function() { return entry; });
      });
    });
  }

  function remove(entry) {
    var ids = [entry.id, entry.th].filter(Boolean);
    return Promise.all(ids.map(function(id) { return fetch(url(id), { method: 'DELETE' }).catch(function() {}); }));
  }

  function list(tree, pid) {
    var p = tree && tree.P[pid], f = p && p.a && Array.isArray(p.a.files) ? p.a.files : [];
    return f.filter(function(x) { return x && /^[a-f0-9]{32}$/.test(String(x.id)); });
  }
  function isImage(entry) { return /^image\//.test(entry.type); }

  // A face: a square crop of a photo already on the server, cut in the browser.
  // fx, fy: the face's centre (0..1 of the photo); z: zoom (1 = the whole short side).
  // -> Promise<{ id, src, kids }> for P[id].a.face
  function makeFace(entry, fx, fy, z) {
    return new Promise(function(resolve, reject) {
      var img = new Image();
      img.crossOrigin = 'anonymous';             // the server sends CORS headers, so the canvas stays readable
      img.onload = function() { resolve(img); };
      img.onerror = function() { reject(new Error('load')); };
      img.src = url(entry.id);
    }).then(function(img) {
      var w = img.naturalWidth, h = img.naturalHeight, side = Math.min(w, h) / Math.max(1, z || 1);
      var sx = Math.max(0, Math.min(w - side, fx * w - side / 2)), sy = Math.max(0, Math.min(h - side, fy * h - side / 2));
      var c = document.createElement('canvas'); c.width = c.height = 320;
      c.getContext('2d').drawImage(img, sx, sy, side, side, 0, 0, 320, 320);
      return new Promise(function(res) { c.toBlob(function(b) { c.width = c.height = 0; res(b); }, 'image/jpeg', 0.86); });
    }).then(function(blob) {
      if (!blob) throw new Error('crop');
      return put(blob, 'image/jpeg');
    }).then(function(id) { return { id: id, src: entry.id, kids: entry.kids ? 1 : 0 }; });
  }

  return { newId: newId, url: url, typeOf: typeOf, prepare: prepare, upload: upload, remove: remove, list: list, isImage: isImage, makeFace: makeFace, MAX: MAX };
})();
if (typeof window !== 'undefined') window.ArbolFiles = ArbolFiles;
