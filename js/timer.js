/* ================================================================
   TIMER SYSTEM — Shared Logic
   Manages per-kid daily play limits and the "Time Up" lock screen.
   ================================================================ */

var TimerManager = (function() {
  'use strict';

  var TIMER_PREFIX = 'zs_timer_';
  var PAUSE_KEY    = 'zs_timer_paused';
  var DEFAULT_MAX  = 20;
  var _interval      = null;

  function _key(name) {
    var user = name ? { name: name } : getActiveUser();
    if (!user) return null;
    return TIMER_PREFIX + user.name.toLowerCase().replace(/\s+/g, '_');
  }

  function _getData(name) {
    var key = _key(name);
    if (!key) return null;
    try {
      var raw = localStorage.getItem(key);
      var data = raw ? JSON.parse(raw) : {
        date: new Date().toISOString().split('T')[0],
        minutesUsed: 0,
        maxMinutes: DEFAULT_MAX
      };
      // Midnight reset
      var today = new Date().toISOString().split('T')[0];
      if (data.date !== today) {
        data.date = today;
        data.minutesUsed = 0;
        _saveData(data, name);
      }
      return data;
    } catch (e) { return null; }
  }

  function _saveData(data, name) {
    var key = _key(name);
    if (key) {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (e) {}
    }
  }

  function start() {
    if (_interval) return;
    _interval = setInterval(function() {
      if (isPaused()) return;
      var data = _getData();
      if (data) {
        data.minutesUsed++;
        _saveData(data);
        _updateUI();
        if (data.minutesUsed >= data.maxMinutes) {
          _showLockScreen();
        }
      }
    }, 60000); // every minute
  }

  function pause() {
    if (_interval) {
      clearInterval(_interval);
      _interval = null;
    }
  }

  function addBonus(minutes) {
    var data = _getData();
    if (data) {
      data.maxMinutes += minutes;
      _saveData(data);
      _updateUI();
      _hideLockScreen();
    }
  }

  function addBonusForKid(name, minutes) {
    var data = _getData(name);
    if (data) {
      data.maxMinutes += minutes;
      _saveData(data, name);
      var active = getActiveUser();
      if (active && active.name === name) {
        _updateUI();
        _hideLockScreen();
      }
    }
  }

  function setMax(minutes) {
    var data = _getData();
    if (data) {
      data.maxMinutes = minutes;
      _saveData(data);
      _updateUI();
      if (data.minutesUsed < data.maxMinutes) _hideLockScreen();
      else _showLockScreen();
    }
  }

  function reset(name) {
    var data = _getData(name);
    if (data) {
      data.minutesUsed = 0;
      _saveData(data, name);
      var active = getActiveUser();
      if (active && active.name === name) {
        _updateUI();
        _hideLockScreen();
      }
    }
  }

  function getRemaining() {
    var data = _getData();
    if (!data) return 0;
    return Math.max(0, data.maxMinutes - data.minutesUsed);
  }

  function isTimeUp() {
    var data = _getData();
    if (!data) return false;
    return data.minutesUsed >= data.maxMinutes;
  }

  function _updateUI() {
    var el = document.getElementById('timer-display');
    if (el) {
      var rem = getRemaining();
      el.textContent = '⏰ ' + rem + ' min left';
    }
    // Update dashboard/parents corner if open
    var parentsOverlay = document.getElementById('parents-overlay');
    if (parentsOverlay && parentsOverlay.classList.contains('active')) {
      if (typeof renderParentsCorner === 'function') renderParentsCorner();
    }
  }

  function isPaused() {
    return localStorage.getItem(PAUSE_KEY) === 'true';
  }

  function pauseAll() {
    localStorage.setItem(PAUSE_KEY, 'true');
    _updateUI();
    _showLockScreen();
  }

  function resumeAll() {
    localStorage.setItem(PAUSE_KEY, 'false');
    _updateUI();
    if (!isTimeUp()) _hideLockScreen();
  }

  function _showLockScreen() {
    if (document.getElementById('timer-lock-overlay')) return;
    
    var msg = '¡Tiempo agotado por hoy!';
    if (isPaused()) {
      msg = 'Timers paused by parent. Time to take a break! ⏸️';
    } else {
      msg = 'Has jugado mucho por hoy. Descansa un poco o haz una tarea del hogar para ganar más tiempo. ⭐';
    }

    var style = document.createElement('style');
    style.id = 'timer-lock-styles';
    style.textContent = 
      '#timer-lock-overlay { position:fixed; inset:0; background:rgba(11,11,26,0.98); z-index:10000; display:flex; align-items:center; justify-content:center; color:#fff; text-align:center; font-family:var(--font-display); }' +
      '.lock-panel { max-width:400px; padding:40px 20px; }' +
      '.lock-emoji { font-size:80px; margin-bottom:20px; }' +
      '.lock-msg { font-size:1.2rem; margin-bottom:30px; line-height:1.5; color:var(--text-muted); }' +
      '.lock-actions { display:flex; flex-direction:column; gap:12px; }' +
      '.lock-btn { padding:14px; border-radius:12px; border:none; font-weight:800; font-family:var(--font-display); cursor:pointer; }' +
      '.btn-switch { background:var(--purple); color:#fff; }' +
      '.btn-parent { background:#333; color:var(--text-muted); }' +
      '.lock-pin-area { margin-top:20px; display:none; flex-direction:column; gap:10px; }' +
      '.lock-pin-input { background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); padding:12px; border-radius:8px; color:#fff; text-align:center; font-size:1.5rem; letter-spacing:8px; }';
    document.head.appendChild(style);

    var paused = isPaused();
    var guest = (typeof isGuestUser === 'function') && isGuestUser();

    var overlay = document.createElement('div');
    overlay.id = 'timer-lock-overlay';
    var content = 
      '<div class="lock-panel">' +
        '<div class="lock-emoji">' + (paused ? '⏸️' : '🌙') + '</div>' +
        '<h2>' + (paused ? 'Paused' : 'Time for a break!') + '</h2>' +
        '<div class="lock-msg">' + msg + '</div>' +
        '<div class="lock-actions">' +
          '<button class="lock-btn btn-switch" onclick="TimerManager.timerSwitchUser()">🔄 Cambiar Jugador</button>' +
          '<button class="lock-btn btn-parent" id="lock-parent-trigger" onclick="document.getElementById(\'lock-pin-area\').style.display=\'flex\'; this.style.display=\'none\'">🔒 Modo Padres</button>' +
          '<div class="lock-pin-area" id="lock-pin-area">' +
            '<input type="password" class="lock-pin-input" id="lock-pin-input" placeholder="····" maxlength="4" inputmode="numeric">' +
            '<button class="lock-btn btn-parent" onclick="TimerManager.checkLockPin()">Desbloquear 🔓</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    overlay.innerHTML = content;
    document.body.appendChild(overlay);

    var pinIn = document.getElementById('lock-pin-input');
    if (pinIn) {
      pinIn.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') checkLockPin();
      });
    }
  }

  function _hideLockScreen() {
    var overlay = document.getElementById('timer-lock-overlay');
    if (overlay) overlay.remove();
    var style = document.getElementById('timer-lock-styles');
    if (style) style.remove();
  }

  function checkLockPin() {
    var input = document.getElementById('lock-pin-input');
    if (input && input.value === getParentPin()) {
      _hideLockScreen();
      if (isPaused()) resumeAll();
      else resetCurrent();
    } else if (input) {
      input.value = '';
      input.style.borderColor = '#ef4444';
      setTimeout(function() { input.style.borderColor = ''; }, 1000);
    }
  }

  function timerSwitchUser() {
    localStorage.removeItem('zs_active_user');
    window.location.href = 'index.html';
  }

  function resetCurrent() {
    var user = getActiveUser();
    if (user) reset(user.name);
  }

  function addBonusCurrent(mins) {
    var user = getActiveUser();
    if (user) addBonusForKid(user.name, mins);
  }

  // Init
  document.addEventListener('DOMContentLoaded', function() {
    start();
    if (isTimeUp() || isPaused()) {
      _showLockScreen();
    }
  });

  return { 
    getRemaining: getRemaining, 
    isTimeUp: isTimeUp, 
    start: start, 
    pause: pause, 
    addBonus: addBonus, 
    addBonusForKid: addBonusForKid, 
    setMax: setMax, 
    reset: reset,
    isPaused: isPaused,
    pauseAll: pauseAll, 
    resumeAll: resumeAll,
    timerSwitchUser: timerSwitchUser, 
    checkLockPin: checkLockPin, 
    resetCurrent: resetCurrent, 
    addBonusCurrent: addBonusCurrent,
    getDataForKid: _getData
  };
})();
