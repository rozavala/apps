/* ================================================================
   LITTLE MAESTRO — lm-art.js
   Drawing only. Inline SVG for the Song Map (worlds, winding trail,
   song medallions, the kid's avatar on the current stone), the
   Trophy Room cabinet and the home-screen icons, plus a pointer-held
   "pk-down" class so on-screen keys visibly go down while touched.

   It reads progress through the app's own helpers (activeProgress,
   pathOrder, currentSongFrom, completedSongIds, librarySongs, SONGS,
   LM_PATHS, LM_WORLDS) and never writes storage, never changes what
   a tap does, and never touches the lesson engine or MIDI input.
   No images, no network.
   ================================================================ */

var LMArt = (function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  var EMOJI_FONT = 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif';

  /* ──────────────────────────────────────────────────────────────
     0. Shared SVG gradients (one hidden <svg>, referenced by id)
     ────────────────────────────────────────────────────────────── */
  var METALS = {
    bronze: { l: '#f7d2aa', m: '#c4803f', d: '#7a4519', x: '#4a2a10' },
    silver: { l: '#ffffff', m: '#c6ccd6', d: '#7d8796', x: '#4a525e' },
    gold:   { l: '#fff4bd', m: '#e6b43a', d: '#946109', x: '#5a3a05' },
    purple: { l: '#ede9fe', m: '#a78bfa', d: '#6d28d9', x: '#3b0764' },
    stone:  { l: '#f1f0ee', m: '#cfcdc8', d: '#9a968e', x: '#5f5b54' }
  };

  function ensureDefs() {
    if (document.getElementById('lma-defs')) return;
    var g = '';
    Object.keys(METALS).forEach(function (k) {
      var m = METALS[k];
      g += '<linearGradient id="lma-' + k + '-rim" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0" stop-color="' + m.l + '"/><stop offset=".35" stop-color="' + m.m + '"/>' +
        '<stop offset=".62" stop-color="' + m.d + '"/><stop offset=".82" stop-color="' + m.m + '"/><stop offset="1" stop-color="' + m.l + '"/></linearGradient>';
      g += '<radialGradient id="lma-' + k + '-face" cx=".38" cy=".32" r=".85">' +
        '<stop offset="0" stop-color="' + m.l + '"/><stop offset=".55" stop-color="' + m.m + '"/><stop offset="1" stop-color="' + m.d + '"/></radialGradient>';
      g += '<linearGradient id="lma-' + k + '-cup" x1="0" y1="0" x2="1" y2="0">' +
        '<stop offset="0" stop-color="' + m.d + '"/><stop offset=".22" stop-color="' + m.m + '"/><stop offset=".38" stop-color="' + m.l + '"/>' +
        '<stop offset=".56" stop-color="' + m.m + '"/><stop offset="1" stop-color="' + m.d + '"/></linearGradient>';
    });
    g += '<radialGradient id="lma-ivory" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#f8f3e8"/><stop offset="1" stop-color="#e7dcc6"/></radialGradient>';
    g += '<radialGradient id="lma-lacq" cx=".38" cy=".3" r=".85"><stop offset="0" stop-color="#a78bfa"/><stop offset=".5" stop-color="#7c3aed"/><stop offset="1" stop-color="#4c1d95"/></radialGradient>';
    g += '<radialGradient id="lma-slate" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#eceef2"/><stop offset=".7" stop-color="#cdd1d9"/><stop offset="1" stop-color="#a7adb8"/></radialGradient>';
    g += '<linearGradient id="lma-slab" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4efe4"/><stop offset=".55" stop-color="#d9cfbb"/><stop offset="1" stop-color="#a99c83"/></linearGradient>';
    g += '<linearGradient id="lma-slab-night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8e98c2"/><stop offset=".55" stop-color="#5d678f"/><stop offset="1" stop-color="#3a4166"/></linearGradient>';
    g += '<radialGradient id="lma-shadow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>';
    g += '<radialGradient id="lma-glow" cx=".5" cy=".5" r=".5"><stop offset=".55" stop-color="#fbbf24" stop-opacity=".55"/><stop offset="1" stop-color="#fbbf24" stop-opacity="0"/></radialGradient>';
    g += '<linearGradient id="lma-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a6436"/><stop offset=".5" stop-color="#7a4a24"/><stop offset="1" stop-color="#5a3518"/></linearGradient>';
    g += '<linearGradient id="lma-leaf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#86c96a"/><stop offset="1" stop-color="#3f8a3a"/></linearGradient>';
    g += '<linearGradient id="lma-pine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2f7d4f"/><stop offset=".5" stop-color="#3f9a62"/><stop offset="1" stop-color="#256a42"/></linearGradient>';
    g += '<linearGradient id="lma-marble" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#cfc9bd"/><stop offset=".35" stop-color="#fbf9f4"/><stop offset=".7" stop-color="#e4dfd4"/><stop offset="1" stop-color="#bdb6a8"/></linearGradient>';
    g += '<filter id="lma-ds" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="1.6" flood-color="#000" flood-opacity=".35"/></filter>';
    var el = document.createElement('div');
    el.id = 'lma-defs';
    el.setAttribute('aria-hidden', 'true');
    el.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
    el.innerHTML = '<svg width="0" height="0" focusable="false"><defs>' + g + '</defs></svg>';
    document.body.appendChild(el);
  }

  function star(cx, cy, r, fill, stroke) {
    var pts = [];
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
      pts.push((cx + rr * Math.cos(a)).toFixed(1) + ',' + (cy + rr * Math.sin(a)).toFixed(1));
    }
    return '<polygon points="' + pts.join(' ') + '" fill="' + fill + '"' + (stroke ? ' stroke="' + stroke + '" stroke-width="1.1" stroke-linejoin="round"' : '') + '/>';
  }

  // a beamed pair of eighth notes, centred on (cx, cy), about s tall
  function notesGlyph(cx, cy, s, fill) {
    var k = s / 30;
    function X(v) { return (cx + v * k).toFixed(1); }
    function Y(v) { return (cy + v * k).toFixed(1); }
    return '<g fill="' + fill + '">' +
      '<ellipse cx="' + X(-7) + '" cy="' + Y(9) + '" rx="' + (5.6 * k).toFixed(1) + '" ry="' + (4.2 * k).toFixed(1) + '" transform="rotate(-20 ' + X(-7) + ' ' + Y(9) + ')"/>' +
      '<ellipse cx="' + X(9) + '" cy="' + Y(5) + '" rx="' + (5.6 * k).toFixed(1) + '" ry="' + (4.2 * k).toFixed(1) + '" transform="rotate(-20 ' + X(9) + ' ' + Y(5) + ')"/>' +
      '<rect x="' + X(-2.6) + '" y="' + Y(-13) + '" width="' + (2.4 * k).toFixed(1) + '" height="' + (22 * k).toFixed(1) + '"/>' +
      '<rect x="' + X(13.4) + '" y="' + Y(-17) + '" width="' + (2.4 * k).toFixed(1) + '" height="' + (22 * k).toFixed(1) + '"/>' +
      '<path d="M' + X(-2.6) + ',' + Y(-13) + ' L' + X(15.8) + ',' + Y(-17) + ' L' + X(15.8) + ',' + Y(-11.5) + ' L' + X(-2.6) + ',' + Y(-7.5) + 'Z"/>' +
      '</g>';
  }

  /* ──────────────────────────────────────────────────────────────
     1. KEYBOARD — keys go down while a finger or mouse holds them.
     Visual only: listens passively (capture) and never cancels or
     re-routes the event; the keyboard's own pointerdown handler
     still does the input. Only on keyboards in tap mode.
     ────────────────────────────────────────────────────────────── */
  var _held = {};
  function _keyFrom(t) {
    return t && t.closest ? t.closest('.pk-wrap--interactive .pk-white, .pk-wrap--interactive .pk-black') : null;
  }
  function _release(id) {
    var k = _held[id];
    if (k) { k.classList.remove('pk-down'); delete _held[id]; }
  }
  function _releaseAll() { Object.keys(_held).forEach(_release); }
  document.addEventListener('pointerdown', function (e) {
    var k = _keyFrom(e.target);
    if (!k) return;
    _release(e.pointerId);
    k.classList.add('pk-down');
    _held[e.pointerId] = k;
  }, { capture: true, passive: true });
  ['pointerup', 'pointercancel'].forEach(function (t) {
    window.addEventListener(t, function (e) { _release(e.pointerId); }, { capture: true, passive: true });
  });
  window.addEventListener('blur', _releaseAll);
  document.addEventListener('visibilitychange', _releaseAll);

  /* ──────────────────────────────────────────────────────────────
     2. SONG MAP
     ────────────────────────────────────────────────────────────── */
  // world id → scenery theme
  var WORLD_THEME = { 1: 'meadow', 2: 'sky', 3: 'fair', 20: 'hills', 21: 'garden', 22: 'rail', 23: 'night', 24: 'classic', 25: 'world' };
  var PATH_COLOR = { primer: '#db2777', level1: '#2563eb', level2: '#ea580c' };

  // ── Horizon band at the top of each world (viewBox 600×160) ──
  function hills(d, fill, op) { return '<path d="' + d + '" fill="' + fill + '"' + (op ? ' opacity="' + op + '"' : '') + '/>'; }
  function cloud(x, y, s, op) {
    return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')" opacity="' + (op || 0.95) + '">' +
      '<ellipse cx="0" cy="8" rx="34" ry="11" fill="#fff"/><circle cx="-12" cy="2" r="13" fill="#fff"/><circle cx="8" cy="-2" r="17" fill="#fff"/><circle cx="24" cy="5" r="10" fill="#fff"/>' +
      '<ellipse cx="2" cy="14" rx="30" ry="4" fill="#dfe8f3" opacity=".8"/></g>';
  }
  function balloon(x, y, s, c1, c2) {
    return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')">' +
      '<path d="M0,-30 C18,-30 24,-14 20,-2 C16,10 6,18 4,24 L-4,24 C-6,18 -16,10 -20,-2 C-24,-14 -18,-30 0,-30Z" fill="' + c1 + '"/>' +
      '<path d="M0,-30 C8,-30 10,-14 8,-2 C6,10 2,18 1,24 L-1,24 C-2,18 -6,10 -8,-2 C-10,-14 -8,-30 0,-30Z" fill="' + c2 + '"/>' +
      '<path d="M-12,-20 C-10,-26 -4,-28 0,-28" stroke="#fff" stroke-width="2.2" fill="none" opacity=".6" stroke-linecap="round"/>' +
      '<path d="M-4,24 L-5,32 M4,24 L5,32" stroke="#6b4a2a" stroke-width="1"/>' +
      '<rect x="-6" y="32" width="12" height="8" rx="1.5" fill="#8a5a2b"/><rect x="-6" y="32" width="12" height="2" fill="#a8743f"/></g>';
  }
  function pineSil(x, y, s, fill) {
    return '<path transform="translate(' + x + ',' + y + ') scale(' + s + ')" d="M0,-40 L12,-16 L6,-16 L16,0 L9,0 L18,14 L2,14 L2,22 L-2,22 L-2,14 L-18,14 L-9,0 L-16,0 L-6,-16 L-12,-16Z" fill="' + fill + '"/>';
  }
  function roundTree(x, y, s) {
    return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')"><rect x="-2.5" y="0" width="5" height="16" fill="#7a5230"/>' +
      '<circle cx="0" cy="-8" r="15" fill="url(#lma-leaf)"/><circle cx="-6" cy="-13" r="6" fill="#a5d98a" opacity=".55"/></g>';
  }

  function horizon(theme) {
    var s = '';
    switch (theme) {
      case 'sky':
        s += '<rect width="600" height="160" fill="url(#lmaHzSky)"/>' + cloud(90, 50, 1.1) + cloud(470, 34, 0.9) + cloud(300, 96, 0.7, 0.8) +
          balloon(190, 60, 0.9, '#f97316', '#fdba74') + balloon(400, 82, 0.65, '#3b82f6', '#93c5fd') + balloon(540, 104, 0.5, '#ec4899', '#f9a8d4') +
          hills('M0,150 C120,128 240,140 360,132 C470,125 540,138 600,134 L600,160 L0,160Z', '#bfe0b0');
        return { bg: ['#b9dcf6', '#e8f4fd'], body: s };
      case 'fair':
        s += '<rect width="600" height="160" fill="url(#lmaHzSky)"/><circle cx="500" cy="54" r="22" fill="#fff3c4" opacity=".9"/>';
        // carousel
        s += '<g transform="translate(300,64)"><path d="M-62,10 L0,-30 L62,10Z" fill="#ef4444"/>' +
          '<path d="M-62,10 L-31,-10 L-20,10Z M0,-30 L-10,10 L10,10Z M31,-10 L20,10 L62,10Z" fill="#fff" opacity=".9"/>' +
          '<rect x="-60" y="10" width="120" height="7" fill="#facc15"/><circle cx="0" cy="-32" r="4" fill="#facc15"/>' +
          '<rect x="-56" y="17" width="3" height="50" fill="#d4a017"/><rect x="53" y="17" width="3" height="50" fill="#d4a017"/>' +
          '<rect x="-21" y="17" width="3" height="50" fill="#d4a017"/><rect x="18" y="17" width="3" height="50" fill="#d4a017"/>' +
          '<path d="M-48,44 c4,-8 14,-8 16,0 l-2,8 h-12z M26,38 c4,-8 14,-8 16,0 l-2,8 h-12z" fill="#fff" stroke="#c2410c" stroke-width="1"/>' +
          '<rect x="-64" y="66" width="128" height="8" rx="2" fill="#b45309"/></g>';
        // tents
        s += '<g transform="translate(110,96)"><path d="M-30,30 L0,-14 L30,30Z" fill="#3b82f6"/><path d="M-10,30 L0,-14 L10,30Z" fill="#fff"/><path d="M0,-14 l0,-10 l10,4 l-10,4" fill="#ef4444"/></g>';
        s += '<g transform="translate(500,100)"><path d="M-26,26 L0,-12 L26,26Z" fill="#22c55e"/><path d="M-8,26 L0,-12 L8,26Z" fill="#fff"/></g>';
        // bunting
        s += '<path d="M0,30 Q150,60 300,30 Q450,0 600,30" fill="none" stroke="#7c5a3a" stroke-width="1.2"/>';
        for (var b = 0; b < 16; b++) {
          var bx = 18 + b * 37, bt = (bx % 300) / 300, by = bx < 300 ? 30 + 60 * bt * (1 - bt) : 30 - 60 * bt * (1 - bt);
          var col = ['#ef4444', '#facc15', '#3b82f6', '#22c55e'][b % 4];
          s += '<path d="M' + (bx - 7) + ',' + by.toFixed(1) + ' L' + (bx + 7) + ',' + by.toFixed(1) + ' L' + bx + ',' + (by + 13).toFixed(1) + 'Z" fill="' + col + '"/>';
        }
        s += hills('M0,148 C150,138 450,140 600,148 L600,160 L0,160Z', '#f2c9a0');
        return { bg: ['#ffd9b8', '#fff4e8'], body: s };
      case 'hills':
        s += '<rect width="600" height="160" fill="url(#lmaHzSky)"/><circle cx="96" cy="44" r="18" fill="#fff6c8"/>' + cloud(420, 40, 0.8);
        s += hills('M0,110 C80,70 150,80 230,96 C320,112 380,64 470,72 C540,78 580,96 600,100 L600,160 L0,160Z', '#a7d7b8');
        s += hills('M0,128 C100,104 200,112 300,124 C400,136 500,110 600,118 L600,160 L0,160Z', '#6fbf8c');
        s += pineSil(60, 116, 0.8, '#2f7d4f') + pineSil(84, 120, 0.6, '#256a42') + pineSil(530, 108, 0.9, '#2f7d4f') + pineSil(556, 114, 0.65, '#256a42');
        s += '<g transform="translate(400,116)"><rect x="-14" y="-12" width="28" height="18" fill="#fef3c7"/><path d="M-18,-12 L0,-26 L18,-12Z" fill="#b91c1c"/><rect x="-4" y="-4" width="8" height="10" fill="#92400e"/><rect x="6" y="-8" width="5" height="5" fill="#93c5fd"/></g>';
        s += hills('M0,146 C150,136 450,138 600,146 L600,160 L0,160Z', '#4fa872');
        return { bg: ['#bfe3f2', '#eef8f1'], body: s };
      case 'garden':
        s += '<rect width="600" height="160" fill="url(#lmaHzSky)"/>';
        s += '<path d="M0,40 Q150,64 300,40 Q450,16 600,40" fill="none" stroke="#5b4a7a" stroke-width="1"/>';
        for (var l = 0; l < 12; l++) { var lx = 25 + l * 50, lt = (lx % 300) / 300, ly = lx < 300 ? 40 + 48 * lt * (1 - lt) : 40 - 48 * lt * (1 - lt); s += '<circle cx="' + lx + '" cy="' + (ly + 6).toFixed(1) + '" r="5" fill="#fde68a"/><circle cx="' + lx + '" cy="' + (ly + 6).toFixed(1) + '" r="10" fill="#fde68a" opacity=".25"/>'; }
        // bandstand
        s += '<g transform="translate(300,82)"><path d="M-58,0 Q0,-44 58,0Z" fill="#7c3aed"/><path d="M-58,0 Q0,-44 58,0" fill="none" stroke="#fff" stroke-width="2" opacity=".5"/>' +
          '<circle cx="0" cy="-26" r="4" fill="#facc15"/><rect x="-60" y="0" width="120" height="6" fill="#ede9fe"/>' +
          '<rect x="-54" y="6" width="4" height="40" fill="#fff"/><rect x="-20" y="6" width="4" height="40" fill="#fff"/><rect x="16" y="6" width="4" height="40" fill="#fff"/><rect x="50" y="6" width="4" height="40" fill="#fff"/>' +
          '<rect x="-66" y="46" width="132" height="10" rx="2" fill="#e9e2f7" stroke="#b9a8db"/></g>';
        s += hills('M0,132 C40,118 80,118 120,130 C160,118 200,118 220,132 L220,160 L0,160Z', '#5f9e6e') + hills('M380,132 C420,118 460,118 500,130 C540,118 580,118 600,128 L600,160 L380,160Z', '#5f9e6e');
        s += hills('M0,146 C150,138 450,138 600,146 L600,160 L0,160Z', '#8cc79a');
        return { bg: ['#d9cdf3', '#f6f2fd'], body: s };
      case 'rail':
        s += '<rect width="600" height="160" fill="url(#lmaHzSky)"/><circle cx="480" cy="46" r="20" fill="#fff1c2"/>' + cloud(150, 36, 0.7);
        s += hills('M0,104 C100,80 200,92 300,100 C420,110 500,84 600,92 L600,160 L0,160Z', '#d8c48f');
        s += hills('M0,124 C150,112 300,118 450,122 C520,124 560,118 600,120 L600,160 L0,160Z', '#b9a46c');
        // track
        s += '<rect x="0" y="128" width="600" height="3" fill="#6b5a45"/><rect x="0" y="136" width="600" height="3" fill="#6b5a45"/>';
        for (var t = 0; t < 40; t++) s += '<rect x="' + (t * 16) + '" y="126" width="8" height="15" fill="#8a6a48" opacity=".55"/>';
        // train
        s += '<g transform="translate(210,104)"><rect x="0" y="0" width="54" height="22" rx="3" fill="#dc2626"/><rect x="34" y="-14" width="20" height="16" fill="#991b1b"/><rect x="38" y="-10" width="12" height="8" fill="#bfdbfe"/>' +
          '<rect x="8" y="-12" width="9" height="12" fill="#374151"/><rect x="6" y="-15" width="13" height="4" fill="#1f2937"/>' +
          '<circle cx="12" cy="24" r="6" fill="#1f2937"/><circle cx="30" cy="24" r="6" fill="#1f2937"/><circle cx="46" cy="24" r="6" fill="#1f2937"/>' +
          '<circle cx="-10" cy="-22" r="7" fill="#fff" opacity=".8"/><circle cx="-24" cy="-30" r="9" fill="#fff" opacity=".6"/><circle cx="-42" cy="-36" r="11" fill="#fff" opacity=".4"/></g>';
        s += '<g transform="translate(140,108)"><rect x="0" y="0" width="58" height="18" rx="2" fill="#2563eb"/><rect x="6" y="4" width="10" height="7" fill="#dbeafe"/><rect x="24" y="4" width="10" height="7" fill="#dbeafe"/><rect x="42" y="4" width="10" height="7" fill="#dbeafe"/>' +
          '<circle cx="12" cy="20" r="5" fill="#1f2937"/><circle cx="46" cy="20" r="5" fill="#1f2937"/><rect x="58" y="10" width="6" height="3" fill="#374151"/></g>';
        return { bg: ['#f7dfb0', '#fdf6e6'], body: s };
      case 'night':
        s += '<rect width="600" height="160" fill="url(#lmaHzSky)"/>';
        var st = [[40, 30], [120, 18], [180, 50], [250, 24], [330, 44], [380, 16], [440, 36], [560, 22], [80, 70], [520, 64], [290, 80], [160, 92]];
        st.forEach(function (p, i) { s += star(p[0], p[1], i % 3 ? 2.2 : 3.4, '#fef9c3'); });
        s += '<circle cx="480" cy="52" r="24" fill="#fef3c7"/><circle cx="492" cy="44" r="22" fill="#1f2a55"/><circle cx="480" cy="52" r="34" fill="#fef3c7" opacity=".12"/>';
        s += hills('M0,118 C90,94 180,102 260,114 C350,128 430,96 520,104 C560,108 590,114 600,116 L600,160 L0,160Z', '#2c3768');
        s += '<g transform="translate(150,116)"><rect x="-16" y="-14" width="32" height="20" fill="#3b4677"/><path d="M-20,-14 L0,-30 L20,-14Z" fill="#4b5690"/><rect x="-10" y="-8" width="7" height="7" fill="#fde68a"/><rect x="4" y="-8" width="7" height="7" fill="#fde68a"/></g>';
        s += hills('M0,140 C150,128 450,132 600,140 L600,160 L0,160Z', '#222b55');
        return { bg: ['#121a3d', '#2a3568'], body: s };
      case 'classic':
        s += '<rect width="600" height="160" fill="url(#lmaHzSky)"/>';
        // temple
        s += '<g transform="translate(300,60)"><path d="M-110,10 L0,-26 L110,10Z" fill="url(#lma-marble)" stroke="#b3ab9b"/><rect x="-112" y="10" width="224" height="9" fill="#efeae0" stroke="#b3ab9b"/>';
        for (var c = 0; c < 6; c++) { var cx = -92 + c * 36.8; s += '<rect x="' + (cx - 7).toFixed(1) + '" y="19" width="14" height="60" fill="url(#lma-marble)"/><rect x="' + (cx - 9).toFixed(1) + '" y="19" width="18" height="4" fill="#e7e1d4"/><rect x="' + (cx - 9).toFixed(1) + '" y="75" width="18" height="4" fill="#e7e1d4"/>'; }
        s += '<rect x="-120" y="79" width="240" height="8" fill="#ddd6c8"/><rect x="-130" y="87" width="260" height="8" fill="#cfc7b6"/>' +
          '<path d="M-14,-6 a14,14 0 0 1 28,0" fill="none" stroke="#b3ab9b" stroke-width="2"/></g>';
        s += hills('M0,128 C40,120 70,112 100,122 C140,112 170,116 200,128 L200,160 L0,160Z', '#9cb48a') + hills('M400,128 C430,116 470,112 500,122 C540,112 570,118 600,126 L600,160 L400,160Z', '#9cb48a');
        s += pineSil(60, 116, 0.7, '#5a7d4a') + pineSil(540, 114, 0.75, '#5a7d4a');
        s += hills('M0,150 C150,144 450,144 600,150 L600,160 L0,160Z', '#c9c1b0');
        return { bg: ['#d8e4ee', '#f7f5f0'], body: s };
      case 'world':
        s += '<rect width="600" height="160" fill="url(#lmaHzSky)"/><circle cx="110" cy="50" r="20" fill="#fff3c4"/>' + cloud(380, 36, 0.8);
        s += '<rect x="0" y="104" width="600" height="56" fill="#3aa7c9"/><rect x="0" y="104" width="600" height="6" fill="#7dd3e8" opacity=".7"/>';
        for (var w = 0; w < 10; w++) s += '<path d="M' + (20 + w * 62) + ',' + (122 + (w % 3) * 9) + ' q8,-5 16,0" stroke="#e0f6fb" stroke-width="1.6" fill="none"/>';
        s += '<g transform="translate(470,104)"><path d="M-60,2 C-40,-20 30,-24 60,2Z" fill="#e8d29a"/><path d="M-30,-8 C-20,-26 18,-28 36,-6Z" fill="#6fbf6a"/>' +
          '<path d="M2,-16 C4,-34 6,-44 8,-52" stroke="#7a5230" stroke-width="3" fill="none"/><path d="M8,-52 c-14,-6 -22,0 -26,6 M8,-52 c12,-8 22,-4 26,2 M8,-52 c-6,-10 -18,-12 -24,-10 M8,-52 c8,-12 20,-12 24,-8" stroke="#2f8a3a" stroke-width="4" fill="none" stroke-linecap="round"/></g>';
        s += '<g transform="translate(220,98)"><path d="M-26,8 L26,8 L18,18 L-18,18Z" fill="#92400e"/><rect x="-1" y="-40" width="2.4" height="48" fill="#5b3a1a"/><path d="M2,-38 L24,4 L2,4Z" fill="#fff"/><path d="M-2,-30 L-20,4 L-2,4Z" fill="#fde68a"/></g>';
        return { bg: ['#a9dcf2', '#e9f7fc'], body: s };
      default: // meadow
        s += '<rect width="600" height="160" fill="url(#lmaHzSky)"/><circle cx="500" cy="46" r="20" fill="#fff6c8"/><circle cx="500" cy="46" r="32" fill="#fff6c8" opacity=".35"/>' + cloud(140, 42, 0.8) + cloud(330, 26, 0.6, 0.85);
        s += hills('M0,108 C100,80 190,88 280,102 C380,118 460,86 600,96 L600,160 L0,160Z', '#bde3a0');
        s += hills('M0,130 C120,112 240,118 360,128 C460,136 540,120 600,124 L600,160 L0,160Z', '#8fcf72');
        s += roundTree(70, 116, 1) + roundTree(98, 122, 0.7) + roundTree(540, 112, 0.9);
        // a little picket fence of piano keys
        for (var k = 0; k < 9; k++) s += '<rect x="' + (360 + k * 13) + '" y="112" width="11" height="22" rx="2" fill="#fffaf0" stroke="#c9bfa6" stroke-width=".8"/>' + ((k % 7 === 2 || k % 7 === 6) ? '' : '<rect x="' + (367 + k * 13) + '" y="112" width="7" height="13" rx="1" fill="#2b2a30"/>');
        s += hills('M0,146 C150,136 450,138 600,146 L600,160 L0,160Z', '#76bd5c');
        [[180, 140, '#f472b6'], [210, 146, '#facc15'], [250, 142, '#fff'], [430, 146, '#f472b6'], [470, 140, '#facc15']].forEach(function (f) {
          s += '<circle cx="' + f[0] + '" cy="' + f[1] + '" r="3.2" fill="' + f[2] + '"/><circle cx="' + f[0] + '" cy="' + f[1] + '" r="1.2" fill="#f59e0b"/>';
        });
        return { bg: ['#c4e6fb', '#f2fafe'], body: s };
    }
  }

  var _hz = 0;
  function horizonSvg(theme) {
    var h = horizon(theme), id = 'lmaHzSky' + (++_hz);
    return '<svg class="lma-horizon" viewBox="0 0 600 160" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">' +
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + h.bg[0] + '"/><stop offset="1" stop-color="' + h.bg[1] + '"/></linearGradient></defs>' +
      h.body.replace(/lmaHzSky/g, id) + '</svg>';
  }

  // ── Side props (viewBox 100×100), one beside each stepping stone ──
  var PROPS = {
    meadow: [
      function () { return '<ellipse cx="50" cy="94" rx="26" ry="5" fill="url(#lma-shadow)"/><rect x="45" y="56" width="10" height="38" rx="3" fill="url(#lma-wood)"/><circle cx="50" cy="40" r="28" fill="url(#lma-leaf)"/><circle cx="32" cy="50" r="16" fill="#5aa64c"/><circle cx="68" cy="48" r="17" fill="#4f9a45"/><circle cx="40" cy="28" r="11" fill="#a5d98a" opacity=".6"/><circle cx="62" cy="36" r="3" fill="#ef4444"/><circle cx="38" cy="52" r="3" fill="#ef4444"/>'; },
      function () { var s = '<ellipse cx="50" cy="90" rx="34" ry="6" fill="#7cc05c" opacity=".6"/>'; [[30, 70, '#f472b6'], [50, 60, '#facc15'], [70, 72, '#a78bfa'], [42, 80, '#fff'], [62, 84, '#f472b6']].forEach(function (f) { s += '<path d="M' + f[0] + ',' + (f[1] + 6) + ' L' + f[0] + ',90" stroke="#3f8a3a" stroke-width="2"/>'; for (var i = 0; i < 5; i++) { var a = i * 1.2566; s += '<circle cx="' + (f[0] + 5 * Math.cos(a)).toFixed(1) + '" cy="' + (f[1] + 5 * Math.sin(a)).toFixed(1) + '" r="4" fill="' + f[2] + '"/>'; } s += '<circle cx="' + f[0] + '" cy="' + f[1] + '" r="2.6" fill="#f59e0b"/>'; }); return s; },
      function () { return '<ellipse cx="50" cy="90" rx="34" ry="5" fill="url(#lma-shadow)"/><circle cx="30" cy="72" r="18" fill="#4f9a45"/><circle cx="54" cy="66" r="22" fill="url(#lma-leaf)"/><circle cx="74" cy="76" r="15" fill="#5aa64c"/><circle cx="46" cy="58" r="7" fill="#a5d98a" opacity=".6"/>'; }
    ],
    sky: [
      function () { return balloon(50, 52, 1.1, '#ef4444', '#fca5a5'); },
      function () { return cloud(50, 50, 1.05); },
      function () { return '<path d="M50,14 L74,40 L50,70 L26,40Z" fill="#f59e0b"/><path d="M50,14 L50,70 M26,40 L74,40" stroke="#fff" stroke-width="2"/><path d="M50,14 L74,40 L50,40Z" fill="#fbbf24"/><path d="M50,70 C46,80 56,84 50,92 C44,98 52,100 48,104" stroke="#6b4a2a" stroke-width="1.2" fill="none"/><path d="M48,78 l-6,2 l6,2Z M50,88 l6,2 l-6,2Z" fill="#ef4444"/>'; }
    ],
    fair: [
      function () { return '<ellipse cx="50" cy="94" rx="30" ry="4" fill="url(#lma-shadow)"/><path d="M14,92 L50,30 L86,92Z" fill="#ef4444"/><path d="M38,92 L50,30 L62,92Z" fill="#fff"/><path d="M14,92 L86,92" stroke="#b91c1c" stroke-width="3"/><path d="M50,30 L50,14 L64,19 L50,24" fill="#3b82f6" stroke="#1e3a8a" stroke-width=".8"/><path d="M44,92 C44,78 56,78 56,92Z" fill="#7f1d1d"/>'; },
      function () { return balloon(40, 50, 0.8, '#3b82f6', '#93c5fd') + balloon(62, 42, 0.8, '#facc15', '#fde68a').replace(/<rect[^>]*>/g, '') + balloon(52, 60, 0.7, '#22c55e', '#86efac').replace(/<rect[^>]*>/g, ''); },
      function () { return '<rect x="47" y="20" width="4" height="74" fill="#d4a017"/><path d="M51,22 L84,32 L51,42Z" fill="#a855f7"/><path d="M51,46 L76,54 L51,62Z" fill="#f472b6"/><ellipse cx="49" cy="94" rx="14" ry="3" fill="url(#lma-shadow)"/>'; }
    ],
    hills: [
      function () { return '<ellipse cx="50" cy="94" rx="22" ry="4" fill="url(#lma-shadow)"/>' + pineSil(50, 64, 1.6, 'url(#lma-pine)'); },
      function () { return '<ellipse cx="50" cy="94" rx="26" ry="5" fill="url(#lma-shadow)"/><rect x="45" y="56" width="10" height="38" rx="3" fill="url(#lma-wood)"/><circle cx="50" cy="42" r="26" fill="#3f9a62"/><circle cx="40" cy="30" r="10" fill="#7fcf9b" opacity=".55"/>'; },
      function () { return '<ellipse cx="50" cy="90" rx="34" ry="6" fill="url(#lma-shadow)"/><path d="M18,88 C16,70 30,56 48,58 C66,52 86,66 84,88Z" fill="#9aa3ad"/><path d="M30,66 C40,58 56,58 64,62" stroke="#c9ced5" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M60,88 C66,80 76,78 84,88Z" fill="#6b7480"/><path d="M14,90 c6,-8 10,-8 14,0 M76,90 c4,-6 8,-6 12,0" stroke="#4f9a45" stroke-width="3" fill="none"/>'; }
    ],
    garden: [
      function () { return '<ellipse cx="50" cy="95" rx="16" ry="3" fill="url(#lma-shadow)"/><rect x="47" y="34" width="6" height="60" fill="#374151"/><rect x="40" y="90" width="20" height="5" rx="1" fill="#1f2937"/><path d="M38,34 L62,34 L58,14 L42,14Z" fill="#1f2937"/><path d="M42,32 L58,32 L55,16 L45,16Z" fill="#fde68a"/><circle cx="50" cy="24" r="20" fill="url(#lma-glow)"/><path d="M40,14 L50,6 L60,14Z" fill="#374151"/>'; },
      function () { return '<g transform="rotate(-28 50 50)"><path d="M50,8 L50,30" stroke="#3b2414" stroke-width="5" stroke-linecap="round"/><path d="M38,40 C30,32 36,22 50,26 C64,22 70,32 62,40 C70,48 70,56 64,62 C72,70 68,90 50,90 C32,90 28,70 36,62 C30,56 30,48 38,40Z" fill="#b45309"/><path d="M38,40 C30,32 36,22 50,26 C64,22 70,32 62,40 C70,48 70,56 64,62 C72,70 68,90 50,90" fill="none" stroke="#7c2d12" stroke-width="1.5"/><path d="M44,52 c-2,4 -2,8 0,10 M56,52 c2,4 2,8 0,10" stroke="#3b2414" stroke-width="2" fill="none"/><rect x="48.5" y="28" width="3" height="54" fill="#1f1308"/><path d="M42,80 L58,80" stroke="#1f1308" stroke-width="3"/><path d="M49,30 L49,80 M51,30 L51,80" stroke="#e5e7eb" stroke-width=".5"/></g><path d="M18,86 L88,40" stroke="#6b4a2a" stroke-width="2"/>'; },
      function () { return '<ellipse cx="50" cy="92" rx="34" ry="5" fill="url(#lma-shadow)"/><rect x="16" y="56" width="68" height="36" rx="14" fill="#4f9a45"/><rect x="16" y="56" width="68" height="10" rx="5" fill="#6ab35e"/>' + [[26, 60, '#f472b6'], [44, 58, '#fff'], [60, 62, '#f472b6'], [74, 59, '#fde68a'], [34, 70, '#fde68a'], [66, 72, '#fff']].map(function (f) { return '<circle cx="' + f[0] + '" cy="' + f[1] + '" r="3.4" fill="' + f[2] + '"/>'; }).join(''); }
    ],
    rail: [
      function () { return '<ellipse cx="50" cy="95" rx="14" ry="3" fill="url(#lma-shadow)"/><rect x="47" y="30" width="6" height="64" fill="#4b5563"/><rect x="38" y="10" width="24" height="40" rx="5" fill="#1f2937"/><circle cx="50" cy="20" r="6" fill="#ef4444"/><circle cx="50" cy="38" r="6" fill="#22c55e"/><circle cx="50" cy="38" r="11" fill="#22c55e" opacity=".25"/>'; },
      function () { return '<ellipse cx="50" cy="94" rx="22" ry="4" fill="url(#lma-shadow)"/>' + pineSil(50, 64, 1.6, '#4d7c3a'); },
      function () { return '<rect x="47" y="8" width="6" height="86" fill="url(#lma-wood)"/><rect x="28" y="16" width="44" height="5" fill="#7a4a24"/><circle cx="32" cy="14" r="2.5" fill="#bfdbfe"/><circle cx="50" cy="14" r="2.5" fill="#bfdbfe"/><circle cx="68" cy="14" r="2.5" fill="#bfdbfe"/><path d="M0,22 Q16,32 32,16 M68,16 Q84,32 100,22" stroke="#374151" stroke-width="1" fill="none"/><ellipse cx="50" cy="95" rx="12" ry="3" fill="url(#lma-shadow)"/>'; }
    ],
    night: [
      function () { return '<ellipse cx="50" cy="95" rx="16" ry="3" fill="#000" opacity=".3"/><rect x="47" y="30" width="6" height="64" fill="#9ca3af"/><rect x="40" y="90" width="20" height="5" rx="1" fill="#6b7280"/><circle cx="50" cy="22" r="26" fill="url(#lma-glow)"/><path d="M40,30 L60,30 L56,12 L44,12Z" fill="#fde68a"/><path d="M38,12 L50,4 L62,12Z" fill="#9ca3af"/>'; },
      function () { return '<circle cx="66" cy="52" r="22" fill="url(#lma-glow)" opacity=".6"/>' + star(30, 30, 9, '#fef08a') + star(66, 52, 12, '#fde68a') + star(36, 76, 6, '#fef9c3'); },
      function () { var s = '<ellipse cx="50" cy="90" rx="36" ry="7" fill="#11173a" opacity=".6"/><circle cx="30" cy="72" r="18" fill="#2c3d6b"/><circle cx="56" cy="64" r="24" fill="#34477a"/><circle cx="76" cy="76" r="14" fill="#2c3d6b"/>'; [[24, 56], [44, 46], [70, 50], [82, 64], [36, 84], [62, 80]].forEach(function (p) { s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2" fill="#fef08a"/><circle cx="' + p[0] + '" cy="' + p[1] + '" r="6" fill="#fef08a" opacity=".25"/>'; }); return s; }
    ],
    classic: [
      function () { return '<ellipse cx="50" cy="95" rx="22" ry="4" fill="url(#lma-shadow)"/><rect x="30" y="86" width="40" height="8" fill="#d6cfc0"/><rect x="34" y="80" width="32" height="6" fill="#e7e1d4"/><rect x="38" y="20" width="24" height="60" fill="url(#lma-marble)"/><path d="M42,22 L42,78 M48,22 L48,78 M54,22 L54,78" stroke="#c9c2b3" stroke-width="1"/><rect x="32" y="12" width="36" height="8" rx="2" fill="#efeae0" stroke="#bdb6a8"/><path d="M32,12 c-4,0 -4,8 0,8 M68,12 c4,0 4,8 0,8" stroke="#bdb6a8" stroke-width="2" fill="none"/>'; },
      function () { return '<ellipse cx="50" cy="95" rx="18" ry="3" fill="url(#lma-shadow)"/><path d="M40,20 L60,20 L58,28 C74,34 76,60 62,78 L66,92 L34,92 L38,78 C24,60 26,34 42,28Z" fill="#c2643a"/><path d="M36,48 C44,52 56,52 64,48" stroke="#1f1308" stroke-width="5" fill="none"/><path d="M42,28 C30,24 26,40 32,46 M58,28 C70,24 74,40 68,46" stroke="#a0522d" stroke-width="3" fill="none"/><path d="M40,36 C40,30 46,30 46,30" stroke="#fff" stroke-width="2" opacity=".4" fill="none"/>'; },
      function () { return '<path d="M30,20 C20,40 26,70 50,86 C74,70 80,40 70,20" fill="none" stroke="#d4a017" stroke-width="6" stroke-linecap="round"/><path d="M26,24 L74,24" stroke="#b8860b" stroke-width="5" stroke-linecap="round"/><path d="M40,26 L40,74 M47,26 L47,80 M53,26 L53,80 M60,26 L60,74" stroke="#7c5a2a" stroke-width="1.4"/><ellipse cx="50" cy="94" rx="18" ry="3" fill="url(#lma-shadow)"/>'; }
    ],
    world: [
      function () { return '<ellipse cx="50" cy="90" rx="40" ry="8" fill="#3aa7c9" opacity=".5"/><path d="M14,88 C24,76 76,74 86,88Z" fill="#e8d29a"/><path d="M50,80 C52,60 54,46 58,32" stroke="#7a5230" stroke-width="4" fill="none"/><path d="M58,32 c-18,-8 -28,0 -32,8 M58,32 c16,-10 28,-4 32,4 M58,32 c-8,-14 -22,-16 -30,-12 M58,32 c10,-16 26,-14 30,-10" stroke="#2f8a3a" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="56" cy="36" r="3" fill="#7c4a1e"/><circle cx="62" cy="38" r="3" fill="#7c4a1e"/>'; },
      function () { return '<path d="M14,70 q36,10 72,0" stroke="#7dd3e8" stroke-width="3" fill="none" opacity=".8"/><path d="M22,62 L78,62 L68,76 L32,76Z" fill="#b45309"/><rect x="49" y="10" width="3" height="52" fill="#5b3a1a"/><path d="M53,12 L80,58 L53,58Z" fill="#fff" stroke="#e5e7eb"/><path d="M48,20 L24,58 L48,58Z" fill="#fde68a"/><path d="M52,10 L64,14 L52,18Z" fill="#ef4444"/>'; },
      function () { return '<circle cx="50" cy="50" r="34" fill="#fff" stroke="#b8860b" stroke-width="3"/><circle cx="50" cy="50" r="28" fill="none" stroke="#e5d3a1" stroke-width="1.5"/><path d="M50,14 L57,50 L50,86 L43,50Z" fill="#b91c1c"/><path d="M50,50 L57,50 L50,86 L43,50Z" fill="#1f2937"/><path d="M14,50 L50,43 L86,50 L50,57Z" fill="#9ca3af"/><circle cx="50" cy="50" r="4" fill="#b8860b"/><text x="50" y="12" text-anchor="middle" font-size="9" font-weight="900" font-family="Nunito, sans-serif" fill="#7c5a2a">N</text>'; }
    ]
  };

  function propSvg(theme, i) {
    var list = PROPS[theme] || PROPS.meadow;
    return '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">' + list[i % list.length]() + '</svg>';
  }

  // ── Song medallions (stepping stones) ──
  function medallion(state, stars, night) {
    var s = '';
    // the stone the medallion rests on
    s += '<ellipse cx="50" cy="91" rx="40" ry="7" fill="url(#lma-shadow)"/>';
    s += '<path d="M8,80 C8,68 30,62 50,62 C70,62 92,68 92,80 C92,90 72,94 50,94 C28,94 8,90 8,80Z" fill="url(#' + (night ? 'lma-slab-night' : 'lma-slab') + ')"/>';
    s += '<path d="M14,76 C22,68 40,66 50,66 C62,66 78,68 86,76" stroke="#fff" stroke-width="2" fill="none" opacity=".45" stroke-linecap="round"/>';
    if (state === 'current') s += '<circle class="lma-glow" cx="50" cy="44" r="46" fill="url(#lma-glow)"/>';
    var rim, face;
    if (state === 'done') { rim = stars >= 3 ? 'gold' : stars === 2 ? 'silver' : 'bronze'; face = 'url(#lma-ivory)'; }
    else if (state === 'current') { rim = 'gold'; face = 'url(#lma-lacq)'; }
    else if (state === 'open') { rim = 'purple'; face = 'url(#lma-ivory)'; }
    else { rim = 'stone'; face = 'url(#lma-slate)'; }
    s += '<g filter="url(#lma-ds)"><circle cx="50" cy="44" r="35" fill="url(#lma-' + rim + '-rim)"/></g>';
    s += '<circle cx="50" cy="44" r="28.5" fill="' + face + '" stroke="' + METALS[rim].d + '" stroke-width="1.2"/>';
    // beaded edge
    for (var i = 0; i < 24; i++) {
      var a = i / 24 * Math.PI * 2;
      s += '<circle cx="' + (50 + 31.8 * Math.cos(a)).toFixed(1) + '" cy="' + (44 + 31.8 * Math.sin(a)).toFixed(1) + '" r="1" fill="' + METALS[rim].l + '" opacity=".8"/>';
    }
    if (state === 'done') {
      s += '<path d="M36,45 L46,55 L65,34" fill="none" stroke="' + METALS[rim].x + '" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round" opacity=".25" transform="translate(0,1.5)"/>';
      s += '<path d="M36,45 L46,55 L65,34" fill="none" stroke="#16a34a" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>';
      s += '<path d="M37,44 L46,53" fill="none" stroke="#86efac" stroke-width="2" stroke-linecap="round"/>';
      // three stars on a ribbon across the stone
      s += '<path d="M18,74 Q50,84 82,74 L80,86 Q50,96 20,86Z" fill="#7c3aed"/><path d="M18,74 Q50,84 82,74" stroke="#a78bfa" stroke-width="1.5" fill="none"/>';
      [[32, 82], [50, 86], [68, 82]].forEach(function (p, k) {
        s += star(p[0], p[1], 6.4, k < stars ? '#fcd34d' : '#5b3a9e', k < stars ? '#b45309' : '#4c1d95');
      });
    } else if (state === 'current') {
      s += '<path d="M42,30 L66,44 L42,58Z" fill="#fff" stroke="#fde68a" stroke-width="2" stroke-linejoin="round"/>';
      s += '<path d="M30,30 a24,24 0 0 1 16,-12" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".5"/>';
    } else if (state === 'open') {
      s += notesGlyph(50, 45, 32, '#6d28d9');
      s += '<path d="M28,32 a24,24 0 0 1 16,-12" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>';
    } else {
      // padlock
      s += '<path d="M40,42 V34 a10,10 0 0 1 20,0 V42" fill="none" stroke="#6b7280" stroke-width="5"/>';
      s += '<rect x="35" y="41" width="30" height="22" rx="4" fill="#9ca3af" stroke="#6b7280" stroke-width="1.2"/>';
      s += '<circle cx="50" cy="50" r="3.4" fill="#4b5563"/><rect x="48.6" y="51" width="2.8" height="7" rx="1" fill="#4b5563"/>';
    }
    return '<svg class="lma-medal-svg" viewBox="0 0 100 100" aria-hidden="true" focusable="false">' + s + '</svg>';
  }

  function starsFromText(el) {
    var t = el ? el.textContent : '';
    return (t.match(/★/g) || []).length;
  }

  function _user() {
    try {
      var u = (typeof UserManager !== 'undefined') ? UserManager.getCurrentUser() : null;
      if (u && u.profile) return { avatar: u.profile.avatar || '🎵', color: u.profile.favoriteColor || '#7C3AED' };
    } catch (e) {}
    return { avatar: '🎵', color: '#7C3AED' };
  }

  var _ro = null;
  function _observe(container) {
    if (typeof ResizeObserver === 'undefined') { setTimeout(function () { layoutTrails(container); }, 50); return; }
    if (_ro) _ro.disconnect();
    var last = 0;
    _ro = new ResizeObserver(function () {
      var w = container.clientWidth;
      if (!w || w === last) { if (w && !container.querySelector('.lma-trail path')) layoutTrails(container); return; }
      last = w;
      layoutTrails(container);
    });
    _ro.observe(container);
  }

  function decorateQuestMap(container, tab) {
    if (!container) return;
    try {
      ensureDefs();
      container.classList.remove('lma-map--path', 'lma-map--mybook', 'lma-map--library');
      container.classList.add('lma-map');
      if (tab === 'mybook') { container.classList.add('lma-map--mybook'); return; }
      if (tab === 'library') { container.classList.add('lma-map--library'); return; }
      container.classList.add('lma-map--path');
      _decoratePath(container, tab);
      _observe(container);
      requestAnimationFrame(function () { layoutTrails(container); });
    } catch (e) {
      if (typeof console !== 'undefined') console.warn('[LMArt] map decoration skipped:', e);
    }
  }

  function _decoratePath(container, tab) {
    var progress = (typeof activeProgress !== 'undefined') ? activeProgress() : {};
    var cur = (typeof currentSongFrom !== 'undefined') ? currentSongFrom(progress, tab) : null;
    var curId = cur ? String(cur.id) : null;
    var user = _user();
    var pcolor = PATH_COLOR[tab] || '#7c3aed';
    container.style.setProperty('--lma-path', pcolor);

    var head = container.querySelector('.questmap-precurr-banner');
    if (head) head.classList.add('lma-path-title');

    // Group each world's banner + songs into one illustrated section
    var kids = Array.prototype.slice.call(container.children);
    var section = null, worldIdx = 0;
    kids.forEach(function (el) {
      if (el.classList.contains('questmap-world-banner')) {
        var m = /world-banner--(\d+)/.exec(el.className);
        var w = m ? +m[1] : 0;
        var theme = WORLD_THEME[w] || 'meadow';
        worldIdx++;
        section = document.createElement('section');
        section.className = 'lma-world lma-theme--' + theme;
        section.setAttribute('data-world', String(w));
        section.innerHTML = '<div class="lma-scene" aria-hidden="true">' + horizonSvg(theme) + '</div>' +
          '<svg class="lma-trail" aria-hidden="true" focusable="false"></svg>';
        container.insertBefore(section, el);
        section.appendChild(el);
        // world number medallion instead of the emoji
        var icon = el.querySelector('.world-banner-icon');
        if (icon) { icon.classList.add('lma-hide'); }
        var num = document.createElement('span');
        num.className = 'lma-wnum';
        num.setAttribute('aria-hidden', 'true');
        num.textContent = String(worldIdx);
        el.insertBefore(num, el.firstChild);
        return;
      }
      if (section && !el.classList.contains('qm-tabs')) section.appendChild(el);
    });

    // Medallions, props and the avatar
    var propN = 0;
    Array.prototype.forEach.call(container.querySelectorAll('.lma-world'), function (sec) {
      var theme = (/lma-theme--(\w+)/.exec(sec.className) || [])[1] || 'meadow';
      var night = theme === 'night';
      Array.prototype.forEach.call(sec.querySelectorAll('.questmap-row'), function (row) {
        var node = row.querySelector('.qm-node');
        if (!node) return;
        var circle = node.querySelector('.qm-node-circle');
        var id = node.getAttribute('data-song-id');
        var state = node.classList.contains('qm-node--completed') ? 'done'
          : node.classList.contains('qm-node--locked') ? 'locked'
          : (id === curId ? 'current' : 'open');
        var stars = state === 'done' ? Math.max(1, starsFromText(node.querySelector('.qm-node-stars'))) : 0;
        node.classList.add('lma-stone', 'lma-stone--' + state);
        if (circle) {
          var holder = document.createElement('span');
          holder.className = 'lma-medal';
          holder.innerHTML = medallion(state, stars, night);
          circle.insertBefore(holder, circle.firstChild);
        }
        if (state === 'current') {
          var av = document.createElement('span');
          av.className = 'lma-avatar';
          av.setAttribute('aria-hidden', 'true');
          av.style.setProperty('--lma-kid', /^#[0-9a-fA-F]{3,8}$/.test(user.color) ? user.color : '#7C3AED');
          av.innerHTML = '<span class="lma-avatar-face">' + esc(user.avatar) + '</span><span class="lma-avatar-flag">Play</span>';
          node.appendChild(av);
        }
        var prop = document.createElement('span');
        var side = row.classList.contains('questmap-row--left') ? 'right' : 'left';
        prop.className = 'lma-prop lma-prop--' + side + ' lma-prop--v' + (propN % 3);
        prop.setAttribute('aria-hidden', 'true');
        prop.innerHTML = propSvg(theme, propN);
        propN++;
        row.appendChild(prop);
        // a second, farther prop for wide screens (hidden on narrow ones by CSS)
        var far = document.createElement('span');
        far.className = 'lma-prop lma-prop--far lma-prop--far-' + (side === 'left' ? 'right' : 'left') + ' lma-prop--v' + ((propN + 1) % 3);
        far.setAttribute('aria-hidden', 'true');
        far.innerHTML = propSvg(theme, propN + 1);
        row.appendChild(far);
      });
    });
  }

  // Winding trail through every stone (and lesson sign) of a world
  function layoutTrails(container) {
    Array.prototype.forEach.call(container.querySelectorAll('.lma-world'), function (sec) {
      var svg = sec.querySelector('.lma-trail');
      if (!svg) return;
      var W = sec.clientWidth, H = sec.clientHeight;
      if (!W || !H) return;
      var base = sec.getBoundingClientRect();
      var pts = [];
      var banner = sec.querySelector('.questmap-world-banner');
      if (banner) { var b = banner.getBoundingClientRect(); pts.push({ x: b.left - base.left + b.width / 2, y: b.bottom - base.top - 4 }); }
      var curIdx = -1;
      Array.prototype.forEach.call(sec.querySelectorAll('.qm-lesson, .qm-node .qm-node-circle'), function (el) {
        var r = el.getBoundingClientRect();
        var node = el.closest('.qm-node');
        if (node && (node.classList.contains('lma-stone--current'))) curIdx = pts.length;
        if (node && node.classList.contains('lma-stone--done')) curIdx = Math.max(curIdx, pts.length);
        pts.push({ x: r.left - base.left + r.width / 2, y: r.top - base.top + r.height * 0.62 });
      });
      if (pts.length < 2) { svg.innerHTML = ''; return; }
      var d = 'M' + pts[0].x.toFixed(1) + ',' + pts[0].y.toFixed(1);
      var dDone = d;
      for (var i = 1; i < pts.length; i++) {
        var p = pts[i - 1], q = pts[i], dy = (q.y - p.y) * 0.55;
        var seg = ' C' + p.x.toFixed(1) + ',' + (p.y + dy).toFixed(1) + ' ' + q.x.toFixed(1) + ',' + (q.y - dy).toFixed(1) + ' ' + q.x.toFixed(1) + ',' + q.y.toFixed(1);
        d += seg;
        if (i <= curIdx) dDone += seg;
      }
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.setAttribute('width', W);
      svg.setAttribute('height', H);
      svg.innerHTML =
        '<path class="lma-trail-shadow" d="' + d + '"/>' +
        '<path class="lma-trail-edge" d="' + d + '"/>' +
        '<path class="lma-trail-road" d="' + d + '"/>' +
        '<path class="lma-trail-dash" d="' + d + '"/>' +
        (curIdx > 0 ? '<path class="lma-trail-done" d="' + dDone + '"/>' : '');
    });
  }

  /* ──────────────────────────────────────────────────────────────
     3. TROPHY ROOM — a cabinet of medals and cups
     ────────────────────────────────────────────────────────────── */
  var RIBBON = { primer: ['#db2777', '#f9a8d4'], level1: ['#2563eb', '#93c5fd'], level2: ['#ea580c', '#fdba74'], extra: ['#7c3aed', '#c4b5fd'] };

  function songMedal(metal, ribbon) {
    var s = '';
    var rc = ribbon[0], rl = ribbon[1];
    s += '<path d="M17,0 L28,0 L36,38 L26,41Z" fill="' + rc + '"/><path d="M43,0 L32,0 L24,38 L34,41Z" fill="' + rc + '" style="filter:brightness(.8)"/>';
    s += '<path d="M20,0 L23,0 L31,34 L29,35Z" fill="' + rl + '" opacity=".8"/>';
    s += '<rect x="23" y="36" width="14" height="6" rx="2" fill="url(#lma-' + metal + '-rim)" stroke="' + METALS[metal].d + '" stroke-width=".6"/>';
    s += '<g filter="url(#lma-ds)"><circle cx="30" cy="60" r="19" fill="url(#lma-' + metal + '-rim)"/></g>';
    s += '<circle cx="30" cy="60" r="15" fill="url(#lma-' + metal + '-face)" stroke="' + METALS[metal].d + '" stroke-width=".8"/>';
    s += '<g transform="translate(.6,.8)">' + notesGlyph(30, 61, 16, METALS[metal].x) + '</g>' + notesGlyph(30, 60, 16, METALS[metal].d);
    s += '<path d="M18,52 a14,14 0 0 1 10,-7" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/>';
    return '<svg viewBox="0 0 60 82" aria-hidden="true" focusable="false">' + s + '</svg>';
  }
  function songSilhouette() {
    var s = '<g fill="#1f1510"><path d="M17,0 L28,0 L36,38 L26,41Z M43,0 L32,0 L24,38 L34,41Z"/><circle cx="30" cy="60" r="19"/></g>' +
      '<circle cx="30" cy="60" r="14" fill="none" stroke="#fff" stroke-opacity=".08" stroke-width="1.5"/>' + notesGlyph(30, 60, 16, 'rgba(255,255,255,.07)');
    return '<svg viewBox="0 0 60 82" aria-hidden="true" focusable="false">' + s + '</svg>';
  }

  // milestone emblems drawn on cups/medals
  function emblem(kind, cx, cy, s, col) {
    switch (kind) {
      case 'star': return star(cx, cy, s * 0.55, col);
      case 'stars': return star(cx - s * 0.32, cy + s * 0.1, s * 0.3, col) + star(cx + s * 0.32, cy + s * 0.1, s * 0.3, col) + star(cx, cy - s * 0.22, s * 0.36, col);
      case 'book': return '<path d="M' + (cx - s * .5) + ',' + (cy - s * .3) + ' q' + (s * .25) + ',' + (-s * .12) + ' ' + (s * .5) + ',0 v' + (s * .62) + ' q' + (-s * .25) + ',' + (-s * .12) + ' ' + (-s * .5) + ',0Z M' + (cx + s * .5) + ',' + (cy - s * .3) + ' q' + (-s * .25) + ',' + (-s * .12) + ' ' + (-s * .5) + ',0 v' + (s * .62) + ' q' + (s * .25) + ',' + (-s * .12) + ' ' + (s * .5) + ',0Z" fill="' + col + '"/>';
      case 'flame': return '<path d="M' + cx + ',' + (cy - s * .5) + ' C' + (cx + s * .45) + ',' + (cy - s * .1) + ' ' + (cx + s * .35) + ',' + (cy + s * .45) + ' ' + cx + ',' + (cy + s * .45) + ' C' + (cx - s * .38) + ',' + (cy + s * .45) + ' ' + (cx - s * .42) + ',' + (cy) + ' ' + (cx - s * .12) + ',' + (cy - s * .18) + ' C' + (cx - s * .1) + ',' + (cy + s * .05) + ' ' + (cx + s * .05) + ',' + (cy + s * .05) + ' ' + cx + ',' + (cy - s * .5) + 'Z" fill="' + col + '"/>';
      case 'shelf': return '<rect x="' + (cx - s * .45) + '" y="' + (cy - s * .35) + '" width="' + (s * .16) + '" height="' + (s * .7) + '" fill="' + col + '"/><rect x="' + (cx - s * .22) + '" y="' + (cy - s * .42) + '" width="' + (s * .16) + '" height="' + (s * .77) + '" fill="' + col + '"/><rect x="' + (cx + s * .02) + '" y="' + (cy - s * .3) + '" width="' + (s * .16) + '" height="' + (s * .65) + '" fill="' + col + '"/><rect x="' + (cx + s * .22) + '" y="' + (cy - s * .38) + '" width="' + (s * .16) + '" height="' + (s * .73) + '" fill="' + col + '" transform="rotate(12 ' + (cx + s * .3) + ' ' + (cy + s * .35) + ')"/>';
      case 'flag': return '<rect x="' + (cx - s * .3) + '" y="' + (cy - s * .5) + '" width="' + (s * .08) + '" height="' + s + '" fill="' + col + '"/><path d="M' + (cx - s * .22) + ',' + (cy - s * .5) + ' L' + (cx + s * .45) + ',' + (cy - s * .3) + ' L' + (cx - s * .22) + ',' + (cy - s * .08) + 'Z" fill="' + col + '"/>';
      default: return notesGlyph(cx, cy, s, col);
    }
  }
  function cupSvg(metal, kind, big) {
    var m = METALS[metal], s = '';
    s += '<g filter="url(#lma-ds)">';
    s += '<path d="M20,26 C4,26 4,52 26,56" fill="none" stroke="url(#lma-' + metal + '-rim)" stroke-width="5" stroke-linecap="round"/>';
    s += '<path d="M60,26 C76,26 76,52 54,56" fill="none" stroke="url(#lma-' + metal + '-rim)" stroke-width="5" stroke-linecap="round"/>';
    s += '<path d="M16,16 H64 C64,46 56,62 40,65 C24,62 16,46 16,16Z" fill="url(#lma-' + metal + '-cup)"/>';
    s += '<ellipse cx="40" cy="16" rx="24" ry="4" fill="' + m.d + '"/><ellipse cx="40" cy="15.5" rx="21.5" ry="2.8" fill="' + m.x + '" opacity=".5"/>';
    s += '<path d="M35,65 H45 L43,77 H37Z" fill="url(#lma-' + metal + '-cup)"/><ellipse cx="40" cy="71" rx="6.5" ry="2.5" fill="url(#lma-' + metal + '-rim)"/>';
    s += '<path d="M27,84 C29,79 51,79 53,84Z" fill="url(#lma-' + metal + '-cup)"/>';
    s += '<rect x="21" y="84" width="38" height="13" rx="2" fill="#3b2414"/><rect x="21" y="84" width="38" height="3" rx="1" fill="#5a3a22"/><rect x="29" y="89" width="22" height="5" rx="1" fill="url(#lma-' + metal + '-rim)"/>';
    s += '</g>';
    s += '<circle cx="40" cy="37" r="12" fill="' + m.m + '" stroke="' + m.d + '" stroke-width=".9"/>';
    s += '<g transform="translate(.6,.8)">' + emblem(kind, 40, 37, 15, m.x) + '</g>' + emblem(kind, 40, 37, 15, m.d);
    s += '<path d="M25,22 C25,40 29,52 35,58" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".6"/>';
    return '<svg viewBox="0 0 80 100" class="' + (big ? 'lma-cup--big' : '') + '" aria-hidden="true" focusable="false">' + s + '</svg>';
  }
  function cupSilhouette(kind) {
    var s = '<g fill="#1f1510"><path d="M20,26 C4,26 4,52 26,56 L26,52 C12,48 12,32 20,30Z M60,26 C76,26 76,52 54,56 L54,52 C68,48 68,32 60,30Z"/>' +
      '<path d="M16,16 H64 C64,46 56,62 40,65 C24,62 16,46 16,16Z"/><path d="M35,65 H45 L43,77 H37Z"/><path d="M27,84 C29,79 51,79 53,84Z"/><rect x="21" y="84" width="38" height="13" rx="2"/></g>' +
      emblem(kind, 40, 37, 15, 'rgba(255,255,255,.08)');
    return '<svg viewBox="0 0 80 100" aria-hidden="true" focusable="false">' + s + '</svg>';
  }

  function trophyRoom(container) {
    if (!container || !(typeof SONGS !== 'undefined') || !(typeof LM_PATHS !== 'undefined') || !(typeof pathOrder !== 'undefined')) return false;
    try {
      ensureDefs();
      var progress = (typeof activeProgress !== 'undefined') ? activeProgress() : {};
      var stats = {};
      try {
        var u = UserManager.getCurrentUser();
        if (u) stats = (JSON.parse(localStorage.getItem('littlemaestro_' + u.profile.name.toLowerCase().replace(/\s+/g, '_')) || '{}').stats) || {};
      } catch (e) {}
      var done = (typeof completedSongIds !== 'undefined') ? completedSongIds(progress) : new Set();
      function starsOf(id) {
        var p = progress[id];
        return Math.min(3, (p && p.stars) || (progress.songStars || {})[id] || 0);
      }
      var total = done.size;
      var three = 0;
      done.forEach(function (id) { if (starsOf(id) >= 3) three++; });
      var paths = LM_PATHS.map(function (p) {
        var songs = pathOrder(p.id);
        return { p: p, songs: songs, got: songs.filter(function (s) { return done.has(s.id); }).length };
      });
      var inPath = {};
      paths.forEach(function (x) { x.songs.forEach(function (s) { inPath[s.id] = 1; }); });
      var extras = SONGS.filter(function (s) { return !inPath[s.id] && done.has(s.id); });
      var mine = extras.filter(function (s) { return s.custom; }).length;
      var lib = extras.length - mine;
      var streak = Math.max(stats.bestStreak || 0, stats.longestStreak || 0, stats.streak || 0, stats.currentStreak || 0);

      var MILESTONES = [
        { kind: 'note', title: 'First Song', desc: 'Pass your first song', have: total, need: 1, metal: 'bronze' },
        { kind: 'note', title: '10 Songs', desc: 'Pass 10 songs', have: total, need: 10, metal: 'silver' },
        { kind: 'note', title: '25 Songs', desc: 'Pass 25 songs', have: total, need: 25, metal: 'gold' },
        { kind: 'note', title: '50 Songs', desc: 'Pass 50 songs', have: total, need: 50, metal: 'gold' },
        { kind: 'note', title: '100 Songs', desc: 'Pass 100 songs', have: total, need: 100, metal: 'gold' },
        { kind: 'stars', title: 'Star Player', desc: '10 songs with 3 stars', have: three, need: 10, metal: 'gold' },
        { kind: 'flame', title: '7-Day Streak', desc: 'Practise 7 days in a row', have: streak, need: 7, metal: 'silver' },
        { kind: 'book', title: 'My Book', desc: 'Pass a piece from your lesson book', have: mine, need: 1, metal: 'bronze' },
        { kind: 'shelf', title: 'Library Explorer', desc: 'Pass 5 Library songs', have: lib, need: 5, metal: 'silver' }
      ];
      paths.forEach(function (x) {
        MILESTONES.push({ kind: 'flag', title: x.p.title + ' Complete', desc: 'Every song in ' + x.p.title, have: x.got, need: x.songs.length, metal: 'gold', big: true });
      });

      var h = '';
      // ── milestone shelf
      var earnedM = MILESTONES.filter(function (m) { return m.have >= m.need; }).length;
      h += '<div class="lma-cabinet lma-cabinet--cups">' +
        '<div class="lma-cab-head"><span class="lma-cab-title">Milestones</span><span class="lma-cab-count">' + earnedM + ' of ' + MILESTONES.length + '</span></div>' +
        '<div class="lma-shelf lma-shelf--cups">';
      MILESTONES.forEach(function (m) {
        var got = m.have >= m.need;
        h += '<div class="lma-cup' + (got ? '' : ' is-locked') + '" role="img" aria-label="' + esc(m.title + (got ? ', earned' : ', ' + Math.min(m.have, m.need) + ' of ' + m.need)) + '">' +
          (got ? cupSvg(m.metal, m.kind, m.big) : cupSilhouette(m.kind)) +
          '<span class="lma-plaque"><b>' + esc(m.title) + '</b><small>' + (got ? esc(m.desc) : Math.min(m.have, m.need) + ' / ' + m.need) + '</small></span>' +
          (got ? '' : '<span class="lma-cup-bar"><i style="width:' + Math.round(Math.min(1, m.have / m.need) * 100) + '%"></i></span>') +
          '</div>';
      });
      h += '</div></div>';

      // ── legend
      h += '<div class="lma-legend"><span><i class="lma-dot lma-dot--bronze"></i>1 star</span><span><i class="lma-dot lma-dot--silver"></i>2 stars</span><span><i class="lma-dot lma-dot--gold"></i>3 stars</span></div>';

      // ── one cabinet per path, a shelf per world
      var active = (typeof activePathId !== 'undefined') ? activePathId() : 'primer';
      paths.forEach(function (x) {
        var rib = RIBBON[x.p.id] || RIBBON.extra;
        var open = x.p.id === active || (x.got > 0 && x.got < x.songs.length);
        h += '<details class="lma-cabinet lma-cabinet--path"' + (open ? ' open' : '') + ' style="--lma-rib:' + rib[0] + '">' +
          '<summary class="lma-cab-head"><span class="lma-cab-title">' + esc(x.p.title) + '</span>' +
          '<span class="lma-cab-bar" aria-hidden="true"><i style="width:' + (x.songs.length ? Math.round(x.got / x.songs.length * 100) : 0) + '%"></i></span>' +
          '<span class="lma-cab-count">' + x.got + ' / ' + x.songs.length + '</span></summary>';
        x.p.worlds.forEach(function (w, wi) {
          var ws = x.songs.filter(function (s) { return s.world === w; });
          if (!ws.length) return;
          var meta = ((typeof LM_WORLDS !== 'undefined') && LM_WORLDS[w]) || { subtitle: '' };
          h += '<div class="lma-shelf-label">World ' + (wi + 1) + (meta.subtitle ? ' · ' + esc(meta.subtitle) : '') + '</div><div class="lma-shelf">';
          ws.forEach(function (s) {
            var n = done.has(s.id) ? Math.max(1, starsOf(s.id)) : 0;
            var metal = n >= 3 ? 'gold' : n === 2 ? 'silver' : 'bronze';
            h += '<div class="lma-medal-slot' + (n ? '' : ' is-locked') + '" role="img" aria-label="' + esc(s.title + (n ? ', ' + n + ' star' + (n > 1 ? 's' : '') : ', not yet')) + '">' +
              (n ? songMedal(metal, rib) : songSilhouette()) +
              '<span class="lma-medal-name">' + esc(s.title) + '</span>' +
              (n ? '<span class="lma-medal-stars" aria-hidden="true">' + '★'.repeat(n) + '<s>' + '★'.repeat(3 - n) + '</s></span>' : '') +
              '</div>';
          });
          h += '</div>';
        });
        h += '</details>';
      });

      // ── songs passed outside the paths
      h += '<div class="lma-cabinet lma-cabinet--extra"><div class="lma-cab-head"><span class="lma-cab-title">Library &amp; My Book</span><span class="lma-cab-count">' + extras.length + '</span></div>';
      if (extras.length) {
        h += '<div class="lma-shelf">';
        extras.forEach(function (s) {
          var n = Math.max(1, starsOf(s.id));
          var metal = n >= 3 ? 'gold' : n === 2 ? 'silver' : 'bronze';
          h += '<div class="lma-medal-slot" role="img" aria-label="' + esc(s.title + ', ' + n + ' star' + (n > 1 ? 's' : '')) + '">' + songMedal(metal, RIBBON.extra) +
            '<span class="lma-medal-name">' + esc(s.title) + '</span><span class="lma-medal-stars" aria-hidden="true">' + '★'.repeat(n) + '<s>' + '★'.repeat(3 - n) + '</s></span></div>';
        });
        h += '</div>';
      } else {
        h += '<p class="lma-cab-empty">Songs you pass from the Library or My Book get their medals here.</p>';
      }
      h += '</div>';

      container.innerHTML = '<div class="lma-trophies">' + h + '</div>';
      return true;
    } catch (e) {
      if (typeof console !== 'undefined') console.warn('[LMArt] trophy cabinet skipped:', e);
      return false;
    }
  }

  /* ──────────────────────────────────────────────────────────────
     4. HOME — drawn icons for the cards (the mascot stays)
     ────────────────────────────────────────────────────────────── */
  var ICONS = {
    map: '<rect x="6" y="10" width="36" height="30" rx="3" fill="#fef3c7" stroke="#d97706" stroke-width="1.6"/><path d="M18,10 V40 M30,10 V40" stroke="#f59e0b" stroke-width="1.2" opacity=".6"/><path d="M10,34 C16,26 22,32 26,24 S36,18 38,14" stroke="#7c3aed" stroke-width="2.4" fill="none" stroke-dasharray="3 3" stroke-linecap="round"/><path d="M38,8 c-5,0 -7,4 -7,6 c0,4 7,10 7,10 s7,-6 7,-10 c0,-2 -2,-6 -7,-6Z" fill="#ef4444"/><circle cx="38" cy="14" r="2.4" fill="#fff"/>',
    keys: '<rect x="4" y="12" width="40" height="26" rx="4" fill="#1f1d24"/><rect x="4" y="12" width="40" height="5" rx="2" fill="#9d2437"/>' + [0, 1, 2, 3, 4, 5].map(function (i) { return '<rect x="' + (6 + i * 6.1) + '" y="17" width="5.6" height="19" rx="1.2" fill="#fffaf0"/>'; }).join('') + [0, 1, 3, 4].map(function (i) { return '<rect x="' + (10.2 + i * 6.1) + '" y="17" width="3.4" height="11" rx=".8" fill="#141218"/>'; }).join('') + '<rect x="12.3" y="17" width="5.6" height="19" rx="1.2" fill="#fcd34d"/>',
    trophy: '<path d="M14,10 C4,10 4,24 16,26 M34,10 C44,10 44,24 32,26" stroke="#d4a017" stroke-width="3" fill="none"/><path d="M12,6 H36 C36,22 32,30 24,32 C16,30 12,22 12,6Z" fill="#e6b43a"/><path d="M16,8 C16,18 18,24 22,28" stroke="#fff4bd" stroke-width="2.4" fill="none" stroke-linecap="round"/><rect x="21" y="32" width="6" height="6" fill="#b8860b"/><rect x="14" y="38" width="20" height="6" rx="1.5" fill="#5a3a22"/>' + star(24, 17, 5, '#fff4bd'),
    book: '<path d="M24,12 C18,8 10,8 4,10 V40 C10,38 18,38 24,42Z" fill="#ede9fe" stroke="#7c3aed" stroke-width="1.6"/><path d="M24,12 C30,8 38,8 44,10 V40 C38,38 30,38 24,42Z" fill="#fff" stroke="#7c3aed" stroke-width="1.6"/><path d="M28,18 H40 M28,23 H40 M28,28 H40 M28,33 H40" stroke="#c4b5fd" stroke-width="1"/>' + notesGlyph(14, 26, 18, '#6d28d9'),
    rush: '<path d="M27,4 L10,26 H22 L18,44 L38,18 H26Z" fill="#facc15" stroke="#d97706" stroke-width="1.6" stroke-linejoin="round"/><path d="M26,8 L15,23" stroke="#fff" stroke-width="1.6" opacity=".7"/>',
    echo: '<path d="M8,18 H16 L26,10 V38 L16,30 H8Z" fill="#7c3aed"/><path d="M31,17 C34,20 34,28 31,31 M35,13 C40,18 40,30 35,35 M39,9 C46,16 46,32 39,39" stroke="#a78bfa" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
    play: '<circle cx="24" cy="24" r="20" fill="#fff" opacity=".18"/>' + notesGlyph(24, 24, 26, '#fff'),
    note: notesGlyph(24, 24, 28, '#7c3aed'),
    songs: '<rect x="8" y="6" width="32" height="38" rx="3" fill="#fff" stroke="#7c3aed" stroke-width="1.6"/><path d="M12,16 H36 M12,20 H36 M12,24 H36 M12,28 H36 M12,32 H36" stroke="#c4b5fd" stroke-width="1"/>' + notesGlyph(24, 24, 16, '#4c1d95'),
    clock: '<circle cx="24" cy="25" r="17" fill="#fff" stroke="#0d9488" stroke-width="3"/><path d="M24,14 V25 L31,29" stroke="#134e4a" stroke-width="2.6" fill="none" stroke-linecap="round"/><rect x="20" y="3" width="8" height="5" rx="1.5" fill="#0d9488"/>',
    best: '<path d="M16,4 L22,18 M32,4 L26,18" stroke="#ef4444" stroke-width="5"/><circle cx="24" cy="30" r="13" fill="#e6b43a" stroke="#946109" stroke-width="1.4"/>' + star(24, 30, 7, '#fff4bd')
  };
  function icon(name, size) {
    return '<svg class="lma-icon" viewBox="0 0 48 48" width="' + (size || 40) + '" height="' + (size || 40) + '" aria-hidden="true" focusable="false">' + (ICONS[name] || '') + '</svg>';
  }
  var CARD_ICON = { 'Song Map': 'map', 'Free Play': 'keys', 'Trophies': 'trophy', 'Learn Basics': 'book', 'Note Rush': 'rush', 'Echo': 'echo' };
  var STAT_ICON = { 'Notes': 'note', 'Songs': 'songs', 'Practice': 'clock', 'Best': 'best' };

  function decorateHome(container) {
    if (!container) return;
    try {
      Array.prototype.forEach.call(container.querySelectorAll('.home-nav-card'), function (card) {
        var t = card.querySelector('.home-nav-card-title'), ic = card.querySelector('.home-nav-card-icon');
        var name = t && CARD_ICON[t.textContent.trim()];
        if (ic && name) { ic.innerHTML = icon(name, 40); ic.classList.add('lma-drawn'); }
      });
      Array.prototype.forEach.call(container.querySelectorAll('.home-stat-card'), function (card) {
        var l = card.querySelector('.home-stat-label'), ic = card.querySelector('.home-stat-icon');
        var name = l && STAT_ICON[l.textContent.trim()];
        if (ic && name) { ic.innerHTML = icon(name, 26); ic.classList.add('lma-drawn'); }
      });
      var ci = container.querySelector('.home-continue-icon');
      if (ci) { ci.innerHTML = icon('play', 34); ci.classList.add('lma-drawn'); }
    } catch (e) {}
  }

  return {
    decorateQuestMap: decorateQuestMap,
    layoutTrails: layoutTrails,
    trophyRoom: trophyRoom,
    decorateHome: decorateHome,
    _medallion: medallion
  };
})();
