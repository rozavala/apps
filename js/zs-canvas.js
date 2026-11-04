/* zs-canvas.js — small shared canvas-memory helper (global ZsCanvas, ES5).

   WebKit on iOS caps the total memory of all canvases on a page (a few
   hundred MB on older iPads) and each canvas at ~16.7 M pixels. Past
   that, canvas.getContext('2d') returns null. A canvas dropped from a
   JS cache keeps its memory until garbage collection; setting its width
   and height to 0 frees it at once.

   ZsCanvas.dpr()          devicePixelRatio, capped at 2
   ZsCanvas.get2d(canvas)  the 2d context; if null, asks every onPressure
                           handler to free memory, retries once, and
                           returns null if it is still unavailable
   ZsCanvas.release(c)     frees a canvas's backing store now
   ZsCanvas.releaseIn(el)  releases every canvas inside an element (call
                           before replacing its innerHTML)
   ZsCanvas.onPressure(fn) registers a handler that empties a cache
                           (also run on pagehide)
*/
var ZsCanvas = (function() {
  'use strict';
  var handlers = [];
  var MAX_PX = 16777216;

  function dpr() { return Math.min(window.devicePixelRatio || 1, 2); }

  function release(c) {
    if (!c) return;
    try { c.width = 0; c.height = 0; } catch (e) {}
  }

  function releaseIn(root) {
    if (!root || !root.querySelectorAll) return;
    var list = root.querySelectorAll('canvas');
    for (var i = 0; i < list.length; i++) release(list[i]);
  }

  function onPressure(fn) { if (typeof fn === 'function') handlers.push(fn); }

  function pressure() {
    for (var i = 0; i < handlers.length; i++) {
      try { handlers[i](); } catch (e) {}
    }
  }

  function tryGet(c, opts) {
    try { return opts ? c.getContext('2d', opts) : c.getContext('2d'); } catch (e) { return null; }
  }

  function get2d(c, opts) {
    if (!c) return null;
    // a canvas over the per-canvas pixel cap can never get a context
    if (c.width * c.height > MAX_PX) return null;
    var x = tryGet(c, opts);
    if (x) return x;
    pressure();
    return tryGet(c, opts);
  }

  // Leaving the page (it may be kept in the back/forward cache, whose
  // canvases still count against the same budget): empty the offscreen
  // caches. They are rebuilt on demand; what is on screen is kept.
  try { window.addEventListener('pagehide', pressure); } catch (e) {}

  return { dpr: dpr, get2d: get2d, release: release, releaseIn: releaseIn, onPressure: onPressure };
})();
