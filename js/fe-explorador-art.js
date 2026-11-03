/* ================================================================
   FE EXPLORADOR — ART (js/fe-explorador-art.js)
   Hand-built SVG for the faith module. No images, no network.

   - saintPortrait(id)   stained-glass window of a saint with a
                         simple traditional attribute (keys, lily…)
   - rosary(state)       a wooden / glass-bead rosary on a chain with
                         centrepiece medal and crucifix; the bead being
                         prayed glows
   - prayerVignette(id)  small holy-card picture above each prayer
   - heritageScene(id)   illustration of each Chilean place/festival
                         the app describes (only what the text says)
   - icon(name)          tab icons
   Everything returns an SVG string; ids are made unique per call so
   several drawings can share a page.
   ================================================================ */

const FeArt = (() => {
  'use strict';

  let _uid = 0;
  const LEAD = '#211a16';

  // ── Saint looks ────────────────────────────────────────────────
  // robe / mantle colours follow each saint's habit or the usual
  // colours of their images; `attr` is the object drawn with them.
  // `sym` is the caption shown under the window ("Símbolo: …").
  const BLACK = '#2c3040', WHITE = '#f1ece0', BROWN = '#6e4a2c', FBROWN = '#7d5634';
  const SKIN = '#f0c9a4', SKIN2 = '#e2b48c', SKIN_DARK = '#9a6544';
  const SAINT_LOOKS = {
    benito:          { robe: BLACK, head: 'bald', hair: '#cfc8bb', beard: 'long', attr: 'rule', crosier: true, sym: 'el libro de su Regla y el báculo de abad' },
    francisco:       { robe: FBROWN, cord: true, head: 'tonsure', hair: '#6b4a2e', beard: 'short', attr: 'bird', sym: 'un pajarito, por su amor a las criaturas' },
    teresa_andes:    { robe: BROWN, mantle: WHITE, head: 'veil', veil: '#22232b', attr: 'crucifix', sym: 'el hábito carmelita y un crucifijo' },
    alberto_hurtado: { robe: BLACK, collar: true, head: 'short', hair: '#2e2620', attr: 'house', sym: 'una casita, por el Hogar de Cristo' },
    rosa_lima:       { robe: WHITE, mantle: BLACK, head: 'veil', veil: '#22232b', roses: true, attr: 'praying', sym: 'una corona de rosas' },
    martin_porres:   { robe: WHITE, mantle: BLACK, head: 'tonsure', hair: '#1f1a17', skin: SKIN_DARK, attr: 'broom', sym: 'la escoba, por su humildad' },
    ignacio_loyola:  { robe: BLACK, head: 'bald', hair: '#3a2d24', beard: 'short', attr: 'ihs', sym: 'un libro con el monograma IHS' },
    teresa_avila:    { robe: BROWN, mantle: WHITE, head: 'veil', veil: '#22232b', attr: 'quill', sym: 'la pluma y el libro, por sus escritos' },
    juan_bosco:      { robe: BLACK, collar: true, head: 'short', hair: '#2a221c', attr: 'balls', sym: 'pelotas de malabares, por sus juegos con los niños' },
    jose:            { robe: '#2f7a5e', mantle: '#c98a28', head: 'short', hair: '#5b3b22', beard: 'short', attr: 'lily', sym: 'un lirio blanco' },
    juan_dios:       { robe: '#2f2a28', head: 'short', hair: '#2f241c', beard: 'short', attr: 'pomegranate', sym: 'la granada con la cruz' },
    pablo:           { robe: '#2f7a4a', mantle: '#b3122e', head: 'bald', hair: '#3a2a20', beard: 'long', attr: 'sword', sym: 'la espada y el libro de sus cartas' },
    pedro:           { robe: '#2457a8', mantle: '#d39b22', head: 'curly', hair: '#e9e4da', beard: 'short', attr: 'keys', sym: 'las llaves' },
    juan_cruz:       { robe: BROWN, mantle: WHITE, head: 'hood', veil: BROWN, attr: 'cross', sym: 'una cruz' },
    tomas_aquino:    { robe: WHITE, mantle: BLACK, head: 'tonsure', hair: '#3a2a1e', attr: 'sun', sym: 'un sol en el pecho y un libro' },
    agustin:         { robe: WHITE, mantle: '#a8172f', orphrey: true, head: 'mitre', beard: 'short', hair: '#3a2a1e', attr: 'heart', crosier: true, sym: 'un corazón encendido y la mitra de obispo' },
    catalina_siena:  { robe: WHITE, mantle: BLACK, head: 'veil', veil: '#22232b', attr: 'lily', sym: 'el hábito dominico y un lirio' },
    jorge:           { robe: 'armor', mantle: '#b3122e', head: 'curly', hair: '#6b4426', attr: 'dragon', sym: 'el escudo con la cruz roja y el dragón' },
    ambrosio:        { robe: WHITE, mantle: '#c99a2a', orphrey: true, head: 'mitre', beard: 'short', hair: '#d8d2c6', attr: 'beehive', crosier: true, sym: 'una colmena y la mitra de obispo' },
    monica:          { robe: '#6d6158', head: 'veil', veil: '#3b3a40', attr: 'praying', sym: 'el velo y las manos en oración' },
    // added 2026-11 (namesake saints + kid favourites)
    emilia:          { robe: '#7a2f4a', mantle: '#2f6a8a', head: 'veil', veil: '#3b3a5a', attr: 'family', sym: 'cuatro pequeñas aureolas, por sus hijos santos' },
    rodrigo:         { robe: WHITE, mantle: '#a8172f', orphrey: true, head: 'short', hair: '#3a2a1e', beard: 'short', attr: 'palm', sym: 'la palma de los mártires y la casulla roja de sacerdote' },
    isabel:          { robe: '#2f6a4a', mantle: '#c98a28', head: 'veil', veil: '#7a2f4a', attr: 'baby', sym: 'el niño Juan Bautista en sus brazos' },
    santiago:        { robe: '#2f5a8a', mantle: '#8a4a2a', head: 'short', hair: '#5b3b22', beard: 'short', attr: 'shell', sym: 'la concha y el bastón de peregrino' },
    francisco_javier:{ robe: BLACK, head: 'short', hair: '#2a221c', beard: 'short', attr: 'ship', sym: 'un barco, por sus viajes de misionero' },
    clara:           { robe: BROWN, cord: true, head: 'veil', veil: '#22232b', attr: 'monstrance', sym: 'la custodia con la Eucaristía' },
    laura_vicuna:    { robe: '#2c3a6a', collar: true, head: 'girl', hair: '#3a2618', attr: 'andes', sym: 'la cordillera de los Andes, entre Chile y Argentina' },
    nicolas:         { robe: WHITE, mantle: '#a8172f', orphrey: true, head: 'mitre', hair: '#ece8df', beard: 'long', attr: 'gold', crosier: true, sym: 'el libro con tres bolas de oro y la mitra de obispo' },
    bernardita:      { robe: '#3b4f7a', head: 'veil', veil: '#efe9dc', attr: 'rosary', sym: 'el rosario y su pañuelo blanco' },
    juan_pablo:      { robe: WHITE, mantle: '#f6f3ec', head: 'zucchetto', hair: '#e9e4da', attr: 'ferula', sym: 'el báculo con la cruz y el solideo blanco del Papa' },
    teresa_lisieux:  { robe: BROWN, mantle: WHITE, head: 'veil', veil: '#22232b', attr: 'roses', sym: 'un crucifijo con rosas, por su «lluvia de rosas»' }
  };

  function saintSymbol(id) { return (SAINT_LOOKS[id] || {}).sym || ''; }
  function saintAttr(id) { return (SAINT_LOOKS[id] || {}).attr || ''; }

  function _shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const f = amt < 0 ? 0 : 255, t = Math.abs(amt);
    r = Math.round((f - r) * t + r); g = Math.round((f - g) * t + g); b = Math.round((f - b) * t + b);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  // Radial "light through glass" gradient for one colour.
  function _glass(id, c) {
    return '<radialGradient id="' + id + '" cx="40%" cy="30%" r="80%">' +
      '<stop offset="0" stop-color="' + _shade(c, 0.35) + '"/>' +
      '<stop offset="0.55" stop-color="' + c + '"/>' +
      '<stop offset="1" stop-color="' + _shade(c, -0.35) + '"/></radialGradient>';
  }

  function saintPortrait(id, opts) {
    opts = opts || {};
    const L = SAINT_LOOKS[id] || SAINT_LOOKS.jose;
    const u = 'sp' + (++_uid);
    const full = !!opts.full;
    const skin = L.skin || SKIN;
    const robe = L.robe === 'armor' ? '#b9c0cb' : L.robe;
    const S = 'stroke="' + LEAD + '" stroke-width="2.6" stroke-linejoin="round"';
    const s = [];

    s.push('<defs>' +
      '<linearGradient id="' + u + 'st" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e3d9c4"/><stop offset="0.5" stop-color="#bfb29a"/><stop offset="1" stop-color="#8d806b"/></linearGradient>' +
      '<radialGradient id="' + u + 'bg" cx="50%" cy="32%" r="75%"><stop offset="0" stop-color="#5d8ee0"/><stop offset="0.5" stop-color="#2a55ad"/><stop offset="1" stop-color="#132f72"/></radialGradient>' +
      '<radialGradient id="' + u + 'halo" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#fff3b8"/><stop offset="0.55" stop-color="#f0c040"/><stop offset="1" stop-color="#c2861a"/></radialGradient>' +
      '<radialGradient id="' + u + 'sk" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="' + _shade(skin, 0.25) + '"/><stop offset="1" stop-color="' + _shade(skin, -0.12) + '"/></radialGradient>' +
      _glass(u + 'robe', robe) +
      (L.mantle ? _glass(u + 'man', L.mantle) : '') +
      '<radialGradient id="' + u + 'lt" cx="50%" cy="20%" r="70%"><stop offset="0" stop-color="#fff" stop-opacity="0.32"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
      '<pattern id="' + u + 'q" width="20" height="28" patternUnits="userSpaceOnUse"><path d="M0 0 L20 28 M20 0 L0 28" stroke="' + LEAD + '" stroke-width="1.3" opacity="0.55"/></pattern>' +
      '<clipPath id="' + u + 'clip"><path d="M18 248 V102 A98 98 0 0 1 100 15 A98 98 0 0 1 182 102 V248 Z"/></clipPath>' +
      (full ? '<filter id="' + u + 'tex" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="' + (_uid % 9) + '"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.2 1"/><feComposite in2="SourceGraphic" operator="in"/></filter>' : '') +
      '</defs>');

    // Stone arch and blue quarry-glass background
    s.push('<path d="M6 258 V100 A112 112 0 0 1 100 4 A112 112 0 0 1 194 100 V258 Z" fill="url(#' + u + 'st)" stroke="#6f6454" stroke-width="1.5"/>');
    s.push('<g clip-path="url(#' + u + 'clip)">');
    s.push('<rect x="0" y="0" width="200" height="260" fill="url(#' + u + 'bg)"/>');
    // a few lighter / darker panes for the mottled look of old glass
    const panes = [[30, 120, '#4c7bd3'], [150, 150, '#1c418f'], [44, 196, '#22489a'], [150, 104, '#5a87dc'], [36, 160, '#183a84'], [156, 200, '#3e6cc4']];
    panes.forEach(p => s.push('<path d="M' + p[0] + ' ' + p[1] + ' l10 -14 l10 14 l-10 14 Z" fill="' + p[2] + '"/>'));
    s.push('<rect x="0" y="0" width="200" height="260" fill="url(#' + u + 'q)"/>');

    // Halo with leaded rays
    s.push('<circle cx="100" cy="84" r="35" fill="url(#' + u + 'halo)" ' + S + '/>');
    let rays = '';
    for (let i = 0; i < 16; i++) {
      const a = i * Math.PI / 8;
      rays += 'M' + (100 + Math.cos(a) * 25).toFixed(1) + ' ' + (84 + Math.sin(a) * 25).toFixed(1) + ' L' + (100 + Math.cos(a) * 35).toFixed(1) + ' ' + (84 + Math.sin(a) * 35).toFixed(1) + ' ';
    }
    s.push('<path d="' + rays + '" stroke="' + LEAD + '" stroke-width="1.2" opacity="0.7"/>');
    s.push('<circle cx="100" cy="84" r="25" fill="none" stroke="#b07812" stroke-width="1"/>');

    // Veil / hood behind the figure
    if (L.head === 'veil') s.push('<path d="M66 150 C60 104 66 58 100 54 C134 58 140 104 134 150 Z" fill="' + L.veil + '" ' + S + '/>');
    if (L.head === 'hood') s.push('<path d="M64 150 C58 108 62 70 100 42 C138 70 142 108 136 150 Z" fill="' + _shade(L.veil, -0.15) + '" ' + S + '/>');
    if (L.head === 'girl') s.push('<path d="M76 136 C70 112 74 70 100 62 C126 70 130 112 124 136 Q112 142 100 132 Q88 142 76 136 Z" fill="' + (L.hair || '#3a2618') + '" ' + S + '/>');
    if (L.crosier) s.push(_crosier());

    // Body: robe, mantle, details
    s.push('<path d="M56 252 C58 200 64 150 74 128 Q100 112 126 128 C136 150 142 200 144 252 Z" fill="url(#' + u + 'robe)" ' + S + '/>');
    if (L.robe === 'armor') {
      s.push('<path d="M80 132 Q100 126 120 132 L118 176 Q100 184 82 176 Z" fill="#d7dce4" stroke="' + LEAD + '" stroke-width="2"/>' +
             '<path d="M100 130 V180 M84 150 Q100 156 116 150" stroke="#7f8896" stroke-width="1.4" fill="none"/>' +
             '<path d="M76 190 H124 M72 212 H128 M68 234 H132" stroke="#7f8896" stroke-width="1.6"/>');
    } else {
      s.push('<path d="M92 150 Q88 200 92 250 M108 150 Q112 200 108 250 M78 170 Q74 210 72 250 M122 170 Q126 210 128 250" stroke="' + _shade(robe, -0.45) + '" stroke-width="1.3" fill="none" opacity="0.6"/>');
    }
    if (L.cord) s.push('<path d="M76 176 Q100 184 124 176" stroke="#efe6cf" stroke-width="3" fill="none"/><path d="M104 182 Q102 210 106 236" stroke="#efe6cf" stroke-width="2.4" fill="none"/><circle cx="105" cy="206" r="2.2" fill="#efe6cf"/>');
    if (L.mantle) {
      s.push('<path d="M52 252 C52 200 58 150 72 126 Q86 116 96 120 C88 150 84 200 86 252 Z" fill="url(#' + u + 'man)" ' + S + '/>');
      s.push('<path d="M148 252 C148 200 142 150 128 126 Q114 116 104 120 C112 150 116 200 114 252 Z" fill="url(#' + u + 'man)" ' + S + '/>');
      if (L.orphrey) s.push('<path d="M88 124 C82 160 80 210 82 252 M112 124 C118 160 120 210 118 252" stroke="#f0c040" stroke-width="6" fill="none"/><path d="M88 124 C82 160 80 210 82 252 M112 124 C118 160 120 210 118 252" stroke="' + LEAD + '" stroke-width="1" fill="none" stroke-dasharray="2 10"/>');
    }
    if (L.collar) s.push('<path d="M92 118 Q100 124 108 118 L107 124 Q100 128 93 124 Z" fill="#f4f1ea" stroke="' + LEAD + '" stroke-width="1.4"/>');

    // Neck + wimple + head
    s.push('<path d="M92 100 H108 V120 Q100 125 92 120 Z" fill="url(#' + u + 'sk)" ' + S + '/>');
    if (L.head === 'veil') {
      s.push('<path d="M80 90 C80 68 90 61 100 61 C110 61 120 68 120 90 L124 120 Q100 132 76 120 Z" fill="#f4f1ea" ' + S + '/>');
      s.push('<ellipse cx="100" cy="88" rx="14.5" ry="17.5" fill="url(#' + u + 'sk)" ' + S + '/>');
    } else {
      s.push('<ellipse cx="100" cy="86" rx="17" ry="20.5" fill="url(#' + u + 'sk)" ' + S + '/>');
    }
    s.push(_hairAndBeard(L, S));
    s.push(_face(L));
    if (L.head === 'veil') {
      s.push('<path d="M74 122 C70 96 72 64 100 56 C128 64 130 96 126 122 C123 108 121 94 119 84 C116 70 108 67 100 67 C92 67 84 70 81 84 C79 94 77 108 74 122 Z" fill="' + L.veil + '" ' + S + '/>');
    }
    if (L.head === 'hood') {
      s.push('<path d="M76 124 C70 94 76 62 100 48 C124 62 130 94 124 124 C121 106 120 92 117 82 C114 70 108 65 100 65 C92 65 86 70 83 82 C80 92 79 106 76 124 Z" fill="' + _shade(L.veil, 0.12) + '" ' + S + '/>' +
        '<path d="M84 80 C88 70 94 67 100 67 C106 67 112 70 116 80" stroke="' + _shade(L.veil, -0.4) + '" stroke-width="1.4" fill="none"/>');
    }
    if (L.roses) {
      let r = '';
      for (let i = 0; i < 7; i++) {
        const a = Math.PI * (1.12 + i * 0.127);
        const x = 100 + Math.cos(a) * 21, y = 80 + Math.sin(a) * 15;
        r += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="3.6" fill="#d6283f" stroke="' + LEAD + '" stroke-width="1"/><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="1.3" fill="#8e1022"/>';
      }
      s.push(r);
    }
    if (L.head === 'mitre') s.push(_mitre(S));

    s.push(_attribute(L.attr, S, u));

    // light across the glass, texture, jewel border
    s.push('<rect x="0" y="0" width="200" height="260" fill="url(#' + u + 'lt)"/>');
    if (full) s.push('<rect x="0" y="0" width="200" height="260" fill="#fff" opacity="0.10" filter="url(#' + u + 'tex)"/>');
    s.push('</g>');
    const arch = 'M18 248 V102 A98 98 0 0 1 100 15 A98 98 0 0 1 182 102 V248';
    s.push('<path d="' + arch + '" fill="none" stroke="#a8172f" stroke-width="9"/>');
    s.push('<path d="' + arch + '" fill="none" stroke="#e6b23a" stroke-width="9" stroke-dasharray="9 9"/>');
    s.push('<path d="' + arch + '" fill="none" stroke="' + LEAD + '" stroke-width="10.5" stroke-dasharray="1.4 7.6" stroke-dashoffset="-8.3"/>');
    s.push('<path d="M22.5 248 V102 A93.5 93.5 0 0 1 100 19.5 A93.5 93.5 0 0 1 177.5 102 V248" fill="none" stroke="' + LEAD + '" stroke-width="1.6"/>');
    s.push('<path d="M13.5 248 V102 A102.5 102.5 0 0 1 100 10.5 A102.5 102.5 0 0 1 186.5 102 V248" fill="none" stroke="' + LEAD + '" stroke-width="1.6"/>');
    // sill
    s.push('<rect x="2" y="246" width="196" height="12" rx="2" fill="url(#' + u + 'st)" stroke="#6f6454" stroke-width="1.2"/>');

    const label = opts.label ? ' aria-label="' + opts.label.replace(/"/g, '&quot;') + '"' : ' aria-hidden="true"';
    return '<svg class="fe-portrait" viewBox="0 0 200 260" role="img"' + label + ' xmlns="http://www.w3.org/2000/svg">' + s.join('') + '</svg>';
  }

  function _hairAndBeard(L, S) {
    const h = L.hair || '#4a3424';
    let o = '';
    if (L.head === 'short') o += '<path d="M83 86 C81 66 91 62 100 62 C110 62 119 66 117 86 C114 74 108 70 100 70 C92 70 86 74 83 86 Z" fill="' + h + '" ' + S + '/>';
    if (L.head === 'curly') {
      o += '<path d="M83 86 C80 70 86 63 92 64 C94 59 106 59 108 64 C114 63 120 70 117 86 C114 76 108 71 100 71 C92 71 86 76 83 86 Z" fill="' + h + '" ' + S + '/>';
      o += '<path d="M88 66 q3 3 6 0 M98 63 q3 3 6 0 M107 66 q3 3 6 0" stroke="' + _shade(h, -0.35) + '" stroke-width="1" fill="none"/>';
    }
    if (L.head === 'tonsure') o += '<path d="M83 90 C81 78 84 72 89 70 C93 75 107 75 111 70 C116 72 119 78 117 90 C115 82 112 79 108 78 L92 78 C88 79 85 82 83 90 Z" fill="' + h + '" ' + S + '/>';
    if (L.head === 'girl') {
      o += '<path d="M82 90 C80 70 90 62 100 62 C110 62 120 70 118 90 C114 78 108 74 100 76 C94 74 87 78 82 90 Z" fill="' + h + '" ' + S + '/>';
      o += '<path d="M115 71 l6 -5 l1 7 Z M115 71 l-1 -8 l-5 4 Z" fill="#f4f1ea" stroke="' + LEAD + '" stroke-width="1"/><circle cx="115" cy="70.5" r="1.6" fill="#f4f1ea" stroke="' + LEAD + '" stroke-width="0.8"/>';
    }
    if (L.head === 'zucchetto') {
      o += '<path d="M83.5 92 C82 84 84 79 88 77 L89 93 Z M116.5 92 C118 84 116 79 112 77 L111 93 Z" fill="' + h + '" stroke="' + LEAD + '" stroke-width="1.6"/>';
      o += '<path d="M86 72 C88 63 94 60 100 60 C106 60 112 63 114 72 Q100 67 86 72 Z" fill="#fbfaf5" ' + S + '/>';
    }
    if (L.head === 'bald' || L.head === 'mitre') o += '<path d="M83.5 92 C82 84 84 79 88 77 L89 93 Z M116.5 92 C118 84 116 79 112 77 L111 93 Z" fill="' + h + '" stroke="' + LEAD + '" stroke-width="1.6"/>';
    if (L.beard === 'short') o += '<path d="M84 92 C86 108 93 112 100 112 C107 112 114 108 116 92 C112 100 107 102 100 102 C93 102 88 100 84 92 Z" fill="' + h + '" ' + S + '/>';
    if (L.beard === 'long') o += '<path d="M84 92 C83 118 92 132 100 134 C108 132 117 118 116 92 C112 102 107 104 100 104 C93 104 88 102 84 92 Z" fill="' + h + '" ' + S + '/><path d="M96 108 Q97 122 99 130 M104 108 Q103 122 101 130" stroke="' + _shade(h, -0.3) + '" stroke-width="1" fill="none"/>';
    return o;
  }

  function _face(L) {
    const c = L.skin === SKIN_DARK ? '#3e2416' : '#6a3f2a';
    const y = L.head === 'veil' ? 2 : 0;
    return '<g stroke="' + c + '" stroke-width="1.15" fill="none" stroke-linecap="round" transform="translate(0 ' + y + ')">' +
      '<path d="M90 79 Q94 76.5 98 79 M102 79 Q106 76.5 110 79"/>' +
      '<path d="M91 85 Q94 87.2 97 85 M103 85 Q106 87.2 109 85"/>' +
      '<path d="M100 84 L98.4 93 Q100 94.2 101.8 93"/>' +
      '<path d="M96.5 99 Q100 101 103.5 99"/></g>';
  }

  function _mitre(S) {
    return '<path d="M83 72 L85 40 Q92 30 100 22 Q108 30 115 40 L117 72 Q100 66 83 72 Z" fill="#f3ead2" ' + S + '/>' +
      '<path d="M100 24 V68 M84 60 Q100 54 116 60" stroke="#e0a72e" stroke-width="5" fill="none"/>' +
      '<path d="M100 24 V68 M84 60 Q100 54 116 60" stroke="' + LEAD + '" stroke-width="0.9" fill="none"/>' +
      '<circle cx="100" cy="44" r="3.2" fill="#c0142f" stroke="' + LEAD + '" stroke-width="1"/>';
  }

  function _crosier() {
    return '<path d="M58 250 V108" stroke="#e7b844" stroke-width="5"/><path d="M58 250 V108" stroke="' + LEAD + '" stroke-width="1" opacity="0.6"/>' +
      '<path d="M58 110 C58 90 76 88 76 100 C76 108 66 110 64 102" fill="none" stroke="#e7b844" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M58 110 C58 90 76 88 76 100 C76 108 66 110 64 102" fill="none" stroke="' + LEAD + '" stroke-width="1" stroke-linecap="round"/>';
  }

  function _hand(x, y, r) {
    return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + (r || 6) + '" ry="' + ((r || 6) * 0.8) + '" fill="' + SKIN2 + '" stroke="' + LEAD + '" stroke-width="2"/>';
  }

  function _book(x, y, w, h, c, extra) {
    return '<g><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="2" fill="' + c + '" stroke="' + LEAD + '" stroke-width="2.2"/>' +
      '<rect x="' + (x + w - 4) + '" y="' + (y + 2) + '" width="3" height="' + (h - 4) + '" fill="#f2e7c9"/>' +
      '<rect x="' + (x + 3) + '" y="' + (y + 3) + '" width="' + (w - 9) + '" height="' + (h - 6) + '" rx="1" fill="none" stroke="#e8b84a" stroke-width="1"/>' + (extra || '') + '</g>';
  }

  function _attribute(a, S, u) {
    switch (a) {
      case 'rule':
        return '<path d="M70 150 L100 156 L130 150 L130 184 L100 190 L70 184 Z" fill="#f6efd9" ' + S + '/>' +
          '<path d="M100 156 V190" stroke="' + LEAD + '" stroke-width="1.6"/>' +
          '<text x="85.5" y="172" font-family="Georgia,serif" font-size="7" font-weight="700" fill="#8e1022" text-anchor="middle">ORA</text>' +
          '<text x="85.5" y="181" font-family="Georgia,serif" font-size="7" font-weight="700" fill="#8e1022" text-anchor="middle">ET</text>' +
          '<text x="114.5" y="176" font-family="Georgia,serif" font-size="5.4" font-weight="700" fill="#8e1022" text-anchor="middle" letter-spacing="-0.2">LABORA</text>' +
          '<path d="M76 186 L98 190 M102 190 L124 186" stroke="#c9b98f" stroke-width="0.8"/>' +
          _hand(70, 186) + _hand(130, 186);
      case 'bird':
        return _hand(100, 168) +
          '<path d="M128 156 Q134 128 140 122" stroke="' + FBROWN + '" stroke-width="10" stroke-linecap="round" fill="none"/>' + _hand(141, 120, 6.5) +
          '<g transform="translate(140 104)"><path d="M-12 4 C-8 -6 6 -8 12 -2 L18 -4 L14 2 C10 8 -4 10 -12 4 Z" fill="#f4f1ea" stroke="' + LEAD + '" stroke-width="1.8"/>' +
          '<path d="M-4 0 C0 -10 8 -12 10 -6" fill="#dcd6c8" stroke="' + LEAD + '" stroke-width="1.4"/><circle cx="9" cy="-2" r="1.1" fill="' + LEAD + '"/></g>';
      case 'crucifix':
        return '<path d="M100 132 V200 M86 148 H114" stroke="#5a3a20" stroke-width="7" stroke-linecap="square"/>' +
          '<path d="M100 132 V200 M86 148 H114" stroke="' + LEAD + '" stroke-width="1" fill="none"/>' +
          '<path d="M100 146 V172 M92 149 L100 152 L108 149" stroke="#efc04a" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="100" cy="143" r="2.4" fill="#efc04a"/>' +
          _hand(94, 186) + _hand(106, 182);
      case 'house':
        return '<path d="M80 166 L100 148 L120 166 Z" fill="#b3122e" ' + S + '/>' +
          '<rect x="84" y="166" width="32" height="24" fill="#e9c46a" ' + S + '/>' +
          '<rect x="96" y="176" width="8" height="14" fill="#6e4a2c" stroke="' + LEAD + '" stroke-width="1.4"/>' +
          '<path d="M100 140 V150 M96 144 H104" stroke="#f4f1ea" stroke-width="2.4"/>' +
          _hand(80, 190) + _hand(120, 190);
      case 'praying':
        return '<path d="M94 182 C92 168 96 150 100 146 C104 150 108 168 106 182 Z" fill="' + SKIN2 + '" ' + S + '/><path d="M100 148 V182" stroke="' + LEAD + '" stroke-width="1.2"/>';
      case 'broom':
        return '<path d="M142 120 L74 226" stroke="#a7763e" stroke-width="5" stroke-linecap="round"/><path d="M142 120 L74 226" stroke="' + LEAD + '" stroke-width="1" opacity="0.5"/>' +
          '<path d="M78 220 L56 244 L66 252 L84 230 Z" fill="#d8b45a" ' + S + '/><path d="M62 246 L80 226 M68 250 L83 229" stroke="#9a7a2c" stroke-width="1"/>' +
          _hand(128, 142) + _hand(104, 178);
      case 'ihs':
        return _book(80, 148, 40, 46, '#8e1022',
          '<circle cx="100" cy="171" r="12" fill="#f0c040" stroke="' + LEAD + '" stroke-width="1.2"/><text x="100" y="175" font-family="Georgia,serif" font-size="9" font-weight="700" fill="#8e1022" text-anchor="middle">IHS</text>') +
          _hand(80, 190) + _hand(120, 190);
      case 'quill':
        return _book(72, 156, 34, 42, '#8e1022') + _hand(76, 196) +
          '<path d="M126 176 C134 150 146 128 156 116 C150 132 142 156 130 178 Z" fill="#f7f4ec" ' + S + '/><path d="M128 178 L156 116" stroke="#b8b2a2" stroke-width="1"/>' +
          _hand(127, 180);
      case 'balls':
        return _hand(100, 172) + '<path d="M128 160 Q134 140 138 134" stroke="' + BLACK + '" stroke-width="10" stroke-linecap="round" fill="none"/>' + _hand(139, 132, 6.5) +
          '<path d="M136 126 Q148 96 160 112" stroke="#f0c040" stroke-width="1.2" fill="none" stroke-dasharray="2 3"/>' +
          '<circle cx="134" cy="112" r="6" fill="#d6283f" ' + S + '/><circle cx="148" cy="98" r="6" fill="#f0c040" ' + S + '/><circle cx="160" cy="112" r="6" fill="#2f9a5a" ' + S + '/>';
      case 'lily':
        return '<path d="M124 186 C126 160 128 130 130 100" stroke="#2f7a3a" stroke-width="3" fill="none"/>' +
          '<path d="M127 150 C118 146 114 138 116 132 C122 136 126 142 127 150 Z M128 130 C136 126 140 118 138 112 C132 116 129 122 128 130 Z" fill="#3f9a4a" stroke="' + LEAD + '" stroke-width="1.4"/>' +
          _lily(130, 98) + _lily(120, 116, 0.8) + _lily(139, 120, 0.75) + _hand(123, 188);
      case 'pomegranate':
        return '<circle cx="100" cy="166" r="16" fill="#c8402f" ' + S + '/><path d="M93 152 L96 145 L100 151 L104 145 L107 152 Z" fill="#c8402f" stroke="' + LEAD + '" stroke-width="1.6"/>' +
          '<path d="M100 145 V130 M94 136 H106" stroke="#f0c040" stroke-width="3"/><path d="M100 145 V130 M94 136 H106" stroke="' + LEAD + '" stroke-width="0.8"/>' +
          '<path d="M92 160 Q96 156 100 160" stroke="#f08a6a" stroke-width="2" fill="none"/>' + _hand(86, 180) + _hand(114, 180);
      case 'sword':
        return _book(64, 150, 30, 38, '#1f4fa8') + _hand(70, 188) +
          '<path d="M138 196 L138 252" stroke="#dfe4ea" stroke-width="7"/><path d="M138 196 L138 252" stroke="' + LEAD + '" stroke-width="1"/>' +
          '<path d="M126 196 H150" stroke="#e7b844" stroke-width="5" stroke-linecap="round"/><path d="M138 196 V180" stroke="#6e4a2c" stroke-width="5"/><circle cx="138" cy="178" r="4" fill="#e7b844" stroke="' + LEAD + '" stroke-width="1.2"/>' +
          _hand(138, 186);
      case 'keys':
        return _key(100, 170, -35, '#efc04a') + _key(100, 170, 35, '#d8dde6') + _hand(92, 184) + _hand(110, 184);
      case 'sun':
        let rays = '';
        for (let i = 0; i < 12; i++) {
          const a = i * Math.PI / 6;
          rays += 'M' + (100 + Math.cos(a) * 9).toFixed(1) + ' ' + (150 + Math.sin(a) * 9).toFixed(1) + ' L' + (100 + Math.cos(a) * 15).toFixed(1) + ' ' + (150 + Math.sin(a) * 15).toFixed(1) + ' ';
        }
        return '<path d="' + rays + '" stroke="#f0c040" stroke-width="2.6"/><circle cx="100" cy="150" r="9" fill="#f6d55c" stroke="' + LEAD + '" stroke-width="1.6"/>' +
          _book(112, 172, 30, 38, '#8e1022') + _hand(118, 208) + _hand(86, 186);
      case 'heart':
        return '<path d="M128 140 C124 130 132 124 136 132 C140 124 148 130 144 140 Q138 150 136 156 Q134 150 128 140 Z" fill="#c8102e" ' + S + '/>' +
          '<path d="M136 128 C130 118 136 110 136 104 C140 112 146 116 138 128 Z" fill="#f59e0b" stroke="' + LEAD + '" stroke-width="1.4"/>' +
          _hand(136, 162) + _book(80, 160, 30, 36, '#1f4fa8') + _hand(84, 194);
      case 'dragon':
        return '<path d="M60 150 Q60 186 80 200 Q100 186 100 150 Z" fill="#f4f1ea" ' + S + '/><path d="M80 154 V194 M64 168 H96" stroke="#c8102e" stroke-width="6"/>' +
          '<path d="M150 112 L112 246" stroke="#a7763e" stroke-width="4"/><path d="M150 112 L146 98 L156 106 Z" fill="#d8dde6" stroke="' + LEAD + '" stroke-width="1.4"/>' +
          _hand(136, 162) +
          '<g transform="translate(-6 -18)"><path d="M104 250 C110 228 130 222 142 232 C152 222 166 226 172 238 L164 244 C158 236 150 238 144 246 C136 240 120 242 112 252 Z" fill="#3f8a4a" ' + S + '/>' +
          '<path d="M164 236 l8 -2 l-3 5 Z" fill="#c8102e"/><circle cx="163" cy="233" r="1.6" fill="#f0c040" stroke="' + LEAD + '" stroke-width="0.6"/>' +
          '<path d="M120 236 l5 -10 l4 9 M132 230 l5 -10 l4 9 M144 228 l4 -8 l3 8" fill="#2f6a3a" stroke="' + LEAD + '" stroke-width="1.2"/>' +
          '<path d="M118 244 Q130 238 142 240" stroke="#8fc48a" stroke-width="1.2" fill="none"/></g>';
      case 'beehive':
        return '<path d="M118 186 C116 164 124 150 134 150 C144 150 152 164 150 186 Z" fill="#e0a72e" ' + S + '/>' +
          '<path d="M119 176 H149 M120 166 H148 M124 157 H144" stroke="#9a6a14" stroke-width="1.6"/><path d="M131 186 v-7 a3 3 0 0 1 6 0 v7" fill="#5a3a14"/>' +
          '<g fill="' + LEAD + '"><ellipse cx="156" cy="146" rx="2.4" ry="1.6"/><ellipse cx="146" cy="138" rx="2.4" ry="1.6"/></g>' +
          '<path d="M154 143 l2 -2 M144 135 l2 -2" stroke="#f4f1ea" stroke-width="1.2"/>' + _hand(122, 188) + _hand(146, 188);
      case 'family': {
        // four small haloed figures: her sons Basil, Gregory, Peter (bishops) and daughter Macrina
        const kids = [[70, '#a8172f', 'mitre'], [90, '#2457a8', 'mitre'], [110, '#3b3a40', 'veil'], [130, '#2f7a5e', 'mitre']];
        let o = _hand(66, 200) + _hand(134, 200);
        kids.forEach(k => {
          const x = k[0];
          o += '<circle cx="' + x + '" cy="219" r="9" fill="url(#' + u + 'halo)" stroke="' + LEAD + '" stroke-width="1.4"/>' +
            '<path d="M' + (x - 10) + ' 252 C' + (x - 10) + ' 238 ' + (x - 6) + ' 230 ' + x + ' 230 C' + (x + 6) + ' 230 ' + (x + 10) + ' 238 ' + (x + 10) + ' 252 Z" fill="' + k[1] + '" stroke="' + LEAD + '" stroke-width="1.6"/>';
          if (k[2] === 'veil') o += '<path d="M' + (x - 7) + ' 232 C' + (x - 8) + ' 218 ' + (x - 5) + ' 212 ' + x + ' 212 C' + (x + 5) + ' 212 ' + (x + 8) + ' 218 ' + (x + 7) + ' 232 Z" fill="#22232b" stroke="' + LEAD + '" stroke-width="1.2"/>';
          o += '<circle cx="' + x + '" cy="222" r="5.2" fill="' + SKIN + '" stroke="' + LEAD + '" stroke-width="1.2"/>';
          if (k[2] === 'mitre') o += '<path d="M' + (x - 4.5) + ' 218 L' + (x - 4) + ' 211 L' + x + ' 207 L' + (x + 4) + ' 211 L' + (x + 4.5) + ' 218 Z" fill="#f3ead2" stroke="' + LEAD + '" stroke-width="1"/>';
          if (k[2] === 'veil') o += '<path d="M' + (x - 5) + ' 219 C' + (x - 4) + ' 214 ' + (x + 4) + ' 214 ' + (x + 5) + ' 219" fill="none" stroke="#f4f1ea" stroke-width="1.6"/>';
        });
        return o;
      }
      case 'palm': {
        let o = '<path d="M122 186 Q136 150 154 106" stroke="#2f6a3a" stroke-width="3" fill="none" stroke-linecap="round"/>';
        for (let i = 0; i < 9; i++) {
          const t = 0.25 + i * 0.085, m = 1 - t;
          const x = m * m * 122 + 2 * m * t * 136 + t * t * 154, y = m * m * 186 + 2 * m * t * 150 + t * t * 106;
          const len = 15 - i * 0.9;
          o += '<path d="M' + x.toFixed(1) + ' ' + y.toFixed(1) + ' q' + (-len * 0.8).toFixed(1) + ' ' + (-len * 0.15).toFixed(1) + ' ' + (-len).toFixed(1) + ' ' + (len * 0.45).toFixed(1) + ' M' + x.toFixed(1) + ' ' + y.toFixed(1) + ' q' + (len * 0.75).toFixed(1) + ' ' + (len * 0.05).toFixed(1) + ' ' + (len * 0.95).toFixed(1) + ' ' + (len * 0.62).toFixed(1) + '" stroke="#3f9a4a" stroke-width="3.2" fill="none" stroke-linecap="round"/>';
        }
        o += '<path d="M146 122 l6 -14" stroke="#7cc27a" stroke-width="1.2"/>';
        return o + _hand(122, 186) + _hand(84, 182);
      }
      case 'baby':
        return '<g transform="rotate(-14 104 170)"><ellipse cx="106" cy="170" rx="22" ry="11" fill="#f6efdc" ' + S + '/>' +
          '<path d="M94 162 Q98 170 94 178 M106 160 Q110 170 106 180 M118 162 Q121 170 118 177" stroke="#c9b98f" stroke-width="1.3" fill="none"/></g>' +
          '<circle cx="82" cy="164" r="10.5" fill="url(#' + u + 'halo)" stroke="' + LEAD + '" stroke-width="1.4"/>' +
          '<circle cx="83" cy="166" r="7" fill="' + SKIN + '" stroke="' + LEAD + '" stroke-width="1.5"/>' +
          '<path d="M80.5 166 h1.2 M85 166 h1.2 M81.5 169.5 q1.5 1 3 0" stroke="#6a3f2a" stroke-width="0.9" fill="none" stroke-linecap="round"/>' +
          _hand(84, 184) + _hand(128, 170);
      case 'shell':
        return '<path d="M140 252 V112" stroke="#8a5a2c" stroke-width="5" stroke-linecap="round"/><path d="M140 252 V112" stroke="' + LEAD + '" stroke-width="1" opacity="0.5"/>' +
          '<path d="M141 132 q-6 2 -5 9 q1 7 6 7 q6 0 6 -7 q0 -6 -6 -7 q2 -4 0 -6 Z" fill="#d9a441" stroke="' + LEAD + '" stroke-width="1.3"/><path d="M140 126 q-3 -3 -1 -6" stroke="#8a5a2c" stroke-width="1.4" fill="none"/>' +
          _hand(140, 170) +
          '<path d="M100 166 L84 148 C86 136 114 136 116 148 Z" fill="#f6e7c4" ' + S + '/>' +
          '<path d="M100 166 L89 142 M100 166 L95 139 M100 166 L100 138 M100 166 L105 139 M100 166 L111 142" stroke="#b98a4a" stroke-width="1.3"/>' +
          '<path d="M95 166 h10 l-2 4 h-6 Z" fill="#e8cf9a" stroke="' + LEAD + '" stroke-width="1.2"/>' +
          _hand(80, 190);
      case 'ship':
        return '<g transform="translate(100 214) scale(1.3) translate(-100 -232)">' +
          '<path d="M100 236 V196" stroke="#6e4a2c" stroke-width="2.6"/>' +
          '<path d="M102 198 Q122 210 102 228 Z" fill="#f4f1ea" stroke="' + LEAD + '" stroke-width="1.6"/><path d="M107 206 V222 M102 213 H112" stroke="#b3122e" stroke-width="2"/>' +
          '<path d="M98 202 Q84 214 98 228 Z" fill="#ece6d6" stroke="' + LEAD + '" stroke-width="1.6"/>' +
          '<path d="M100 196 l8 3 l-8 3 Z" fill="#b3122e"/>' +
          '<path d="M72 232 H130 L122 246 H80 Z" fill="#8a5a2c" ' + S + '/><path d="M78 238 H124" stroke="#e7b844" stroke-width="1.4"/>' +
          '</g>' + _hand(68, 218) + _hand(132, 218);
      case 'monstrance': {
        let rays = '';
        for (let i = 0; i < 16; i++) {
          const a = i * Math.PI / 8, r2 = i % 2 ? 19 : 24;
          rays += 'M' + (100 + Math.cos(a) * 11).toFixed(1) + ' ' + (154 + Math.sin(a) * 11).toFixed(1) + ' L' + (100 + Math.cos(a) * r2).toFixed(1) + ' ' + (154 + Math.sin(a) * r2).toFixed(1) + ' ';
        }
        return '<path d="' + rays + '" stroke="#f0c040" stroke-width="3.4" stroke-linecap="round"/><path d="' + rays + '" stroke="' + LEAD + '" stroke-width="0.7"/>' +
          '<circle cx="100" cy="154" r="11" fill="#e7b844" stroke="' + LEAD + '" stroke-width="1.6"/><circle cx="100" cy="154" r="7" fill="#fbf8ee" stroke="' + LEAD + '" stroke-width="1"/>' +
          '<path d="M100 165 V194" stroke="#e7b844" stroke-width="4.5"/><path d="M100 165 V194" stroke="' + LEAD + '" stroke-width="0.8"/><circle cx="100" cy="178" r="3.4" fill="#e7b844" stroke="' + LEAD + '" stroke-width="1"/>' +
          '<path d="M86 200 Q100 190 114 200 Z" fill="#e7b844" ' + S + '/>' +
          '<path d="M100 130 V124 M97 127 H103" stroke="#f0c040" stroke-width="1.8"/>' +
          _hand(88, 194) + _hand(112, 194);
      }
      case 'andes':
        return '<path d="M94 182 C92 168 96 150 100 146 C104 150 108 168 106 182 Z" fill="' + SKIN2 + '" ' + S + '/><path d="M100 148 V182" stroke="' + LEAD + '" stroke-width="1.2"/>' +
          '<path d="M0 252 V226 L26 204 L44 220 L70 194 L96 224 L118 200 L144 222 L170 198 L200 222 V252 Z" fill="#6f7f9a" ' + S + '/>' +
          '<path d="M60 204 L70 194 L80 205 L74 202 L70 207 L65 202 Z M110 208 L118 200 L127 209 L121 206 L117 211 L114 206 Z M162 206 L170 198 L178 206 L173 204 L170 208 L166 204 Z M20 209 L26 204 L32 210 L26 208 Z" fill="#f7f9fc" stroke="' + LEAD + '" stroke-width="1"/>' +
          '<path d="M0 252 V240 Q50 230 100 238 T200 236 V252 Z" fill="#4f7a4a" stroke="' + LEAD + '" stroke-width="1.6"/>';
      case 'gold':
        return _book(82, 160, 36, 34, '#1f4fa8') +
          [[91, 154], [109, 154], [100, 145]].map(p => '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="6" fill="url(#' + u + 'halo)" stroke="' + LEAD + '" stroke-width="1.4"/><circle cx="' + (p[0] - 2) + '" cy="' + (p[1] - 2) + '" r="1.6" fill="#fff8d0"/>').join('') +
          _hand(84, 196) + _hand(116, 196);
      case 'rosary': {
        let o = '<path d="M94 182 C92 168 96 150 100 146 C104 150 108 168 106 182 Z" fill="' + SKIN2 + '" ' + S + '/><path d="M100 148 V182" stroke="' + LEAD + '" stroke-width="1.2"/>';
        o += '<path d="M96 180 C84 196 88 213 100 214 C112 213 116 196 104 180" stroke="#cfc8b8" stroke-width="0.9" fill="none"/>';
        for (let i = 0; i <= 12; i++) {
          const a = -0.5 + i * (Math.PI + 1) / 12;
          const x = 100 + Math.cos(a) * 12.5, y = 197 + Math.sin(a) * 17;
          o += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="2" fill="#f4f1ea" stroke="' + LEAD + '" stroke-width="0.7"/>';
        }
        o += '<path d="M100 214 V230 M95 220 H105" stroke="#d8dde6" stroke-width="2.4"/><path d="M100 214 V230 M95 220 H105" stroke="' + LEAD + '" stroke-width="0.6"/>';
        return o;
      }
      case 'ferula':
        return '<path d="M140 252 V112" stroke="#d8dde6" stroke-width="4.5"/><path d="M140 252 V112" stroke="' + LEAD + '" stroke-width="1"/>' +
          '<path d="M140 100 V128 M130 108 H150" stroke="#d8dde6" stroke-width="5" stroke-linecap="square"/><path d="M140 100 V128 M130 108 H150" stroke="' + LEAD + '" stroke-width="1" fill="none"/>' +
          '<path d="M140 106 V122 M134 109 L140 111 L146 109" stroke="#8a8f98" stroke-width="1.8" fill="none" stroke-linecap="round"/><circle cx="140" cy="104" r="1.6" fill="#8a8f98"/>' +
          '<path d="M100 128 V146 M95 134 H105" stroke="#e7b844" stroke-width="2.4"/>' +
          _hand(140, 172) + _hand(86, 186);
      case 'roses': {
        let o = '<g transform="rotate(-24 100 170)"><path d="M100 134 V206 M88 150 H112" stroke="#5a3a20" stroke-width="6" stroke-linecap="square"/><path d="M100 134 V206 M88 150 H112" stroke="' + LEAD + '" stroke-width="1" fill="none"/>' +
          '<path d="M100 148 V170 M93 151 L100 154 L107 151" stroke="#efc04a" stroke-width="2.2" fill="none" stroke-linecap="round"/></g>';
        [[84, 184], [96, 190], [108, 186], [90, 196], [104, 199], [116, 194]].forEach((p, i) => {
          o += '<path d="M' + (p[0] - 5) + ' ' + (p[1] + 4) + ' q-4 4 -2 8 M' + (p[0] + 4) + ' ' + (p[1] + 4) + ' q5 2 5 7" stroke="#2f7a3a" stroke-width="2.4" fill="none"/>';
          o += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="5.4" fill="' + (i % 2 ? '#c8102e' : '#e0405a') + '" stroke="' + LEAD + '" stroke-width="1.1"/><path d="M' + (p[0] - 2.5) + ' ' + p[1] + ' q2.5 -3 5 0 q-2.5 3 -5 0" stroke="#7a0a1e" stroke-width="0.9" fill="none"/>';
        });
        return o + _hand(80, 200) + _hand(120, 200);
      }
      case 'cross':
        return '<path d="M100 128 V214 M84 148 H116" stroke="#7a5230" stroke-width="7" stroke-linecap="square"/><path d="M100 128 V214 M84 148 H116" stroke="' + LEAD + '" stroke-width="1" fill="none"/>' + _hand(94, 192) + _hand(106, 188);
      default:
        return _hand(94, 172) + _hand(106, 172);
    }
  }

  function _lily(x, y, k) {
    k = k || 1;
    let p = '';
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3 - Math.PI / 2;
      const px = x + Math.cos(a) * 7 * k, py = y + Math.sin(a) * 7 * k;
      p += '<ellipse cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" rx="' + (2.6 * k).toFixed(1) + '" ry="' + (5 * k).toFixed(1) + '" transform="rotate(' + (i * 60) + ' ' + px.toFixed(1) + ' ' + py.toFixed(1) + ')" fill="#fbf8f0" stroke="' + LEAD + '" stroke-width="1.1"/>';
    }
    return p + '<circle cx="' + x + '" cy="' + y + '" r="' + (2 * k).toFixed(1) + '" fill="#f0c040"/>';
  }

  function _key(cx, cy, rot, c) {
    return '<g transform="rotate(' + rot + ' ' + cx + ' ' + cy + ')">' +
      '<rect x="' + (cx - 2.5) + '" y="' + (cy - 34) + '" width="5" height="52" fill="' + c + '" stroke="' + LEAD + '" stroke-width="1.4"/>' +
      '<circle cx="' + cx + '" cy="' + (cy + 24) + '" r="8" fill="none" stroke="' + c + '" stroke-width="4.5"/><circle cx="' + cx + '" cy="' + (cy + 24) + '" r="8" fill="none" stroke="' + LEAD + '" stroke-width="0.8"/>' +
      '<path d="M' + (cx + 2) + ' ' + (cy - 32) + ' h9 v5 h-5 v4 h5 v5 h-9" fill="' + c + '" stroke="' + LEAD + '" stroke-width="1.4"/></g>';
  }

  // ── Rosary ─────────────────────────────────────────────────────
  // Geometry is computed once: a loop of 4 cubic Béziers sampled by
  // arc length, the centrepiece medal at the bottom of the loop and
  // the pendant hanging below it.
  const LOOP = [
    [[200, 330], [130, 322], [30, 262], [30, 175]],
    [[30, 175], [30, 80], [110, 20], [200, 20]],
    [[200, 20], [290, 20], [370, 80], [370, 175]],
    [[370, 175], [370, 262], [270, 322], [200, 330]]
  ];
  function _bz(p, t) {
    const m = 1 - t;
    return [
      m * m * m * p[0][0] + 3 * m * m * t * p[1][0] + 3 * m * t * t * p[2][0] + t * t * t * p[3][0],
      m * m * m * p[0][1] + 3 * m * m * t * p[1][1] + 3 * m * t * t * p[2][1] + t * t * t * p[3][1]
    ];
  }
  let _geo = null;
  function _geometry() {
    if (_geo) return _geo;
    const pts = [];
    LOOP.forEach((seg, si) => { for (let i = (si ? 1 : 0); i <= 200; i++) pts.push(_bz(seg, i / 200)); });
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const total = cum[cum.length - 1];
    const at = d => {
      let lo = 0, hi = cum.length - 1;
      while (lo < hi - 1) { const mid = (lo + hi) >> 1; if (cum[mid] < d) lo = mid; else hi = mid; }
      const f = (d - cum[lo]) / ((cum[hi] - cum[lo]) || 1);
      return [pts[lo][0] + (pts[hi][0] - pts[lo][0]) * f, pts[lo][1] + (pts[hi][1] - pts[lo][1]) * f];
    };
    // Loop beads, clockwise from the medal up the left side:
    // decade 1 (10 small), large, decade 2, large, … decade 5.
    const gap = 26, BIG = 1.65;
    const units = 50 + 4 * BIG;
    const unit = (total - 2 * gap) / units;
    const loop = [];  // {x,y,r,kind:'s'|'L', decade, idx}
    let d = gap + unit / 2;
    for (let dec = 0; dec < 5; dec++) {
      for (let i = 0; i < 10; i++) {
        const p = at(d);
        loop.push({ x: p[0], y: p[1], r: unit * 0.37, kind: 's', decade: dec, idx: i, dist: d });
        d += unit;
      }
      if (dec < 4) {
        d += (BIG - 1) / 2 * unit;
        const p = at(d);
        loop.push({ x: p[0], y: p[1], r: unit * 0.56, kind: 'L', decade: dec + 1, idx: -1, dist: d });
        d += (BIG + 1) / 2 * unit;
      }
    }
    // Gloria markers: on the chain just after each decade's 10th bead.
    const gloria = [];
    for (let dec = 0; dec < 5; dec++) {
      const tenth = loop.find(b => b.decade === dec && b.idx === 9);
      const p = at(Math.min(tenth.dist + unit * (dec < 4 ? 0.82 : 0.9), total - 6));
      gloria.push({ x: p[0], y: p[1] });
    }
    const ur = unit * 0.37, Lr = unit * 0.56;
    const pendant = {
      L2: { x: 200, y: 372, r: Lr },
      s: [{ x: 200, y: 400, r: ur }, { x: 200, y: 418, r: ur }, { x: 200, y: 436, r: ur }],
      gloria: { x: 200, y: 452 },
      L1: { x: 200, y: 470, r: Lr },
      cross: { x: 200, y: 492 }
    };
    _geo = { pts, total, loop, gloria, pendant, unit, at };
    return _geo;
  }

  function _beadDefs(u, mat) {
    if (mat === 'cristal') {
      return '<radialGradient id="' + u + 'b" cx="34%" cy="30%" r="75%"><stop offset="0" stop-color="#f6fbff"/><stop offset="0.25" stop-color="#bcd6f7"/><stop offset="0.7" stop-color="#5b8fd6"/><stop offset="1" stop-color="#2a4f94"/></radialGradient>' +
             '<radialGradient id="' + u + 'bL" cx="34%" cy="30%" r="75%"><stop offset="0" stop-color="#ffffff"/><stop offset="0.3" stop-color="#cfe2fa"/><stop offset="0.75" stop-color="#4f83cf"/><stop offset="1" stop-color="#21437f"/></radialGradient>';
    }
    return '<radialGradient id="' + u + 'b" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#d9a26a"/><stop offset="0.45" stop-color="#9a6332"/><stop offset="1" stop-color="#4b2a12"/></radialGradient>' +
           '<radialGradient id="' + u + 'bL" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#e0ad78"/><stop offset="0.45" stop-color="#8f5a2c"/><stop offset="1" stop-color="#3f230f"/></radialGradient>';
  }

  function _bead(b, u, mat, state, attrs) {
    const fill = b.kind === 'L' ? 'url(#' + u + 'bL)' : 'url(#' + u + 'b)';
    let o = '<g class="fe-bead' + (state ? ' is-' + state : '') + '"' + (attrs || '') + '>';
    if (state === 'current') {
      o += '<circle class="fe-bead-glow" cx="' + b.x.toFixed(1) + '" cy="' + b.y.toFixed(1) + '" r="' + (b.r * 3.4).toFixed(1) + '" fill="url(#' + u + 'glow)"/>';
      b = Object.assign({}, b, { r: b.r * 1.28 });
    }
    // a larger invisible hit area for taps
    o += '<circle cx="' + b.x.toFixed(1) + '" cy="' + b.y.toFixed(1) + '" r="' + Math.max(b.r + 3, 9).toFixed(1) + '" fill="transparent"/>';
    o += '<circle cx="' + (b.x + b.r * 0.18).toFixed(1) + '" cy="' + (b.y + b.r * 0.28).toFixed(1) + '" r="' + b.r.toFixed(1) + '" fill="#000" opacity="0.22"/>';
    o += '<circle cx="' + b.x.toFixed(1) + '" cy="' + b.y.toFixed(1) + '" r="' + b.r.toFixed(1) + '" fill="' + fill + '"' +
      (mat === 'cristal' ? ' fill-opacity="0.95"' : '') + ' stroke="' + (state === 'current' ? '#f6c64a' : (state === 'done' ? '#d9a63a' : (mat === 'cristal' ? '#2a4f94' : '#3a200c'))) + '" stroke-width="' + (state === 'current' ? 1.8 : (state === 'done' ? 1.1 : 0.6)) + '"/>';
    if (mat !== 'cristal') {
      o += '<path d="M' + (b.x - b.r * 0.8).toFixed(1) + ' ' + (b.y + b.r * 0.1).toFixed(1) + ' Q' + b.x.toFixed(1) + ' ' + (b.y + b.r * 0.5).toFixed(1) + ' ' + (b.x + b.r * 0.8).toFixed(1) + ' ' + (b.y + b.r * 0.15).toFixed(1) + '" stroke="#3a200c" stroke-width="0.5" fill="none" opacity="0.45"/>';
    } else {
      o += '<circle cx="' + (b.x + b.r * 0.35).toFixed(1) + '" cy="' + (b.y + b.r * 0.4).toFixed(1) + '" r="' + (b.r * 0.28).toFixed(1) + '" fill="#e8f2ff" opacity="0.55"/>';
    }
    if (state === 'current') o += '<circle cx="' + b.x.toFixed(1) + '" cy="' + b.y.toFixed(1) + '" r="' + (b.r * 0.62).toFixed(1) + '" fill="#ffe9a8" opacity="0.45"/>';
    o += '<ellipse cx="' + (b.x - b.r * 0.33).toFixed(1) + '" cy="' + (b.y - b.r * 0.38).toFixed(1) + '" rx="' + (b.r * 0.34).toFixed(1) + '" ry="' + (b.r * 0.22).toFixed(1) + '" fill="#fff" opacity="' + (mat === 'cristal' ? 0.9 : 0.55) + '" transform="rotate(-30 ' + (b.x - b.r * 0.33).toFixed(1) + ' ' + (b.y - b.r * 0.38).toFixed(1) + ')"/>';
    return o + '</g>';
  }

  function _chainPath(d) {
    return '<path d="' + d + '" fill="none" stroke="#5f646e" stroke-width="3.2" stroke-linecap="round"/>' +
           '<path d="' + d + '" fill="none" stroke="#c9ced8" stroke-width="2.2" stroke-dasharray="3.4 1.6" stroke-linecap="round"/>' +
           '<path d="' + d + '" fill="none" stroke="#f7f9fc" stroke-width="0.7" stroke-dasharray="1.6 3.4" stroke-linecap="round"/>';
  }

  // st: { mat:'madera'|'cristal', phase:'intro'|'decade'|'salve',
  //       introStep, decade, step }
  // Intro steps: 0 Señal de la Cruz, 1 Credo (crucifix), 2 Padre
  // Nuestro (first large bead), 3–5 Ave María ×3, 6 Gloria (chain).
  // Decade steps: 0 Padre Nuestro (large bead), 1–10 Ave María, 11 Gloria.
  function rosary(st) {
    const g = _geometry();
    const u = 'ro' + (++_uid);
    const mat = st.mat === 'cristal' ? 'cristal' : 'madera';
    const o = [];
    o.push('<defs>' + _beadDefs(u, mat) +
      '<radialGradient id="' + u + 'glow"><stop offset="0" stop-color="#fffbe6" stop-opacity="1"/><stop offset="0.3" stop-color="#fde68a" stop-opacity="0.9"/><stop offset="0.6" stop-color="#fbbf24" stop-opacity="0.45"/><stop offset="1" stop-color="#f59e0b" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="' + u + 'met" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3f5f9"/><stop offset="0.45" stop-color="#b9bfca"/><stop offset="0.7" stop-color="#e2e6ec"/><stop offset="1" stop-color="#7d838f"/></linearGradient>' +
      '<linearGradient id="' + u + 'gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff1b0"/><stop offset="0.45" stop-color="#d6a632"/><stop offset="0.75" stop-color="#f3d06a"/><stop offset="1" stop-color="#9a6d14"/></linearGradient>' +
      '<filter id="' + u + 'sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="1.5" dy="2.5" stdDeviation="2" flood-color="#2a1a0a" flood-opacity="0.3"/></filter>' +
      '</defs>');

    // Chain: the loop (gap at the medal) and the pendant
    let d = '';
    g.pts.forEach((p, i) => { d += (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); });
    o.push('<g filter="url(#' + u + 'sh)">');
    o.push(_chainPath(d));
    o.push(_chainPath('M200 344 V490'));

    const P = g.pendant;
    const cur = st.phase;
    const isCur = (ph, a, b) => cur === ph && a === b;

    // Loop beads
    g.loop.forEach(b => {
      let state = '';
      if (b.kind === 's') {
        const step = b.idx + 1;
        if (cur === 'decade' && st.decade === b.decade && st.step === step) state = 'current';
        else if (cur === 'salve' || (cur === 'decade' && (st.decade > b.decade || (st.decade === b.decade && st.step > step)))) state = 'done';
        o.push(_bead(b, u, mat, state, ' data-bead="d' + b.decade + '-' + step + '"'));
      } else {
        if (cur === 'decade' && st.decade === b.decade && st.step === 0) state = 'current';
        else if (cur === 'salve' || (cur === 'decade' && st.decade >= b.decade && !(st.decade === b.decade && st.step === 0))) state = 'done';
        o.push(_bead(b, u, mat, state, ' data-bead="d' + b.decade + '-0"'));
      }
    });
    // Pendant: L2 is the first decade's Padre Nuestro
    {
      let state = '';
      if (cur === 'decade' && st.decade === 0 && st.step === 0) state = 'current';
      else if (cur === 'salve' || (cur === 'decade' && !(st.decade === 0 && st.step === 0))) state = 'done';
      o.push(_bead(Object.assign({ kind: 'L' }, P.L2), u, mat, state, ' data-bead="d0-0"'));
    }
    P.s.forEach((b, i) => {
      const step = 5 - i; // nearest the cross is the first Ave María
      let state = isCur('intro', st.introStep, step) ? 'current' : (cur === 'intro' && st.introStep > step ? 'done' : '');
      o.push(_bead(Object.assign({ kind: 's' }, b), u, mat, state, ' data-bead="i' + step + '"'));
    });
    o.push(_bead(Object.assign({ kind: 'L' }, P.L1), u, mat,
      isCur('intro', st.introStep, 2) ? 'current' : (cur === 'intro' && st.introStep > 2 ? 'done' : ''), ' data-bead="i2"'));

    // Gloria sparks on the chain
    const spark = (x, y, on, key) => '<g class="fe-gloria' + (on ? ' is-current' : '') + '" data-bead="' + key + '">' +
      (on ? '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="16" fill="url(#' + u + 'glow)" class="fe-bead-glow"/>' : '') +
      '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="9" fill="transparent"/>' +
      '<path d="M' + x.toFixed(1) + ' ' + (y - 5).toFixed(1) + ' L' + (x + 1.3).toFixed(1) + ' ' + (y - 1.3).toFixed(1) + ' L' + (x + 5).toFixed(1) + ' ' + y.toFixed(1) + ' L' + (x + 1.3).toFixed(1) + ' ' + (y + 1.3).toFixed(1) + ' L' + x.toFixed(1) + ' ' + (y + 5).toFixed(1) + ' L' + (x - 1.3).toFixed(1) + ' ' + (y + 1.3).toFixed(1) + ' L' + (x - 5).toFixed(1) + ' ' + y.toFixed(1) + ' L' + (x - 1.3).toFixed(1) + ' ' + (y - 1.3).toFixed(1) + ' Z" fill="' + (on ? '#fbbf24' : '#e9d9a8') + '" opacity="' + (on ? 1 : 0.75) + '"/></g>';
    g.gloria.forEach((p, dec) => o.push(spark(p.x, p.y, cur === 'decade' && st.decade === dec && st.step === 11, 'd' + dec + '-11')));
    o.push(spark(P.gloria.x + 12, P.gloria.y, isCur('intro', st.introStep, 6), 'i6'));

    // Centrepiece medal: oval with a crowned "M" and cross
    const medalOn = cur === 'salve';
    o.push('<g class="fe-medal' + (medalOn ? ' is-current' : '') + '" data-bead="salve">' +
      (medalOn ? '<circle cx="200" cy="338" r="40" fill="url(#' + u + 'glow)" class="fe-bead-glow"/>' : '') +
      '<ellipse cx="200" cy="338" rx="19" ry="24" fill="url(#' + u + 'met)" stroke="#5f646e" stroke-width="1.4"/>' +
      '<ellipse cx="200" cy="338" rx="15" ry="19.5" fill="none" stroke="#7d838f" stroke-width="1"/>' +
      '<path d="M190 347 V330 L195 340 L200 330 L205 340 L210 330 V347" fill="none" stroke="#5f646e" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<path d="M200 318 V328 M196 322 H204" stroke="#5f646e" stroke-width="2"/>' +
      '<ellipse cx="194" cy="327" rx="4" ry="7" fill="#fff" opacity="0.45" transform="rotate(25 194 327)"/>' +
      '<circle cx="200" cy="312.5" r="2.6" fill="none" stroke="#9aa0ab" stroke-width="1.6"/><circle cx="200" cy="363.5" r="2.6" fill="none" stroke="#9aa0ab" stroke-width="1.6"/></g>');

    // Crucifix (metal, with a simple corpus)
    const crossOn = cur === 'intro' && st.introStep <= 1;
    const cx = P.cross.x, cy = P.cross.y;
    o.push('<g class="fe-cross' + (crossOn ? ' is-current' : '') + '" data-bead="i0">' +
      (crossOn ? '<circle cx="' + cx + '" cy="' + (cy + 40) + '" r="58" fill="url(#' + u + 'glow)" class="fe-bead-glow"/>' : '') +
      '<circle cx="' + cx + '" cy="' + (cy - 2) + '" r="3" fill="none" stroke="#9aa0ab" stroke-width="1.8"/>' +
      '<path d="M' + (cx - 6) + ' ' + cy + ' H' + (cx + 6) + ' V' + (cy + 24) + ' H' + (cx + 26) + ' V' + (cy + 36) + ' H' + (cx + 6) + ' V' + (cy + 100) + ' H' + (cx - 6) + ' V' + (cy + 36) + ' H' + (cx - 26) + ' V' + (cy + 24) + ' H' + (cx - 6) + ' Z" fill="url(#' + u + 'gold)" stroke="#8a6212" stroke-width="1.2"/>' +
      '<path d="M' + (cx - 4) + ' ' + (cy + 2) + ' V' + (cy + 96) + '" stroke="#fff6cf" stroke-width="1.2" opacity="0.7"/>' +
      '<rect x="' + (cx - 5) + '" y="' + (cy + 10) + '" width="10" height="6" rx="1" fill="#e9e3cf" stroke="#8a6212" stroke-width="0.7"/>' +
      // corpus
      '<g fill="url(#' + u + 'met)" stroke="#6b707a" stroke-width="0.8">' +
      '<circle cx="' + cx + '" cy="' + (cy + 22) + '" r="3.6"/>' +
      '<path d="M' + (cx - 23) + ' ' + (cy + 28) + ' Q' + cx + ' ' + (cy + 33) + ' ' + (cx + 23) + ' ' + (cy + 28) + ' L' + (cx + 22) + ' ' + (cy + 31) + ' Q' + (cx + 8) + ' ' + (cy + 33) + ' ' + (cx + 4) + ' ' + (cy + 36) + ' L' + (cx + 3.5) + ' ' + (cy + 60) + ' L' + (cx + 2) + ' ' + (cy + 88) + ' L' + (cx - 2) + ' ' + (cy + 88) + ' L' + (cx - 3.5) + ' ' + (cy + 60) + ' L' + (cx - 4) + ' ' + (cy + 36) + ' Q' + (cx - 8) + ' ' + (cy + 33) + ' ' + (cx - 22) + ' ' + (cy + 31) + ' Z"/>' +
      '<path d="M' + (cx - 4.5) + ' ' + (cy + 52) + ' H' + (cx + 4.5) + ' L' + (cx + 3.6) + ' ' + (cy + 60) + ' H' + (cx - 3.6) + ' Z" fill="#f4f1ea"/></g>' +
      '<rect x="' + (cx - 26) + '" y="' + (cy - 4) + '" width="52" height="108" fill="transparent"/></g>');
    o.push('</g>');

    return '<svg class="fe-rosary-svg" viewBox="0 0 400 600" role="img" aria-label="' + (st.label || 'Rosario').replace(/"/g, '&quot;') + '" xmlns="http://www.w3.org/2000/svg">' + o.join('') + '</svg>';
  }

  // ── Prayer card vignettes (300×110) ─────────────────────────────
  function prayerVignette(id) {
    const u = 'pv' + (++_uid);
    const defs = '<defs><radialGradient id="' + u + 'r" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff7d6"/><stop offset="1" stop-color="#fff7d6" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="' + u + 'g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbe7a1"/><stop offset="0.5" stop-color="#d49b2a"/><stop offset="1" stop-color="#a26f12"/></linearGradient>' +
      '<linearGradient id="' + u + 'sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dbe8f7"/><stop offset="1" stop-color="#fbf4e4"/></linearGradient></defs>';
    const rays = (cx, cy, n, r1, r2, c) => {
      let p = '';
      for (let i = 0; i < n; i++) {
        const a = i * 2 * Math.PI / n;
        p += '<path d="M' + (cx + Math.cos(a - 0.06) * r1).toFixed(1) + ' ' + (cy + Math.sin(a - 0.06) * r1).toFixed(1) + ' L' + (cx + Math.cos(a) * r2).toFixed(1) + ' ' + (cy + Math.sin(a) * r2).toFixed(1) + ' L' + (cx + Math.cos(a + 0.06) * r1).toFixed(1) + ' ' + (cy + Math.sin(a + 0.06) * r1).toFixed(1) + ' Z" fill="' + c + '" opacity="0.5"/>';
      }
      return p;
    };
    const cloud = (x, y, k) => '<g transform="translate(' + x + ' ' + y + ') scale(' + k + ')" fill="#fff" stroke="#e5d9bd" stroke-width="1"><path d="M-30 8 C-34 -4 -20 -10 -14 -4 C-12 -16 6 -18 10 -6 C18 -12 32 -4 28 8 Z"/></g>';
    let b = '';
    switch (id) {
      case 'padrenuestro':
        b = '<rect width="300" height="110" fill="url(#' + u + 'sky)"/>' + rays(150, 70, 24, 10, 120, '#f4c94a') + '<circle cx="150" cy="70" r="30" fill="url(#' + u + 'r)"/>' +
          cloud(150, 82, 1.6) + cloud(84, 94, 1.1) + cloud(220, 96, 1.2) +
          '<path d="M0 110 Q80 92 150 100 T300 96 V110 Z" fill="#c9d9a8"/>';
        break;
      case 'avemaria':
        b = '<rect width="300" height="110" fill="url(#' + u + 'sky)"/>' + rays(150, 54, 20, 12, 70, '#f4c94a') +
          '<path d="M134 104 Q132 86 140 78 H160 Q168 86 166 104 Z" fill="#7d9fd0" stroke="#3d5f99" stroke-width="1.5"/>' +
          '<path d="M150 80 C148 60 150 40 152 24 M150 64 C140 60 136 52 138 46 M151 52 C160 48 164 40 162 34" stroke="#3f8a4a" stroke-width="2.4" fill="none"/>' +
          _lily(152, 24, 0.9) + _lily(138, 44, 0.75) + _lily(162, 32, 0.7) +
          '<text x="80" y="76" font-family="Georgia,serif" font-size="34" font-style="italic" fill="#2457a8" opacity="0.85" text-anchor="middle">M</text>' +
          '<g fill="#d49b2a">' + [[214, 40], [232, 60], [212, 76], [70, 34], [96, 30]].map(p => '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.2"/>').join('') + '</g>';
        break;
      case 'gloria':
        b = '<rect width="300" height="110" fill="url(#' + u + 'sky)"/>' + rays(150, 62, 28, 14, 110, '#f4c94a') +
          '<path d="M150 20 L188 88 H112 Z" fill="url(#' + u + 'g)" stroke="#8a5c0e" stroke-width="2" stroke-linejoin="round"/>' +
          '<path d="M150 36 L174 80 H126 Z" fill="#fff4cf" opacity="0.75"/>' +
          '<g fill="#a26f12"><circle cx="150" cy="50" r="4"/><circle cx="137" cy="72" r="4"/><circle cx="163" cy="72" r="4"/></g>';
        break;
      case 'angelguarda':
        b = '<rect width="300" height="110" fill="url(#' + u + 'sky)"/>' + cloud(70, 92, 1.2) + cloud(236, 90, 1.3) +
          '<circle cx="150" cy="30" r="12" fill="none" stroke="#e0a72e" stroke-width="3"/>' +
          '<path d="M146 50 C120 22 84 26 70 44 C88 46 98 52 104 60 C92 60 82 64 76 72 C98 70 120 72 146 66 Z" fill="#fff" stroke="#c9b98f" stroke-width="1.4"/>' +
          '<path d="M154 50 C180 22 216 26 230 44 C212 46 202 52 196 60 C208 60 218 64 224 72 C202 70 180 72 154 66 Z" fill="#fff" stroke="#c9b98f" stroke-width="1.4"/>' +
          '<path d="M90 48 Q110 46 132 56 M98 62 Q118 60 138 62 M210 48 Q190 46 168 56 M202 62 Q182 60 162 62" stroke="#d8cdb0" stroke-width="1" fill="none"/>' +
          '<path d="M150 44 L156 54 L150 92 L144 54 Z" fill="#f4c94a" opacity="0.9"/>';
        break;
      case 'salve':
        b = '<rect width="300" height="110" fill="url(#' + u + 'sky)"/>' + rays(150, 64, 24, 12, 90, '#9cb8e6') +
          '<path d="M118 84 L112 46 L130 62 L150 36 L170 62 L188 46 L182 84 Z" fill="url(#' + u + 'g)" stroke="#8a5c0e" stroke-width="2" stroke-linejoin="round"/>' +
          '<rect x="116" y="82" width="68" height="10" rx="2" fill="url(#' + u + 'g)" stroke="#8a5c0e" stroke-width="1.6"/>' +
          '<g fill="#c8102e"><circle cx="150" cy="70" r="4"/><circle cx="130" cy="74" r="3"/><circle cx="170" cy="74" r="3"/></g>' +
          (() => { let s = '<g fill="#2457a8">'; for (let i = 0; i < 12; i++) { const a = Math.PI * (1.05 + i * 0.081); s += '<circle cx="' + (150 + Math.cos(a) * 92).toFixed(1) + '" cy="' + (108 + Math.sin(a) * 92).toFixed(1) + '" r="2.4"/>'; } return s + '</g>'; })();
        break;
      case 'senalcruz':
        b = '<rect width="300" height="110" fill="url(#' + u + 'sky)"/>' + rays(150, 52, 24, 10, 100, '#f4c94a') +
          '<path d="M144 14 H156 V40 H178 V52 H156 V100 H144 V52 H122 V40 H144 Z" fill="url(#' + u + 'g)" stroke="#8a5c0e" stroke-width="1.8"/>';
        break;
      case 'credo':
        b = '<rect width="300" height="110" fill="url(#' + u + 'sky)"/><circle cx="150" cy="56" r="44" fill="url(#' + u + 'r)"/>' +
          '<circle cx="150" cy="56" r="40" fill="none" stroke="#d49b2a" stroke-width="2.4"/>' +
          '<path d="M150 24 V90 M124 38 L176 76 M176 38 L124 76" stroke="#8a1c2a" stroke-width="5" stroke-linecap="round"/>' +
          '<path d="M150 24 C168 24 168 50 150 50" fill="none" stroke="#8a1c2a" stroke-width="5"/>' +
          '<text x="92" y="68" font-family="Georgia,serif" font-size="26" fill="#8a1c2a" text-anchor="middle">Α</text><text x="208" y="68" font-family="Georgia,serif" font-size="26" fill="#8a1c2a" text-anchor="middle">Ω</text>';
        break;
      case 'contricion':
        b = '<rect width="300" height="110" fill="url(#' + u + 'sky)"/>' + rays(150, 62, 24, 14, 90, '#f4c94a') +
          '<path d="M150 98 C120 76 112 60 118 48 C124 36 142 36 150 50 C158 36 176 36 182 48 C188 60 180 76 150 98 Z" fill="#c8102e" stroke="#7a0a1a" stroke-width="2"/>' +
          '<path d="M128 52 C134 44 144 46 146 54" stroke="#ff8a8a" stroke-width="3" fill="none" opacity="0.6"/>' +
          '<path d="M150 46 V18 M142 26 H158" stroke="#d49b2a" stroke-width="4"/>' +
          '<path d="M144 44 C140 34 146 28 150 22 C154 28 160 34 156 44 Z" fill="#f59e0b" opacity="0.85"/>';
        break;
      case 'bendicionmesa':
        b = '<rect width="300" height="110" fill="url(#' + u + 'sky)"/>' +
          '<path d="M40 100 H260" stroke="#b58a52" stroke-width="6"/>' +
          '<path d="M96 96 C92 76 116 66 140 72 C160 76 166 90 160 96 Z" fill="#d9a35c" stroke="#8a5a22" stroke-width="1.8"/><path d="M110 78 L118 92 M126 74 L132 90 M142 76 L146 90" stroke="#b07a38" stroke-width="2"/>' +
          '<path d="M176 96 L182 64 L206 64 L212 96 Z" fill="#b8c6d6" stroke="#5f6e80" stroke-width="1.6"/><path d="M180 70 H208" stroke="#7a1a2a" stroke-width="7"/>' +
          (() => { let s = ''; [[78, 42], [74, 54], [82, 56], [70, 66], [78, 68], [86, 66]].forEach(p => { s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="5.5" fill="#6a2c91" stroke="#3e1858" stroke-width="1"/>'; }); return s; })() +
          '<path d="M78 36 Q84 26 92 28" stroke="#3f8a4a" stroke-width="2" fill="none"/>' +
          '<path d="M232 96 C230 70 236 50 240 34 M240 40 l-6 -6 M240 48 l-7 -5 M240 56 l-7 -5 M240 40 l6 -6 M240 48 l7 -5 M240 56 l7 -5" stroke="#c99a2a" stroke-width="2.4" fill="none"/>';
        break;
      default:
        b = '<rect width="300" height="110" fill="url(#' + u + 'sky)"/>' + rays(150, 55, 20, 10, 90, '#f4c94a');
    }
    return '<svg class="fe-vignette" viewBox="0 0 300 110" aria-hidden="true" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">' + defs + b + '</svg>';
  }

  // ── Heritage scenes (360×200) ───────────────────────────────────
  let _cu = 'x';
  function _commonDefs(u) {
    return '<linearGradient id="' + u + 'lit" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0.28"/><stop offset="0.55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.16"/></linearGradient>' +
      '<linearGradient id="' + u + 'vf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.22"/><stop offset="1" stop-color="#3a2410" stop-opacity="0.16"/></linearGradient>' +
      '<linearGradient id="' + u + 'haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.05"/><stop offset="1" stop-color="#fff" stop-opacity="0.45"/></linearGradient>' +
      '<radialGradient id="' + u + 'vig" cx="50%" cy="42%" r="75%"><stop offset="0.62" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#1a1008" stop-opacity="0.30"/></radialGradient>' +
      '<radialGradient id="' + u + 'sunl" cx="80%" cy="10%" r="80%"><stop offset="0" stop-color="#fff6d8" stop-opacity="0.45"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></radialGradient>' +
      '<filter id="' + u + 'grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 0.25  0 0 0 0 0.2  0 0 0 0 0.15  0 0 0 0.55 0"/></filter>' +
      '<filter id="' + u + 'soft" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="2.5" dy="3" stdDeviation="2" flood-color="#2a1a0a" flood-opacity="0.28"/></filter>';
  }
  function _finish(u) {
    return '<rect width="360" height="200" fill="url(#' + u + 'sunl)"/>' +
      '<rect width="360" height="200" filter="url(#' + u + 'grain)" opacity="0.16"/>' +
      '<rect width="360" height="200" fill="url(#' + u + 'vig)"/>';
  }
  function _ground(y, c) {
    return '<rect y="' + y + '" width="360" height="' + (200 - y) + '" fill="' + c + '"/><rect y="' + y + '" width="360" height="' + (200 - y) + '" fill="url(#' + _cu + 'vf)"/>' +
      '<path d="M0 ' + (y + 0.5) + ' H360" stroke="' + _shade(c, -0.2) + '" stroke-width="1.5" opacity="0.6"/>';
  }
  function _clouds(list) {
    return list.map(c => '<g opacity="0.85" transform="translate(' + c[0] + ' ' + c[1] + ') scale(' + (c[2] || 1) + ')">' +
      '<ellipse cx="0" cy="0" rx="22" ry="7" fill="#fff"/><ellipse cx="-8" cy="-5" rx="10" ry="7" fill="#fff"/><ellipse cx="7" cy="-6" rx="12" ry="8" fill="#fff"/>' +
      '<ellipse cx="0" cy="3" rx="22" ry="3.5" fill="#dfe8f2" opacity="0.8"/></g>').join('');
  }
  function _sky(u, top, bottom) {
    return '<linearGradient id="' + u + 'sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + top + '"/><stop offset="1" stop-color="' + bottom + '"/></linearGradient>';
  }
  function _person(x, y, c, o) {
    o = o || {};
    const h = o.h || 26, hat = o.hat;
    let s = '<g transform="translate(' + x + ' ' + y + ')">' +
      '<ellipse cx="2" cy="0.5" rx="' + (h * 0.32) + '" ry="' + (h * 0.07) + '" fill="#1a1008" opacity="0.22"/>' +
      '<path d="M-6 0 L-4.5 ' + (-h * 0.62) + ' Q0 ' + (-h * 0.7) + ' 4.5 ' + (-h * 0.62) + ' L6 0 Z" fill="' + c + '" stroke="rgba(0,0,0,.35)" stroke-width="0.8"/>' +
      '<path d="M1 0 L1.5 ' + (-h * 0.64) + ' Q4 ' + (-h * 0.66) + ' 4.5 ' + (-h * 0.62) + ' L6 0 Z" fill="#000" opacity="0.15"/>' +
      '<circle cx="0" cy="' + (-h * 0.78) + '" r="' + (h * 0.13) + '" fill="' + (o.skin || '#e8b98f') + '"/>';
    if (hat === 'chupalla') s += '<ellipse cx="0" cy="' + (-h * 0.86) + '" rx="' + (h * 0.3) + '" ry="' + (h * 0.06) + '" fill="#e2c27a" stroke="#9a7a3a" stroke-width="0.6"/><path d="M' + (-h * 0.13) + ' ' + (-h * 0.86) + ' Q0 ' + (-h * 1.04) + ' ' + (h * 0.13) + ' ' + (-h * 0.86) + ' Z" fill="#e2c27a"/>';
    if (hat === 'veil') s += '<path d="M' + (-h * 0.16) + ' ' + (-h * 0.66) + ' Q0 ' + (-h * 1.02) + ' ' + (h * 0.16) + ' ' + (-h * 0.66) + ' Z" fill="' + (o.veilC || '#f4f1ea') + '"/>';
    if (hat === 'plume') s += '<path d="M-5 ' + (-h * 0.86) + ' Q0 ' + (-h * 1.4) + ' 5 ' + (-h * 0.86) + ' Z" fill="' + (o.plumeC || '#f0c040') + '" stroke="rgba(0,0,0,.3)" stroke-width="0.6"/>';
    if (hat === 'mask') s += '<circle cx="0" cy="' + (-h * 0.8) + '" r="' + (h * 0.17) + '" fill="' + (o.maskC || '#d6283f') + '" stroke="#5a1010" stroke-width="0.8"/><path d="M-3 ' + (-h * 0.92) + ' l-3 -5 l4 2 Z M3 ' + (-h * 0.92) + ' l3 -5 l-4 2 Z" fill="#f0c040"/><circle cx="-1.6" cy="' + (-h * 0.82) + '" r="1" fill="#fff"/><circle cx="1.6" cy="' + (-h * 0.82) + '" r="1" fill="#fff"/>';
    if (o.candle) s += '<rect x="5" y="' + (-h * 0.62) + '" width="1.6" height="7" fill="#f4f1ea"/><ellipse cx="5.8" cy="' + (-h * 0.62 - 2) + '" rx="1.3" ry="2.2" fill="#f59e0b"/>';
    if (o.cape) s += '<path d="M-6 ' + (-h * 0.55) + ' L-11 -2 L-5 -1 Z M6 ' + (-h * 0.55) + ' L11 -2 L5 -1 Z" fill="' + o.cape + '"/>';
    return s + '</g>';
  }
  function _church(x, y, o) {
    // generic colonial / classical church: x,y = bottom centre
    const w = o.w || 80, h = o.h || 46, c = o.c || '#efe6d2', d = _shade(c, -0.25), roof = o.roof || '#a5532f';
    const dep = o.depth == null ? 12 : o.depth;
    let s = '<g transform="translate(' + x + ' ' + y + ')">';
    s += '<path d="M' + (-w / 2 - 4) + ' 1 L' + (w / 2 + dep + 30) + ' 1 L' + (w / 2 + dep + 8) + ' -6 L' + (-w / 2) + ' -2 Z" fill="#1a1008" opacity="0.18"/>';
    // side wall (depth) and roof side
    s += '<path d="M' + (w / 2) + ' 0 V' + (-h) + ' L' + (w / 2 + dep) + ' ' + (-h - dep * 0.5) + ' V' + (-dep * 0.5) + ' Z" fill="' + _shade(c, -0.22) + '" stroke="' + d + '" stroke-width="0.8"/>';
    s += '<path d="M0 ' + (-h - w * 0.22) + ' L' + dep + ' ' + (-h - w * 0.22 - dep * 0.5) + ' L' + (w / 2 + dep + 3) + ' ' + (-h - dep * 0.5) + ' L' + (w / 2 + 3) + ' ' + (-h) + ' Z" fill="' + _shade(o.pediment ? c : roof, -0.3) + '"/>';
    s += '<rect x="' + (-w / 2) + '" y="' + (-h) + '" width="' + w + '" height="' + h + '" fill="' + c + '" stroke="' + d + '" stroke-width="1"/>';
    s += '<rect x="' + (-w / 2) + '" y="' + (-h) + '" width="' + w + '" height="' + h + '" fill="url(#' + _cu + 'lit)"/>';
    s += '<path d="M' + (-w / 2) + ' -3 H' + (w / 2) + '" stroke="' + d + '" stroke-width="3" opacity="0.5"/>';
    if (o.pediment) s += '<path d="M' + (-w / 2 - 2) + ' ' + (-h) + ' L0 ' + (-h - w * 0.26) + ' L' + (w / 2 + 2) + ' ' + (-h) + ' Z" fill="' + _shade(c, 0.05) + '" stroke="' + d + '" stroke-width="1.2"/>';
    else {
      s += '<path d="M' + (-w / 2 - 3) + ' ' + (-h) + ' L0 ' + (-h - w * 0.22) + ' L' + (w / 2 + 3) + ' ' + (-h) + ' Z" fill="' + roof + '" stroke="' + _shade(roof, -0.3) + '" stroke-width="1"/>';
      let tl = '';
      for (let i = 1; i < 4; i++) { const t = i / 4; tl += 'M' + (-(w / 2 + 3) * (1 - t)) + ' ' + (-h - w * 0.22 * t) + ' H' + ((w / 2 + 3) * (1 - t)) + ' '; }
      s += '<path d="' + tl + '" stroke="' + _shade(roof, -0.28) + '" stroke-width="0.8" opacity="0.7"/>';
    }
    if (o.columns) for (let i = 0; i < 4; i++) { const cx = -w * 0.36 + i * w * 0.24; s += '<rect x="' + (cx - 2.5) + '" y="' + (-h + 4) + '" width="5" height="' + (h - 4) + '" fill="' + _shade(c, 0.12) + '" stroke="' + d + '" stroke-width="0.6"/>'; }
    // door + window
    s += '<path d="M-8 0 V-18 A8 8 0 0 1 8 -18 V0 Z" fill="#5a3a22" stroke="#3a2412" stroke-width="1"/>';
    s += '<circle cx="0" cy="' + (-h + 12) + '" r="5" fill="#7a9ccc" stroke="' + d + '" stroke-width="1"/>';
    const tower = (tx, th, tw) => {
      let t = '<path d="M' + (tx + tw / 2) + ' 0 V' + (-th) + ' l' + (dep * 0.5) + ' ' + (-dep * 0.25) + ' V' + (-dep * 0.25) + ' Z" fill="' + _shade(c, -0.25) + '"/>' +
        '<rect x="' + (tx - tw / 2) + '" y="' + (-th) + '" width="' + tw + '" height="' + th + '" fill="' + c + '" stroke="' + d + '" stroke-width="1"/>' +
        '<rect x="' + (tx - tw / 2) + '" y="' + (-th) + '" width="' + tw + '" height="' + th + '" fill="url(#' + _cu + 'lit)"/>' +
        '<path d="M' + (tx - tw / 2 - 1.5) + ' ' + (-th + 28) + ' h' + (tw + 3) + '" stroke="' + d + '" stroke-width="2"/>' +
        '<path d="M' + (tx - 4) + ' ' + (-th + 24) + ' V' + (-th + 14) + ' A4 4 0 0 1 ' + (tx + 4) + ' ' + (-th + 14) + ' V' + (-th + 24) + ' Z" fill="#3a2a22"/>';
      if (o.clock) t += '<circle cx="' + tx + '" cy="' + (-th + 34) + '" r="4.5" fill="#fff" stroke="' + d + '" stroke-width="0.8"/><path d="M' + tx + ' ' + (-th + 34) + ' v-3 M' + tx + ' ' + (-th + 34) + ' h2.4" stroke="#333" stroke-width="0.7"/>';
      t += o.domes ? '<path d="M' + (tx - tw / 2 - 1) + ' ' + (-th) + ' Q' + tx + ' ' + (-th - tw * 1.1) + ' ' + (tx + tw / 2 + 1) + ' ' + (-th) + ' Z" fill="' + (o.domeC || '#b9c4cf') + '" stroke="' + d + '" stroke-width="0.8"/>'
        : '<path d="M' + (tx - tw / 2 - 2) + ' ' + (-th) + ' L' + tx + ' ' + (-th - tw * 1.3) + ' L' + (tx + tw / 2 + 2) + ' ' + (-th) + ' Z" fill="' + roof + '" stroke="' + _shade(roof, -0.3) + '" stroke-width="0.8"/>';
      const top = o.domes ? -th - tw * 0.55 : -th - tw * 1.3;
      t += '<path d="M' + tx + ' ' + (top) + ' v-8 M' + (tx - 3) + ' ' + (top - 5) + ' h6" stroke="#4a3a2a" stroke-width="1.2"/>';
      return t;
    };
    if (o.towers === 2) { s += tower(-w / 2 - 6, h + 30, 16) + tower(w / 2 + 6, h + 30, 16); }
    else if (o.towers === 1) { s += tower(o.towerX || (w / 2 - 8), o.towerH || h + 44, o.towerW || 18); }
    return s + '</g>';
  }
  function _virgin(x, y, k, o) {
    // a small crowned statue of the Virgin on an "anda" (platform)
    o = o || {};
    let s = '<g transform="translate(' + x + ' ' + y + ') scale(' + k + ')">';
    if (o.anda) s += '<rect x="-22" y="-6" width="44" height="8" rx="2" fill="#c99a2a" stroke="#7a5a12" stroke-width="1"/><path d="M-28 0 H28" stroke="#6e4a2c" stroke-width="3"/>' +
      '<g fill="#f4f1ea">' + [-18, -10, 10, 18].map(fx => '<circle cx="' + fx + '" cy="-8" r="3"/>').join('') + '</g><g fill="#d6283f">' + [-14, 14].map(fx => '<circle cx="' + fx + '" cy="-9" r="2.6"/>').join('') + '</g>';
    s += '<path d="M-12 -6 Q-10 -30 -6 -40 Q0 -46 6 -40 Q10 -30 12 -6 Z" fill="' + (o.mantle || '#f4f1ea') + '" stroke="rgba(0,0,0,.35)" stroke-width="0.8"/>';
    s += '<path d="M-6 -6 Q-5 -26 0 -34 Q5 -26 6 -6 Z" fill="' + (o.robe || '#7a5230') + '"/>';
    if (o.sash) s += '<path d="M-6 -24 Q0 -21 6 -24 L5 -10 L3 -24" fill="none" stroke="' + o.sash + '" stroke-width="2"/>';
    s += '<circle cx="0" cy="-42" r="4.2" fill="#ecc49c"/>';
    s += '<path d="M-6 -40 Q0 -50 6 -40 L5 -34 Q0 -38 -5 -34 Z" fill="' + (o.veil || '#f4f1ea') + '"/>';
    if (o.crown !== false) s += '<path d="M-4.5 -46 L-5 -51 L-2.5 -48.5 L0 -52 L2.5 -48.5 L5 -51 L4.5 -46 Z" fill="#f0c040" stroke="#8a5c0e" stroke-width="0.5"/>';
    if (o.candle) s += '<rect x="7" y="-30" width="2" height="10" fill="#f4f1ea"/><ellipse cx="8" cy="-33" rx="1.6" ry="2.8" fill="#f59e0b"/>';
    s += '<circle cx="0" cy="-30" r="22" fill="#fff7c8" opacity="0.18"/>';
    return s + '</g>';
  }
  function _mountains(c1, c2, snow) {
    return '<path d="M0 132 L50 104 L90 124 L140 92 L200 122 L250 98 L300 118 L360 100 V200 H0 Z" fill="' + _shade(c1, 0.35) + '"/>' +
      '<path d="M0 140 L40 96 L70 118 L110 70 L150 112 L190 80 L230 116 L270 74 L310 104 L360 84 V200 H0 Z" fill="' + c1 + '"/>' +
      '<path d="M40 96 L52 140 L70 118 Z M110 70 L124 140 L150 112 Z M190 80 L204 140 L230 116 Z M270 74 L286 140 L310 104 Z" fill="#1a1008" opacity="0.12"/>' +
      '<path d="M0 140 L40 96 L70 118 L110 70 L150 112 L190 80 L230 116 L270 74 L310 104 L360 84 V200 H0 Z" fill="url(#' + _cu + 'haze)"/>' +
      (snow ? '<path d="M110 70 L100 82 L108 80 L114 86 L120 79 Z M270 74 L260 86 L268 84 L274 90 L280 83 Z M190 80 L183 89 L190 87 L196 91 Z" fill="#fff"/>' : '') +
      '<path d="M0 156 Q60 132 120 148 T240 140 T360 146 V200 H0 Z" fill="' + c2 + '"/>';
  }

  function heritageScene(id) {
    const u = 'hs' + (++_uid);
    _cu = u;
    let defs = '', b = '';
    const sun = (x, y, r, c) => '<circle cx="' + x + '" cy="' + y + '" r="' + (r * 2.2) + '" fill="' + c + '" opacity="0.18"/><circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + c + '"/>';
    switch (id) {
      case 'fiesta_san_pedro': {
        defs = _sky(u, '#7fb6e6', '#e8f2f8') + '<linearGradient id="' + u + 'sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f7fb8"/><stop offset="1" stop-color="#174a7a"/></linearGradient>';
        b = '<rect width="360" height="200" fill="url(#' + u + 'sky)"/>' + sun(300, 40, 14, '#fff1b0') +
          '<path d="M0 112 Q50 84 100 96 T200 88 T300 92 T360 86 V124 H0 Z" fill="#9db58a"/><path d="M0 120 H360 V124 H0 Z" fill="#cfc29a"/>' +
          '<g fill="#f4f1ea" stroke="#8a8a8a" stroke-width="0.5">' + [[40, 100], [56, 98], [72, 102], [250, 92], [266, 96]].map(p => '<rect x="' + p[0] + '" y="' + p[1] + '" width="10" height="8"/><path d="M' + (p[0] - 1) + ' ' + p[1] + ' l6 -5 l6 5 Z" fill="#b3532f"/>').join('') + '</g>' +
          '<rect y="122" width="360" height="78" fill="url(#' + u + 'sea)"/>' +
          '<path d="M0 140 q15 -4 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0" stroke="#7fc0ea" stroke-width="1.4" fill="none" opacity="0.6"/>' +
          '<path d="M0 176 q15 -4 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0" stroke="#7fc0ea" stroke-width="1.4" fill="none" opacity="0.5"/>';
        const boat = (x, y, k, hull, trim, flagC) => '<g transform="translate(' + x + ' ' + y + ') scale(' + k + ')">' +
          '<path d="M-40 0 L-34 16 H34 L42 0 Z" fill="' + hull + '" stroke="#2a2a2a" stroke-width="1.2"/><path d="M-39 3 H41" stroke="' + trim + '" stroke-width="3"/>' +
          '<path d="M0 0 V-46" stroke="#6e4a2c" stroke-width="2.4"/><path d="M0 -46 L-36 -2 M0 -46 L38 -2" stroke="#7a6a5a" stroke-width="0.8"/>' +
          (() => { let f = ''; const cols = ['#d6283f', '#f4f1ea', '#2457a8', '#f0c040', '#2f9a5a']; for (let i = 0; i < 6; i++) { const t = (i + 1) / 7; f += '<path d="M' + (-36 * t) + ' ' + (-46 + 44 * t) + ' l3 6 l3 -6 Z" fill="' + cols[i % 5] + '"/><path d="M' + (38 * t) + ' ' + (-46 + 44 * t) + ' l3 6 l3 -6 Z" fill="' + cols[(i + 2) % 5] + '"/>'; } return f; })() +
          '<path d="M0 -46 l14 4 l-14 4 Z" fill="' + flagC + '"/>' +
          '<path d="M-30 0 Q-20 -6 -10 0 Q0 -6 10 0 Q20 -6 30 0" stroke="#3f8a4a" stroke-width="3" fill="none"/>' +
          '<g fill="#f4f1ea">' + [-26, -14, 4, 18, 30].map(fx => '<circle cx="' + fx + '" cy="-2" r="2.4"/>').join('') + '</g><g fill="#d6283f">' + [-20, -2, 12, 24].map(fx => '<circle cx="' + fx + '" cy="-3" r="2"/>').join('') + '</g>' +
          '</g>';
        b += boat(110, 140, 1.15, '#2457a8', '#f4f1ea', '#f0c040') + boat(250, 150, 1, '#d6283f', '#f0c040', '#2457a8') + boat(60, 170, 0.7, '#f4f1ea', '#2f7a5e', '#d6283f');
        b += '<g transform="translate(110 140)"><path d="M-6 0 Q-5 -18 0 -24 Q5 -18 6 0 Z" fill="#d39b22" stroke="#7a5a12" stroke-width="0.6"/><circle cx="0" cy="-27" r="3.4" fill="#ecc49c"/><circle cx="0" cy="-27" r="6" fill="none" stroke="#f0c040" stroke-width="1.2"/><path d="M4 -16 l6 6 M7 -14 l2 -2" stroke="#f0c040" stroke-width="1.6"/></g>';
        break;
      }
      case 'carmen': {
        defs = _sky(u, '#f3c98a', '#fbeedd');
        b = '<rect width="360" height="200" fill="url(#' + u + 'sky)"/>' + sun(70, 60, 18, '#fff4cf') + _clouds([[150, 40, 1.1], [320, 30, 0.8]]) +
          '<path d="M0 150 Q90 128 180 140 T360 132 V150 H0 Z" fill="#c9b48a" opacity="0.7"/>' + _ground(150, '#d9c7a3') +
          _church(270, 150, { w: 90, h: 52, c: '#efe2c6', towers: 1, towerX: 30, towerH: 96 });
        b += _virgin(170, 152, 1.25, { anda: true, robe: '#6b4a2c', mantle: '#f4f1ea', veil: '#f4f1ea' });
        [[130, 168], [150, 170], [190, 170], [210, 168]].forEach((p, i) => { b += _person(p[0], p[1], ['#2457a8', '#6b4a2c', '#2f7a5e', '#8e1022'][i], { h: 30 }); });
        [[60, 176], [84, 180], [250, 178], [276, 180], [302, 176], [36, 182]].forEach((p, i) => { b += _person(p[0], p[1], ['#7a5230', '#2f2a40', '#b3532f', '#2457a8', '#6b4a2c', '#3f8a4a'][i], { h: 26, candle: true, hat: i % 2 ? 'veil' : null }); });
        break;
      }
      case 'sanfrancisco_stgo': {
        defs = _sky(u, '#8fc0ea', '#eef5fa');
        b = '<rect width="360" height="200" fill="url(#' + u + 'sky)"/>' + _mountains('#b7c3cf', '#cfd8de', true) +
          _ground(160, '#cdbf9f') + _clouds([[60, 36, 0.9], [210, 26, 1.1]]);
        // thick colonial walls, small high windows, a tall bell tower
        b += '<g transform="translate(150 162)">' +
          '<rect x="-90" y="-58" width="150" height="58" fill="#b8553a" stroke="#7a3422" stroke-width="1.2"/>' +
          '<path d="M-94 -58 L-15 -80 L64 -58 Z" fill="#8c3c26" stroke="#5a2414" stroke-width="1"/>' +
          '<path d="M-34 0 V-30 A14 14 0 0 1 -6 -30 V0 Z" fill="#4a2c18" stroke="#2a180c" stroke-width="1.2"/><path d="M-20 -44 V0" stroke="#2a180c" stroke-width="0.8"/>' +
          '<rect x="-40" y="-48" width="40" height="4" fill="#e8d7b8"/>' +
          [-74, -56, 22, 40].map(wx => '<rect x="' + wx + '" y="-48" width="8" height="12" rx="4" fill="#3a2a22"/>').join('') +
          '<path d="M-90 -6 H60" stroke="#7a3422" stroke-width="0.8" opacity="0.5"/>' +
          // tower
          '<rect x="60" y="-110" width="34" height="110" fill="#c0603f" stroke="#7a3422" stroke-width="1.2"/>' +
          '<rect x="56" y="-114" width="42" height="6" fill="#e8d7b8"/><rect x="56" y="-66" width="42" height="4" fill="#e8d7b8"/>' +
          '<circle cx="77" cy="-84" r="8" fill="#f8f4ea" stroke="#5a3a2a" stroke-width="1"/><path d="M77 -84 v-5 M77 -84 h4" stroke="#333" stroke-width="1"/>' +
          '<rect x="62" y="-150" width="30" height="36" fill="#e8d7b8" stroke="#8a7a5a" stroke-width="1"/>' +
          '<path d="M70 -118 V-138 A7 7 0 0 1 84 -138 V-118 Z" fill="#3a2a22"/><path d="M77 -132 a4 4 0 0 1 0 8 a4 4 0 0 1 0 -8" fill="#c99a2a"/>' +
          '<path d="M60 -150 L77 -176 L94 -150 Z" fill="#8c3c26" stroke="#5a2414" stroke-width="1"/><path d="M77 -176 v-12 M72 -183 h10" stroke="#3a2a22" stroke-width="1.6"/>' +
          '</g>';
        [[40, 186, '#2457a8'], [60, 190, '#7a5230'], [290, 188, '#2f7a5e']].forEach(p => { b += _person(p[0], p[1], p[2], { h: 22 }); });
        b += '<text x="18" y="24" font-family="Georgia,serif" font-size="14" font-weight="700" fill="#5a3a2a">1586</text>';
        break;
      }
      case 'tirana': {
        defs = _sky(u, '#4c8fd6', '#f6e3c0');
        b = '<rect width="360" height="200" fill="url(#' + u + 'sky)"/>' + sun(310, 36, 14, '#fff4cf') +
          '<path d="M0 128 Q90 108 180 120 T360 114 V200 H0 Z" fill="#d9b680"/>' +
          '<path d="M0 150 Q100 136 200 146 T360 142 V200 H0 Z" fill="#e6c992"/>' +
          // tamarugo trees of the pampa
          [[30, 128], [64, 124], [330, 120]].map(p => '<path d="M' + p[0] + ' ' + p[1] + ' v-12" stroke="#6e4a2c" stroke-width="3"/><ellipse cx="' + p[0] + '" cy="' + (p[1] - 18) + '" rx="16" ry="9" fill="#6f8a4a"/>').join('') +
          _church(196, 132, { w: 70, h: 38, c: '#f4efe4', towers: 1, towerX: 0, towerH: 64, towerW: 16, roof: '#7a8aa0' });
        const dancer = (x, y, k, body, cape, mask, flip) => '<g transform="translate(' + x + ' ' + y + ') scale(' + (flip ? -k : k) + ' ' + k + ')">' +
          '<path d="M-14 -30 L-24 4 L-4 0 Z" fill="' + cape + '" stroke="rgba(0,0,0,.3)" stroke-width="0.8"/>' +
          '<path d="M-8 0 L-6 -34 Q0 -38 6 -34 L10 0 Z" fill="' + body + '" stroke="rgba(0,0,0,.35)" stroke-width="0.8"/>' +
          '<path d="M-6 -12 H8" stroke="#f0c040" stroke-width="2"/><path d="M-6 -6 H9" stroke="#f0c040" stroke-width="1.4"/>' +
          '<path d="M-4 0 L-8 12 M5 0 L12 10" stroke="#2a2a2a" stroke-width="3" stroke-linecap="round"/>' +
          '<path d="M6 -30 L18 -40" stroke="' + body + '" stroke-width="4" stroke-linecap="round"/>' +
          '<circle cx="0" cy="-44" r="9" fill="' + mask + '" stroke="#4a0a0a" stroke-width="1"/>' +
          '<path d="M-5 -50 Q-12 -62 -6 -64 Q-6 -56 -2 -52 Z M5 -50 Q12 -62 6 -64 Q6 -56 2 -52 Z" fill="#f0c040" stroke="#8a5c0e" stroke-width="0.6"/>' +
          '<circle cx="-3.4" cy="-45" r="2.2" fill="#fff"/><circle cx="3.4" cy="-45" r="2.2" fill="#fff"/><circle cx="-3.4" cy="-45" r="1" fill="#222"/><circle cx="3.4" cy="-45" r="1" fill="#222"/>' +
          '<path d="M-4 -39 Q0 -36 4 -39" stroke="#fff" stroke-width="1.2" fill="none"/>' +
          '<g fill="#f0c040"><circle cx="-8" cy="-42" r="1.4"/><circle cx="8" cy="-42" r="1.4"/></g></g>';
        b += dancer(70, 176, 1.2, '#d6283f', '#2457a8', '#d6283f') + dancer(130, 182, 1.25, '#2457a8', '#d6283f', '#2f9a5a', true) +
             dancer(240, 180, 1.2, '#6a2c91', '#f0c040', '#d6283f') + dancer(300, 176, 1.15, '#2f9a5a', '#d6283f', '#f0c040', true);
        b += _virgin(188, 186, 0.9, { anda: true, robe: '#6b4a2c', mantle: '#f4f1ea' });
        break;
      }
      case 'cuasimodo': {
        defs = _sky(u, '#9fcdf0', '#f2f7ea');
        b = '<rect width="360" height="200" fill="url(#' + u + 'sky)"/>' + _mountains('#9bb0a0', '#a9c48a', false) +
          _ground(166, '#c8ad7a') + _clouds([[80, 34, 1], [260, 24, 0.9]]) +
          [[30, 150], [330, 152]].map(p => '<path d="M' + p[0] + ' ' + p[1] + ' v-18" stroke="#6e4a2c" stroke-width="3"/><circle cx="' + p[0] + '" cy="' + (p[1] - 26) + '" r="14" fill="#5f8a44"/>').join('');
        const horse = (x, y, k, c, rider, cape) => '<g transform="translate(' + x + ' ' + y + ') scale(' + k + ')">' +
          '<path d="M-22 -14 Q-24 -26 -10 -28 L14 -28 Q22 -30 26 -40 L32 -44 L36 -38 L30 -28 Q28 -18 22 -14 Z" fill="' + c + '" stroke="rgba(0,0,0,.4)" stroke-width="0.8"/>' +
          '<path d="M-18 -14 L-20 4 M-10 -14 L-8 4 M14 -14 L12 4 M20 -14 L24 4" stroke="' + c + '" stroke-width="3.6" stroke-linecap="round"/>' +
          '<path d="M-22 -24 Q-32 -18 -30 -6" stroke="#2a1a10" stroke-width="3" fill="none"/>' +
          '<path d="M26 -40 L30 -48" stroke="#2a1a10" stroke-width="2"/>' +
          '<path d="M-4 -30 L-6 -50 Q0 -54 6 -50 L6 -30 Z" fill="' + rider + '"/>' +
          '<path d="M-8 -48 L-14 -28 L-4 -30 Z" fill="' + cape + '"/>' +
          '<circle cx="0" cy="-56" r="4" fill="#e8b98f"/><ellipse cx="0" cy="-59" rx="9" ry="2.2" fill="#e2c27a"/><path d="M-4 -59 Q0 -66 4 -59 Z" fill="#e2c27a"/>' +
          '<path d="M6 -46 L10 -64" stroke="#6e4a2c" stroke-width="1.4"/><path d="M10 -64 l10 3 l-10 4 Z" fill="' + cape + '"/></g>';
        b += horse(60, 176, 1.05, '#7a4a2a', '#2f2a40', '#f0c040') + horse(286, 178, 1.1, '#3a2a22', '#8e1022', '#f4f1ea');
        // the priest in a small decorated carriage under a canopy
        b += '<g transform="translate(178 178)">' +
          '<path d="M-34 -24 H30 L26 -6 H-30 Z" fill="#f4f1ea" stroke="#8a7a5a" stroke-width="1"/><path d="M-34 -24 H30" stroke="#f0c040" stroke-width="3"/>' +
          '<circle cx="-20" cy="-4" r="9" fill="none" stroke="#5a3a22" stroke-width="2.4"/><circle cx="16" cy="-4" r="9" fill="none" stroke="#5a3a22" stroke-width="2.4"/>' +
          '<path d="M-20 -13 V5 M-29 -4 H-11 M16 -13 V5 M7 -4 H25" stroke="#5a3a22" stroke-width="1"/>' +
          '<path d="M-24 -24 V-58 M20 -24 V-58" stroke="#c99a2a" stroke-width="2"/><path d="M-30 -58 Q-2 -70 26 -58 Z" fill="#f0c040" stroke="#8a5c0e" stroke-width="1"/>' +
          '<path d="M-30 -58 H26" stroke="#f4f1ea" stroke-width="2" stroke-dasharray="4 3"/>' +
          '<path d="M-8 -24 L-7 -44 Q-2 -48 3 -44 L4 -24 Z" fill="#f8f6f0" stroke="#b8b0a0" stroke-width="0.8"/><path d="M-6 -36 H3" stroke="#f0c040" stroke-width="2"/>' +
          '<circle cx="-2" cy="-49" r="4" fill="#e8b98f"/></g>' +
          horse(240, 178, 0.95, '#d8d2c6', '#2457a8', '#f0c040');
        break;
      }
      case 'andacollo': {
        defs = _sky(u, '#8cc2ee', '#f3ead6');
        b = '<rect width="360" height="200" fill="url(#' + u + 'sky)"/>' +
          '<path d="M0 130 L50 92 L96 120 L150 84 L210 118 L260 88 L320 116 L360 100 V200 H0 Z" fill="#c9a77a"/>' +
          '<path d="M0 150 Q90 130 180 142 T360 138 V200 H0 Z" fill="#dcc29a"/>' +
          [[40, 140], [300, 136], [326, 140]].map(p => '<path d="M' + p[0] + ' ' + p[1] + ' v-14 M' + (p[0] - 5) + ' ' + (p[1] - 6) + ' v-6 M' + (p[0] + 5) + ' ' + (p[1] - 8) + ' v-6" stroke="#5f8a44" stroke-width="3" stroke-linecap="round"/>').join('') +
          _church(180, 142, { w: 104, h: 50, c: '#f2ead8', towers: 2, pediment: true, domes: true, domeC: '#c7a35a' });
        const pilgrims = [[24, 182, '#2457a8'], [44, 186, '#8e1022'], [64, 180, '#2f7a5e'], [86, 186, '#6b4a2c'], [276, 184, '#3f3a5a'], [298, 180, '#b3532f'], [318, 186, '#2457a8'], [338, 182, '#6b4a2c']];
        pilgrims.forEach((p, i) => { b += _person(p[0], p[1], p[2], { h: 26, hat: i % 3 === 0 ? 'veil' : null }); });
        [[130, 184, '#d6283f', '#f0c040'], [150, 188, '#2457a8', '#f4f1ea'], [210, 188, '#d6283f', '#2457a8'], [230, 184, '#2f9a5a', '#f0c040']].forEach(p => { b += _person(p[0], p[1], p[2], { h: 30, hat: 'plume', plumeC: p[3], cape: p[3] }); });
        b += _virgin(180, 188, 0.95, { anda: true, robe: '#2457a8', mantle: '#f4f1ea' });
        break;
      }
      case 'maipu': {
        defs = _sky(u, '#86bbe8', '#eef5fa');
        b = '<rect width="360" height="200" fill="url(#' + u + 'sky)"/>' + _mountains('#b7c3cf', '#c9d2c0', true) +
          _ground(164, '#c5c9b8') + _clouds([[90, 30, 1], [250, 44, 0.8]]);
        // a large temple with a tall bell tower
        b += '<g transform="translate(160 166)">' +
          '<path d="M-92 0 V-62 L-30 -84 L32 -62 V0 Z" fill="#e2ddd2" stroke="#8f8a80" stroke-width="1.2"/>' +
          '<path d="M-30 -84 V0" stroke="#bdb6aa" stroke-width="1"/>' +
          '<path d="M-48 0 V-40 A18 18 0 0 1 -12 -40 V0 Z" fill="#6b7f9a" stroke="#4a5568" stroke-width="1"/>' +
          '<circle cx="-30" cy="-58" r="12" fill="#7d9fd0" stroke="#4a5568" stroke-width="1.2"/><path d="M-30 -70 V-46 M-42 -58 H-18" stroke="#4a5568" stroke-width="1"/>' +
          [-80, -66, 6, 20].map(wx => '<rect x="' + wx + '" y="-50" width="7" height="30" fill="#8aa6cc" stroke="#4a5568" stroke-width="0.6"/>').join('') +
          '<rect x="46" y="-150" width="26" height="150" fill="#e8e3d8" stroke="#8f8a80" stroke-width="1.2"/>' +
          [-140, -120, -100, -80, -60, -40].map(wy => '<rect x="52" y="' + wy + '" width="14" height="10" fill="#9fb2c8"/>').join('') +
          '<path d="M46 -150 L59 -170 L72 -150 Z" fill="#cfc8ba" stroke="#8f8a80" stroke-width="1"/>' +
          '<path d="M59 -170 v-14 M53 -178 h12" stroke="#6b6458" stroke-width="2"/></g>';
        [[40, 188, '#2457a8'], [64, 190, '#7a5230'], [270, 188, '#2f7a5e'], [292, 190, '#8e1022']].forEach(p => { b += _person(p[0], p[1], p[2], { h: 22 }); });
        break;
      }
      case 'teresa': {
        defs = _sky(u, '#7eb4e6', '#f2f6f8');
        b = '<rect width="360" height="200" fill="url(#' + u + 'sky)"/>' +
          '<path d="M0 120 L60 60 L100 92 L160 34 L220 90 L270 50 L330 96 L360 80 V200 H0 Z" fill="#8a97a8"/>' +
          '<path d="M160 34 L146 50 L156 48 L162 56 L172 46 Z M60 60 L50 72 L58 70 L64 76 Z M270 50 L260 62 L268 60 L274 66 L282 60 Z" fill="#fff"/>' +
          '<path d="M0 140 Q80 118 170 132 T360 126 V200 H0 Z" fill="#8fae6a"/><path d="M0 164 Q100 150 200 160 T360 156 V200 H0 Z" fill="#a7c07c"/>' +
          _church(190, 156, { w: 96, h: 40, c: '#f6f3ec', roof: '#9a6a4a', towers: 1, towerX: 56, towerH: 72, towerW: 14 }) +
          '<path d="M100 170 Q150 160 190 158" stroke="#d8c8a0" stroke-width="6" fill="none"/>';
        [[110, 178, '#2457a8'], [128, 174, '#6b4a2c'], [146, 172, '#8e1022'], [80, 182, '#2f7a5e']].forEach((p, i) => { b += _person(p[0], p[1], p[2], { h: 22, hat: i === 1 ? 'veil' : null }); });
        break;
      }
      case 'catedral_stgo': {
        defs = _sky(u, '#8cc0ec', '#eef5fa');
        b = '<rect width="360" height="200" fill="url(#' + u + 'sky)"/>' +
          _clouds([[70, 34, 1], [300, 26, 0.9]]) + _ground(160, '#cfc6b2') +
          (() => { let t = ''; for (let i = 0; i < 12; i++) t += '<path d="M' + (i * 32 - 10) + ' 200 L' + (180 + (i - 5.5) * 8) + ' 160" stroke="#b0a68e" stroke-width="0.7" opacity="0.5"/>'; return t; })() +
          _church(180, 160, { w: 140, h: 70, c: '#e9e1cf', towers: 2, pediment: true, columns: true, clock: true, roof: '#8a8f99', domes: false });
        const palm = x => '<path d="M' + x + ' 186 Q' + (x + 3) + ' 150 ' + x + ' 116" stroke="#7a5a3a" stroke-width="4" fill="none"/>' +
          [-60, -25, 10, 45, 80, 120, 160, 200].map(a => '<path d="M' + x + ' 116 q' + (Math.cos(a * Math.PI / 180) * 14).toFixed(1) + ' ' + (Math.sin(a * Math.PI / 180) * 14 - 6).toFixed(1) + ' ' + (Math.cos(a * Math.PI / 180) * 24).toFixed(1) + ' ' + (Math.sin(a * Math.PI / 180) * 24 + 4).toFixed(1) + '" stroke="#3f7a3a" stroke-width="3.4" fill="none" stroke-linecap="round"/>').join('');
        b += palm(38) + palm(326);
        [[70, 188, '#2457a8'], [96, 190, '#8e1022'], [262, 190, '#2f7a5e'], [284, 188, '#6b4a2c']].forEach(p => { b += _person(p[0], p[1], p[2], { h: 22 }); });
        b += '<text x="180" y="196" font-family="Georgia,serif" font-size="10" font-weight="700" fill="#5a4a3a" text-anchor="middle">Plaza de Armas</text>';
        break;
      }
      case 'lourdes_punta_arenas': {
        defs = _sky(u, '#6f9fcf', '#e4ecf2') + '<radialGradient id="' + u + 'cave" cx="50%" cy="60%" r="60%"><stop offset="0" stop-color="#2e2a28"/><stop offset="1" stop-color="#5a524a"/></radialGradient>';
        b = '<rect width="360" height="200" fill="url(#' + u + 'sky)"/>' +
          '<path d="M0 120 H360 V140 H0 Z" fill="#4f7fa6"/><path d="M0 124 q20 -3 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="#9cc0dc" stroke-width="1" fill="none"/>' +
          '<path d="M0 140 Q80 128 180 136 T360 132 V200 H0 Z" fill="#7d9a5c"/>' +
          // rock grotto
          '<path d="M90 186 C84 140 100 76 150 64 C176 58 214 66 236 92 C260 120 268 160 262 186 Z" fill="#8a8178" stroke="#5a524a" stroke-width="1.4"/>' +
          '<path d="M100 110 Q120 100 130 112 M210 90 Q226 98 234 112 M106 150 Q118 142 128 152 M232 140 Q244 136 252 148" stroke="#6a6258" stroke-width="2" fill="none"/>' +
          '<path d="M146 186 C142 150 152 112 178 106 C204 112 214 150 210 186 Z" fill="url(#' + u + 'cave)"/>' +
          _virgin(178, 156, 1.05, { robe: '#f8f6f0', mantle: '#f8f6f0', veil: '#f8f6f0', sash: '#5b8fd6', crown: false }) +
          '<g>' + [[150, 186], [158, 184], [196, 184], [204, 186]].map(p => '<rect x="' + p[0] + '" y="' + (p[1] - 10) + '" width="2.4" height="10" fill="#f4f1ea"/><ellipse cx="' + (p[0] + 1.2) + '" cy="' + (p[1] - 12.5) + '" rx="1.6" ry="2.6" fill="#f59e0b"/>').join('') + '</g>' +
          '<path d="M90 186 H262" stroke="#5a524a" stroke-width="2"/>';
        [[300, 186, '#2457a8'], [320, 184, '#6b4a2c'], [50, 186, '#2f7a5e']].forEach((p, i) => { b += _person(p[0], p[1], p[2], { h: 24, hat: i === 1 ? 'veil' : null }); });
        break;
      }
      case 'candelaria': {
        defs = _sky(u, '#7fb5e8', '#f6ead2');
        b = '<rect width="360" height="200" fill="url(#' + u + 'sky)"/>' + sun(290, 40, 13, '#fff4cf') +
          '<path d="M0 128 L60 98 L120 120 L190 92 L260 118 L320 96 L360 110 V200 H0 Z" fill="#c9a170"/>' +
          '<path d="M0 154 Q90 140 180 150 T360 146 V200 H0 Z" fill="#e0c394"/>' +
          _church(250, 150, { w: 76, h: 44, c: '#f4efe4', towers: 1, towerX: -26, towerH: 74, towerW: 16, roof: '#a5532f' });
        b += _virgin(150, 176, 1.2, { anda: true, robe: '#2457a8', mantle: '#f4f1ea', candle: true });
        [[80, 182, '#d6283f', '#f0c040'], [104, 186, '#2f9a5a', '#d6283f'], [196, 186, '#6a2c91', '#f0c040'], [220, 182, '#2457a8', '#f4f1ea']].forEach(p => { b += _person(p[0], p[1], p[2], { h: 30, hat: 'plume', plumeC: p[3], cape: p[3] }); });
        [[40, 188, '#6b4a2c'], [330, 188, '#2457a8'], [310, 186, '#8e1022']].forEach(p => { b += _person(p[0], p[1], p[2], { h: 24, candle: true }); });
        break;
      }
      default: {
        defs = _sky(u, '#8cc0ec', '#eef5fa');
        b = '<rect width="360" height="200" fill="url(#' + u + 'sky)"/>' + _mountains('#b7c3cf', '#c9d2c0', true) + _church(180, 166, { w: 90, h: 50, towers: 1 });
      }
    }
    return '<svg class="fe-scene" viewBox="0 0 360 200" aria-hidden="true" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><defs>' + _commonDefs(u) + defs + '</defs>' + b + _finish(u) + '</svg>';
  }

  // ── Small icons (24×24) ─────────────────────────────────────────
  function icon(name) {
    const w = (b) => '<svg class="fe-ico" viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">' + b + '</svg>';
    switch (name) {
      case 'prayer': return w('<rect x="9" y="9" width="6" height="12" rx="1" fill="#f4ecd8" stroke="#8a6212" stroke-width="1.2"/><path d="M12 9 V7" stroke="#5a3a22" stroke-width="1"/><path d="M12 2.5 C10 5 10.5 7 12 7.5 C13.5 7 14 5 12 2.5 Z" fill="#f59e0b"/><path d="M6 21 H18" stroke="#8a6212" stroke-width="1.6" stroke-linecap="round"/>');
      case 'saint': return w('<circle cx="12" cy="9" r="7" fill="#fcd34d" stroke="#b45309" stroke-width="1"/><circle cx="12" cy="10" r="3.6" fill="#f0c9a4" stroke="#5a3a22" stroke-width="0.9"/><path d="M5 22 C5 16 8 14 12 14 C16 14 19 16 19 22 Z" fill="#2457a8" stroke="#1a2a4a" stroke-width="0.9"/>');
      case 'rosary': return w('<g fill="#9a6332" stroke="#4b2a12" stroke-width="0.5">' + Array.from({ length: 10 }, (_, i) => { const a = Math.PI * (0.72 + i * 0.172); return '<circle cx="' + (12 + Math.cos(a) * 7).toFixed(1) + '" cy="' + (8 + Math.sin(a) * 6).toFixed(1) + '" r="1.5"/>'; }).join('') + '</g><path d="M12 13.5 V17 M12 17 V23 M9.5 19 H14.5" stroke="#b45309" stroke-width="1.8"/>');
      case 'heritage': return w('<path d="M4 21 V11 L12 6 L20 11 V21 Z" fill="#f4ecd8" stroke="#8c3c26" stroke-width="1.2"/><path d="M12 6 V1.5 M10 3 H14" stroke="#8c3c26" stroke-width="1.4"/><path d="M10 21 V16 A2 2 0 0 1 14 16 V21" fill="#8c3c26"/>');
      case 'challenge': return w('<path d="M7 3 H17 V8 C17 12 14.5 14 12 14 C9.5 14 7 12 7 8 Z" fill="#fbbf24" stroke="#b45309" stroke-width="1.2"/><path d="M7 5 H4 C4 9 6 10 7.5 10 M17 5 H20 C20 9 18 10 16.5 10" fill="none" stroke="#b45309" stroke-width="1.2"/><path d="M12 14 V18 M8 21 H16 L15 18 H9 Z" fill="#b45309" stroke="#b45309" stroke-width="1"/>');
      case 'rose': return '<svg class="fe-rose" viewBox="0 0 48 48" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="22" fill="#8c7a5e"/><circle cx="24" cy="24" r="19" fill="#1f4fa8" stroke="#211a16" stroke-width="1.4"/>' +
        Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; const x = 24 + Math.cos(a) * 12, y = 24 + Math.sin(a) * 12; return '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="5" fill="' + (i % 2 ? '#b3122e' : '#e6b23a') + '" stroke="#211a16" stroke-width="1.2"/>'; }).join('') +
        '<circle cx="24" cy="24" r="6" fill="#f0c040" stroke="#211a16" stroke-width="1.4"/></svg>';
    }
    return '';
  }

  return { saintPortrait, saintSymbol, saintAttr, rosary, prayerVignette, heritageScene, icon, SAINT_LOOKS };
})();
