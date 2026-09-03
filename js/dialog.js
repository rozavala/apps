/* ================================================================
   IN-PAGE DIALOGS (js/dialog.js)

   A replacement for window.confirm / window.alert.

   Those are not reliable on every device the family actually uses.
   A WKWebView-based browser only shows them if the host app wires up
   the JS panel delegates; where it hasn't — the iPad's MIDI Browser,
   more so under Guided Access — confirm() returns false immediately
   and alert() does nothing at all. A destructive action guarded by
   `if (!confirm(...)) return;` then silently never runs, with no
   message to explain why.

   ZsDialog.confirm(opts) -> Promise<boolean>
   ZsDialog.toast(message)

   Both draw inside the page, so they behave the same everywhere.
   ================================================================ */

var ZsDialog = (function() {
  'use strict';

  var _open = null;   // { resolve, overlay, lastFocus }

  function _esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function _settle(answer) {
    if (!_open) return;
    var pending = _open;
    _open = null;
    if (pending.overlay && pending.overlay.parentNode) {
      pending.overlay.parentNode.removeChild(pending.overlay);
    }
    document.removeEventListener('keydown', _onKey, true);
    try { if (pending.lastFocus && pending.lastFocus.focus) pending.lastFocus.focus(); } catch (e) {}
    pending.resolve(answer);
  }

  function _onKey(e) {
    if (!_open) return;
    if (e.key === 'Escape') { e.preventDefault(); _settle(false); }
    else if (e.key === 'Enter') { e.preventDefault(); _settle(true); }
  }

  // opts: { title, message, confirmLabel, cancelLabel, danger }
  function confirm(opts) {
    var o = opts || {};
    // Never stack two: the second question would be answered by the
    // first one's buttons.
    if (_open) _settle(false);

    return new Promise(function(resolve) {
      var overlay = document.createElement('div');
      overlay.className = 'zsd-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.innerHTML =
        '<div class="zsd-panel">' +
          '<h2 class="zsd-title">' + _esc(o.title || 'Are you sure?') + '</h2>' +
          (o.message ? '<p class="zsd-message">' + _esc(o.message) + '</p>' : '') +
          '<div class="zsd-actions">' +
            '<button type="button" class="zsd-btn zsd-cancel">' +
              _esc(o.cancelLabel || 'Cancel') +
            '</button>' +
            '<button type="button" class="zsd-btn zsd-ok' + (o.danger ? ' zsd-danger' : '') + '">' +
              _esc(o.confirmLabel || 'OK') +
            '</button>' +
          '</div>' +
        '</div>';

      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) _settle(false);
      });
      overlay.querySelector('.zsd-cancel').addEventListener('click', function() { _settle(false); });
      overlay.querySelector('.zsd-ok').addEventListener('click', function() { _settle(true); });

      document.body.appendChild(overlay);
      _open = { resolve: resolve, overlay: overlay, lastFocus: document.activeElement };
      document.addEventListener('keydown', _onKey, true);

      // Focus the safe choice, so a stray Enter or tap cancels.
      try { overlay.querySelector('.zsd-cancel').focus(); } catch (e) {}
    });
  }

  var _toastTimer = null;

  function toast(message, ms) {
    var el = document.getElementById('zsd-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'zsd-toast';
      el.className = 'zsd-toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.textContent = String(message == null ? '' : message);
    // Restart the animation even when a toast is already showing.
    el.classList.remove('zsd-toast--on');
    void el.offsetWidth;
    el.classList.add('zsd-toast--on');

    if (_toastTimer) clearTimeout(_toastTimer);
    _toastTimer = setTimeout(function() {
      el.classList.remove('zsd-toast--on');
      _toastTimer = null;
    }, ms || 3200);
  }

  return { confirm: confirm, toast: toast };
})();

if (typeof window !== 'undefined') window.ZsDialog = ZsDialog;
