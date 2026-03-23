/* ================================================================
   LITTLE MAESTRO — Shared Login Bridge (lm-bridge.js)
   ================================================================
   
   INSTALL: Add these two lines right before </body> in little-maestro.html:
   
     <script src="js/auth.js"></script>
     <script src="js/lm-bridge.js"></script>
   
   DO NOT add nav.js — Little Maestro has its own header/nav system.
   This bridge only replaces the login flow, not the UI chrome.
   ================================================================ */

(function() {
  'use strict';

  function bridgeInit() {
    // Ensure Little Maestro's UserManager exists
    if (typeof UserManager === 'undefined') {
      console.warn('[LM-Bridge] UserManager not found — is this little-maestro.html?');
      return;
    }

    // Read shared Zavala Serra user
    var sharedUser = null;
    try {
      sharedUser = JSON.parse(localStorage.getItem('zs_active_user'));
    } catch(e) {}

    // No shared user → redirect to hub
    if (!sharedUser) {
      window.location.href = 'index.html';
      return;
    }

    var name   = sharedUser.name;
    var avatar = sharedUser.avatar || '🐱';
    var color  = sharedUser.color || '#7C3AED';

    // Find or create a matching Little Maestro profile
    var allUsers = UserManager.getAllUsers();
    var existing = allUsers.find(function(u) {
      return u.profile.name.toLowerCase() === name.toLowerCase();
    });

    if (existing) {
      try { UserManager.loadUser(name); }
      catch(e) { console.error('[LM-Bridge] Load failed:', e); return; }
    } else {
      try {
        UserManager.createUser(name, avatar, color);
        try { UserManager.loadUser(name); } catch(e) {}
      } catch(e) {
        // Name might exist with different case — try loading
        console.warn('[LM-Bridge] Create failed, trying load:', e.message);
        try { UserManager.loadUser(name); }
        catch(e2) { console.error('[LM-Bridge] Cannot create or load:', e2); return; }
      }
    }

    // Update LM header with user info
    var nameEl   = document.querySelector('.hdr-student-name');
    var avatarEl = document.querySelector('.hdr-student-avatar');
    if (nameEl)   nameEl.textContent  = name;
    if (avatarEl) avatarEl.textContent = avatar;

    // Show nav + header (LM's login screen hides them)
    var nav    = document.getElementById('bottom-nav');
    var header = document.getElementById('global-header');
    if (nav)    nav.style.display    = 'flex';
    if (header) header.style.display = 'flex';

    // Skip login → go to home (or restore last screen)
    if (typeof showScreen === 'function') {
      var savedScreen = sessionStorage.getItem('lm_current_screen');
      if (savedScreen && savedScreen !== 'login' && savedScreen !== 'screen-login') {
        showScreen(savedScreen);
      } else {
        showScreen('home');
      }
    }

    // Store session for page refreshes
    sessionStorage.setItem('lm_active_user', name);

    // Add "Back to Hub" button in the header
    var headerEl = document.getElementById('global-header');
    if (headerEl && !document.getElementById('lm-hub-btn')) {
      var hubBtn = document.createElement('a');
      hubBtn.id = 'lm-hub-btn';
      hubBtn.href = 'index.html';
      hubBtn.textContent = '🏠';
      hubBtn.title = 'Back to Apps';
      hubBtn.className = 'hdr-lock-btn'; // reuse LM's existing button style
      hubBtn.style.marginRight = '8px';
      hubBtn.style.textDecoration = 'none';
      hubBtn.style.fontSize = '16px';

      // Insert before the logo
      var logo = headerEl.querySelector('.hdr-logo');
      if (logo) headerEl.insertBefore(hubBtn, logo);
      else headerEl.prepend(hubBtn);
    }

    // Override "Switch Student" (header student click) → go to hub
    var studentBtn = document.querySelector('.hdr-student');
    if (studentBtn) {
      var newBtn = studentBtn.cloneNode(true);
      studentBtn.parentNode.replaceChild(newBtn, studentBtn);
      newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('zs_active_user');
        sessionStorage.removeItem('lm_active_user');
        window.location.href = 'index.html';
      });
      newBtn.title = 'Switch user (back to hub)';
    }

    // Intercept showScreen('login') → redirect to hub instead
    var origShowScreen = window.showScreen;
    if (origShowScreen) {
      window.showScreen = function(screenId) {
        if (screenId === 'login' || screenId === 'screen-login') {
          window.location.href = 'index.html';
          return;
        }
        origShowScreen(screenId);
      };
    }

    console.log('[LM-Bridge] ✓ Loaded as "' + name + '"');
  }

  // Run after all LM scripts have initialized
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(bridgeInit, 150);
    });
  } else {
    setTimeout(bridgeInit, 150);
  }
})();
