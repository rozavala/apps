/* ================================================================
   SUMMER QUEST — summer-todos.js
   A shared family "summer bucket list" that lives on the Family Wall.
   Unlike Routines (which reset every night) or Chores (which earn
   screen-time tokens), these are one-time things to accomplish over
   the whole summer — and the goal is to knock out a few PER DAY.

   Design (per parent request):
     - ONE shared list the whole family works through together.
     - PER-KID CREDIT: each completed item records who did it + when,
       so every kid sees their own "done today" count and 🔥 streak.
     - DAILY TARGET + STREAK: hit `target` items in a day and your
       streak grows; miss a day and it resets (same rule as Routines).
     - Starts EMPTY: the kids add their own summer to-dos.

   Storage key (household-shared, syncs via CloudSync HOUSEHOLD_KEYS):
     zs_summer_todos = {
       items:  [ { id, label, done, doneBy, doneAt(YYYY-MM-DD), createdAt } ],
       target: 2,
       credit: { "<kidkey>": { streak, bestStreak, lastTargetDay } }
     }
   ================================================================ */

var SummerTodos = (function() {
  'use strict';

  var STORAGE_KEY = 'zs_summer_todos';
  var DEFAULT_TARGET = 2;
  var MAX_TARGET = 20;

  function _today() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function _yesterday() {
    var d = new Date();
    d.setDate(d.getDate() - 1);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function _kidKey(name) {
    return String(name == null ? '' : name).toLowerCase().replace(/\s+/g, '_');
  }

  function _genId() {
    return 's_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }

  function _load() {
    try {
      var data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {};
      if (!Array.isArray(data.items)) data.items = [];
      if (typeof data.target !== 'number' || data.target < 1) data.target = DEFAULT_TARGET;
      if (!data.credit || typeof data.credit !== 'object') data.credit = {};
      return data;
    } catch (e) {
      return { items: [], target: DEFAULT_TARGET, credit: {} };
    }
  }

  function _save(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
    // Mirror to the shared household bucket so every family device
    // (iPad on the fridge, parents' phones) sees the same list.
    if (typeof CloudSync !== 'undefined' && CloudSync.push) CloudSync.push(STORAGE_KEY);
  }

  // ---- Reads ----
  function getData() { return _load(); }
  function getItems() { return _load().items; }
  function getTarget() { return _load().target; }

  function getProgress() {
    var items = _load().items;
    var done = items.filter(function(it) { return it.done; }).length;
    return { done: done, total: items.length };
  }

  function doneTodayFor(kidName) {
    var kk = _kidKey(kidName);
    var today = _today();
    return _load().items.filter(function(it) {
      return it.done && it.doneAt === today && _kidKey(it.doneBy) === kk;
    }).length;
  }

  // Per-kid status for the Family Wall chips. A streak only stays
  // "alive" if the kid last hit their target today or yesterday;
  // otherwise it's lapsed and shows as 0 (bestStreak is preserved).
  function getCreditFor(kidName) {
    var data = _load();
    var c = data.credit[_kidKey(kidName)] || { streak: 0, bestStreak: 0, lastTargetDay: null };
    var streak = c.streak || 0;
    if (c.lastTargetDay !== _today() && c.lastTargetDay !== _yesterday()) streak = 0;
    var doneToday = doneTodayFor(kidName);
    return {
      streak: streak,
      bestStreak: c.bestStreak || 0,
      doneToday: doneToday,
      target: data.target,
      reachedTarget: doneToday >= data.target
    };
  }

  // ---- Writes ----
  function setTarget(n) {
    n = parseInt(n, 10);
    if (isNaN(n) || n < 1) n = 1;
    if (n > MAX_TARGET) n = MAX_TARGET;
    var data = _load();
    data.target = n;
    _save(data);
    return n;
  }

  function addItem(label) {
    label = String(label == null ? '' : label).trim().slice(0, 120);
    if (!label) return null;
    var data = _load();
    data.items.push({
      id: _genId(), label: label, done: false,
      doneBy: null, doneAt: null, createdAt: Date.now()
    });
    _save(data);
    return data.items[data.items.length - 1];
  }

  function removeItem(id) {
    var data = _load();
    data.items = data.items.filter(function(it) { return it.id !== id; });
    _save(data);
  }

  // Award/advance the crediting kid's streak the moment they reach the
  // daily target. Mirrors Routines: +1 if they also hit it yesterday,
  // otherwise the streak (re)starts at 1. Recorded once per day.
  function _awardStreak(data, kidName) {
    var kk = _kidKey(kidName);
    var c = data.credit[kk] || { streak: 0, bestStreak: 0, lastTargetDay: null };
    var today = _today();
    if (c.lastTargetDay === today) { data.credit[kk] = c; return; }
    c.streak = (c.lastTargetDay === _yesterday()) ? (c.streak || 0) + 1 : 1;
    c.lastTargetDay = today;
    if (c.streak > (c.bestStreak || 0)) c.bestStreak = c.streak;
    data.credit[kk] = c;
  }

  function toggleItem(id, kidName) {
    var data = _load();
    var it = data.items.filter(function(x) { return x.id === id; })[0];
    if (!it) return;
    var today = _today();
    if (it.done) {
      // Un-check. The already-earned streak for the day stands (same
      // forgiving behaviour as Routines — we don't claw it back).
      it.done = false; it.doneBy = null; it.doneAt = null;
    } else {
      it.done = true;
      it.doneBy = kidName || null;
      it.doneAt = today;
      if (kidName) {
        var countToday = data.items.filter(function(x) {
          return x.done && x.doneAt === today && _kidKey(x.doneBy) === _kidKey(kidName);
        }).length;
        if (countToday >= data.target) _awardStreak(data, kidName);
        if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
          ActivityLog.log('Summer Quest', '🏖️', kidName + ' did: ' + it.label);
        }
      }
    }
    _save(data);
  }

  return {
    getData: getData,
    getItems: getItems,
    getProgress: getProgress,
    getTarget: getTarget,
    setTarget: setTarget,
    doneTodayFor: doneTodayFor,
    getCreditFor: getCreditFor,
    addItem: addItem,
    removeItem: removeItem,
    toggleItem: toggleItem
  };
})();
