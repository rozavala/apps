/* ================================================================
   ZAVALA SERRA APPS — Shared Navigation (nav.js)
   
   Renders: home button + user badge + global star counter
   Requires: auth.js loaded first (provides getActiveUser, getTotalStars)
   
   Rules:
   - Does NOT run on index.html (hub has its own nav)
   - Does NOT run on little-maestro.html (LM has its own header)
   - On all other app pages: creates nav inside .app container
   - If no user is logged in, redirects to index.html
   ================================================================ */

(function() {
  'use strict';

  function shouldSkip() {
    var path = window.location.pathname;
    if (path.endsWith('index.html') || path.endsWith('/')) return true;
    if (path.includes('little-maestro')) return true;
    return false;
  }

  function renderNav() {
    if (shouldSkip()) return;
    if (typeof getActiveUser !== 'function') {
      console.warn('[nav.js] getActiveUser not found. Is auth.js loaded?');
      return;
    }

    var user = getActiveUser();
    if (!user) {
      window.location.href = 'index.html';
      return;
    }

    var appContainer = document.querySelector('.app') || document.body;
    if (document.getElementById('zs-nav')) return;

    // Nav container
    var nav = document.createElement('div');
    nav.id = 'zs-nav';

    // Home button
    var homeBtn = document.createElement('a');
    homeBtn.className = 'home-btn';
    homeBtn.href = 'index.html';
    homeBtn.title = 'Back to apps';
    homeBtn.textContent = '🏠';

    // User badge
    var badge = document.createElement('div');
    badge.className = 'user-badge';
    badge.id = 'userBadge';

    var avatar = document.createElement('div');
    avatar.className = 'user-badge-avatar';
    avatar.id = 'ubAvatar';
    avatar.textContent = user.avatar;
    var color = typeof safeColor === 'function' ? safeColor(user.color) : user.color;
    avatar.style.background = color + '22';
    avatar.style.borderColor = color;

    var nameSpan = document.createElement('span');
    nameSpan.id = 'ubName';
    nameSpan.textContent = user.name;

    // Star counter
    var starCount = 0;
    if (typeof getTotalStars === 'function') {
      starCount = getTotalStars();
    }
    var starEl = document.createElement('span');
    starEl.id = 'zs-star-count';
    starEl.className = 'star-counter';
    starEl.textContent = '⭐ ' + starCount;

    badge.appendChild(avatar);
    badge.appendChild(nameSpan);
    badge.appendChild(starEl);

    nav.appendChild(homeBtn);
    nav.appendChild(badge);

    appContainer.prepend(nav);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderNav);
  } else {
    renderNav();
  }
})();
