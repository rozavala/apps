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
   ZsDialog.alert(opts)   -> Promise<void>        (one OK button)
   ZsDialog.prompt(opts)  -> Promise<string|null> (null = cancelled)
   ZsDialog.toast(message)

   All of them draw inside the page, so they behave the same everywhere.
   Any page can load this file on its own: it brings its own styles
   (a page's stylesheet, like css/index.css, can restyle them).
   Never call window.confirm / alert / prompt in an app.
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
    if (e.key === 'Escape') { e.preventDefault(); _settle(_open.no()); }
    else if (e.key === 'Enter') {
      // Enter answers yes only from the text box, or when nothing else has focus:
      // on a focused Cancel button it should cancel.
      var a = document.activeElement;
      if (a && a.classList && a.classList.contains('zsd-cancel')) { e.preventDefault(); _settle(_open.no()); return; }
      e.preventDefault(); _settle(_open.yes());
    }
  }

  // Fallback look, for pages that don't style .zsd-* themselves. Inserted
  // first in <head>, so any page stylesheet wins.
  var BASE_CSS =
    '.zsd-overlay{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;' +
      'padding:24px;background:rgba(0,0,0,.55);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px)}' +
    '.zsd-panel{background:var(--bg-surface,#fff);color:var(--text-primary,#1f2937);border-radius:var(--radius,16px);' +
      'padding:24px;width:100%;max-width:400px;box-shadow:0 20px 50px rgba(0,0,0,.35);font-family:var(--font-body,system-ui,sans-serif)}' +
    '.zsd-title{font-size:1.2rem;font-weight:800;margin:0 0 10px;color:inherit}' +
    '.zsd-message{font-size:.92rem;line-height:1.5;margin:0 0 20px;color:var(--text-muted,#4b5563);white-space:pre-line}' +
    '.zsd-input{display:block;width:100%;box-sizing:border-box;margin:0 0 20px;padding:12px 14px;font-size:1.05rem;' +
      'border-radius:10px;border:1.5px solid rgba(127,127,127,.45);background:rgba(127,127,127,.08);color:inherit}' +
    '.zsd-actions{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap}' +
    '.zsd-btn{padding:11px 20px;border-radius:var(--radius-xs,10px);border:1px solid rgba(127,127,127,.35);' +
      'background:rgba(127,127,127,.1);color:inherit;font:inherit;font-size:.92rem;font-weight:700;cursor:pointer;min-width:96px;min-height:44px}' +
    '.zsd-ok{background:var(--purple,#6d5dfc);border-color:var(--purple,#6d5dfc);color:#fff}' +
    '.zsd-ok.zsd-danger{background:#EF4444;border-color:#EF4444;color:#fff}' +
    '.zsd-toast{position:fixed;left:50%;bottom:28px;transform:translate(-50%,16px);z-index:2147483001;max-width:min(90vw,460px);' +
      'padding:13px 20px;border-radius:999px;background:rgba(20,20,32,.96);color:#fff;font-family:var(--font-body,system-ui,sans-serif);' +
      'font-size:.88rem;font-weight:700;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.35);opacity:0;pointer-events:none;' +
      'transition:opacity .2s ease,transform .2s ease;white-space:pre-line}' +
    '.zsd-toast--on{opacity:1;transform:translate(-50%,0)}';

  function _injectStyles() {
    if (typeof document === 'undefined' || document.getElementById('zsd-base-style')) return;
    var st = document.createElement('style');
    st.id = 'zsd-base-style';
    st.textContent = BASE_CSS;
    var head = document.head || document.getElementsByTagName('head')[0];
    if (head) head.insertBefore(st, head.firstChild);
  }

  function _norm(opts) {
    return (typeof opts === 'string') ? { message: opts } : (opts || {});
  }

  // kind: 'confirm' | 'alert' | 'prompt'
  function _show(kind, o) {
    _injectStyles();
    // Never stack two: the second question would be answered by the
    // first one's buttons.
    if (_open) _settle(_open.kind === 'prompt' ? null : false);

    return new Promise(function(resolve) {
      var overlay = document.createElement('div');
      overlay.className = 'zsd-overlay';
      overlay.setAttribute('role', kind === 'alert' ? 'alertdialog' : 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      var title = o.title || (kind === 'confirm' ? 'Are you sure?' : '');
      overlay.innerHTML =
        '<div class="zsd-panel">' +
          (title ? '<h2 class="zsd-title">' + _esc(title) + '</h2>' : '') +
          (o.message ? '<p class="zsd-message">' + _esc(o.message) + '</p>' : '') +
          (kind === 'prompt'
            ? '<input class="zsd-input" type="' + (o.inputType === 'password' ? 'password' : o.inputType === 'number' ? 'number' : 'text') + '"' +
              (o.inputMode ? ' inputmode="' + _esc(o.inputMode) + '"' : '') +
              ' autocomplete="off" autocapitalize="off" aria-label="' + _esc(o.label || title || o.message || 'Answer') + '"' +
              (o.placeholder ? ' placeholder="' + _esc(o.placeholder) + '"' : '') + '>'
            : '') +
          '<div class="zsd-actions">' +
            (kind === 'alert' ? '' :
              '<button type="button" class="zsd-btn zsd-cancel">' + _esc(o.cancelLabel || 'Cancel') + '</button>') +
            '<button type="button" class="zsd-btn zsd-ok' + (o.danger ? ' zsd-danger' : '') + '">' +
              _esc(o.confirmLabel || 'OK') +
            '</button>' +
          '</div>' +
        '</div>';

      var input = overlay.querySelector('.zsd-input');
      if (input && o.defaultValue != null) input.value = String(o.defaultValue);
      var yes = function() { return kind === 'prompt' ? input.value : kind === 'confirm' ? true : undefined; };
      var no  = function() { return kind === 'prompt' ? null : kind === 'confirm' ? false : undefined; };

      overlay.addEventListener('click', function(e) {
        if (e.target === overlay && kind !== 'alert') _settle(no());
      });
      var cancel = overlay.querySelector('.zsd-cancel');
      if (cancel) cancel.addEventListener('click', function() { _settle(no()); });
      overlay.querySelector('.zsd-ok').addEventListener('click', function() { _settle(yes()); });

      document.body.appendChild(overlay);
      _open = { resolve: resolve, overlay: overlay, lastFocus: document.activeElement, kind: kind, yes: yes, no: no };
      document.addEventListener('keydown', _onKey, true);

      // Focus the safe choice, so a stray Enter or tap cancels; a prompt
      // focuses its box (on iPad that opens the keyboard).
      try { (input || cancel || overlay.querySelector('.zsd-ok')).focus(); } catch (e) {}
    });
  }

  // opts: { title, message, confirmLabel, cancelLabel, danger }
  function confirm(opts) { return _show('confirm', _norm(opts)); }

  // opts: { title, message, confirmLabel }  (or just the message)
  function alert(opts) { return _show('alert', _norm(opts)); }

  // opts: { title, message, defaultValue, placeholder, inputType: 'text'|'password'|'number', inputMode, confirmLabel, cancelLabel }
  function prompt(opts) { return _show('prompt', _norm(opts)); }

  var _toastTimer = null;

  function toast(message, ms) {
    _injectStyles();
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

  return { confirm: confirm, alert: alert, prompt: prompt, toast: toast };
})();

if (typeof window !== 'undefined') window.ZsDialog = ZsDialog;
