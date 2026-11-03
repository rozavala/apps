/* ================================================================
   MONEY MASTER — ART  (js/money-master-art.js)
   Hand-built SVG for coins, banknotes, the shop counter, the cash
   register, shop items and the balance scale. Everything here is an
   ILLUSTRATION for learning: simplified engraving-style portraits,
   guilloché patterns and metal rims — not replicas. Every banknote
   carries a "MUESTRA · SAMPLE" mark.
   Exposes window.MMArt. No network, no images.
   ================================================================ */
(function () {
  'use strict';

  var _n = 0;
  function uid(p) { _n++; return (p || 'mm') + _n.toString(36); }
  function f1(x) { return Math.round(x * 10) / 10; }

  // ---------------------------------------------------------------
  // Metals (field / rim / edge tones). See money-master-data.js for
  // which coin uses which.
  // ---------------------------------------------------------------
  var METALS = {
    copper10: { hi: '#f7c49a', mid: '#c77748', lo: '#7a3a1a', ink: '#4f230c' },
    bronze50: { hi: '#f6e0a2', mid: '#c49a48', lo: '#76561b', ink: '#4c380d' },
    gold:     { hi: '#fff3b8', mid: '#d8b23f', lo: '#86660f', ink: '#584205' },
    silver:   { hi: '#ffffff', mid: '#c4c9ce', lo: '#7a828a', ink: '#434950' },
    nickel:   { hi: '#f3f3ee', mid: '#aeb1ab', lo: '#686b65', ink: '#3f423c' },
    copperUS: { hi: '#f8c8a0', mid: '#c26a37', lo: '#703211', ink: '#4a1f09' }
  };

  var _defsReady = false;
  function ensureDefs() {
    if (_defsReady || typeof document === 'undefined' || !document.body) return;
    _defsReady = true;
    var g = '';
    Object.keys(METALS).forEach(function (k) {
      var m = METALS[k];
      g += '<radialGradient id="mmf-' + k + '" cx="36%" cy="30%" r="78%">' +
             '<stop offset="0" stop-color="' + m.hi + '"/><stop offset=".48" stop-color="' + m.mid + '"/>' +
             '<stop offset="1" stop-color="' + m.lo + '"/></radialGradient>' +
           '<linearGradient id="mmr-' + k + '" x1="0" y1="0" x2="1" y2="1">' +
             '<stop offset="0" stop-color="' + m.hi + '"/><stop offset=".55" stop-color="' + m.mid + '"/>' +
             '<stop offset="1" stop-color="' + m.lo + '"/></linearGradient>' +
           '<linearGradient id="mmi-' + k + '" x1="0" y1="0" x2="1" y2="1">' +
             '<stop offset="0" stop-color="' + m.lo + '"/><stop offset="1" stop-color="' + m.hi + '"/></linearGradient>' +
           '<linearGradient id="mme-' + k + '" x1="0" y1="0" x2="0" y2="1">' +
             '<stop offset="0" stop-color="' + m.lo + '"/><stop offset=".6" stop-color="' + m.mid + '"/>' +
             '<stop offset="1" stop-color="' + m.lo + '"/></linearGradient>' +
           '<linearGradient id="mmz-' + k + '" x1="0" y1="0" x2=".7" y2="1">' +
             '<stop offset="0" stop-color="' + m.hi + '"/><stop offset="1" stop-color="' + m.mid + '"/></linearGradient>';
    });
    g += '<radialGradient id="mm-sheen" cx="50%" cy="50%" r="50%">' +
           '<stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
         '<radialGradient id="mm-gloss" cx="35%" cy="28%" r="60%">' +
           '<stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset=".5" stop-color="#fff" stop-opacity=".15"/>' +
           '<stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
         '<linearGradient id="mm-chrome" x1="0" y1="0" x2="0" y2="1">' +
           '<stop offset="0" stop-color="#fdfdfd"/><stop offset=".45" stop-color="#b9bec4"/>' +
           '<stop offset=".55" stop-color="#8d939a"/><stop offset="1" stop-color="#e5e8eb"/></linearGradient>' +
         '<linearGradient id="mm-brass" x1="0" y1="0" x2="0" y2="1">' +
           '<stop offset="0" stop-color="#fbe7a6"/><stop offset=".5" stop-color="#c89a3a"/>' +
           '<stop offset="1" stop-color="#7d5a16"/></linearGradient>';
    var holder = document.createElement('div');
    holder.setAttribute('aria-hidden', 'true');
    holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;';
    holder.innerHTML = '<svg width="0" height="0" focusable="false"><defs>' + g + '</defs></svg>';
    document.body.insertBefore(holder, document.body.firstChild);
  }

  // ---------------------------------------------------------------
  // Portraits — a small parametric bust, right-facing in a 100×100 box.
  // Simplified silhouettes for learning; not likenesses.
  // ---------------------------------------------------------------
  var FACE_M = 'M40 74 C36 62 30 50 31 38 C32 22 45 12 58 14 C65 15 69 21 70 28 L71 34 C72 36 72.5 37 72 38.5 ' +
    'L76.5 46.5 C77 48 75.5 49.2 73 49 C73.2 50.5 73.6 51.6 73 53 C72.2 53.8 72.6 54.8 72.4 56 C71.6 57.2 70.6 58 71 60 ' +
    'C71.4 63 69.4 66 65 67.4 C61 68.6 58.6 71 58.2 76 L58.6 86 L41 86 Z';
  var FACE_F = 'M40 74 C36 62 30 50 31 38 C32 22 45 12 58 14 C65 15 69 21 69.6 28 L70.4 34 C71.4 36 71.8 37 71.4 38.5 ' +
    'L74.6 46 C75 47.6 73.8 48.6 72 48.6 C72.3 50.2 72.8 51.4 72.3 52.8 C71.6 53.6 72 54.6 71.8 55.8 C71 57 70.2 57.8 70.4 59.6 ' +
    'C70.6 62.6 68.6 65.4 64.6 66.4 C61 67.4 58.8 70 58.2 76 L58.6 86 L41 86 Z';
  var EAR = 'M50 40 C47 38 45 41 46 45 C46.5 49 48 52 51 52 C53 52 53.5 49 52.5 47 C53 44 52.5 41 50 40 Z';
  var BUST = 'M12 100 C14 88 27 82 41 81 L59 81 C73 82 86 88 89 100 Z';
  var HAIR = {
    short: 'M70 28 C68 18 60 12 48 12.5 C36 13.5 29 24 30.5 38 C31.5 48 35 57 40 64 C41 58 43 50 47 45 C48 42 50 40.5 52.5 41 L54 52 L56.5 52 L56 40 C56.5 32 62 27 70 28 Z',
    neat: 'M70.5 27 C70 16 61 9 48 10 C35 11 28 22 29.5 37 C30.5 47 34 56 39 62 C41 56 43 50 47 45 C49 42 51 40.5 53.5 41 L54.5 46 L56.5 46 L56.5 38 C57.5 31 63 27 70.5 27 Z',
    swept: 'M71 26 C70 14 62 4 48 5 C34 6 27 18 29 34 C30 46 33 55 38 62 C40 55 43 48 47 44 C49 41 51 40 53 41 L55 51 L57.5 51 L57 38 C58 31 63 27 71 26 Z',
    wig: 'M69 27 C67 16 58 10 47 11 C35 12 28 22 29 36 C29.5 46 32 54 36 60 L44 56 C44 50 46 45 50 42 L58 34 C61 30 65 28 69 27 Z',
    bald: 'M57 15.5 C47 14 36 18 32 30 C30 40 32 52 38 62 C40 56 43 49 47 45 C49 42 51 41 53 42 L54.5 49 L56 49 L55.5 38 C55 31 55.5 23 57 15.5 Z',
    woman: 'M70 28 C68 17 59 11 48 11.5 C35 12.5 28 23 29.5 37 C30.5 47 33 54 37 59 C40 60 43 58 45 54 C45 48 47 43 51 40.5 C55 38 57 33 61 30 C64 28.5 67 28 70 28 Z',
    long: 'M70 28 C68 17 59 11 48 11.5 C35 12.5 28 23 29 37 C29 50 30 62 28 76 L26 92 L39 92 C39 80 40 70 42 62 C44 56 45 50 48 44 C51 40 56 34 61 30 C64 28.5 67 28 70 28 Z'
  };
  var CURLS = [[37, 15.5, 3.8], [43, 12, 3.8], [49.5, 10.5, 3.8], [56, 11, 3.8], [62, 13.5, 3.6], [67, 18.5, 3.4], [69.5, 24, 3], [32.5, 22, 3.8],
    [30.5, 29.5, 3.6], [30.5, 37, 3.6], [32, 45, 3.4]];
  var BEARD = {
    chin: 'M53.5 44 L55 54 C57 60 61 64 66 66 C69 65.5 70.8 63 71 60.5 C70 58 70.6 57.4 71.8 56.6 C72.6 60 72.4 66 69 70.5 C65 74.5 59 74.5 55 71 C51 67 50 60 50.5 53 Z',
    full: 'M53.5 44 L55 54 C57 60 61 62 66 61 C69 60 70.6 59 71.6 57 C72.8 60.5 72.4 66 69 70 C65 74 59 74 55 71 C51 67 50 60 50.5 53 Z',
    stache: 'M67.6 51 C69.6 49.8 72.8 50.2 74 52.2 C72.4 53 69.8 52.8 67.4 52.6 Z'
  };
  var COLLAR = {
    military: { coat: 1, parts: [
      ['M40 74.5 C46 77 54 77 59.5 74.5 L61 85 C54 87.5 46 87.5 39.5 85.5 Z', 'band'],
      ['M18 89 C23 82 33 81 39.5 84.5 L37.5 91 C31 88.5 24 89.5 18 93 Z', 'trim'],
      ['M64 90 a1.8 1.8 0 1 0 0.1 0 M65.5 96.5 a1.8 1.8 0 1 0 0.1 0', 'trim']
    ] },
    cravat: { coat: 1, parts: [
      ['M40.5 74 C47 78 55 78 59.8 75.5 L61.5 84.5 C55 89.5 46 89.5 39.5 85.5 Z', 'white'],
      ['M39.5 86 L50 100 L43 100 L30 88.5 Z', 'coat'],
      ['M61.5 84.5 L58 100 L67 100 L73 88 Z', 'coat']
    ] },
    jabot: { coat: 1, parts: [
      ['M40.5 74 C47 78 55 78 59.8 75.5 L61.5 84.5 C55 89.5 46 89.5 39.5 85.5 Z', 'white'],
      ['M50 86 L56 85 L54 89 L58 90 L55 93 L59 95 L55.5 97.5 L58.5 100 L48 100 L50 94 Z', 'white'],
      ['M39.5 86 L48 100 L42 100 L30 88.5 Z', 'coat'],
      ['M61.5 84.5 L59 100 L67 100 L73 88 Z', 'coat']
    ] },
    suit: { coat: 1, parts: [
      ['M42 80 L52 100 L61 80 L58 76 C53 78 47 78 43 76 Z', 'white'],
      ['M50.5 86 L54 86 L55.5 100 L49 100 Z', 'tie'],
      ['M42 80 L49 100 L40 100 L33 86 Z', 'coat'],
      ['M61 80 L56 100 L66 100 L70 86 Z', 'coat']
    ] },
    plain: { coat: 2, parts: [
      ['M43 82 C47 89 55 89 60 82', 'line'],
      ['M51.5 90.5 a2.2 2.2 0 1 0 0.1 0', 'trim']
    ] },
    clerical: { coat: 3, parts: [
      ['M41 76 C47 79 54 79 59 76.5 L59.8 81.5 C54 83.5 47 83.5 40.6 81 Z', 'white'],
      ['M51 80 h5 v5 h-5 Z', 'white']
    ] },
    mapuche: { coat: 2, parts: [
      ['M22 92 C34 84 48 86 60 82 C70 84 80 88 86 98 L84 100 L20 100 Z', 'shawl'],
      ['M47 83 L50 92 M57 83 L54 92', 'line'],
      ['M47 92 h10 v4 h-10 Z M50 96 h4 v4 h-4 Z', 'trim']
    ] }
  };
  var FIGS = {
    ohiggins: { hair: 'short', collar: 'military' },
    mapuche:  { hair: 'long', collar: 'mapuche', face: 'f', band: 1, earring: 1 },
    silva:    { hair: 'bald', collar: 'clerical', cap: 1 },
    carrera:  { hair: 'short', collar: 'military' },
    rodriguez:{ hair: 'short', curls: 1, collar: 'cravat' },
    mistral:  { hair: 'woman', collar: 'plain', face: 'f' },
    prat:     { hair: 'short', beard: 'full', stache: 1, collar: 'military' },
    bello:    { hair: 'bald', collar: 'cravat' },
    lincoln:  { hair: 'short', beard: 'chin', collar: 'suit' },
    jefferson:{ hair: 'wig', queue: 1, collar: 'cravat' },
    roosevelt:{ hair: 'neat', collar: 'suit' },
    washington:{ hair: 'wig', queue: 1, collar: 'jabot' },
    kennedy:  { hair: 'neat', collar: 'suit' },
    hamilton: { hair: 'wig', queue: 1, collar: 'jabot' },
    jackson:  { hair: 'swept', collar: 'cravat' }
  };

  // List of [d, role] layers for a figure, in paint order.
  function figLayers(id) {
    var f = FIGS[id] || FIGS.ohiggins;
    var L = [];
    var col = COLLAR[f.collar] || COLLAR.plain;
    L.push([BUST, col.coat === 1 ? 'coat' : col.coat === 3 ? 'cassock' : 'dress']);
    if (f.hair === 'long') L.push([HAIR.long, 'hair']);
    L.push([f.face === 'f' ? FACE_F : FACE_M, 'skin']);
    L.push([EAR, 'skin']);
    if (f.hair !== 'long') L.push([HAIR[f.hair] || HAIR.short, 'hair']);
    if (f.curls) CURLS.forEach(function (c) { L.push(['M' + (c[0] - c[2]) + ' ' + c[1] + ' a' + c[2] + ' ' + c[2] + ' 0 1 0 ' + (2 * c[2]) + ' 0 a' + c[2] + ' ' + c[2] + ' 0 1 0 -' + (2 * c[2]) + ' 0 Z', 'hair']); });
    if (f.hair === 'wig') {
      L.push(['M39 47 a7 4.4 0 1 0 14 0 a7 4.4 0 1 0 -14 0 Z', 'hair']);
      L.push(['M38 55 a6 4 0 1 0 12 0 a6 4 0 1 0 -12 0 Z', 'hair']);
    }
    if (f.queue) {
      L.push(['M34 56 C30 62 28 70 28.5 80 L32.5 80 C32.5 72 34.5 65 38.5 59 Z', 'hair']);
      L.push(['M27 62 L33 64.5 L27 68 Z M39 61 L33 64.5 L38 69 Z', 'tie']);
    }
    if (f.cap) L.push(['M35 22 C39 13 51 10 60 14 C54 17.5 44 19.5 35 22 Z', 'tie']);
    if (f.band) {
      L.push(['M30 31 C40 26 56 24 70 26.5 L70.4 30.4 C56 28.4 40 30.4 30.6 35 Z', 'trim']);
    }
    if (f.hair !== 'bald') L.push(['M40 16.5 C48 13.5 58 15 65.5 21.5 M34.5 25 C42 19.5 52 18.5 61 23.5 M32.5 35 C38 28 46 25.5 54 28', 'strand']);
    if (f.beard) L.push([BEARD[f.beard], 'hair']);
    if (f.stache) L.push([BEARD.stache, 'hair']);
    if (f.earring) L.push(['M46.5 54 L51.5 54 L53.5 61 L44.5 61 Z', 'trim']);
    (col.parts || []).forEach(function (p) { L.push(p); });
    // fine features
    L.push(['M63.5 38.5 C65 37.2 67 37.2 68.5 38.3', 'line']);
    L.push(['M62 35.2 C65 33.8 68 34 70.5 35', 'line']);
    L.push(['M72.6 47.8 C73.5 48.6 74.2 48.4 74.6 47.6', 'line']);
    L.push(['M70.6 54.3 L72.8 54.1', 'line']);
    L.push(['M48.6 43.5 C50.5 44 51 46.5 49.5 48.5', 'line']);
    return L;
  }

  // Embossed (coin) portrait: every shape gets a shadow and a highlight.
  function portraitEmboss(id, metal, tx, ty, s, flip) {
    var L = figLayers(id);
    var m = METALS[metal];
    var tf = 'translate(' + tx + ' ' + ty + ') scale(' + (flip ? -s : s) + ' ' + s + ')' + (flip ? ' translate(-100 0)' : '');
    var out = '<g transform="' + tf + '">';
    L.forEach(function (l) {
      var d = l[0], role = l[1];
      if (role === 'line' || role === 'strand') {
        out += '<path d="' + d + '" fill="none" stroke="' + m.ink + '" stroke-opacity="' + (role === 'strand' ? .3 : .55) + '" stroke-width="1.1" stroke-linecap="round"/>';
        return;
      }
      var fill = role === 'hair' || role === 'tie' ? 'url(#mmi-' + metal + ')' :
                 role === 'coat' || role === 'cassock' || role === 'shawl' ? 'url(#mmr-' + metal + ')' : 'url(#mmz-' + metal + ')';
      out += '<path d="' + d + '" transform="translate(1.2 1.5)" fill="' + m.ink + '" fill-opacity=".55"/>' +
             '<path d="' + d + '" transform="translate(-.8 -.9)" fill="#fff" fill-opacity=".45"/>' +
             '<path d="' + d + '" fill="' + fill + '"/>';
      if (role === 'hair') out += '<path d="' + d + '" fill="none" stroke="' + m.ink + '" stroke-opacity=".25" stroke-width=".6"/>';
    });
    return out + '</g>';
  }

  // Engraved (banknote) portrait: hatching in the note's ink.
  function portraitEngrave(id, ink, paper, tx, ty, s, ids, flip) {
    var L = figLayers(id);
    var tf = 'translate(' + tx + ' ' + ty + ') scale(' + (flip ? -s : s) + ' ' + s + ')' + (flip ? ' translate(-100 0)' : '');
    var out = '<g transform="' + tf + '">';
    L.forEach(function (l) {
      var d = l[0], role = l[1];
      if (role === 'line' || role === 'strand') {
        out += '<path d="' + d + '" fill="none" stroke="' + (role === 'strand' ? paper : ink) + '" stroke-opacity="' + (role === 'strand' ? .7 : 1) + '" stroke-width="' + (role === 'strand' ? 1.1 : .9) + '" stroke-linecap="round"/>';
        return;
      }
      var dense = role === 'coat' || role === 'cassock' || role === 'tie' ? 2 : role === 'hair' || role === 'shawl' ? 1 : role === 'dress' ? 1 : 0;
      out += '<path d="' + d + '" fill="' + (role === 'white' ? '#fff' : paper) + '"/>';
      if (dense >= 1 && role !== 'white' && role !== 'trim') out += '<path d="' + d + '" fill="' + ink + '" opacity="' + (dense === 2 ? .5 : .28) + '"/>';
      if (role !== 'white' && role !== 'trim') {
        out += '<path d="' + d + '" fill="url(#' + ids.h + ')" opacity="' + (dense === 0 ? .2 : .95) + '"/>';
        if (dense >= 1) out += '<path d="' + d + '" fill="url(#' + ids.x + ')" opacity="' + (dense === 2 ? .95 : .7) + '"/>';
      }
      if (role === 'trim') out += '<path d="' + d + '" fill="' + ink + '" opacity=".55"/>';
      out += '<path d="' + d + '" fill="none" stroke="' + ink + '" stroke-width=".7" stroke-opacity=".9"/>';
      if (role === 'skin' && d.length > 100) {
        // shade the back of the head / under the jaw
        out += '<path d="M31 40 C32 54 36 64 40 74 L41 86 L50 86 L50 60 C44 56 40 48 38 36 Z" fill="url(#' + ids.x + ')" opacity=".35"/>';
        out += '<path d="M60 44 C62 50 62 56 60 62 C64 60 66 54 65 48 Z" fill="url(#' + ids.h + ')" opacity=".35"/>';
        out += '<path d="M58 70 C61 68.5 64 68 66 67 L60 76 Z" fill="url(#' + ids.h + ')" opacity=".9"/>';
      }
    });
    return out + '</g>';
  }

  // ---------------------------------------------------------------
  // Guilloché helpers (cached path strings)
  // ---------------------------------------------------------------
  var _gc = {};
  function rosette(R, A, k, copies) {
    var key = [R, A, k, copies].join('|');
    if (_gc[key]) return _gc[key];
    var d = '';
    for (var i = 0; i < copies; i++) {
      var ph = i * Math.PI * 2 / copies / k;
      for (var j = 0; j <= 144; j++) {
        var t = j / 144 * Math.PI * 2;
        var r = R + A * Math.sin(k * (t + ph));
        d += (j ? 'L' : 'M') + f1(r * Math.cos(t)) + ' ' + f1(r * Math.sin(t));
      }
      d += 'Z';
    }
    _gc[key] = d;
    return d;
  }
  function waves(w, h, n, amp, period) {
    var key = ['w', w, h, n, amp, period].join('|');
    if (_gc[key]) return _gc[key];
    var d = '';
    for (var i = 0; i < n; i++) {
      var y0 = (i + 0.5) * h / n;
      for (var x = 0; x <= w; x += 4) {
        var y = y0 + amp * Math.sin(x / period * Math.PI * 2 + i * 0.55);
        d += (x ? 'L' : 'M') + x + ' ' + f1(y);
      }
    }
    _gc[key] = d;
    return d;
  }

  // ---------------------------------------------------------------
  // COINS
  // ---------------------------------------------------------------
  function emText(x, y, txt, size, m, extra) {
    var common = ' x="' + x + '" y="' + y + '" text-anchor="middle" font-family="Baloo 2, Nunito, sans-serif" font-weight="800" font-size="' + size + '"' + (extra || '');
    return '<text' + common + ' fill="#fff" fill-opacity=".55" transform="translate(-.5 -.5)">' + txt + '</text>' +
           '<text' + common + ' fill="' + m.ink + '" fill-opacity=".78">' + txt + '</text>';
  }
  function arcText(idTop, idBot, top, bot, m, size, r) {
    r = r || 37;
    var out = '<defs><path id="' + idTop + '" d="M' + (50 - r) + ' 50 A' + r + ' ' + r + ' 0 0 1 ' + (50 + r) + ' 50"/>' +
              '<path id="' + idBot + '" d="M' + (50 - r - 5.5) + ' 50 A' + (r + 5.5) + ' ' + (r + 5.5) + ' 0 0 0 ' + (50 + r + 5.5) + ' 50"/></defs>';
    var st = ' font-family="Nunito, sans-serif" font-weight="900" font-size="' + (size || 6.6) + '" letter-spacing=".6" text-anchor="middle"';
    [[idTop, top], [idBot, bot]].forEach(function (p) {
      if (!p[1]) return;
      out += '<text' + st + ' fill="#fff" fill-opacity=".5" transform="translate(-.4 -.4)"><textPath href="#' + p[0] + '" startOffset="50%">' + p[1] + '</textPath></text>' +
             '<text' + st + ' fill="' + m.ink + '" fill-opacity=".72"><textPath href="#' + p[0] + '" startOffset="50%">' + p[1] + '</textPath></text>';
    });
    return out;
  }
  function laurel(m, side) {
    // a branch of small leaves curving under the value
    var out = '<g fill="url(#mmi-' + m + ')" stroke="' + METALS[m].ink + '" stroke-opacity=".35" stroke-width=".4">';
    for (var i = 0; i < 7; i++) {
      var a = (200 - i * 14) * Math.PI / 180;
      var x = 50 + 30 * Math.cos(a) * side, y = 50 - 30 * Math.sin(a) + 2;
      var rot = (side > 0 ? 1 : -1) * (i * 14 + 20);
      out += '<ellipse cx="' + f1(x) + '" cy="' + f1(y) + '" rx="2" ry="4.4" transform="rotate(' + rot + ' ' + f1(x) + ' ' + f1(y) + ')"/>';
    }
    return out + '</g>';
  }
  function coatOfArms(m, cx, cy, s) {
    var M = METALS[m];
    var t = 'translate(' + cx + ' ' + cy + ') scale(' + s + ')';
    return '<g transform="' + t + '">' +
      // shield
      '<path d="M-10 -12 H10 V2 C10 9 4 13 0 15 C-4 13 -10 9 -10 2 Z" fill="url(#mmz-' + m + ')" stroke="' + M.ink + '" stroke-opacity=".6" stroke-width=".8"/>' +
      '<path d="M-10 -4 H10" stroke="' + M.ink + '" stroke-opacity=".55" stroke-width=".8"/>' +
      '<path d="M0 -9.6 L1.4 -6.4 L4.8 -6.2 L2.2 -4.2 L3.1 -1 L0 -2.8 L-3.1 -1 L-2.2 -4.2 L-4.8 -6.2 L-1.4 -6.4 Z" fill="' + M.ink + '" fill-opacity=".6"/>' +
      // plumes
      '<path d="M-5 -13 C-6 -18 -2 -20 0 -16 C2 -20 6 -18 5 -13 Z" fill="url(#mmi-' + m + ')"/>' +
      // condor (viewer's left) and huemul (viewer's right), simplified
      '<path d="M-12 -4 C-16 -10 -20 -10 -22 -6 L-19 -6 L-21 0 C-18 2 -15 6 -14 12 L-11 12 C-12 6 -11 2 -10 -2 Z" fill="url(#mmi-' + m + ')"/>' +
      '<path d="M12 -2 C14 -8 15 -12 18 -13 L19 -17 L20 -13 C22 -12 22 -9 20 -8 C19 -2 18 4 17 12 L14 12 C14 6 12 2 10 0 Z" fill="url(#mmi-' + m + ')"/>' +
      '</g>';
  }
  function shieldUS(m) {
    var M = METALS[m];
    var o = '<path d="M33 30 H67 V50 C67 62 58 70 50 74 C42 70 33 62 33 50 Z" fill="url(#mmz-' + m + ')" stroke="' + M.ink + '" stroke-opacity=".6"/>' +
            '<path d="M33 30 H67 V38 H33 Z" fill="url(#mmi-' + m + ')" opacity=".9"/>';
    for (var i = 0; i < 7; i++) o += '<path d="M' + (36.5 + i * 4.5) + ' 39 V' + (62 - Math.abs(i - 3) * 3.4) + '" stroke="' + M.ink + '" stroke-opacity=".45" stroke-width="1.6"/>';
    return o;
  }
  function monticello(m) {
    var M = METALS[m], o = '';
    o += '<path d="M24 64 H76 V67 H24 Z" fill="url(#mmi-' + m + ')"/>';
    o += '<path d="M28 46 H72 V64 H28 Z" fill="url(#mmz-' + m + ')" stroke="' + M.ink + '" stroke-opacity=".45" stroke-width=".6"/>';
    o += '<path d="M38 46 L50 37 L62 46 Z" fill="url(#mmi-' + m + ')"/>';
    o += '<path d="M43 37 A7 6 0 0 1 57 37 Z" fill="url(#mmz-' + m + ')" stroke="' + M.ink + '" stroke-opacity=".5" stroke-width=".6"/>';
    for (var i = 0; i < 4; i++) o += '<path d="M' + (42 + i * 5.3) + ' 47 V63" stroke="' + M.ink + '" stroke-opacity=".5" stroke-width="1.4"/>';
    o += '<path d="M30 52 h6 v6 h-6 Z M64 52 h6 v6 h-6 Z" fill="' + M.ink + '" fill-opacity=".35"/>';
    return o;
  }
  function torch(m) {
    var M = METALS[m];
    return '<path d="M50 26 C46 30 47 34 50 36 C53 34 54 30 50 26 Z" fill="url(#mmi-' + m + ')"/>' +
      '<path d="M46 36 H54 L52.5 42 H47.5 Z" fill="url(#mmz-' + m + ')" stroke="' + M.ink + '" stroke-opacity=".5" stroke-width=".6"/>' +
      '<path d="M48 42 H52 L51 74 H49 Z" fill="url(#mmi-' + m + ')"/>' +
      // olive branch (left) and oak branch (right)
      '<path d="M46 70 C38 64 32 54 30 44" stroke="' + M.ink + '" stroke-opacity=".5" fill="none" stroke-width="1"/>' +
      '<path d="M54 70 C62 64 68 54 70 44" stroke="' + M.ink + '" stroke-opacity=".5" fill="none" stroke-width="1"/>' +
      [0, 1, 2, 3].map(function (i) {
        var y = 66 - i * 6.5, xl = 41 - i * 3, xr = 59 + i * 3;
        return '<ellipse cx="' + xl + '" cy="' + y + '" rx="1.8" ry="4" transform="rotate(-50 ' + xl + ' ' + y + ')" fill="url(#mmi-' + m + ')"/>' +
               '<path d="M' + xr + ' ' + (y - 4) + ' c3 1 3 3 1 4 c2 1 1 3 -1 3 c0 -2 -2 -4 0 -7 Z" fill="url(#mmi-' + m + ')"/>';
      }).join('');
  }
  function eagle(m, withShield) {
    var M = METALS[m];
    var o = '<path d="M50 34 C46 34 45 38 47 41 C40 40 30 34 24 28 C26 38 32 46 42 50 C40 56 42 62 46 66 L44 72 L50 69 L56 72 L54 66 C58 62 60 56 58 50 C68 46 74 38 76 28 C70 34 60 40 53 41 C55 38 54 34 50 34 Z" fill="url(#mmz-' + m + ')" stroke="' + M.ink + '" stroke-opacity=".5" stroke-width=".6"/>';
    for (var i = 0; i < 4; i++) {
      o += '<path d="M' + (28 + i * 3) + ' ' + (32 + i * 3.4) + ' L' + (42 - i) + ' ' + (44 + i) + '" stroke="' + M.ink + '" stroke-opacity=".35" stroke-width=".7"/>';
      o += '<path d="M' + (72 - i * 3) + ' ' + (32 + i * 3.4) + ' L' + (58 + i) + ' ' + (44 + i) + '" stroke="' + M.ink + '" stroke-opacity=".35" stroke-width=".7"/>';
    }
    if (withShield) o += '<path d="M44 46 H56 V54 C56 58 53 60 50 61 C47 60 44 58 44 54 Z" fill="url(#mmi-' + m + ')" stroke="' + M.ink + '" stroke-opacity=".5" stroke-width=".5"/>';
    return o;
  }

  /**
   * coin(spec, opts) — spec from MM_DATA (metal, mm, reeded, ring,
   * fig, faceFlip, top/bot inscriptions, rev). opts.side 'obv'|'rev',
   * opts.px (width in px), opts.cls.
   */
  function coin(spec, opts) {
    ensureDefs();
    opts = opts || {};
    var side = opts.side || 'rev';
    var px = opts.px || 64;
    var metal = spec.metal, M = METALS[metal];
    var ring = spec.ring; // bimetallic: ring metal, `metal` = centre
    var rimMetal = ring || metal;
    var idA = uid('a'), idB = uid('b');
    var s = '<svg class="mm-svg-coin ' + (opts.cls || '') + '" viewBox="0 0 100 105" width="' + px + '" height="' + f1(px * 1.05) + '" aria-hidden="true" focusable="false">';
    // edge (thickness), with reeding where the real coin has it
    s += '<circle cx="50" cy="54" r="48" fill="url(#mme-' + rimMetal + ')"/>';
    if (spec.reeded) {
      s += '<g stroke="' + METALS[rimMetal].ink + '" stroke-opacity=".55" stroke-width=".7">';
      for (var a = 6; a <= 174; a += 3.2) {
        var r = a * Math.PI / 180, x = 50 + 48 * Math.cos(r), y = 50 + 48 * Math.sin(r);
        s += '<line x1="' + f1(x) + '" y1="' + f1(y) + '" x2="' + f1(x) + '" y2="' + f1(y + 4) + '"/>';
      }
      s += '</g>';
    }
    // face
    s += '<circle cx="50" cy="50" r="48" fill="url(#mmr-' + rimMetal + ')"/>' +
         '<circle cx="50" cy="50" r="47.6" fill="none" stroke="' + METALS[rimMetal].ink + '" stroke-opacity=".35" stroke-width=".7"/>';
    if (ring) {
      s += '<circle cx="50" cy="50" r="44" fill="url(#mmf-' + ring + ')"/>' +
           '<circle cx="50" cy="50" r="44" fill="none" stroke="url(#mmi-' + ring + ')" stroke-width="1.2"/>' +
           '<circle cx="50" cy="50" r="31" fill="url(#mmf-' + metal + ')"/>' +
           '<circle cx="50" cy="50" r="31" fill="none" stroke="url(#mmi-' + metal + ')" stroke-width="1.4"/>' +
           '<circle cx="50" cy="50" r="31.8" fill="none" stroke="' + METALS[ring].ink + '" stroke-opacity=".4" stroke-width=".6"/>';
    } else {
      s += '<circle cx="50" cy="50" r="44" fill="url(#mmf-' + metal + ')"/>' +
           '<circle cx="50" cy="50" r="44" fill="none" stroke="url(#mmi-' + metal + ')" stroke-width="1.3"/>';
    }
    s += '<circle cx="50" cy="50" r="45.7" fill="none" stroke="' + METALS[rimMetal].lo + '" stroke-width="1.5" stroke-dasharray=".8 1.15" stroke-opacity=".7"/>';

    var tm = ring ? METALS[ring] : M;
    if (side === 'obv') {
      if (ring) {
        s += portraitEmboss(spec.fig, metal, 31, 28, 0.42, spec.faceFlip);
        s += arcText(idA, idB, spec.top, spec.bot, tm, 6, 37.5);
      } else {
        s += portraitEmboss(spec.fig, metal, 20, 14, 0.64, spec.faceFlip);
        s += arcText(idA, idB, spec.top, spec.bot, tm, spec.small ? 7 : 6.4, 36.5);
      }
    } else {
      var rv = spec.rev || 'value';
      if (rv === 'value') {
        var big = String(spec.num);
        s += emText(50, 56, big, big.length >= 3 ? 27 : 34, M, ' letter-spacing="-1"');
        s += emText(50, 68, 'PESOS', 8.5, M, ' letter-spacing="1.2"');
        s += laurel(metal, 1) + laurel(metal, -1);
        s += arcText(idA, idB, spec.revTop || 'CHILE', '', M, 6.4, 36.5);
      } else if (rv === 'arms') {
        s += coatOfArms(metal, 50, 52, 0.95);
        s += arcText(idA, idB, '100 PESOS', 'POR LA RAZÓN O LA FUERZA', tm, 5.6, 37.5);
      } else {
        if (rv === 'shield') s += shieldUS(metal);
        else if (rv === 'monticello') s += monticello(metal);
        else if (rv === 'torch') s += torch(metal);
        else if (rv === 'eagle') s += eagle(metal, false);
        else if (rv === 'seal') s += eagle(metal, true);
        s += arcText(idA, idB, 'UNITED STATES OF AMERICA', spec.word, M, 5.8, 37);
      }
    }
    s += '<ellipse cx="36" cy="30" rx="30" ry="17" fill="url(#mm-sheen)" opacity=".55" transform="rotate(-32 36 30)"/>';
    return s + '</svg>';
  }

  // ---------------------------------------------------------------
  // LANDSCAPE vignettes for banknote reverses (monochrome engraving)
  // ---------------------------------------------------------------
  function vignette(kind, x, y, w, h, ink, tint, cid) {
    var o = '<g clip-path="url(#' + cid + ')"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + tint + '"/>';
    var gy = y + h * 0.72;
    function P(pts) { return pts.map(function (p, i) { return (i ? 'L' : 'M') + f1(x + p[0] * w) + ' ' + f1(y + p[1] * h); }).join('') + 'Z'; }
    // sky lines
    for (var i = 0; i < 9; i++) o += '<path d="M' + x + ' ' + f1(y + 4 + i * h * 0.045) + ' h' + w + '" stroke="' + ink + '" stroke-opacity=".18" stroke-width=".6"/>';
    if (kind === 'torres') {
      o += '<path d="' + P([[0, .72], [.12, .5], [.24, .58], [.3, .32], [.34, .3], [.38, .5], [.42, .2], [.46, .18], [.5, .46], [.54, .26], [.58, .24], [.62, .5], [.76, .46], [.9, .6], [1, .55], [1, .74], [0, .74]]) + '" fill="' + ink + '" fill-opacity=".55"/>';
      o += '<path d="' + P([[.3, .32], [.34, .3], [.35, .4], [.31, .42]]) + ' ' + P([[.42, .2], [.46, .18], [.47, .3], [.43, .32]]) + ' ' + P([[.54, .26], [.58, .24], [.59, .36], [.55, .36]]) + '" fill="#fff" fill-opacity=".55"/>';
      o += '<rect x="' + x + '" y="' + f1(gy) + '" width="' + w + '" height="' + f1(h * .1) + '" fill="' + ink + '" fill-opacity=".22"/>';
      o += '<path d="' + P([[0, .82], [.3, .78], [.6, .84], [1, .8], [1, 1], [0, 1]]) + '" fill="' + ink + '" fill-opacity=".7"/>';
    } else if (kind === 'nalcas') {
      o += '<path d="' + P([[0, .7], [.2, .5], [.36, .58], [.55, .22], [.6, .2], [.8, .55], [1, .5], [1, .74], [0, .74]]) + '" fill="' + ink + '" fill-opacity=".45"/>';
      o += '<path d="' + P([[.52, .27], [.55, .22], [.6, .2], [.64, .29], [.58, .27]]) + '" fill="#fff" fill-opacity=".6"/>';
      for (var t = 0; t < 9; t++) {
        var tx = x + w * (0.04 + t * 0.115), th = h * (0.32 + (t % 3) * 0.06), ty = y + h * 0.95;
        o += '<path d="M' + f1(tx) + ' ' + f1(ty) + ' V' + f1(ty - th) + '" stroke="' + ink + '" stroke-width="1.6"/>';
        o += '<path d="M' + f1(tx - w * .05) + ' ' + f1(ty - th + 3) + ' Q' + f1(tx) + ' ' + f1(ty - th - 4) + ' ' + f1(tx + w * .05) + ' ' + f1(ty - th + 3) + '" stroke="' + ink + '" stroke-width="2.6" fill="none"/>';
      }
      o += '<path d="' + P([[0, .9], [1, .86], [1, 1], [0, 1]]) + '" fill="' + ink + '" fill-opacity=".75"/>';
    } else if (kind === 'campana') {
      o += '<path d="' + P([[0, .62], [.22, .42], [.4, .52], [.58, .3], [.78, .48], [1, .4], [1, .8], [0, .8]]) + '" fill="' + ink + '" fill-opacity=".4"/>';
      for (var pm = 0; pm < 4; pm++) {
        var px = x + w * (0.16 + pm * 0.24), py = y + h * 0.92, ph = h * (0.42 + (pm % 2) * 0.08);
        o += '<path d="M' + f1(px - 1.4) + ' ' + f1(py) + ' L' + f1(px - 1) + ' ' + f1(py - ph) + ' L' + f1(px + 1) + ' ' + f1(py - ph) + ' L' + f1(px + 1.6) + ' ' + f1(py) + ' Z" fill="' + ink + '"/>';
        for (var fr = 0; fr < 7; fr++) {
          var an = -160 + fr * 23, ex = px + Math.cos(an * Math.PI / 180) * w * .07, ey = py - ph + Math.sin(an * Math.PI / 180) * h * .1 + 3;
          o += '<path d="M' + f1(px) + ' ' + f1(py - ph) + ' Q' + f1((px + ex) / 2) + ' ' + f1(py - ph - 4) + ' ' + f1(ex) + ' ' + f1(ey) + '" stroke="' + ink + '" stroke-width="1.5" fill="none"/>';
        }
      }
      o += '<path d="' + P([[0, .88], [1, .9], [1, 1], [0, 1]]) + '" fill="' + ink + '" fill-opacity=".7"/>';
    } else if (kind === 'agostini') {
      o += '<path d="' + P([[0, .66], [.14, .36], [.26, .46], [.4, .16], [.52, .38], [.66, .24], [.8, .44], [1, .3], [1, .7], [0, .7]]) + '" fill="' + ink + '" fill-opacity=".5"/>';
      o += '<path d="' + P([[.32, .32], [.4, .16], [.47, .3], [.44, .48], [.38, .66], [.34, .5]]) + ' ' + P([[.6, .32], [.66, .24], [.72, .34], [.7, .66], [.64, .62]]) + '" fill="#fff" fill-opacity=".7"/>';
      for (var wv = 0; wv < 5; wv++) o += '<path d="M' + x + ' ' + f1(y + h * (0.76 + wv * 0.05)) + ' h' + w + '" stroke="' + ink + '" stroke-opacity=".5" stroke-width=".8" stroke-dasharray="6 3"/>';
    } else if (kind === 'surire') {
      o += '<path d="' + P([[0, .56], [.18, .3], [.3, .42], [.46, .22], [.62, .44], [.8, .32], [1, .5], [1, .62], [0, .62]]) + '" fill="' + ink + '" fill-opacity=".45"/>';
      o += '<path d="' + P([[.42, .28], [.46, .22], [.5, .28]]) + '" fill="#fff" fill-opacity=".7"/>';
      o += '<rect x="' + x + '" y="' + f1(y + h * .62) + '" width="' + w + '" height="' + f1(h * .38) + '" fill="#fff" fill-opacity=".6"/>';
      for (var sl = 0; sl < 4; sl++) o += '<path d="M' + x + ' ' + f1(y + h * (0.68 + sl * 0.08)) + ' h' + w + '" stroke="' + ink + '" stroke-opacity=".25" stroke-width=".6"/>';
      // flamingo
      var fx = x + w * .68, fy = y + h * .9, sc = h / 60;
      o += '<g transform="translate(' + f1(fx) + ' ' + f1(fy) + ') scale(' + f1(sc) + ')" fill="' + ink + '">' +
        '<path d="M0 0 V-14 M3 0 L1 -14" stroke="' + ink + '" stroke-width="1"/>' +
        '<path d="M-6 -16 C-6 -22 4 -24 8 -18 C6 -14 -2 -12 -6 -16 Z"/>' +
        '<path d="M6 -19 C10 -26 6 -32 9 -36 C12 -38 14 -36 13 -34 L15 -32 L12 -33 C10 -30 13 -24 8 -18 Z"/></g>';
    } else if (kind === 'seal1') {
      [[.25, .5], [.75, .5]].forEach(function (c, ci) {
        var cx = x + w * c[0], cy = y + h * c[1], rr = h * .4;
        o += '<circle cx="' + f1(cx) + '" cy="' + f1(cy) + '" r="' + f1(rr) + '" fill="#fff" fill-opacity=".6" stroke="' + ink + '" stroke-width="1"/>' +
             '<circle cx="' + f1(cx) + '" cy="' + f1(cy) + '" r="' + f1(rr - 3) + '" fill="none" stroke="' + ink + '" stroke-width=".5" stroke-dasharray="1 1"/>';
        if (ci === 0) o += '<path d="M' + f1(cx - rr * .6) + ' ' + f1(cy + rr * .5) + ' L' + f1(cx) + ' ' + f1(cy - rr * .45) + ' L' + f1(cx + rr * .6) + ' ' + f1(cy + rr * .5) + ' Z" fill="' + ink + '" fill-opacity=".55"/>' +
          '<path d="M' + f1(cx - rr * .2) + ' ' + f1(cy - rr * .2) + ' L' + f1(cx) + ' ' + f1(cy - rr * .62) + ' L' + f1(cx + rr * .2) + ' ' + f1(cy - rr * .2) + ' Z" fill="none" stroke="' + ink + '" stroke-width=".8"/>';
        else o += '<g transform="translate(' + f1(cx - 50 * rr / 42) + ' ' + f1(cy - 50 * rr / 42) + ') scale(' + f1(rr / 42) + ')">' + eagleInk(ink) + '</g>';
      });
      o += '<text x="' + f1(x + w / 2) + '" y="' + f1(y + h * .64) + '" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="' + f1(h * .34) + '" fill="' + ink + '">ONE</text>';
    } else {
      // building: memorial / treasury / whitehouse
      var cols = kind === 'memorial' ? 12 : kind === 'treasury' ? 10 : 6;
      var bx = x + w * .1, bw = w * .8, by = y + h * (kind === 'whitehouse' ? .4 : .3), bh = h * .5;
      o += '<rect x="' + f1(x) + '" y="' + f1(y + h * .82) + '" width="' + w + '" height="' + f1(h * .18) + '" fill="' + ink + '" fill-opacity=".35"/>';
      if (kind === 'whitehouse') {
        o += '<rect x="' + f1(bx) + '" y="' + f1(by) + '" width="' + f1(bw) + '" height="' + f1(bh) + '" fill="#fff" fill-opacity=".75" stroke="' + ink + '" stroke-width=".8"/>';
        for (var wn = 0; wn < 8; wn++) if (wn < 3 || wn > 4) o += '<rect x="' + f1(bx + 4 + wn * bw / 8) + '" y="' + f1(by + bh * .25) + '" width="' + f1(bw / 16) + '" height="' + f1(bh * .22) + '" fill="' + ink + '" fill-opacity=".6"/><rect x="' + f1(bx + 4 + wn * bw / 8) + '" y="' + f1(by + bh * .62) + '" width="' + f1(bw / 16) + '" height="' + f1(bh * .22) + '" fill="' + ink + '" fill-opacity=".6"/>';
        var pcx = x + w / 2, pr = bw * .16;
        o += '<path d="M' + f1(pcx - pr) + ' ' + f1(by + bh) + ' V' + f1(by - 2) + ' A' + f1(pr) + ' ' + f1(pr * .35) + ' 0 0 1 ' + f1(pcx + pr) + ' ' + f1(by - 2) + ' V' + f1(by + bh) + ' Z" fill="#fff" stroke="' + ink + '" stroke-width=".8"/>';
        for (var pc = 0; pc < cols; pc++) o += '<path d="M' + f1(pcx - pr + 2 + pc * (2 * pr - 4) / (cols - 1)) + ' ' + f1(by + 1) + ' V' + f1(by + bh) + '" stroke="' + ink + '" stroke-width="1.6"/>';
        o += '<rect x="' + f1(bx - 2) + '" y="' + f1(by - 4) + '" width="' + f1(bw + 4) + '" height="3" fill="' + ink + '" fill-opacity=".7"/>';
      } else {
        o += '<rect x="' + f1(bx) + '" y="' + f1(by) + '" width="' + f1(bw) + '" height="' + f1(bh) + '" fill="#fff" fill-opacity=".7" stroke="' + ink + '" stroke-width=".8"/>';
        o += '<rect x="' + f1(bx - 3) + '" y="' + f1(by - 6) + '" width="' + f1(bw + 6) + '" height="6" fill="' + ink + '" fill-opacity=".7"/>';
        if (kind === 'memorial') o += '<rect x="' + f1(bx + bw * .15) + '" y="' + f1(by - 11) + '" width="' + f1(bw * .7) + '" height="5" fill="' + ink + '" fill-opacity=".55"/>';
        else o += '<path d="M' + f1(bx + bw * .3) + ' ' + f1(by - 6) + ' L' + f1(bx + bw / 2) + ' ' + f1(by - 14) + ' L' + f1(bx + bw * .7) + ' ' + f1(by - 6) + ' Z" fill="' + ink + '" fill-opacity=".55"/>';
        for (var cc = 0; cc < cols; cc++) o += '<path d="M' + f1(bx + 4 + cc * (bw - 8) / (cols - 1)) + ' ' + f1(by + 1) + ' V' + f1(by + bh) + '" stroke="' + ink + '" stroke-width="2"/>';
        o += '<rect x="' + f1(bx - 5) + '" y="' + f1(by + bh) + '" width="' + f1(bw + 10) + '" height="4" fill="' + ink + '" fill-opacity=".6"/>';
      }
    }
    return o + '</g>';
  }
  function eagleInk(ink) {
    return '<path d="M50 34 C46 34 45 38 47 41 C40 40 30 34 24 28 C26 38 32 46 42 50 C40 56 42 62 46 66 L44 72 L50 69 L56 72 L54 66 C58 62 60 56 58 50 C68 46 74 38 76 28 C70 34 60 40 53 41 C55 38 54 34 50 34 Z" fill="' + ink + '" fill-opacity=".6"/>' +
      '<path d="M44 46 H56 V54 C56 58 53 60 50 61 C47 60 44 58 44 54 Z" fill="#fff" fill-opacity=".8" stroke="' + ink + '" stroke-width=".6"/>';
  }

  // ---------------------------------------------------------------
  // BANKNOTES
  // ---------------------------------------------------------------
  function sampleMark(x, y, s) {
    return '<g transform="translate(' + f1(x) + ' ' + f1(y) + ') rotate(-8) scale(' + s + ')" opacity=".92">' +
      '<rect x="-27" y="-12" width="54" height="24" rx="3" fill="#fff" fill-opacity=".6" stroke="#b91c1c" stroke-width="1.4"/>' +
      '<rect x="-24.5" y="-9.5" width="49" height="19" rx="2" fill="none" stroke="#b91c1c" stroke-width=".5"/>' +
      '<text x="0" y="-1" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="8.6" letter-spacing=".6" fill="#b91c1c">MUESTRA</text>' +
      '<text x="0" y="7" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="6.6" letter-spacing="1.2" fill="#b91c1c">SAMPLE</text></g>';
  }

  /** note(spec, opts) — opts.side 'obv'|'rev', opts.px width */
  function note(spec, opts) {
    ensureDefs();
    opts = opts || {};
    var side = opts.side || 'obv';
    var W = spec.wmm * 2, H = spec.hmm * 2;
    var px = opts.px || 160;
    var ink = spec.ink, tint = spec.tint, light = spec.light, accent = spec.accent || ink;
    var ids = { h: uid('h'), x: uid('x'), clip: uid('c'), bg: uid('g'), vig: uid('v'), pc: uid('p') };
    var usd = spec.cur === 'USD';
    var s = '<svg class="mm-svg-note ' + (opts.cls || '') + '" viewBox="0 0 ' + W + ' ' + H + '" width="' + px + '" height="' + f1(px * H / W) + '" aria-hidden="true" focusable="false">';
    s += '<defs>' +
      '<clipPath id="' + ids.clip + '"><rect width="' + W + '" height="' + H + '" rx="' + (usd ? 3 : 5) + '"/></clipPath>' +
      '<pattern id="' + ids.h + '" width="1.7" height="1.7" patternUnits="userSpaceOnUse" patternTransform="rotate(38)"><path d="M0 .4 H1.7" stroke="' + ink + '" stroke-width=".55"/></pattern>' +
      '<pattern id="' + ids.x + '" width="1.5" height="1.5" patternUnits="userSpaceOnUse" patternTransform="rotate(-40)"><path d="M0 .4 H1.5" stroke="' + ink + '" stroke-width=".6"/></pattern>' +
      '<linearGradient id="' + ids.bg + '" x1="0" y1="0" x2="1" y2=".6"><stop offset="0" stop-color="' + light + '"/>' +
        '<stop offset=".55" stop-color="' + tint + '"/><stop offset="1" stop-color="' + light + '"/></linearGradient>' +
      '<clipPath id="' + ids.vig + '"><rect x="' + (usd ? W * .26 : W * .05) + '" y="' + H * .2 + '" width="' + (usd ? W * .48 : W - H * .8 - W * .05) + '" height="' + H * .6 + '" rx="6"/></clipPath>' +
      '<clipPath id="' + ids.pc + '"><ellipse cx="' + (usd ? W / 2 : W - H * .43) + '" cy="' + H * (usd ? .46 : .48) + '" rx="' + H * (usd ? .29 : .34) + '" ry="' + H * (usd ? .34 : .41) + '"/></clipPath>' +
      '</defs>';
    s += '<g clip-path="url(#' + ids.clip + ')">';
    s += '<rect width="' + W + '" height="' + H + '" fill="url(#' + ids.bg + ')"/>';
    s += '<path d="' + waves(W, H, usd ? 22 : 26, 2.2, 38) + '" fill="none" stroke="' + ink + '" stroke-opacity=".13" stroke-width=".45"/>';

    if (!usd) {
      // ----- CLP -----
      var pcx = W - H * .43, lz = (W - H * .8) / 2 + 2;
      var rcx = side === 'obv' ? lz : W - H * .55;
      s += '<g transform="translate(' + f1(rcx) + ' ' + f1(H * .56) + ')" fill="none" stroke="' + ink + '" stroke-width=".35">' +
           '<path d="' + rosette(H * .27, H * .06, 9, 10) + '" stroke-opacity=".5"/>' +
           '<path d="' + rosette(H * .15, H * .04, 7, 8) + '" stroke-opacity=".4"/></g>';
      s += '<rect x="3" y="3" width="' + (W - 6) + '" height="' + (H - 6) + '" rx="4" fill="none" stroke="' + ink + '" stroke-opacity=".55" stroke-width=".8"/>' +
           '<rect x="5.5" y="5.5" width="' + (W - 11) + '" height="' + (H - 11) + '" rx="3" fill="none" stroke="' + ink + '" stroke-opacity=".3" stroke-width=".5" stroke-dasharray="1.2 1"/>';
      if (side === 'obv') {
        s += '<ellipse cx="' + f1(pcx) + '" cy="' + f1(H * .48) + '" rx="' + f1(H * .34) + '" ry="' + f1(H * .41) + '" fill="' + light + '"/>';
        s += '<g clip-path="url(#' + ids.pc + ')"><g transform="translate(' + f1(pcx) + ' ' + f1(H * .48) + ')" fill="none" stroke="' + ink + '" stroke-width=".3" stroke-opacity=".3"><path d="' + rosette(H * .3, H * .1, 14, 6) + '"/></g>' +
             portraitEngrave(spec.fig, ink, light, pcx - H * .4, H * .08, H * .0082, ids, spec.faceFlip) + '</g>';
        s += '<ellipse cx="' + f1(pcx) + '" cy="' + f1(H * .48) + '" rx="' + f1(H * .34) + '" ry="' + f1(H * .41) + '" fill="none" stroke="' + ink + '" stroke-width="1.2"/>' +
             '<ellipse cx="' + f1(pcx) + '" cy="' + f1(H * .48) + '" rx="' + f1(H * .36) + '" ry="' + f1(H * .43) + '" fill="none" stroke="' + ink + '" stroke-width=".5" stroke-dasharray="1 1"/>';
        s += txt(lz, H * .27, spec.short, H * .2, ink, 'middle', 800);
        s += txt(lz, H * .57, 'CHILE', H * .1, ink, 'middle', 900, ' letter-spacing="3"');
        s += txt(lz, H * .74, spec.words, H * .06, ink, 'middle', 900, ' letter-spacing=".8"');
        s += txt(pcx, H * .965, spec.person.toUpperCase(), H * .05, ink, 'middle', 900, ' letter-spacing=".4"');
        s += sampleMark(lz, H * .88, H / 150);
      } else {
        var vw = W - H * .8 - W * .05;
        s += vignette(spec.scene, W * .05, H * .2, vw, H * .6, ink, light, ids.vig);
        s += '<rect x="' + f1(W * .05) + '" y="' + f1(H * .2) + '" width="' + f1(vw) + '" height="' + f1(H * .6) + '" rx="6" fill="none" stroke="' + ink + '" stroke-width="1"/>';
        s += txt(W - H * .4, H * .3, spec.short, H * .17, ink, 'middle', 800);
        s += txt(W - H * .4, H * .56, 'CHILE', H * .085, ink, 'middle', 900, ' letter-spacing="2.5"');
        s += txt(W * .05 + vw / 2, H * .13, spec.words, H * .06, ink, 'middle', 900, ' letter-spacing="1"');
        s += txt(W * .05 + vw / 2, H * .9, spec.place.toUpperCase(), H * .046, ink, 'middle', 900, ' letter-spacing=".2"');
        s += sampleMark(W - H * .4, H * .8, H / 140);
      }
    } else {
      // ----- USD -----
      s += '<rect x="4" y="4" width="' + (W - 8) + '" height="' + (H - 8) + '" fill="none" stroke="' + ink + '" stroke-width="2.4"/>' +
           '<rect x="8" y="8" width="' + (W - 16) + '" height="' + (H - 16) + '" fill="none" stroke="' + ink + '" stroke-width=".6"/>';
      s += '<path d="M4 4 H' + (W - 4) + 'V' + (H - 4) + 'H4Z" fill="none" stroke="' + ink + '" stroke-opacity=".35" stroke-width="5" stroke-dasharray="1 1.2"/>';
      [[22, 24], [W - 22, 24], [22, H - 18], [W - 22, H - 18]].forEach(function (c) {
        s += '<g transform="translate(' + f1(c[0]) + ' ' + f1(c[1]) + ')"><path d="' + rosette(11, 2.6, 8, 5) + '" fill="none" stroke="' + ink + '" stroke-width=".35" stroke-opacity=".6"/></g>' +
             txt(c[0], c[1] + 5.5, String(spec.num), spec.num >= 10 ? 13 : 15, ink, 'middle', 800);
      });
      if (side === 'obv') {
        var ux = W / 2;
        s += '<ellipse cx="' + ux + '" cy="' + f1(H * .46) + '" rx="' + f1(H * .29) + '" ry="' + f1(H * .34) + '" fill="' + light + '"/>';
        s += '<g clip-path="url(#' + ids.pc + ')"><g transform="translate(' + ux + ' ' + f1(H * .46) + ')" fill="none" stroke="' + ink + '" stroke-width=".3" stroke-opacity=".35"><path d="' + rosette(H * .26, H * .09, 16, 6) + '"/></g>' +
             portraitEngrave(spec.fig, ink, light, ux - H * .34, H * .13, H * .0068, ids, spec.faceFlip) + '</g>';
        s += '<ellipse cx="' + ux + '" cy="' + f1(H * .46) + '" rx="' + f1(H * .29) + '" ry="' + f1(H * .34) + '" fill="none" stroke="' + ink + '" stroke-width="1.6"/>';
        s += txt(ux, H * .13 + 2, 'THE UNITED STATES OF AMERICA', H * .075, ink, 'middle', 900, ' letter-spacing="1"');
        s += txt(ux, H * .955 - 2, spec.words, H * .075, ink, 'middle', 900, ' letter-spacing="1.4"');
        s += txt(ux, H * .865 - 2, spec.person.toUpperCase(), H * .048, ink, 'middle', 900, ' letter-spacing=".8"');
        // seals (simplified rings)
        s += '<g transform="translate(' + f1(W * .22) + ' ' + f1(H * .46) + ')"><circle r="' + f1(H * .14) + '" fill="none" stroke="#222" stroke-width="1.4"/><path d="' + rosette(H * .1, H * .02, 12, 3) + '" fill="none" stroke="#222" stroke-width=".4"/></g>';
        s += '<g transform="translate(' + f1(W * .78) + ' ' + f1(H * .46) + ')"><circle r="' + f1(H * .13) + '" fill="' + spec.seal + '" fill-opacity=".18" stroke="' + spec.seal + '" stroke-width="2" stroke-dasharray="1.4 .8"/><path d="M-6 -2 H6 M0 -8 V6 M-7 3 H7" stroke="' + spec.seal + '" stroke-width="1.4"/></g>';
        if (spec.num > 1) s += txt(W * .8, H * .9 - 2, String(spec.num), H * .24, accent, 'middle', 800, ' fill-opacity=".85"');
        s += sampleMark(W * .235, H * .8, H / 125);
      } else {
        s += vignette(spec.scene, W * .26, H * .2, W * .48, H * .6, ink, light, ids.vig);
        s += '<rect x="' + f1(W * .26) + '" y="' + f1(H * .2) + '" width="' + f1(W * .48) + '" height="' + f1(H * .6) + '" rx="6" fill="none" stroke="' + ink + '" stroke-width="1"/>';
        s += txt(W / 2, H * .15, 'IN GOD WE TRUST', H * .07, ink, 'middle', 900, ' letter-spacing="1"');
        s += txt(W / 2, H * .93, spec.words, H * .075, ink, 'middle', 900, ' letter-spacing="1.4"');
        s += txt(W / 2, H * .87 - 1, spec.place.toUpperCase(), H * .045, ink, 'middle', 900, ' letter-spacing=".5"');
        s += sampleMark(W * .15, H * .52, H / 120);
      }
    }
    s += '<rect width="' + W + '" height="' + H + '" fill="url(#mm-gloss)" opacity=".35"/>';
    s += '</g><rect x=".5" y=".5" width="' + (W - 1) + '" height="' + (H - 1) + '" rx="' + (usd ? 3 : 5) + '" fill="none" stroke="#000" stroke-opacity=".18"/>';
    return s + '</svg>';
  }
  function txt(x, y, t, size, fill, anchor, wt, extra) {
    return '<text x="' + f1(x) + '" y="' + f1(y) + '" text-anchor="' + anchor + '" font-family="Baloo 2, Nunito, sans-serif" font-weight="' + (wt || 800) + '" font-size="' + f1(size) + '" fill="' + fill + '"' + (extra || '') + '>' + t + '</text>';
  }

  // ---------------------------------------------------------------
  // SHOP ITEMS (64×64)
  // ---------------------------------------------------------------
  function item(id, px) {
    ensureDefs();
    var g = uid('i');
    var o = '<svg class="mm-svg-item" viewBox="0 0 64 64" width="' + (px || 56) + '" height="' + (px || 56) + '" aria-hidden="true" focusable="false"><defs>' +
      '<linearGradient id="' + g + 'a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>';
    o += '<ellipse cx="32" cy="58" rx="20" ry="3.2" fill="#000" opacity=".13"/>';
    var body = ITEM_ART[id] ? ITEM_ART[id](g) : ITEM_ART.apple(g);
    return o + body + '</svg>';
  }
  var ITEM_ART = {
    apple: function (g) {
      return '<path d="M32 18 C24 12 10 16 11 32 C12 46 22 57 30 55 C31.5 54.5 32.5 54.5 34 55 C42 57 52 46 53 32 C54 16 40 12 32 18 Z" fill="#d62f2f"/>' +
        '<path d="M32 18 C24 12 10 16 11 32 C12 46 22 57 30 55 C22 50 17 40 19 28 C20 22 26 18 32 18 Z" fill="#a61d1d" opacity=".6"/>' +
        '<path d="M32 19 C32 13 33 9 36 6" stroke="#5b3a1a" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
        '<path d="M35 12 C40 6 48 7 50 10 C46 15 40 15 35 12 Z" fill="#3f9b3a"/>' +
        '<ellipse cx="22" cy="27" rx="5" ry="8" fill="url(#' + g + 'a)" transform="rotate(20 22 27)"/>';
    },
    banana: function () {
      return '<path d="M10 22 C14 44 34 54 54 44 C56 43 56 40 54 40 C38 44 22 36 16 20 Z" fill="#f6cf34"/>' +
        '<path d="M16 20 C22 36 38 44 54 40 C42 46 24 42 14 26 Z" fill="#d9a514" opacity=".7"/>' +
        '<path d="M8 18 L16 20 L14 24 L9 22 Z" fill="#6b4a16"/><path d="M53 40 L57 41 L56 44 L53 44 Z" fill="#5a3d12"/>';
    },
    bread: function () {
      return '<path d="M8 40 C8 26 20 20 32 22 C44 20 56 26 56 40 C56 48 46 50 32 50 C18 50 8 48 8 40 Z" fill="#d99a4e"/>' +
        '<path d="M32 22 C30 30 30 42 32 50" stroke="#a7652a" stroke-width="2.4" fill="none"/>' +
        '<path d="M14 30 C18 24 26 23 30 25" stroke="#f6d39b" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<path d="M36 25 C42 23 50 25 52 31" stroke="#f6d39b" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<path d="M8 40 C8 48 18 50 32 50 C46 50 56 48 56 40 C50 46 14 46 8 40 Z" fill="#a8652c"/>';
    },
    milk: function () {
      return '<path d="M18 22 L32 12 L46 22 Z" fill="#e2e8f0"/><path d="M26 6 h12 v6 h-12 Z" fill="#1d4ed8"/>' +
        '<rect x="18" y="22" width="28" height="34" fill="#f8fafc"/><rect x="18" y="22" width="5" height="34" fill="#cbd5e1"/>' +
        '<rect x="18" y="36" width="28" height="12" fill="#2563eb"/><path d="M24 44 C27 38 30 38 32 42 C34 38 38 38 40 44" stroke="#fff" stroke-width="1.8" fill="none"/>' +
        '<path d="M18 22 L32 12 L32 22 Z" fill="#cbd5e1"/>';
    },
    juice: function () {
      return '<rect x="20" y="16" width="24" height="40" rx="3" fill="#f97316"/><rect x="20" y="16" width="6" height="40" rx="2" fill="#c2410c" opacity=".55"/>' +
        '<circle cx="34" cy="36" r="8" fill="#fde047"/><path d="M34 28 C36 24 40 24 41 26" stroke="#16a34a" stroke-width="2" fill="none"/>' +
        '<path d="M38 16 L42 4 L45 5" stroke="#e5e7eb" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
        '<rect x="22" y="18" width="20" height="6" fill="#fff" opacity=".25"/>';
    },
    pencil: function () {
      return '<g transform="rotate(-38 32 32)"><rect x="8" y="27" width="38" height="10" fill="#facc15"/><rect x="8" y="27" width="38" height="3.4" fill="#fde68a"/>' +
        '<rect x="8" y="33.6" width="38" height="3.4" fill="#ca8a04"/><path d="M46 27 L58 32 L46 37 Z" fill="#f5d0a9"/><path d="M54 30.4 L58 32 L54 33.6 Z" fill="#333"/>' +
        '<rect x="3" y="27" width="5" height="10" fill="#cbd5e1"/><rect x="-1" y="27" width="4" height="10" rx="1.5" fill="#f472b6"/></g>';
    },
    eraser: function () {
      return '<path d="M12 38 L36 22 L54 32 L30 48 Z" fill="#f9a8d4"/><path d="M12 38 L30 48 L30 54 L12 44 Z" fill="#db2777"/><path d="M30 48 L54 32 L54 38 L30 54 Z" fill="#ec4899"/>' +
        '<path d="M22 31.5 L40 42 L46 38 L28 27.6 Z" fill="#3b82f6"/>';
    },
    notebook: function () {
      var o = '<rect x="14" y="10" width="38" height="46" rx="3" fill="#059669"/><rect x="14" y="10" width="7" height="46" fill="#047857"/>' +
        '<rect x="26" y="18" width="20" height="9" rx="1.5" fill="#ecfdf5"/><path d="M28 22.5 h16" stroke="#94a3b8" stroke-width="1.2"/>';
      for (var i = 0; i < 6; i++) o += '<circle cx="17.5" cy="' + (15 + i * 7.4) + '" r="1.6" fill="#d1fae5"/>';
      return o + '<rect x="14" y="10" width="38" height="5" fill="#fff" opacity=".15"/>';
    },
    crayons: function () {
      var cols = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7'], o = '';
      cols.forEach(function (c, i) { o += '<rect x="' + (15 + i * 7) + '" y="' + (10 + (i % 2) * 3) + '" width="6" height="22" rx="1" fill="' + c + '"/><path d="M' + (15 + i * 7) + ' ' + (10 + (i % 2) * 3) + ' L' + (18 + i * 7) + ' ' + (5 + (i % 2) * 3) + ' L' + (21 + i * 7) + ' ' + (10 + (i % 2) * 3) + ' Z" fill="' + c + '"/>'; });
      return o + '<path d="M12 26 H52 L50 56 H14 Z" fill="#facc15"/><path d="M12 26 H52 L51.5 32 H12.5 Z" fill="#16a34a"/>' +
        '<path d="M22 40 C26 36 38 36 42 40 C38 46 26 46 22 40 Z" fill="#16a34a"/><rect x="12" y="26" width="5" height="30" fill="#ca8a04" opacity=".45"/>';
    },
    ball: function () {
      return '<circle cx="32" cy="32" r="22" fill="#f8fafc" stroke="#1f2937" stroke-width="1.4"/>' +
        '<path d="M32 22 L41 28.5 L37.5 39 H26.5 L23 28.5 Z" fill="#1f2937"/>' +
        '<path d="M32 22 V11 M41 28.5 L51 25 M37.5 39 L44 48 M26.5 39 L20 48 M23 28.5 L13 25" stroke="#1f2937" stroke-width="1.4"/>' +
        '<path d="M28 10.6 L36 10.6 L32 14 Z M53.6 29 L52 36 L49 30 Z M10.4 29 L12 36 L15 30 Z M38 53 L44.6 49.6 L40 46 Z M26 53 L19.4 49.6 L24 46 Z" fill="#1f2937"/>' +
        '<circle cx="32" cy="32" r="22" fill="url(#mm-gloss)" opacity=".7"/>';
    },
    car: function () {
      return '<path d="M8 42 L10 32 C11 30 13 29 16 29 L22 21 C23 20 25 19 27 19 H40 C43 19 45 20 46 22 L51 29 C54 29.5 56 31 56 34 V42 Z" fill="#dc2626"/>' +
        '<path d="M24 22 H32 V29 H19 Z M35 22 H41 C42 22 43 23 44 24 L47 29 H35 Z" fill="#bfdbfe"/>' +
        '<rect x="8" y="38" width="48" height="5" fill="#991b1b"/><rect x="50" y="32" width="5" height="3" fill="#fde047"/>' +
        '<circle cx="19" cy="44" r="6" fill="#1f2937"/><circle cx="19" cy="44" r="2.6" fill="#cbd5e1"/>' +
        '<circle cx="45" cy="44" r="6" fill="#1f2937"/><circle cx="45" cy="44" r="2.6" fill="#cbd5e1"/>' +
        '<path d="M12 31 C20 29 40 28 52 30" stroke="#fff" stroke-opacity=".35" stroke-width="2" fill="none"/>';
    },
    cookies: function () {
      var o = '<circle cx="30" cy="34" r="19" fill="#c98a45"/><circle cx="30" cy="34" r="19" fill="none" stroke="#9a6127" stroke-width="2"/>';
      [[22, 28], [34, 24], [38, 38], [26, 42], [31, 33], [20, 36]].forEach(function (p) { o += '<ellipse cx="' + p[0] + '" cy="' + p[1] + '" rx="2.6" ry="2" fill="#4a2a12"/>'; });
      return o + '<circle cx="46" cy="46" r="10" fill="#d99a52" stroke="#9a6127" stroke-width="1.6"/><ellipse cx="44" cy="44" rx="1.8" ry="1.4" fill="#4a2a12"/><ellipse cx="49" cy="48" rx="1.8" ry="1.4" fill="#4a2a12"/>' +
        '<ellipse cx="24" cy="25" rx="7" ry="4" fill="#fff" opacity=".18"/>';
    },
    stickers: function () {
      var o = '<rect x="12" y="10" width="40" height="46" rx="3" fill="#fff" stroke="#cbd5e1" stroke-width="1.4"/>';
      [[22, 22, '#f59e0b'], [42, 22, '#ef4444'], [22, 44, '#3b82f6'], [42, 44, '#10b981']].forEach(function (p) {
        var x = p[0], y = p[1];
        o += '<path d="M' + x + ' ' + (y - 7) + ' L' + (x + 2.2) + ' ' + (y - 2.3) + ' L' + (x + 7) + ' ' + (y - 2) + ' L' + (x + 3.4) + ' ' + (y + 1.4) + ' L' + (x + 4.4) + ' ' + (y + 6.4) + ' L' + x + ' ' + (y + 3.8) + ' L' + (x - 4.4) + ' ' + (y + 6.4) + ' L' + (x - 3.4) + ' ' + (y + 1.4) + ' L' + (x - 7) + ' ' + (y - 2) + ' L' + (x - 2.2) + ' ' + (y - 2.3) + ' Z" fill="' + p[2] + '"/>';
      });
      return o + '<path d="M44 56 L52 48 L52 56 Z" fill="#e2e8f0"/>';
    },
    empanada: function () {
      var o = '<path d="M8 42 C8 26 20 16 32 16 C44 16 56 26 56 42 Z" fill="#e0a85a"/>' +
        '<path d="M8 42 C8 32 14 24 22 20 C16 26 13 34 14 42 Z" fill="#fff" opacity=".2"/>';
      for (var i = 0; i < 9; i++) o += '<ellipse cx="' + (10 + i * 5.5) + '" cy="43" rx="3.4" ry="2.6" fill="#c7863b"/>';
      return o + '<path d="M8 42 H56 C54 48 46 50 32 50 C18 50 10 48 8 42 Z" fill="#b47330"/>';
    }
  };

  // ---------------------------------------------------------------
  // CASH REGISTER (320×190). The display has id `${id}-disp` lines.
  // ---------------------------------------------------------------
  function register(id) {
    ensureDefs();
    var g = id + 'g';
    var o = '<svg class="mm-svg-register" viewBox="0 0 320 196" aria-hidden="true" focusable="false"><defs>' +
      '<linearGradient id="' + g + 'b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4250"/><stop offset=".5" stop-color="#262c36"/><stop offset="1" stop-color="#171b22"/></linearGradient>' +
      '<linearGradient id="' + g + 'f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4efe4"/><stop offset="1" stop-color="#d9d0bd"/></linearGradient>' +
      '<linearGradient id="' + g + 'k" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fafafa"/><stop offset="1" stop-color="#c9ccd1"/></linearGradient>' +
      '<linearGradient id="' + g + 'd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#062b1b"/><stop offset="1" stop-color="#0b3d27"/></linearGradient>' +
      '<filter id="' + g + 'gl" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="1.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '</defs>';
    // customer display tower
    o += '<rect x="196" y="4" width="112" height="44" rx="7" fill="url(#' + g + 'b)"/>' +
         '<rect x="203" y="10" width="98" height="32" rx="4" fill="url(#' + g + 'd)" stroke="#000" stroke-opacity=".5"/>' +
         '<text id="' + id + '-d1" x="296" y="23" text-anchor="end" font-family="ui-monospace, Menlo, Consolas, monospace" font-weight="700" font-size="9" fill="#7dfcb4" filter="url(#' + g + 'gl)">TOTAL</text>' +
         '<text id="' + id + '-d2" x="296" y="37.5" text-anchor="end" font-family="ui-monospace, Menlo, Consolas, monospace" font-weight="700" font-size="13" fill="#9dffc8" filter="url(#' + g + 'gl)">0</text>' +
         '<rect x="203" y="10" width="98" height="9" rx="4" fill="#fff" opacity=".06"/>' +
         '<rect x="246" y="48" width="14" height="16" fill="url(#mm-chrome)"/>';
    // body
    o += '<path d="M14 70 C14 62 20 58 28 58 H292 C300 58 306 62 306 70 L314 150 H6 Z" fill="url(#' + g + 'f)"/>' +
         '<path d="M14 70 C14 62 20 58 28 58 H292 C300 58 306 62 306 70" fill="none" stroke="#fff" stroke-width="2" opacity=".8"/>' +
         '<path d="M6 150 H314 L314 156 H6 Z" fill="url(#mm-chrome)"/>';
    // receipt printer
    o += '<rect x="30" y="66" width="74" height="30" rx="5" fill="url(#' + g + 'b)"/>' +
         '<rect x="38" y="70" width="58" height="5" rx="2" fill="#0b0d10"/>' +
         '<path d="M42 72 H92 V44 C92 40 88 38 84 40 L46 46 C43 46.5 42 48 42 50 Z" fill="#fffdf6" stroke="#d8d2c4" stroke-width=".8"/>' +
         '<path d="M48 50 H84 M48 55 H78 M48 60 H86 M48 65 H72" stroke="#9ca3af" stroke-width="1.2"/>';
    // keypad
    var kx = 124, ky = 68;
    for (var r = 0; r < 4; r++) for (var c = 0; c < 5; c++) {
      var x = kx + c * 30, y = ky + r * 19;
      var special = c === 4;
      o += '<rect x="' + x + '" y="' + (y + 2) + '" width="26" height="15" rx="3.5" fill="#00000033"/>' +
           '<rect x="' + x + '" y="' + y + '" width="26" height="15" rx="3.5" fill="' + (special ? (r === 3 ? '#16a34a' : r === 2 ? '#dc2626' : '#f59e0b') : 'url(#' + g + 'k)') + '" stroke="#8b8f96" stroke-opacity=".5"/>' +
           '<rect x="' + (x + 2) + '" y="' + (y + 1.5) + '" width="22" height="4" rx="2" fill="#fff" opacity=".45"/>';
      if (!special) {
        var lbl = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '00', '.'][r * 3 + c];
        if (c < 3 && lbl) o += '<text x="' + (x + 13) + '" y="' + (y + 11) + '" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="8" fill="#374151">' + lbl + '</text>';
        if (c === 3) o += '<text x="' + (x + 13) + '" y="' + (y + 11) + '" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="900" font-size="6.5" fill="#374151">' + ['×', '−', '+', 'C'][r] + '</text>';
      }
    }
    // brand plate (generic) + keylock
    o += '<rect x="30" y="104" width="74" height="16" rx="3" fill="url(#mm-brass)"/>' +
         '<text x="67" y="115" text-anchor="middle" font-family="Baloo 2, Nunito, sans-serif" font-weight="800" font-size="8.5" fill="#4a3208" letter-spacing="1">MI TIENDA</text>' +
         '<circle cx="48" cy="134" r="6" fill="url(#mm-chrome)"/><rect x="47" y="130" width="2" height="8" rx="1" fill="#333"/>' +
         '<circle cx="86" cy="134" r="4" fill="#22c55e"/><circle cx="86" cy="134" r="4" fill="url(#mm-gloss)"/>';
    // drawer front
    o += '<path d="M2 158 H318 V186 C318 190 315 192 311 192 H9 C5 192 2 190 2 186 Z" fill="url(#' + g + 'b)"/>' +
         '<rect x="132" y="168" width="56" height="9" rx="4.5" fill="url(#mm-chrome)"/>' +
         '<path d="M2 158 H318" stroke="#fff" stroke-opacity=".18"/>';
    return o + '</svg>';
  }

  // ---------------------------------------------------------------
  // BALANCE SCALE (320×200). Beam & pans are groups the game rotates.
  // ---------------------------------------------------------------
  function scale(id) {
    ensureDefs();
    return '<svg class="mm-svg-scale" viewBox="0 0 320 210" aria-hidden="true" focusable="false">' +
      '<ellipse cx="160" cy="200" rx="70" ry="7" fill="#000" opacity=".12"/>' +
      '<path d="M112 196 C112 184 128 178 160 178 C192 178 208 184 208 196 Z" fill="url(#mm-brass)"/>' +
      '<rect x="154" y="44" width="12" height="138" rx="4" fill="url(#mm-brass)"/>' +
      '<rect x="157" y="44" width="3" height="138" fill="#fff" opacity=".35"/>' +
      '<g id="' + id + '-beam" class="mm-beam">' +
        '<path d="M34 46 H286 L282 54 H38 Z" fill="url(#mm-brass)" stroke="#7d5a16" stroke-width=".8"/>' +
        '<circle cx="160" cy="48" r="9" fill="url(#mm-brass)" stroke="#7d5a16"/><circle cx="160" cy="48" r="3" fill="#7d5a16"/>' +
        '<path d="M160 30 L154 44 H166 Z" fill="url(#mm-brass)"/>' +
      '</g>' +
      [['L', 44], ['R', 276]].map(function (p) {
        return '<g id="' + id + '-pan' + p[0] + '" class="mm-pan">' +
          '<path d="M' + p[1] + ' 50 L' + (p[1] - 40) + ' 120 M' + p[1] + ' 50 L' + (p[1] + 40) + ' 120" stroke="#8a6a2a" stroke-width="1.4"/>' +
          '<path d="M' + (p[1] - 48) + ' 120 H' + (p[1] + 48) + ' C' + (p[1] + 44) + ' 136 ' + (p[1] + 24) + ' 142 ' + p[1] + ' 142 C' + (p[1] - 24) + ' 142 ' + (p[1] - 44) + ' 136 ' + (p[1] - 48) + ' 120 Z" fill="url(#mm-brass)" stroke="#7d5a16" stroke-width=".8"/>' +
          '<ellipse cx="' + p[1] + '" cy="120" rx="48" ry="5" fill="#f8e7b0" stroke="#7d5a16" stroke-width=".8"/>' +
          '<circle cx="' + p[1] + '" cy="50" r="3" fill="#7d5a16"/></g>';
      }).join('') +
      '</svg>';
  }

  // ---------------------------------------------------------------
  // Small mode icons for the home screen (64×64)
  // ---------------------------------------------------------------
  function modeIcon(mode, cur, D) {
    ensureDefs();
    var c = function (v, px, side) { var sp = D.coinSpec(cur, v); return sp ? coin(sp, { px: px, side: side || 'rev' }) : ''; };
    var n = function (v, px, side) { var sp = D.noteSpec(cur, v); return sp ? note(sp, { px: px, side: side || 'obv' }) : ''; };
    var lo = cur === 'USD' ? [1, 5, 10, 25] : [10, 50, 100, 500];
    var bills = cur === 'USD' ? [100, 500, 1000, 2000] : [1000, 2000, 5000, 10000];
    var wrap = function (inner) { return '<span class="mm-mi">' + inner + '</span>'; };
    switch (mode) {
      case 'identify': return wrap('<span class="mm-mi-a">' + c(lo[3], 54, 'obv') + '</span><span class="mm-mi-lens"></span>');
      case 'count': return wrap('<span class="mm-mi-stack">' + c(lo[2], 40) + c(lo[3], 44) + c(lo[1], 40) + '</span>');
      case 'change': return wrap('<span class="mm-mi-reg">' + register('mmi' + _n++) + '</span>');
      case 'challenge': return wrap('<span class="mm-mi-fan">' + n(bills[2], 62) + n(bills[1], 62) + n(bills[0], 62) + '</span>');
      case 'fewest': return wrap('<span class="mm-mi-purse"></span><span class="mm-mi-in">' + c(lo[3], 30) + c(lo[2], 26) + '</span>');
      case 'budget': return wrap('<span class="mm-mi-item">' + item('bread', 40) + item('milk', 40) + '</span>');
      case 'compare': return wrap('<span class="mm-mi-scale">' + scale('mms' + _n++) + '</span>');
      case 'museum': return wrap('<span class="mm-mi-museum">' + n(bills[3], 70, 'obv') + '</span>');
    }
    return '';
  }

  window.MMArt = {
    ensureDefs: ensureDefs,
    coin: coin,
    note: note,
    item: item,
    register: register,
    scale: scale,
    modeIcon: modeIcon,
    METALS: METALS,
    ITEMS: Object.keys(ITEM_ART)
  };
})();
