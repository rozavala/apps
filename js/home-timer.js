/* ================================================================
   HOME ROUTINES TIMER — home-timer.js
   Real-time step-by-step guide for morning and bedtime routines.

   Different from js/routines.js (habit tracker, streak-focused):
   this one runs a countdown per step with a soft chime between
   transitions. Shares the same template source so edits in
   Parents Corner apply here too.

   Per-step duration defaults, kid can tap Next early (skipped step
   is logged parent-visible).
   ================================================================ */

var HomeTimer = (function() {
  'use strict';

  // Default step durations in seconds if the template doesn't specify.
  // Templates from js/routines.js are { id, label } only, so we
  // augment them here. Labels containing "diente" get 120s (2 min),
  // "leer"/"read" gets 600s (10 min), everything else 180s (3 min).
  function _defaultDuration(label) {
    var l = String(label || '').toLowerCase();
    if (l.indexOf('diente') !== -1 || l.indexOf('teeth') !== -1) return 120;
    if (l.indexOf('leer')   !== -1 || l.indexOf('read')  !== -1) return 600;
    if (l.indexOf('desayun') !== -1) return 600;
    if (l.indexOf('vest')   !== -1) return 300;
    if (l.indexOf('cama')   !== -1 || l.indexOf('bed')   !== -1) return 180;
    return 180;
  }

  function _esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ── State ──
  var state = {
    kid: null,        // profile object
    mode: null,       // 'morning' | 'evening'
    steps: [],        // [{id, label, duration}]
    idx: 0,
    remaining: 0,
    timerId: null,
    paused: false,
    muted: false,
    skipped: []       // array of {label} the kid tapped through early
  };

  function _loadTemplate(which, kidName) {
    // Use Routines.getTemplates if available; otherwise fall back to
    // a small sensible default so this page still works standalone.
    if (typeof Routines !== 'undefined' && Routines.getTemplates) {
      try {
        var tpls = Routines.getTemplates(kidName);
        if (tpls && Array.isArray(tpls[which]) && tpls[which].length > 0) {
          return tpls[which].map(function(it) {
            return { id: it.id, label: it.label, duration: _defaultDuration(it.label) };
          });
        }
      } catch (e) {}
    }
    var fallback = which === 'morning'
      ? [
          { id: 'bed',       label: 'Hacer la cama 🛏️' },
          { id: 'teeth',     label: 'Cepillarse los dientes 🦷' },
          { id: 'dressed',   label: 'Vestirse 👕' },
          { id: 'breakfast', label: 'Desayunar 🥣' }
        ]
      : [
          { id: 'tidy',     label: 'Ordenar el cuarto 🧸' },
          { id: 'teeth_pm', label: 'Cepillarse los dientes 🦷' },
          { id: 'read',     label: 'Leer un rato 📖' }
        ];
    return fallback.map(function(it) {
      return { id: it.id, label: it.label, duration: _defaultDuration(it.label) };
    });
  }

  // ── Gentle chime (Web Audio, no external asset) ──
  var _audioCtx = null;
  function _chime() {
    if (state.muted) return;
    try {
      if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      var now = _audioCtx.currentTime;
      [660, 880].forEach(function(freq, i) {
        var osc = _audioCtx.createOscillator();
        var gain = _audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.value = 0;
        osc.connect(gain).connect(_audioCtx.destination);
        var start = now + i * 0.18;
        osc.start(start);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.18, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);
        osc.stop(start + 0.55);
      });
    } catch (e) {}
  }

  // ── Screens ──
  function _renderHome() {
    var wrap = document.getElementById('ht-wrap');
    if (!wrap) return;
    var profiles = typeof getProfiles === 'function' ? getProfiles() : [];
    var chosen = state.kid ? state.kid.name : null;

    var profHtml = profiles.map(function(p) {
      var active = chosen === p.name ? ' active' : '';
      var color = typeof safeColor === 'function' ? safeColor(p.color) : (p.color || '#7C3AED');
      return '<button class="ht-profile' + active + '" ' +
        'onclick="HomeTimer._pickKid(\'' + _esc(p.name).replace(/'/g, "\\'") + '\')" ' +
        'style="border-color:' + (chosen === p.name ? color : 'rgba(255,255,255,0.08)') + ';">' +
        '<span class="ht-profile-avatar">' + _esc(p.avatar) + '</span>' +
        '<span class="ht-profile-name">' + _esc(p.name) + '</span>' +
      '</button>';
    }).join('');

    if (!profiles.length) {
      wrap.innerHTML = '<div class="ht-header"><span class="ht-icon">⏱</span><h1>Home Timer</h1><p>Add a kid in the hub first.</p></div>';
      return;
    }

    wrap.innerHTML =
      '<div class="ht-header">' +
        '<span class="ht-icon">⏱</span>' +
        '<h1>Home Timer</h1>' +
        '<p>Guided step-by-step for morning and bedtime.</p>' +
      '</div>' +
      '<div class="ht-profiles">' + profHtml + '</div>' +
      '<div class="ht-modes">' +
        '<button class="ht-mode morning" onclick="HomeTimer._start(\'morning\')"' + (chosen ? '' : ' disabled') + '>' +
          '<span class="ht-m-icon">🌅</span>' +
          '<div class="ht-m-title">Morning</div>' +
          '<div class="ht-m-sub">Get ready for the day</div>' +
        '</button>' +
        '<button class="ht-mode evening" onclick="HomeTimer._start(\'evening\')"' + (chosen ? '' : ' disabled') + '>' +
          '<span class="ht-m-icon">🌙</span>' +
          '<div class="ht-m-title">Bedtime</div>' +
          '<div class="ht-m-sub">Wind down and rest</div>' +
        '</button>' +
      '</div>' +
      (chosen ? '' : '<p style="text-align:center;color:var(--text-muted);font-weight:700;margin-top:8px;">Pick who\'s playing first.</p>');
  }

  function _renderSession() {
    var wrap = document.getElementById('ht-wrap');
    if (!wrap) return;
    var step = state.steps[state.idx];
    if (!step) { _renderDone(); return; }

    var totalSteps = state.steps.length;
    var dots = state.steps.map(function(s, i) {
      var cls = i < state.idx ? 'done' : (i === state.idx ? 'active' : '');
      return '<span class="ht-prog-dot ' + cls + '"></span>';
    }).join('');

    var pct = step.duration > 0 ? (state.remaining / step.duration) : 0;
    var circumference = 2 * Math.PI * 86;
    var offset = circumference * (1 - pct);

    wrap.innerHTML =
      '<div class="ht-session">' +
        '<div class="ht-step-label">Step <span class="ht-step-n">' + (state.idx + 1) + ' / ' + totalSteps + '</span></div>' +
        '<div class="ht-step-title">' + _esc(step.label) + '</div>' +
        '<div class="ht-timer">' +
          '<svg viewBox="0 0 200 200">' +
            '<defs>' +
              '<linearGradient id="ht-gradient" x1="0" y1="0" x2="1" y2="1">' +
                '<stop offset="0" stop-color="#7C3AED"/>' +
                '<stop offset="0.5" stop-color="#EC4899"/>' +
                '<stop offset="1" stop-color="#FBBF24"/>' +
              '</linearGradient>' +
            '</defs>' +
            '<circle class="ht-timer-track" cx="100" cy="100" r="86"/>' +
            '<circle class="ht-timer-fill" cx="100" cy="100" r="86" ' +
                    'stroke-dasharray="' + circumference.toFixed(2) + '" ' +
                    'stroke-dashoffset="' + offset.toFixed(2) + '"/>' +
          '</svg>' +
          '<div class="ht-timer-num">' +
            '<div class="ht-timer-secs">' + _fmtSec(state.remaining) + '</div>' +
            '<div class="ht-timer-label">' + (state.paused ? 'Paused' : 'Remaining') + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="ht-actions">' +
          (state.paused
            ? '<button class="ht-btn-primary" onclick="HomeTimer._resume()">▶ Resume</button>'
            : '<button class="ht-btn-secondary" onclick="HomeTimer._pause()">⏸ Pause</button>') +
          '<button class="ht-btn-secondary" onclick="HomeTimer._next(true)">⏭ Skip</button>' +
          '<button class="ht-btn-primary" onclick="HomeTimer._next(false)">✓ Done</button>' +
          '<button class="ht-btn-danger" onclick="HomeTimer._quit()">✕ Quit</button>' +
        '</div>' +
        '<div class="ht-progress">' + dots + '</div>' +
        '<button class="ht-mute-toggle ' + (state.muted ? 'muted' : '') + '" onclick="HomeTimer._toggleMute()">' +
          (state.muted ? '🔕 Chime off' : '🔔 Chime on') +
        '</button>' +
      '</div>';
  }

  function _renderDone() {
    var wrap = document.getElementById('ht-wrap');
    if (!wrap) return;
    var skipHtml = state.skipped.length === 0
      ? ''
      : '<div class="ht-skip-log">⏭ Skipped: ' +
        state.skipped.map(function(s){ return _esc(s.label); }).join(', ') +
        '</div>';
    wrap.innerHTML =
      '<div class="ht-done">' +
        '<span class="ht-done-emoji">' + (state.mode === 'morning' ? '🌅' : '🌙') + '</span>' +
        '<h2>¡' + (state.mode === 'morning' ? 'Listo para el día' : 'Buenas noches') + ', ' +
          _esc(state.kid ? state.kid.name : '') + '!</h2>' +
        '<p>Routine complete.</p>' +
        '<div class="ht-actions">' +
          '<button class="ht-btn-primary" onclick="HomeTimer._home()">🏠 Back</button>' +
        '</div>' +
        skipHtml +
      '</div>';

    if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
      ActivityLog.log('Home Timer', state.mode === 'morning' ? '🌅' : '🌙',
        'Completó rutina de ' + (state.mode === 'morning' ? 'mañana' : 'noche') +
        (state.skipped.length ? ' · ' + state.skipped.length + ' saltadas' : ''));
    }
    // Reset running state
    clearInterval(state.timerId);
    state.timerId = null;
  }

  function _fmtSec(s) {
    s = Math.max(0, Math.floor(s));
    var m = Math.floor(s / 60);
    s = s % 60;
    return m + ':' + String(s).padStart(2, '0');
  }

  // ── Flow ──
  function _pickKid(name) {
    var profiles = typeof getProfiles === 'function' ? getProfiles() : [];
    for (var i = 0; i < profiles.length; i++) {
      if (profiles[i].name === name) { state.kid = profiles[i]; break; }
    }
    _renderHome();
  }

  function _start(mode) {
    if (!state.kid) return;
    state.mode = mode;
    state.steps = _loadTemplate(mode, state.kid.name);
    state.idx = 0;
    state.skipped = [];
    state.paused = false;
    state.remaining = state.steps[0] ? state.steps[0].duration : 0;
    _renderSession();
    _tickLoop();
  }

  function _tickLoop() {
    clearInterval(state.timerId);
    state.timerId = setInterval(function() {
      if (state.paused) return;
      state.remaining -= 1;
      if (state.remaining <= 0) {
        state.remaining = 0;
        _renderSession();
        _chime();
        setTimeout(function() { _next(false); }, 300);
        return;
      }
      _renderSession();
    }, 1000);
  }

  function _next(skipped) {
    if (skipped) {
      var step = state.steps[state.idx];
      if (step) state.skipped.push({ label: step.label });
    }
    state.idx++;
    if (state.idx >= state.steps.length) {
      clearInterval(state.timerId);
      _renderDone();
      return;
    }
    state.remaining = state.steps[state.idx].duration;
    state.paused = false;
    _renderSession();
  }

  function _pause() { state.paused = true; _renderSession(); }
  function _resume() { state.paused = false; _renderSession(); }
  function _toggleMute() { state.muted = !state.muted; _renderSession(); }
  function _quit() {
    clearInterval(state.timerId);
    state.timerId = null;
    state.mode = null;
    _renderHome();
  }
  function _home() { _quit(); }

  // ── Init ──
  function init() {
    _renderHome();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    _pickKid: _pickKid,
    _start: _start,
    _next: _next,
    _pause: _pause,
    _resume: _resume,
    _toggleMute: _toggleMute,
    _quit: _quit,
    _home: _home
  };
})();
