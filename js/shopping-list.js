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

    var html = '';
    orderedCats.forEach(function(cat) {
      var catItems = groups[cat];
      catItems.sort(function(a, b) {
        if (a.checked !== b.checked) return a.checked ? 1 : -1;
        return (b.addedAt || 0) - (a.addedAt || 0);
      });

      html += '<div class="sl-group-label">' + _escape(CATEGORIES[cat].label) + '</div>';
      catItems.forEach(function(item) {
        html += '<div class="sl-item ' + (item.checked ? 'checked' : '') + '" data-id="' + _escape(item.id) + '">' +
          '<button class="sl-check" onclick="ShoppingList.toggle(\'' + _escape(item.id) + '\')" aria-label="Toggle ' + _escape(item.text) + '">✓</button>' +
          '<div class="sl-item-text">' + _escape(item.text) + '</div>' +
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
    share: share
  };
})();
