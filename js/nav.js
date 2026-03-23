function renderNav() {
  const user = getActiveUser();
  if (!user) return; // Only show navigation if logged in (for apps)

  const navHTML = `
    <a class="home-btn" href="index.html" title="Back to apps">🏠</a>
    <div class="user-badge" id="userBadge">
      <div class="user-badge-avatar" id="ubAvatar" style="background:${user.color}22;border-color:${user.color}">${user.avatar}</div>
      <span id="ubName">${user.name}</span>
    </div>
  `;

  // Create a container or prepend to body/app container
  const appContainer = document.querySelector('.app') || document.body;

  // Create a dedicated nav container if it doesn't exist
  let navContainer = document.getElementById('main-nav');
  if (!navContainer) {
    navContainer = document.createElement('div');
    navContainer.id = 'main-nav';
    appContainer.prepend(navContainer);
  }

  navContainer.innerHTML = navHTML;
}

// Automatically render if it's an app page (not index.html)
if (!window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('/')) {
  document.addEventListener('DOMContentLoaded', renderNav);
}
