/* ================================================================
   ZAVALA SERRA APPS — Service Worker
   Caching strategy:
     - HTML documents         → network-first (fall back to cache)
     - CSS / JS / images      → stale-while-revalidate
     - Fonts (Google CDN)     → cache-first (they're versioned)
     - /api/* (VPS sync)      → never cache (user data)
     - External URLs we don't know → pass through

   Bump CACHE_VERSION when you change SW logic or want to invalidate
   the precache. Existing caches are cleaned up on activate.
   ================================================================ */

'use strict';

const CACHE_VERSION = 'zs-suite-v6';
const CORE_CACHE = CACHE_VERSION + '-core';
const ASSETS_CACHE = CACHE_VERSION + '-assets';
const FONTS_CACHE = CACHE_VERSION + '-fonts';

// Bare-minimum shell: the hub + the shared JS/CSS so the suite can
// boot offline. Per-app HTML is cached lazily as the user visits them.
const CORE_ASSETS = [
  './',
  './index.html',
  './css/common.css',
  './css/index.css',
  './js/auth.js',
  './js/sync.js',
  './js/index.js',
  './js/nav.js',
  './js/debug.js',
  './manifest.json',
  './icons/icon.svg',
  './icons/icon-maskable.svg'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CORE_CACHE).then(function(cache) {
      // Use individual puts so one bad asset doesn't abort the whole install.
      return Promise.all(CORE_ASSETS.map(function(url) {
        return fetch(url, { cache: 'no-store' })
          .then(function(res) {
            if (res.ok) return cache.put(url, res.clone());
          })
          .catch(function() { /* ok, try again on next install */ });
      }));
    }).then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) {
        if (k.indexOf(CACHE_VERSION) !== 0) return caches.delete(k);
      }));
    }).then(function() { return self.clients.claim(); })
  );
});

function _isHTML(req) {
  if (req.mode === 'navigate') return true;
  var accept = req.headers.get('accept') || '';
  return accept.indexOf('text/html') !== -1;
}

function _isFont(url) {
  return url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
}

function _isAPI(url) {
  return url.pathname.indexOf('/api/') !== -1;
}

function _sameOrigin(url) {
  return url.origin === self.location.origin;
}

self.addEventListener('fetch', function(event) {
  var req = event.request;
  // Only GET requests are cacheable.
  if (req.method !== 'GET') return;

  var url;
  try { url = new URL(req.url); }
  catch (e) { return; }

  // Never cache the sync/diag APIs.
  if (_isAPI(url)) return;

  // Chrome extensions and other schemes: pass through.
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  if (_isFont(url)) {
    event.respondWith(_cacheFirst(req, FONTS_CACHE));
    return;
  }

  if (!_sameOrigin(url)) {
    // Third-party non-font: don't touch it — let the network handle.
    return;
  }

  if (_isHTML(req)) {
    event.respondWith(_networkFirst(req, CORE_CACHE));
    return;
  }

  // Same-origin static asset (css/js/images/svg)
  event.respondWith(_staleWhileRevalidate(req, ASSETS_CACHE));
});

function _networkFirst(req, cacheName) {
  return fetch(req).then(function(res) {
    if (res && res.ok) {
      var clone = res.clone();
      caches.open(cacheName).then(function(c) { c.put(req, clone); });
    }
    return res;
  }).catch(function() {
    return caches.match(req).then(function(cached) {
      return cached || caches.match('./index.html');
    });
  });
}

function _cacheFirst(req, cacheName) {
  return caches.match(req).then(function(cached) {
    if (cached) return cached;
    return fetch(req).then(function(res) {
      if (res && res.ok) {
        var clone = res.clone();
        caches.open(cacheName).then(function(c) { c.put(req, clone); });
      }
      return res;
    });
  });
}

function _staleWhileRevalidate(req, cacheName) {
  return caches.match(req).then(function(cached) {
    var fetchPromise = fetch(req).then(function(res) {
      if (res && res.ok) {
        var clone = res.clone();
        caches.open(cacheName).then(function(c) { c.put(req, clone); });
      }
      return res;
    }).catch(function() { return cached; });
    return cached || fetchPromise;
  });
}

// Allow the page to ask the SW to activate a pending update immediately.
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
