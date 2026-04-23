/* ================================================================
   CERTIFICATE — certificate.js
   Renders a printable certificate from URL params.
   Query params:
     - name:  kid's name (falls back to active user)
     - rank:  rank name (Cadet, Apprentice, Explorer, ...) — if omitted,
              computed live from getPlayerStats()
     - app:   optional app id (math, piano, chess, ...) — narrows
              the certificate to a single app's progress
     - date:  optional ISO date string; defaults to today
   ================================================================ */

var Certificate = (function() {
  'use strict';

  var APP_LABELS = {
    math: { name: 'Math Galaxy', emoji: '🧮' },
    chile: { name: 'Descubre Chile', emoji: '🇨🇱' },
    chess: { name: 'Chess Quest', emoji: '♟️' },
    piano: { name: 'Little Maestro', emoji: '🎹' },
    faith: { name: 'Fe Explorador', emoji: '⛪' },
    guitar: { name: 'Guitar Jam', emoji: '🎸' },
    art: { name: 'Art Studio', emoji: '🎨' },
    sports: { name: 'Sports Arena', emoji: '🏓' },
    lab: { name: 'Lab Explorer', emoji: '🔬' },
    world: { name: 'World Explorer', emoji: '🌍' },
    story: { name: 'Story Explorer', emoji: '📚' },
    guess: { name: 'Guess Quest', emoji: '🎯' }
  };

  var RANK_ICONS = {
    'Cadet': '🛸',
    'Apprentice': '🌟',
    'Veteran': '🛡️',
    'Explorer': '🌍',
    'Pilot': '🚀',
    'Astronaut': '🌌',
    'Elite': '💎',
    'Grand Master': '👑'
  };

  function _getParam(k) {
    var m = window.location.search.match(new RegExp('[?&]' + k + '=([^&]*)'));
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : null;
  }

  function _formatDate(d) {
    var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  }

  function render() {
    var nameParam = _getParam('name');
    var rankParam = _getParam('rank');
    var appParam = _getParam('app');
    var dateParam = _getParam('date');

    // Resolve name
    var name = nameParam;
    if (!name && typeof getActiveUser === 'function') {
      var u = getActiveUser();
      if (u) name = u.name;
    }
    if (!name) name = 'Explorer';

    // Resolve rank
    var rankName = rankParam;
    if (!rankName && typeof getExplorerRank === 'function') {
      try {
        var r = getExplorerRank(name);
        if (r && r.name) rankName = r.name;
      } catch (e) {}
    }
    if (!rankName) rankName = 'Cadet';
    var rankIcon = RANK_ICONS[rankName] || '🏆';

    // Resolve app line
    var appLine = 'across the Zavala Serra Apps suite';
    var sealIcon = rankIcon;
    if (appParam && APP_LABELS[appParam]) {
      appLine = 'in ' + APP_LABELS[appParam].name;
      sealIcon = APP_LABELS[appParam].emoji;
    }

    // Resolve date
    var d = dateParam ? new Date(dateParam) : new Date();
    if (isNaN(d.getTime())) d = new Date();

    // Write to DOM
    var nameEl = document.getElementById('cert-name');
    var rankEl = document.getElementById('cert-rank');
    var appEl = document.getElementById('cert-app');
    var dateEl = document.getElementById('cert-date');
    var sealEl = document.getElementById('cert-seal');

    if (nameEl) nameEl.textContent = name;
    if (rankEl) rankEl.textContent = rankIcon + ' ' + rankName;
    if (appEl) appEl.textContent = appLine;
    if (dateEl) dateEl.textContent = _formatDate(d);
    if (sealEl) sealEl.textContent = sealIcon;

    // Title tab
    document.title = 'Certificate — ' + name + ' · ' + rankName;
  }

  function print() { window.print(); }

  function init() { render(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { render: render, print: print };
})();
