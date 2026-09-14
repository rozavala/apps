/* ================================================================
   SHOPPING LIST — shopping-list.js
   Household shared list. Not per-kid.
   Storage key: zs_shopping_list
   ================================================================ */

var ShoppingList = (function() {
  'use strict';

  var STORAGE_KEY = 'zs_shopping_list';

  var CATEGORIES = {
    general:   { label: '🛒 General',   order: 1 },
    groceries: { label: '🥕 Groceries', order: 2 },
    hardware:  { label: '🔧 Hardware',  order: 3 },
    pharmacy:  { label: '💊 Pharmacy',  order: 4 },
    school:    { label: '✏️ School',    order: 5 },
    other:     { label: '📦 Other',     order: 6 }
  };

  // ── Amazon lookup (parents only) ──────────────────────────────
  // A per-item link that opens an Amazon search for that item, so the
  // weekly order doesn't mean retyping "Bater\u00edas LR1130" by hand.
  // It is a plain search link: nothing is bought, nothing is added to a
  // cart, and no account or API is involved.
  //
  // Two gates, because neither is enough alone:
  //   1. The signed-in profile must be marked as a parent. Profiles
  //      named Papa/Mama count unless a profile says otherwise, so this
  //      works before anyone touches Parents Corner.
  //   2. The Parent PIN must have been entered on this device in this
  //      browser session. Picking a profile isn't authenticated — any
  //      kid can tap Papa's avatar — so the profile check on its own
  //      would only be a curtain.
  // The unlock lives in sessionStorage, so it dies with the tab and
  // never syncs anywhere.
  var UNLOCK_KEY = 'zs_parent_unlocked';
  var PARENT_NAMES = ['papa', 'mama', 'mam\u00e1', 'dad', 'mom', 'mum'];

  function _activeIsParent() {
    var user = (typeof getActiveUser === 'function') ? getActiveUser() : null;
    if (!user || user.isGuest) return false;
    if (user.isParent === true) return true;
    if (user.isParent === false) return false;
    return PARENT_NAMES.indexOf(String(user.name || '').trim().toLowerCase()) !== -1;
  }

  function _isUnlocked() {
    try { return sessionStorage.getItem(UNLOCK_KEY) === '1'; } catch (e) { return false; }
  }

  function _amazonVisible() {
    return _activeIsParent() && _isUnlocked();
  }

  function _amazonUrl(text) {
    return 'https://www.amazon.com/s?k=' + encodeURIComponent(String(text || '').trim());
  }

  // Called from the "Shop" button in the header.
  function unlockShopping() {
    if (!_activeIsParent()) {
      alert('Sign in as a parent first to use Amazon lookup.');
      return;
    }
    if (_isUnlocked()) {
      try { sessionStorage.removeItem(UNLOCK_KEY); } catch (e) {}
      _render();
      return;
    }
    var expected = (typeof getParentPin === 'function') ? String(getParentPin()) : '1234';
    var entered = window.prompt('Parent PIN to show Amazon links:');
    if (entered === null) return;
    if (String(entered).trim() !== expected) {
      alert('That PIN is not right.');
      return;
    }
    try { sessionStorage.setItem(UNLOCK_KEY, '1'); } catch (e) {}
    _render();
  }

  // Reflects state in the header button, and hides it entirely from
  // anyone who isn't a parent so the kids never see the affordance.
  function _renderShopToggle() {
    var btn = document.getElementById('sl-shop-toggle');
    if (!btn) return;
    if (!_activeIsParent()) { btn.style.display = 'none'; return; }
    btn.style.display = '';
    btn.textContent = _isUnlocked() ? '\ud83d\uded2 Amazon: on' : '\ud83d\udd12 Amazon';
    btn.title = _isUnlocked()
      ? 'Hide the Amazon lookup links'
      : 'Enter the parent PIN to show Amazon lookup links';
  }

  function _load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
  }

  function _save(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      if (typeof CloudSync !== 'undefined' && CloudSync.push) CloudSync.push(STORAGE_KEY);
    } catch (e) {
      if (typeof Debug !== 'undefined') Debug.error('[ShoppingList] save failed', e.message);
    }
  }

  function _uid() {
    return 'it_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
  }

  function _escape(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function _render() {
    var items = _load();
    var listEl = document.getElementById('sl-list');
    var emptyEl = document.getElementById('sl-empty');
    var archiveBtn = document.getElementById('sl-archive-btn');
    if (!listEl) return;

    if (items.length === 0) {
      _renderShopToggle();
      listEl.innerHTML = '';
      if (emptyEl) emptyEl.style.display = '';
      if (archiveBtn) archiveBtn.disabled = true;
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';
    var hasChecked = items.some(function(i) { return i.checked; });
    if (archiveBtn) archiveBtn.disabled = !hasChecked;

    // Group by category, unchecked first within each group
    var groups = {};
    items.forEach(function(item) {
      var cat = CATEGORIES[item.category] ? item.category : 'general';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });

    var orderedCats = Object.keys(groups).sort(function(a, b) {
      return (CATEGORIES[a] ? CATEGORIES[a].order : 99) - (CATEGORIES[b] ? CATEGORIES[b].order : 99);
    });

    var showShop = _amazonVisible();
    _renderShopToggle();

    var html = '';
    orderedCats.forEach(function(cat) {
      var catItems = groups[cat];
      catItems.sort(function(a, b) {
        if (a.checked !== b.checked) return a.checked ? 1 : -1;
        return (b.addedAt || 0) - (a.addedAt || 0);
      });

      html += '<div class="sl-group-label">' + _escape(CATEGORIES[cat].label) + '</div>';
      catItems.forEach(function(item) {
        var shopLink = showShop
          ? '<a class="sl-item-shop" href="' + _escape(_amazonUrl(item.text)) + '" ' +
              'target="_blank" rel="noopener noreferrer" ' +
              'aria-label="Search Amazon for ' + _escape(item.text) + '" ' +
              'title="Search Amazon for ' + _escape(item.text) + '">\ud83d\udd0d</a>'
          : '';
        html += '<div class="sl-item ' + (item.checked ? 'checked' : '') + '" data-id="' + _escape(item.id) + '">' +
          '<button class="sl-check" onclick="ShoppingList.toggle(\'' + _escape(item.id) + '\')" aria-label="Toggle ' + _escape(item.text) + '">✓</button>' +
          '<div class="sl-item-text">' + _escape(item.text) + '</div>' +
          shopLink +
          '<button class="sl-item-delete" onclick="ShoppingList.remove(\'' + _escape(item.id) + '\')" aria-label="Delete ' + _escape(item.text) + '">✕</button>' +
        '</div>';
      });
    });

    listEl.innerHTML = html;
  }

  function addItem(event) {
    if (event) event.preventDefault();
    var input = document.getElementById('sl-input');
    var categoryEl = document.getElementById('sl-category');
    if (!input) return;
    var text = input.value.trim();
    if (!text) return;

    var items = _load();
    items.push({
      id: _uid(),
      text: text,
      category: categoryEl ? categoryEl.value : 'general',
      checked: false,
      addedAt: Date.now()
    });
    _save(items);
    input.value = '';
    _render();
    input.focus();
  }

  function toggle(id) {
    var items = _load();
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) {
        items[i].checked = !items[i].checked;
        items[i].checkedAt = items[i].checked ? Date.now() : null;
        break;
      }
    }
    _save(items);
    _render();
  }

  function remove(id) {
    var items = _load();
    items = items.filter(function(it) { return it.id !== id; });
    _save(items);
    _render();
  }

  function archiveChecked() {
    var items = _load();
    var remaining = items.filter(function(it) { return !it.checked; });
    if (remaining.length === items.length) return;
    _save(remaining);
    _render();
  }

  function share() {
    var items = _load();
    var unchecked = items.filter(function(it) { return !it.checked; });
    if (unchecked.length === 0) {
      alert('La lista está vacía. Agrega ítems antes de compartir.');
      return;
    }

    var groups = {};
    unchecked.forEach(function(item) {
      var cat = CATEGORIES[item.category] ? item.category : 'general';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item.text);
    });

    var text = '🛒 Lista de Compras\n\n';
    Object.keys(groups).sort(function(a, b) {
      return (CATEGORIES[a] ? CATEGORIES[a].order : 99) - (CATEGORIES[b] ? CATEGORIES[b].order : 99);
    }).forEach(function(cat) {
      text += CATEGORIES[cat].label + '\n';
      groups[cat].forEach(function(item) { text += '• ' + item + '\n'; });
      text += '\n';
    });

    if (navigator.share) {
      navigator.share({ title: 'Lista de Compras', text: text }).catch(function() {});
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function() {
        alert('Lista copiada al portapapeles ✓');
      }).catch(function() {
        _fallbackShare(text);
      });
    } else {
      _fallbackShare(text);
    }
  }

  function _fallbackShare(text) {
    var w = window.open('', '_blank');
    if (w) {
      w.document.write('<pre style="font-family:system-ui;padding:20px;white-space:pre-wrap;">' + _escape(text) + '</pre>');
      w.document.close();
    }
  }

  function init() {
    _render();
    var input = document.getElementById('sl-input');
    if (input) input.focus();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    addItem: addItem,
    toggle: toggle,
    remove: remove,
    archiveChecked: archiveChecked,
    share: share,
    unlockShopping: unlockShopping,
    _amazonVisible: _amazonVisible,
    _amazonUrl: _amazonUrl
  };
})();
