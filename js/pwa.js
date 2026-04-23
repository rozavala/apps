/* ================================================================
   PWA — pwa.js
   - Registers ./sw.js so the suite is offline-capable.
   - Captures the beforeinstallprompt event and exposes a small
     "📱 Install" button on the hub after the user has visited
     at least twice (not first-load nagging).
   - Shows a one-line "Nueva versión disponible" banner when a new
     service worker is waiting.

   The install button is created lazily only when the browser both
   supports the prompt and hasn't already been installed.
   ================================================================ */

(function() {
  'use strict';
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  // ── Visit counter so we don't spam the install UX on first load.
  try {
    var visits = parseInt(localStorage.getItem('zs_visits') || '0', 10) || 0;
    visits++;
    localStorage.setItem('zs_visits', String(visits));
  } catch (e) {}

  var deferredPrompt = null;

  // Skip SW on file:// and other dev protocols.
  var protoOk = location.protocol === 'http:' || location.protocol === 'https:';
  if (!protoOk) return;

  function _visits() {
    try { return parseInt(localStorage.getItem('zs_visits') || '0', 10) || 0; }
    catch (e) { return 0; }
  }

  function _alreadyInstalled() {
    return window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
  }

  // ── Register the SW ────────────────────────────────────────────
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('./sw.js')
      .then(function(reg) {
        if (typeof Debug !== 'undefined') Debug.log('[PWA] SW registered:', reg.scope);

        // Listen for updates becoming available.
        reg.addEventListener('updatefound', function() {
          var newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', function() {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              _showUpdateBanner(reg);
            }
          });
        });
      })
      .catch(function(err) {
        if (typeof Debug !== 'undefined') Debug.warn('[PWA] SW registration failed:', err);
      });

    // If a new SW activates and takes control, reload once so the
    // freshly-cached HTML is in effect.
    var reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', function() {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    });
  });

  // ── Install prompt capture ─────────────────────────────────────
  window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    deferredPrompt = e;
    if (_visits() >= 2 && !_alreadyInstalled()) _mountInstallButton();
  });

  window.addEventListener('appinstalled', function() {
    try { localStorage.setItem('zs_pwa_installed', '1'); } catch (e) {}
    _removeInstallButton();
  });

  // ── UI: install button on the hub footer ───────────────────────
  function _mountInstallButton() {
    if (document.getElementById('zs-pwa-install')) return;
    // Only on hub.
    if (!document.getElementById('hub-screen')) return;

    var btn = document.createElement('button');
    btn.id = 'zs-pwa-install';
    btn.className = 'parent-btn';
    btn.style.cssText = 'margin-top:0;background:linear-gradient(135deg,#7C3AED,#EC4899);color:#fff;border:none;font-weight:800;';
    btn.textContent = '📱 Instalar en pantalla de inicio';
    btn.addEventListener('click', function() {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function(choice) {
        if (choice && choice.outcome === 'accepted') _removeInstallButton();
        deferredPrompt = null;
      });
    });

    // Slot into the bottom action row if we can find it.
    var row = document.querySelector('#hub-screen .parent-btn');
    if (row && row.parentElement) row.parentElement.appendChild(btn);
    else document.body.appendChild(btn);
  }

  function _removeInstallButton() {
    var el = document.getElementById('zs-pwa-install');
    if (el && el.parentElement) el.parentElement.removeChild(el);
  }

  // ── UI: update-available banner ────────────────────────────────
  function _showUpdateBanner(reg) {
    if (document.getElementById('zs-pwa-update')) return;
    var bar = document.createElement('div');
    bar.id = 'zs-pwa-update';
    bar.style.cssText =
      'position:fixed;left:0;right:0;bottom:0;z-index:9999;' +
      'padding:10px 16px;background:linear-gradient(135deg,#7C3AED,#EC4899);color:#fff;' +
      'font-family:var(--font-body,sans-serif);font-weight:700;font-size:0.9rem;' +
      'display:flex;align-items:center;justify-content:center;gap:14px;' +
      'box-shadow:0 -8px 24px -12px rgba(0,0,0,0.5);';
    bar.innerHTML =
      '<span>✨ Nueva versión lista. Toca para actualizar.</span>' +
      '<button id="zs-pwa-update-btn" style="padding:6px 14px;border-radius:99px;border:none;background:#fff;color:#7C3AED;font-weight:800;cursor:pointer;">Actualizar</button>';
    document.body.appendChild(bar);
    document.getElementById('zs-pwa-update-btn').addEventListener('click', function() {
      if (reg && reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      // controllerchange listener above will reload.
    });
  }
})();
