/* ================================================================
   CHORES SYSTEM — "Tareas del Hogar"
   Kids earn "Adventure Tokens" by helping around the house.
   Redeem tokens for extra play time or stars.
   ================================================================ */

var ChoresManager = (function() {
  'use strict';

  var CHORES_PREFIX = 'zs_chores_';
  var TOKEN_VAL_MIN = 5; // 1 token = 5 extra minutes

  var DEFAULT_CHORES = [
    { id: 'bed',    label: 'Hacer la cama 🛏️', tokens: 1 },
    { id: 'table',  label: 'Poner la mesa 🍽️', tokens: 1 },
    { id: 'toys',   label: 'Recoger juguetes 🧸', tokens: 1 },
    { id: 'read',   label: 'Leer 10 minutos 📖', tokens: 2 },
    { id: 'clean',  label: 'Ayudar a limpiar 🧹', tokens: 1 },
    { id: 'homework', label: 'Tarea del colegio ✏️', tokens: 2 },
  ];

  function _key() {
    var user = typeof getActiveUser === 'function' ? getActiveUser() : null;
    if (!user) return null;
    return CHORES_PREFIX + user.name.toLowerCase().replace(/\s+/g, '_');
  }

  function _getData() {
    var key = _key();
    if (!key) return null;
    try {
      var item = localStorage.getItem(key);
      var data = item ? JSON.parse(item) : {
        date: new Date().toISOString().split('T')[0],
        completed: [],
        totalTokens: 0
      };
      // Midnight reset check for completed list (keep totalTokens)
      var today = new Date().toISOString().split('T')[0];
      if (data.date !== today) {
        data.date = today;
        data.completed = [];
        _saveData(data);
      }
      return data;
    } catch (e) { return null; }
  }

  function _saveData(data) {
    var key = _key();
    if (key) {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (e) {}
    }
  }

  function getChores() {
    return DEFAULT_CHORES;
  }

  function getStatus() {
    var data = _getData();
    return data ? data : { completed: [], totalTokens: 0 };
  }

  function completeChore(id) {
    var data = _getData();
    if (!data) return;
    
    // Check if already completed today
    var alreadyDone = false;
    for (var i = 0; i < data.completed.length; i++) {
      if (data.completed[i] === id) {
        alreadyDone = true;
        break;
      }
    }
    if (alreadyDone) return;

    var chore = null;
    for (var j = 0; j < DEFAULT_CHORES.length; j++) {
      if (DEFAULT_CHORES[j].id === id) {
        chore = DEFAULT_CHORES[j];
        break;
      }
    }
    if (!chore) return;

    data.completed.push(id);
    data.totalTokens += chore.tokens;
    _saveData(data);
    _updateUI();

    if (typeof showConfetti === 'function') showConfetti();
  }

  function redeemTokens(count) {
    var data = _getData();
    if (!data || data.totalTokens < count) return false;

    data.totalTokens -= count;
    _saveData(data);

    if (typeof TimerManager !== 'undefined') {
      TimerManager.addBonus(count * TOKEN_VAL_MIN);
    }

    _updateUI();
    return true;
  }

  function _updateUI() {
    var tokenEl = document.getElementById('token-balance');
    if (tokenEl) {
      tokenEl.textContent = '⭐ ' + getStatus().totalTokens + ' tokens';
    }
    if (typeof window.renderChoresList === 'function') {
      window.renderChoresList();
    }
  }

  return { 
    getChores: getChores, 
    getStatus: getStatus, 
    completeChore: completeChore, 
    redeemTokens: redeemTokens 
  };
})();
