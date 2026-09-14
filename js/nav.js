/* ================================================================
   ZAVALA SERRA APPS — Shared Navigation (nav.js)
   
   Renders: home button + user badge + global star counter
   Requires: auth.js loaded first (provides getActiveUser, getTotalStars)
   
   Rules:
   - Does NOT run on index.html (hub has its own nav)
   - Does NOT run on little-maestro.html (LM has its own header)
   - On all other app pages: creates nav inside .app container
   - If no user is logged in, redirects to index.html — EXCEPT on
     pages that declare themselves household-scoped with
     <body data-household>. The shopping list and the weekly menu are
     shared family data (zs_shopping_list / zs_menu live in the
     household bucket, not under a kid), and they're linked straight
     from the Family Wall, which nobody is signed in to. Bouncing
     those to a login screen asked for a password to see the list
     already displayed on the wall behind it.
   ================================================================ */

(function() {
  'use strict';

  function shouldSkip() {
    var path = window.location.pathname;
    if (path.endsWith('index.html') || path.endsWith('/')) return true;
    if (path.includes('little-maestro')) return true;
    return false;
  }

  // Shared family data, readable and editable without signing in.
  function _isHousehold() {
    return !!(document.body && document.body.hasAttribute('data-household'));
  }

  // A nav for nobody in particular: a way back to the wall and to the
  // hub, and no user badge or star count, because there's no user.
  function _renderHouseholdNav() {
    var appContainer = document.querySelector('.app') || document.body;
    if (document.getElementById('zs-nav')) return;

    var nav = document.createElement('div');
    nav.id = 'zs-nav';

    var wallBtn = document.createElement('a');
    wallBtn.className = 'home-btn';
    wallBtn.href = 'family.html';
    wallBtn.title = 'Back to the family wall';
    wallBtn.textContent = '\u2190';

    var homeBtn = document.createElement('a');
    homeBtn.className = 'home-btn';
    homeBtn.href = 'index.html';
    homeBtn.title = 'Back to apps';
    homeBtn.textContent = '\ud83c\udfe0';

    nav.appendChild(wallBtn);
    nav.appendChild(homeBtn);
    appContainer.prepend(nav);
  }

  function renderNav() {
    if (shouldSkip()) return;
    if (typeof getActiveUser !== 'function') {
      console.warn('[nav.js] getActiveUser not found. Is auth.js loaded?');
      return;
    }

    var user = getActiveUser();
    if (!user) {
      if (!_isHousehold()) {
        window.location.href = 'index.html';
        return;
      }
      _renderHouseholdNav();
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
