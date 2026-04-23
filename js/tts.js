/* ================================================================
   ZS TTS — tts.js
   Shared text-to-speech helper on top of the Web Speech API.
   No external calls; uses the OS-provided voices.

   Stores per-kid preferences under localStorage key `zs_tts` so any
   app in the suite can check `ZsTTS.getSettings().enabled` before
   rendering a read-aloud button.

   Public API:
     ZsTTS.supported()              → bool
     ZsTTS.getSettings(userName?)   → { enabled, rate }
     ZsTTS.setSettings(patch, user?)→ persist partial update
     ZsTTS.speak(text, opts)        → SpeechSynthesisUtterance | null
        opts = { lang, rate, onBoundary(charIndex), onEnd, onError }
     ZsTTS.stop()
     ZsTTS.isSpeaking()             → bool
   ================================================================ */

var ZsTTS = (function() {
  'use strict';

  var STORAGE_KEY = 'zs_tts';
  // Sensible defaults — enabled by default for young readers; rate a
  // touch below normal so newly-reading kids can track the words.
  var DEFAULT_SETTINGS = { enabled: true, rate: 0.85 };

  function supported() {
    return typeof window !== 'undefined'
      && 'speechSynthesis' in window
      && 'SpeechSynthesisUtterance' in window;
  }

  function _userKey(userName) {
    var name = userName;
    if (!name && typeof getActiveUser === 'function') {
      var u = getActiveUser();
      if (u) name = u.name;
    }
    if (!name) return '_default';
    return name.toLowerCase().replace(/\s+/g, '_');
  }

  function _loadAll() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) || {} : {};
    } catch (e) { return {}; }
  }

  function _saveAll(all) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(all)); }
    catch (e) {}
  }

  function getSettings(userName) {
    var all = _loadAll();
    var key = _userKey(userName);
    var s = all[key] || {};
    return {
      enabled: typeof s.enabled === 'boolean' ? s.enabled : DEFAULT_SETTINGS.enabled,
      rate: typeof s.rate === 'number' ? s.rate : DEFAULT_SETTINGS.rate
    };
  }

  function setSettings(patch, userName) {
    if (!patch) return;
    var all = _loadAll();
    var key = _userKey(userName);
    var current = Object.assign({}, DEFAULT_SETTINGS, all[key] || {});
    if (typeof patch.enabled === 'boolean') current.enabled = patch.enabled;
    if (typeof patch.rate === 'number') current.rate = patch.rate;
    all[key] = current;
    _saveAll(all);
    return current;
  }

  function isSpeaking() {
    return supported() && window.speechSynthesis.speaking;
  }

  function stop() {
    if (!supported()) return;
    try { window.speechSynthesis.cancel(); } catch (e) {}
  }

  function speak(text, opts) {
    if (!supported() || !text) return null;
    var s = getSettings();
    if (!s.enabled) return null;

    stop();
    opts = opts || {};

    var utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = opts.lang || 'en-US';
    utterance.rate = typeof opts.rate === 'number' ? opts.rate : s.rate;
    utterance.pitch = typeof opts.pitch === 'number' ? opts.pitch : 1.0;

    if (typeof opts.onBoundary === 'function') {
      utterance.onboundary = function(ev) {
        if (ev.name && ev.name !== 'word') return;
        opts.onBoundary(ev.charIndex);
      };
    }
    if (typeof opts.onEnd === 'function')   utterance.onend   = opts.onEnd;
    if (typeof opts.onError === 'function') utterance.onerror = opts.onError;

    try { window.speechSynthesis.speak(utterance); }
    catch (e) { if (opts.onError) opts.onError(e); return null; }

    return utterance;
  }

  return {
    supported: supported,
    getSettings: getSettings,
    setSettings: setSettings,
    speak: speak,
    stop: stop,
    isSpeaking: isSpeaking
  };
})();
