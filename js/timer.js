/* ================================================================
   DAILY PLAY TIMER SYSTEM
   Handles per-kid limits, midnight resets, and lock screen overlays.
   ================================================================ */

const TimerManager = (() => {
  const TIMER_PREFIX = 'zs_timer_';
  const PAUSE_KEY    = 'zs_timer_paused';
  const DEFAULT_MAX  = 20;
  let _interval      = null;

  function _key(name) {
    const user = name ? { name } : getActiveUser();
    if (!user) return null;
    return TIMER_PREFIX + user.name.toLowerCase().replace(/\s+/g, '_');
  }

  function _getData(name) {
    const key = _key(name);
    if (!key) return null;
    try {
      const data = JSON.parse(localStorage.getItem(key)) || {
        minutesUsed: 0,
        lastReset: new Date().toISOString().split('T')[0],
        maxMinutes: DEFAULT_MAX
      };
      // Midnight reset check
      const today = new Date().toISOString().split('T')[0];
      if (data.lastReset !== today) {
        data.minutesUsed = 0;
        data.lastReset = today;
        _saveData(data, name);
      }
      return data;
    } catch { return null; }
  }

  function _saveData(data, name) {
    const key = _key(name);
    if (key) localStorage.setItem(key, JSON.stringify(data));
  }

  function getRemaining() {
    const data = _getData();
    if (!data) return DEFAULT_MAX;
    return Math.max(0, data.maxMinutes - data.minutesUsed);
  }

  function isTimeUp() {
    return getRemaining() <= 0 || isPaused();
  }

  function isPaused() {
    return localStorage.getItem(PAUSE_KEY) === 'true';
  }

  function pauseAll() {
    localStorage.setItem(PAUSE_KEY, 'true');
    _checkLock();
  }

  function resumeAll() {
    localStorage.setItem(PAUSE_KEY, 'false');
    // If hub is open, we might need to remove overlay or just wait for next check
    const overlay = document.getElementById('timer-lock-overlay');
    if (overlay && !isTimeUp()) {
      overlay.remove();
      const style = document.getElementById('timer-lock-styles');
      if (style) style.remove();
      start();
    }
  }

  function start() {
    if (_interval) return;
    _checkLock(); // Immediate check on start
    _interval = setInterval(() => {
      if (isPaused()) return; // Don't tick if paused
      const data = _getData();
      if (!data) return;
      if (data.minutesUsed < data.maxMinutes) {
        data.minutesUsed++;
        _saveData(data);
        _updateUI();
        _checkLock();
      }
    }, 60000); // Tick every minute
  }

  function pause() {
    if (_interval) {
      clearInterval(_interval);
      _interval = null;
    }
  }

  function addBonus(minutes) {
    const data = _getData();
    if (data) {
      data.maxMinutes += minutes;
      _saveData(data);
      _updateUI();
      _checkLock();
    }
  }

  function addBonusForKid(name, minutes) {
    const data = _getData(name);
    if (data) {
      data.maxMinutes += minutes;
      _saveData(data, name);
      // If this is the active user, update UI
      const active = getActiveUser();
      if (active && active.name.toLowerCase() === name.toLowerCase()) {
        _updateUI();
        _checkLock();
      }
    }
  }

  function reset(name) {
    const data = _getData(name);
    if (data) {
      data.minutesUsed = 0;
      _saveData(data, name);
      // If this is the active user, update UI
      const active = getActiveUser();
      if (active && active.name.toLowerCase() === name.toLowerCase()) {
        _updateUI();
        const overlay = document.getElementById('timer-lock-overlay');
        if (overlay && !isPaused()) {
          overlay.remove();
          const style = document.getElementById('timer-lock-styles');
          if (style) style.remove();
          start();
        }
      }
    }
  }

  function getUsed(name) {
    const data = _getData(name);
    return data ? data.minutesUsed : 0;
  }

  function getDataForKid(name) {
    return _getData(name);
  }

  function setMax(minutes) {
    const data = _getData();
    if (data) {
      data.maxMinutes = minutes;
      _saveData(data);
      _updateUI();
      _checkLock();
    }
  }

  function _updateUI() {
    const el = document.getElementById('timer-display');
    if (el) {
      const rem = getRemaining();
      el.textContent = `⏰ ${rem} min left`;
      el.classList.toggle('timer-low', rem <= 5);
    }
  }

  function _checkLock() {
    if (isTimeUp()) {
      _showLockOverlay();
    }
  }

  function _showLockOverlay() {
    // BUG FIX: Don't show lock overlay if parent is currently in Parents Corner
    const parentsOverlay = document.getElementById('parents-overlay');
    if (parentsOverlay && parentsOverlay.classList.contains('active')) return;

    if (document.getElementById('timer-lock-overlay')) {
      // Update message if already showing
      const msg = document.querySelector('.lock-msg');
      if (msg) {
        msg.textContent = isPaused() 
          ? 'Timers paused by parent. Time to take a break! ⏸️' 
          : 'Has jugado mucho por hoy. Descansa un poco o haz una tarea del hogar para ganar más tiempo. ⭐';
      }
      return;
    }

    const style = document.createElement('style');
    style.id = 'timer-lock-styles';
    style.textContent = `
      #timer-lock-overlay {
        position: fixed; inset: 0; z-index: 10000;
        background: rgba(11, 11, 26, 0.98);
        backdrop-filter: blur(12px);
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        padding: 24px; text-align: center; color: #F0EDFF; font-family: 'Baloo 2', 'Nunito', cursive;
      }
      .lock-card {
        background: #1A1A3E; border: 2px solid #7C3AED; border-radius: 24px;
        padding: 40px 32px; max-width: 420px; width: 100%;
        box-shadow: 0 20px 60px rgba(0,0,0,0.6);
        animation: lockPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      @keyframes lockPop { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      .lock-emoji { font-size: 64px; margin-bottom: 16px; }
      .lock-title { font-size: 2rem; font-weight: 800; margin-bottom: 12px; line-height: 1.2; }
      .lock-msg { font-size: 1.1rem; color: #8B86B0; margin-bottom: 32px; }
      
      .lock-actions { display: flex; flex-direction: column; gap: 12px; }
      .lock-btn {
        display: flex; align-items: center; justify-content: center; gap: 10px;
        padding: 16px; border-radius: 16px; border: none;
        font-family: 'Baloo 2', cursive; font-size: 1.1rem; font-weight: 700;
        cursor: pointer; transition: all 0.2s; color: #fff; text-decoration: none;
      }
      .btn-switch { background: linear-gradient(135deg, #7C3AED, #A78BFA); }
      .btn-parent { background: rgba(245, 158, 11, 0.15); border: 2px solid #F59E0B; color: #FBBF24; }
      .lock-btn:hover { transform: translateY(-2px); filter: brightness(1.1); }
      
      .lock-pin-area { 
        margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);
        display: none; flex-direction: column; gap: 12px;
      }
      .lock-pin-input {
        background: #0B0B1A; border: 2px solid rgba(255,255,255,0.1); border-radius: 12px;
        padding: 12px; color: #fff; text-align: center; font-size: 1.5rem; letter-spacing: 4px;
        width: 100%; outline: none;
      }
      .lock-pin-input:focus { border-color: #F59E0B; }
      .lock-override-btns { display: none; gap: 10px; }
      .btn-override { flex: 1; padding: 12px; font-size: 0.9rem; background: #F59E0B; color: #000; border-radius: 10px; border: none; font-weight: 800; cursor: pointer; }
    `;
    document.head.appendChild(style);

    const paused = isPaused();
    const guest = (typeof isGuestUser === 'function') && isGuestUser();
    const overlay = document.createElement('div');
    overlay.id = 'timer-lock-overlay';
    overlay.setAttribute('role', 'alertdialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Daily time limit reached');
    
    let content = '';
    if (guest) {
      content = `
        <div class="lock-card">
          <div class="lock-emoji">🌟</div>
          <div class="lock-title">Guest session over!</div>
          <div class="lock-msg">
            Thanks for playing! Your 15-minute guest session is complete.
          </div>
          <div class="lock-actions">
            <button class="lock-btn btn-switch" onclick="TimerManager.switchUser()">🏠 Back to Login</button>
          </div>
        </div>
      `;
    } else {
      content = `
        <div class="lock-card">
          <div class="lock-emoji">${paused ? '⏸️' : '🌟'}</div>
          <div class="lock-title">${paused ? 'Tiempo de Descanso' : '¡Gran aventura hoy!'}</div>
          <div class="lock-msg">
            ${paused 
              ? 'Timers paused by parent. Time to take a break! ⏸️' 
              : 'Has jugado mucho por hoy. Descansa un poco o haz una tarea del hogar para ganar más tiempo. ⭐'}
          </div>
          
          <div class="lock-actions">
            <button class="lock-btn btn-switch" onclick="TimerManager.switchUser()">🔄 Cambiar Jugador</button>
            <button class="lock-btn btn-parent" id="lock-parent-trigger" onclick="document.getElementById('lock-pin-area').style.display='flex'; this.style.display='none'">🔒 Modo Padres</button>
            
            <div class="lock-pin-area" id="lock-pin-area">
              <input type="password" class="lock-pin-input" id="lock-pin-input" placeholder="····" maxlength="4" inputmode="numeric">
              <button class="lock-btn btn-parent" onclick="TimerManager.checkLockPin()">Desbloquear 🔓</button>
            </div>
            
            <div class="lock-override-btns" id="lock-override-btns">
              <button class="btn-override" onclick="TimerManager.resetCurrent()">Reset Timer</button>
              <button class="btn-override" onclick="TimerManager.addBonusCurrent(30)">+30 min</button>
            </div>
          </div>
        </div>
      `;
    }
    
    overlay.innerHTML = content;
    document.body.appendChild(overlay);
    
    // Add Enter key listener for PIN
    const pinIn = document.getElementById('lock-pin-input');
    if (pinIn) {
      pinIn.addEventListener('keydown', e => {
        if (e.key === 'Enter') checkLockPin();
      });
    }
    
    // Prevent Escape key
    window.addEventListener('keydown', _preventEscape, true);
    
    pause();
  }

  function _preventEscape(e) {
    if (e.key === 'Escape' && document.getElementById('timer-lock-overlay')) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  function switchUser() {
    localStorage.removeItem('zs_active_user');
    window.location.href = 'index.html';
  }

  function checkLockPin() {
    const input = document.getElementById('lock-pin-input');
    if (input.value === getParentPin()) {
      document.getElementById('lock-pin-area').style.display = 'none';
      document.getElementById('lock-override-btns').style.display = 'flex';
    } else {
      input.value = '';
      input.style.borderColor = '#EF4444';
      setTimeout(() => { input.style.borderColor = ''; }, 1000);
    }
  }

  function resetCurrent() {
    const user = getActiveUser();
    if (user) {
      reset(user.name);
      _removeLock();
    }
  }

  function addBonusCurrent(mins) {
    const user = getActiveUser();
    if (user) {
      addBonusForKid(user.name, mins);
      _removeLock();
    }
  }

  function _removeLock() {
    const overlay = document.getElementById('timer-lock-overlay');
    if (overlay) overlay.remove();
    const style = document.getElementById('timer-lock-styles');
    if (style) style.remove();
    window.removeEventListener('keydown', _preventEscape, true);
    start();
  }

  // Self-init on load
  document.addEventListener('DOMContentLoaded', () => {
    if (getActiveUser()) {
      start();
      _updateUI();
    }
  });

  return { 
    getRemaining, isTimeUp, start, pause, addBonus, addBonusForKid, setMax, reset, getUsed, getDataForKid, pauseAll, resumeAll, isPaused,
    switchUser, checkLockPin, resetCurrent, addBonusCurrent
  };
})();
