/* ================================================================
   DAILY PLAY TIMER SYSTEM
   Handles per-kid limits, midnight resets, and lock screen overlays.
   ================================================================ */

const TimerManager = (() => {
  const TIMER_PREFIX = 'zs_timer_';
  const DEFAULT_MAX  = 45;
  let _interval      = null;

  function _key() {
    const user = getActiveUser();
    if (!user) return null;
    return TIMER_PREFIX + user.name.toLowerCase().replace(/\s+/g, '_');
  }

  function _getData() {
    const key = _key();
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
        _saveData(data);
      }
      return data;
    } catch { return null; }
  }

  function _saveData(data) {
    const key = _key();
    if (key) localStorage.setItem(key, JSON.stringify(data));
  }

  function getRemaining() {
    const data = _getData();
    if (!data) return DEFAULT_MAX;
    return Math.max(0, data.maxMinutes - data.minutesUsed);
  }

  function isTimeUp() {
    return getRemaining() <= 0;
  }

  function start() {
    if (_interval) return;
    _checkLock(); // Immediate check on start
    _interval = setInterval(() => {
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
    if (document.getElementById('timer-lock-overlay')) return;

    const style = document.createElement('style');
    style.id = 'timer-lock-styles';
    style.textContent = `
      #timer-lock-overlay {
        position: fixed; inset: 0; z-index: 10000;
        background: rgba(11, 11, 26, 0.95);
        backdrop-filter: blur(10px);
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        padding: 24px; text-align: center; color: #F0EDFF; font-family: 'Baloo 2', 'Nunito', cursive;
      }
      .lock-card {
        background: #1A1A3E; border: 2px solid #7C3AED; border-radius: 24px;
        padding: 40px 32px; max-width: 400px; width: 100%;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      }
      .lock-emoji { font-size: 64px; margin-bottom: 16px; }
      .lock-title { font-size: 2rem; font-weight: 800; margin-bottom: 12px; line-height: 1.2; }
      .lock-msg { font-size: 1.1rem; color: #8B86B0; margin-bottom: 24px; }
      .lock-btn {
        display: inline-block; padding: 14px 32px; border-radius: 12px;
        background: linear-gradient(135deg, #7C3AED, #A78BFA); color: #fff;
        text-decoration: none; font-weight: 700; transition: transform 0.2s;
      }
      .lock-btn:hover { transform: scale(1.05); }
    `;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.id = 'timer-lock-overlay';
    overlay.innerHTML = `
      <div class="lock-card">
        <div class="lock-emoji">🌟</div>
        <div class="lock-title">¡Gran aventura hoy!</div>
        <div class="lock-msg">Has jugado mucho por hoy. Descansa un poco o haz una tarea del hogar para ganar más tiempo. ⭐</div>
        <a href="index.html" class="lock-btn">Volver al Hub</a>
      </div>
    `;
    document.body.appendChild(overlay);
    pause();
  }

  // Self-init on load
  document.addEventListener('DOMContentLoaded', () => {
    if (getActiveUser()) {
      start();
      _updateUI();
    }
  });

  return { getRemaining, isTimeUp, start, pause, addBonus, setMax };
})();
