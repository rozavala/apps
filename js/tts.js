/* ================================================================
   ZS TTS — tts.js
   Shared text-to-speech helper on top of the Web Speech API.
   No external calls; uses the OS-provided voices.

   Stores per-kid preferences under localStorage key `zs_tts` so any
   app in the suite can check `ZsTTS.getSettings().enabled` before
   rendering a read-aloud button.

   Public API:
     ZsTTS.supported()              → bool
     ZsTTS.getSettings(userName?)   → { enabled, rate, mode }
        mode: 'off' | 'on' (read-aloud buttons) | 'auto' (little-kid
        mode: also reads instructions when a screen opens). Not set:
        'auto' for a kid aged 5 or under, 'on' otherwise. `enabled` is
        the old on/off flag: true unless mode is 'off'.
     ZsTTS.setSettings(patch, user?)→ persist partial update
     ZsTTS.pickVoice(lang)          → the best installed voice, or null
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

  var MODES = ['off', 'on', 'auto'];

  // 5 and under start in little-kid mode; a parent can change it.
  function _defaultMode(userName) {
    var age = null;
    try {
      var name = userName;
      var active = typeof getActiveUser === 'function' ? getActiveUser() : null;
      if (!name && active) name = active.name;
      var list = typeof getProfiles === 'function' ? getProfiles() : [];
      for (var i = 0; i < list.length; i++) {
        if (list[i] && list[i].name === name) { age = Number(list[i].age) || null; break; }
      }
      if (!age && active && active.name === name) age = Number(active.age) || null;
    } catch (e) {}
    return age && age <= 5 ? 'auto' : 'on';
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
    // A mode wins; otherwise an old saved on/off flag; otherwise by age.
    var mode = MODES.indexOf(s.mode) >= 0 ? s.mode
      : s.enabled === false ? 'off'
      : _defaultMode(userName);
    return {
      enabled: mode !== 'off',
      rate: typeof s.rate === 'number' ? s.rate : DEFAULT_SETTINGS.rate,
      mode: mode
    };
  }

  function setSettings(patch, userName) {
    if (!patch) return;
    var all = _loadAll();
    var key = _userKey(userName);
    var current = Object.assign({}, DEFAULT_SETTINGS, all[key] || {});
    var before = getSettings(userName).mode;
    if (MODES.indexOf(patch.mode) >= 0) {
      current.mode = patch.mode;
      current.enabled = patch.mode !== 'off';
    } else if (typeof patch.enabled === 'boolean') {
      current.enabled = patch.enabled;
      current.mode = patch.enabled ? (before === 'auto' ? 'auto' : 'on') : 'off';
    }
    if (typeof patch.rate === 'number') current.rate = patch.rate;
    all[key] = current;
    _saveAll(all);
    return current;
  }

  // The voices the device has load late on some browsers; keep the list fresh.
  var _voices = [];
  function _loadVoices() {
    try { _voices = window.speechSynthesis.getVoices() || []; } catch (e) { _voices = []; }
  }
  if (supported()) {
    _loadVoices();
    try { window.speechSynthesis.addEventListener('voiceschanged', _loadVoices); } catch (e) {}
  }

  // The best voice for a language like 'es-CL' or 'en-US': the exact
  // locale, then Latin American Spanish (closer to Chilean than Spain's),
  // preferring voices stored on the device (no network) and the better
  // quality ones. null when the device has none for that language.
  function pickVoice(lang) {
    _loadVoices();            // an array read; keeps up with voices that arrive late
    if (!lang || !_voices.length) return null;
    var want = String(lang).toLowerCase().replace('_', '-');
    var base = want.split('-')[0];
    var best = null, bestScore = 0;
    _voices.forEach(function(v) {
      var vl = String(v.lang || '').toLowerCase().replace('_', '-');
      if (vl.split('-')[0] !== base) return;
      var score = 1;
      if (vl === want) score += 6;
      else if (base === 'es' && /^es-(mx|us|419|ar|co|pe)/.test(vl)) score += 2;
      else if (base === 'en' && vl === 'en-us') score += 2;
      if (v.localService) score += 2;
      if (/premium|enhanced|natural/i.test(v.name || '')) score += 1;
      if (score > bestScore) { best = v; bestScore = score; }
    });
    return best;
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
    // Callers that know the language pass it; otherwise the kid's own.
    utterance.lang = opts.lang || (typeof getKidLang === 'function' && getKidLang() === 'es' ? 'es-CL' : 'en-US');
    var voice = pickVoice(utterance.lang);
    if (voice) utterance.voice = voice;
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
    pickVoice: pickVoice,
    stop: stop,
    isSpeaking: isSpeaking
  };
})();
