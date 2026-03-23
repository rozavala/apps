/* ================================================================
   CHORES SYSTEM — "Tareas del Hogar"
   Kids earn "Adventure Tokens" by helping around the house.
   Redeem tokens for extra play time or stars.
   ================================================================ */

const ChoresManager = (() => {
  const CHORES_PREFIX = 'zs_chores_';
  const TOKEN_VAL_MIN = 5; // 1 token = 5 extra minutes

  const DEFAULT_CHORES = [
    { id: 'bed',    label: 'Hacer la cama 🛏️', tokens: 1 },
    { id: 'table',  label: 'Poner la mesa 🍽️', tokens: 1 },
    { id: 'toys',   label: 'Recoger juguetes 🧸', tokens: 1 },
    { id: 'read',   label: 'Leer 10 minutos 📖', tokens: 2 },
    { id: 'clean',  label: 'Ayudar a limpiar 🧹', tokens: 1 },
    { id: 'homework', label: 'Tarea del colegio ✏️', tokens: 2 },
  ];

  function _key() {
    const user = getActiveUser();
    if (!user) return null;
    return CHORES_PREFIX + user.name.toLowerCase().replace(/\s+/g, '_');
  }

  function _getData() {
    const key = _key();
    if (!key) return null;
    try {
      const data = JSON.parse(localStorage.getItem(key)) || {
        date: new Date().toISOString().split('T')[0],
        completed: [],
        totalTokens: 0
      };
      // Midnight reset check for completed list (keep totalTokens)
      const today = new Date().toISOString().split('T')[0];
      if (data.date !== today) {
        data.date = today;
        data.completed = [];
        _saveData(data);
      }
      return data;
    } catch { return null; }
  }

  function _saveData(data) {
    const key = _key();
    if (key) localStorage.setItem(key, JSON.stringify(data));
  }

  function getChores() {
    return DEFAULT_CHORES;
  }

  function getStatus() {
    const data = _getData();
    return data ? data : { completed: [], totalTokens: 0 };
  }

  function completeChore(id) {
    const data = _getData();
    if (!data) return;
    if (data.completed.includes(id)) return;

    const chore = DEFAULT_CHORES.find(c => c.id === id);
    if (!chore) return;

    data.completed.push(id);
    data.totalTokens += chore.tokens;
    _saveData(data);
    _updateUI();

    // Visual feedback (if in hub)
    if (typeof showConfetti === 'function') showConfetti();
  }

  function redeemTokens(count) {
    const data = _getData();
    if (!data || data.totalTokens < count) return false;

    data.totalTokens -= count;
    _saveData(data);

    // Call timer to add time
    if (typeof TimerManager !== 'undefined') {
      TimerManager.addBonus(count * TOKEN_VAL_MIN);
    }

    _updateUI();
    return true;
  }

  function _updateUI() {
    // Update token balance in user bar
    const tokenEl = document.getElementById('token-balance');
    if (tokenEl) {
      tokenEl.textContent = `⭐ ${getStatus().totalTokens} tokens`;
    }
    // Re-render chores list if open
    if (typeof renderChoresList === 'function') renderChoresList();
  }

  return { getChores, getStatus, completeChore, redeemTokens };
})();
