/* ================================================================
   ACCESSIBILITY — a11y.js
   Per-kid display preferences applied across the suite:
     - text size  (S / M / L / XL)
     - high-contrast mode
     - reduced motion
     - dyslexia-friendly font (system stack — no extra download)

   Loaded on every page. Re-applies on each navigation by reading
   localStorage, so settings persist even when offline.

   Storage: zs_a11y
     {
       <userKey or "_default">: { scale: 'm', contrast: false,
                                  motion: 'auto', dyslexia: false }
     }
   ================================================================ */

var ZsA11y = (function() {
  'use strict';
  if (typeof window === 'undefined') return null;

  var STORAGE_KEY = 'zs_a11y';
  var SCALES = { s: 0.875, m: 1.0, l: 1.15, xl: 1.3 };
  var DEFAULT = { scale: 'm', contrast: false, motion: 'auto', dyslexia: false };

  function _userKey(name) {
    if (name) return name.toLowerCase().replace(/\s+/g, '_');
    if (typeof getActiveUser === 'function') {
      var u = getActiveUser();
      if (u) return u.name.toLowerCase().replace(/\s+/g, '_');
    }
    return '_default';
  }

  function _loadAll() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) || {}) : {};
    } catch (e) { return {}; }
  }

  function _saveAll(all) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(all)); }
    catch (e) {}
  }

  function getSettings(userName) {
    var all = _loadAll();
    var k = _userKey(userName);
    var s = all[k] || {};
    return {
      scale:    SCALES[s.scale] ? s.scale : DEFAULT.scale,
      contrast: typeof s.contrast === 'boolean' ? s.contrast : DEFAULT.contrast,
      motion:   (s.motion === 'reduce' || s.motion === 'normal') ? s.motion : DEFAULT.motion,
      dyslexia: typeof s.dyslexia === 'boolean' ? s.dyslexia : DEFAULT.dyslexia
    };
  }

  function setSettings(patch, userName) {
    if (!patch) return;
    var all = _loadAll();
    var k = _userKey(userName);
    var current = Object.assign({}, DEFAULT, all[k] || {});
    if (patch.scale && SCALES[patch.scale]) current.scale = patch.scale;
    if (typeof patch.contrast === 'boolean') current.contrast = patch.contrast;
    if (patch.motion === 'reduce' || patch.motion === 'normal' || patch.motion === 'auto') current.motion = patch.motion;
    if (typeof patch.dyslexia === 'boolean') current.dyslexia = patch.dyslexia;
    all[k] = current;
    _saveAll(all);
    apply();
    return current;
  }

  // Apply current user's settings to the document. Idempotent —
  // safe to call repeatedly (eg. after profile switch).
  function apply() {
    var s = getSettings();
    var html = document.documentElement;
    if (!html) return;

    // Scale via root font-size — every rem unit follows.
    var ratio = SCALES[s.scale] || 1.0;
    html.style.fontSize = (16 * ratio) + 'px';

    html.classList.toggle('zs-a11y-hc', !!s.contrast);
    html.classList.toggle('zs-a11y-dyslexia', !!s.dyslexia);

    if (s.motion === 'reduce')      html.classList.add('zs-a11y-reduce-motion');
    else                            html.classList.remove('zs-a11y-reduce-motion');
    // 'auto' defers to the OS via @media(prefers-reduced-motion).
    // 'normal' explicitly removes the class above.
  }

  // Apply once on load, and again whenever a profile change might
  // have occurred (storage event from another tab, or focus-back).
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }
  window.addEventListener('storage', function(e) {
    if (e.key === STORAGE_KEY || e.key === 'zs_active_user') apply();
  });
  window.addEventListener('focus', apply);

  return {
    getSettings: getSettings,
    setSettings: setSettings,
    apply: apply,
    SCALES: SCALES
  };
})();
