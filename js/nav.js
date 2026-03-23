/* ================================================================
   ZAVALA SERRA APPS — Shared Navigation (nav.js)
   
   Renders the home button + user badge into any app page.
   Uses CSS classes from common.css — no inline styles.
   
   Requires: auth.js loaded first (provides getActiveUser)
   
   Rules:
   - Does NOT run on index.html (hub has its own nav)
   - Does NOT run on little-maestro.html (LM has its own header; lm-bridge.js handles it)
   - On all other app pages: creates .home-btn + .user-badge inside .app container
   - If no user is logged in, redirects to index.html
   ================================================================ */

(function() {
  'use strict';

  function shouldSkip() {
    const path = window.location.pathname;
    // Skip on hub
    if (path.endsWith('index.html') || path.endsWith('/')) return true;
    // Skip on Little Maestro (lm-bridge.js handles its nav)
    if (path.includes('little-maestro')) return true;
    return false;
  }

  function renderNav() {
    if (shouldSkip()) return;

    // Require auth.js
    if (typeof getActiveUser !== 'function') {
      console.warn('[nav.js] getActiveUser not found. Is auth.js loaded?');
      return;
    }

    const user = getActiveUser();

    // No user logged in → redirect to hub
    if (!user) {
      window.location.href = 'index.html';
      return;
    }

    // Find the app container
    const appContainer = document.querySelector('.app') || document.body;

    // Don't duplicate — check if nav already exists
    if (document.getElementById('zs-nav')) return;

    // Create nav container
    const nav = document.createElement('div');
    nav.id = 'zs-nav';

    // Home button
    const homeBtn = document.createElement('a');
    homeBtn.className = 'home-btn';
    homeBtn.href = 'index.html';
    homeBtn.title = 'Back to apps';
    homeBtn.textContent = '🏠';

    // User badge
    const badge = document.createElement('div');
    badge.className = 'user-badge';
    badge.id = 'userBadge';

    const avatar = document.createElement('div');
    avatar.className = 'user-badge-avatar';
    avatar.id = 'ubAvatar';
    avatar.textContent = user.avatar;
    avatar.style.background = user.color + '22';
    avatar.style.borderColor = user.color;

    const name = document.createElement('span');
    name.id = 'ubName';
    name.textContent = user.name;

    badge.appendChild(avatar);
    badge.appendChild(name);

    nav.appendChild(homeBtn);
    nav.appendChild(badge);

    // Insert at the start of the app container
    appContainer.prepend(nav);
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderNav);
  } else {
    renderNav();
  }
})();
