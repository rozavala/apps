/* ================================================================
   WORLD EXPLORER — art: illustrated landmark icons (hand-drawn SVG).
   Each icon is drawn in a 40×40 box with flat, layered tones (no
   gradients/ids, so any number can sit in any number of SVGs).
   WEArt.landmark(key)        -> inner SVG markup (40×40 units)
   WEArt.landmarkSVG(key,cls) -> standalone <svg>
   ================================================================ */

var WEArt = (function() {
  'use strict';

  var SKY = '<rect x="0" y="0" width="40" height="40" rx="9" fill="#dff1fb"/>';
  function g(s) { return s; }
  function hills(col, col2) {
    return '<path d="M0,31 Q10,25 20,29 T40,27 V40 H0Z" fill="' + col + '"/>' +
      (col2 ? '<path d="M0,35 Q14,30 26,34 T40,33 V40 H0Z" fill="' + col2 + '"/>' : '');
  }
  function water(y) { return '<path d="M0,' + y + 'H40V40H0Z" fill="#5fb3e0"/><path d="M4,' + (y + 3) + 'h8M18,' + (y + 5) + 'h10M30,' + (y + 2.5) + 'h6" stroke="#bfe6f8" stroke-width="1.2" stroke-linecap="round"/>'; }
  function sun(x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="3.2" fill="#ffd45c"/>'; }
  function cloud(x, y, s) { s = s || 1; return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')"><ellipse cx="0" cy="0" rx="4.5" ry="2.2" fill="#fff"/><ellipse cx="3" cy="-1.4" rx="3" ry="2.2" fill="#fff"/><ellipse cx="-2.6" cy="-.8" rx="2.4" ry="1.8" fill="#fff"/></g>'; }
  function fall(x, y, w, h) {
    var s = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="#bfe6f8"/>', i;
    for (i = 1; i < 4; i++) s += '<path d="M' + (x + w * i / 4) + ',' + y + 'v' + h + '" stroke="#fff" stroke-width=".9" opacity=".9"/>';
    return s + '<ellipse cx="' + (x + w / 2) + '" cy="' + (y + h) + '" rx="' + (w * 0.9) + '" ry="2.4" fill="#fff" opacity=".9"/>';
  }

  var L = {
    // ── South America ──
    chile: g(SKY + sun(32, 9) + hills('#7cc36a', '#5aa84f') +
      '<path d="M13,33 V17 c0-5 2-8 6-8 h2 c4,0 5,3 5,8 v16Z" fill="#8a7d70"/>' +
      '<path d="M13,17c0-5 2-8 6-8h2c4,0 5,3 5,8l-2,0c0-3-1-5-4-5h-1c-3,0-4,2-4,5Z" fill="#6f645a"/>' +
      '<path d="M15,18h10" stroke="#4e463f" stroke-width="2.2" stroke-linecap="round"/>' +
      '<path d="M20,18 l-1.6,7 h3.2Z" fill="#6f645a"/><path d="M16.5,28.5h7" stroke="#4e463f" stroke-width="1.4" stroke-linecap="round"/>' +
      '<path d="M13,20 h-1.6 v6 h1.6" fill="#6f645a"/><path d="M26,20 h1.6 v6 h-1.6" fill="#6f645a"/>'),
    argentina: g(SKY + '<path d="M0,14 Q20,10 40,14 V22 H0Z" fill="#4f9d3e"/>' + fall(5, 17, 9, 12) + fall(16, 16, 7, 13) + fall(26, 17, 9, 12) +
      '<path d="M0,13 Q10,9 20,13 T40,12 V17 H0Z" fill="#3d8a33"/>' + water(29)),
    brazil: g(SKY + cloud(9, 10, .9) + '<path d="M2,40 L14,22 Q20,15 26,22 L38,40Z" fill="#5a9e4b"/><path d="M14,22 Q20,15 26,22 L22,24 Q20,21 18,24Z" fill="#4a8a3e"/>' +
      '<rect x="19" y="9" width="2.4" height="11" rx="1" fill="#f4f1ea"/><path d="M11,11.6 h18" stroke="#f4f1ea" stroke-width="2.2" stroke-linecap="round"/>' +
      '<circle cx="20.2" cy="7.6" r="1.6" fill="#f4f1ea"/><path d="M19,13 h2.4 v7 h-2.4Z" fill="#d9d4c8"/>'),
    peru: g(SKY + cloud(30, 9, .8) + '<path d="M18,30 L27,8 L36,30Z" fill="#4f8f45"/><path d="M27,8 L36,30 H30Z" fill="#3c7536"/>' +
      '<path d="M0,40 V31 Q12,27 24,30 T40,30 V40Z" fill="#7cbf5e"/>' +
      '<path d="M3,31h6v-3h5v3h5v-2h4v4H3Z" fill="#b8a690"/><path d="M4,34h22M5,36.5h24" stroke="#9c8a73" stroke-width="1.2"/>' +
      '<path d="M5,28 l2.5-2 2.5,2Z M14,28 l2.5-2 2.5,2Z" fill="#8a7860"/>'),
    colombia: g(SKY + sun(9, 9) + water(32) + '<path d="M2,32 V20 h9 v-3 h3 v3 h12 v-3 h3 v3 h9 v12Z" fill="#e3c27e"/>' +
      '<path d="M2,20 h36" stroke="#c9a35d" stroke-width="1.2"/><path d="M15,20 v-8 h10 v8Z" fill="#f6efe2"/><path d="M14,12 l6-4 6,4Z" fill="#c4553c"/>' +
      '<circle cx="20" cy="15" r="1.8" fill="#fff" stroke="#7a5b3a" stroke-width=".6"/><path d="M6,24h3v4H6Z M31,24h3v4h-3Z" fill="#a8844c"/>'),
    venezuela: g(SKY + cloud(9, 7, .8) + '<path d="M8,40 V13 l3-4 h18 l3,4 v27Z" fill="#9b6b45"/><path d="M29,9 l3,4 v27 h-6Z" fill="#7f5537"/>' +
      '<path d="M8,13 h24" stroke="#5c8f3f" stroke-width="2.4"/>' + fall(19, 13, 2.6, 22) + hills('#4f9d3e', '#3d8a33')),
    ecuador: g(SKY + water(26) + '<path d="M0,40 V30 Q20,26 40,30 V40Z" fill="#d9c27a"/>' +
      '<ellipse cx="21" cy="25" rx="11" ry="7.5" fill="#6d6a3c"/><path d="M12,22 l3-4 l4,3 l4-4 l4,3 l3-1 l2,4" fill="none" stroke="#565330" stroke-width="1.4" stroke-linejoin="round"/>' +
      '<path d="M31,26 q5-1 6,2 l-2,2 q-2-1-4,0Z" fill="#8a8458"/><circle cx="35.4" cy="26.8" r=".6" fill="#222"/>' +
      '<path d="M13,30 v3 M18,31 v3 M25,31 v3 M29,30 v3" stroke="#565330" stroke-width="2.2" stroke-linecap="round"/>'),
    bolivia: g('<rect width="40" height="40" rx="9" fill="#bfe3f7"/>' + '<path d="M0,22 l7-6 5,3 7-8 6,6 5-3 10,8Z" fill="#9aa7b8"/><path d="M19,11 l-3,4 3-1 3,2Z" fill="#fff"/>' +
      '<rect x="0" y="22" width="40" height="18" fill="#eef7fb"/><path d="M0,22 l7,5 5-3 7,8 6-6 5,3 10-7Z" fill="#cfe3ee" opacity=".8"/>' +
      '<path d="M2,32 l4-2 4,2 -4,2Z M14,35 l5-2 5,2 -5,2Z M27,31 l4-2 4,2 -4,2Z" fill="none" stroke="#c8d9e3" stroke-width=".8"/>'),
    paraguay: g(SKY + '<path d="M0,26 H40 V40 H0Z" fill="#5fb3e0"/><path d="M2,12 h36 l-3,16 H5Z" fill="#b9bfc6"/><path d="M5,28 h30 l3-16 h-2 l-3,16Z" fill="#9ea5ad"/>' +
      fall(10, 14, 5, 13) + fall(25, 14, 5, 13) + '<path d="M2,12 h36" stroke="#7f868e" stroke-width="1.6"/>'),
    uruguay: g(SKY + water(31) + '<path d="M0,31 Q12,27 24,30 T40,29 V33 H0Z" fill="#cdb48a"/>' +
      '<path d="M17,31 L18.4,10 h3.2 L23,31Z" fill="#f7f4ee"/><path d="M21.6,10 L23,31 h-2Z" fill="#dcd6cb"/><path d="M17.6,16h4.8M17.3,22h5.4" stroke="#c44b3b" stroke-width="2"/>' +
      '<rect x="17" y="6.5" width="6" height="4" rx="1" fill="#ffd45c" stroke="#3b3b3b" stroke-width=".8"/><path d="M16.4,6.5 l3.6-3 3.6,3Z" fill="#3b3b3b"/>' +
      '<path d="M4,31 v-6 h3 v-2 h2 v8Z M30,31 v-5 h5 v5Z" fill="#b59b70"/>'),
    guyana: g(SKY + '<path d="M0,16 Q20,12 40,16 V24 H0Z" fill="#3f8f3a"/>' + fall(15, 16, 10, 16) + '<path d="M0,14 Q20,10 40,14 V18 H0Z" fill="#2f7a2f"/>' +
      '<path d="M0,24 h15 v12 H0Z M25,24 h15 v12 H25Z" fill="#7b5a3a"/>' + water(33)),
    suriname: g(SKY + '<path d="M0,40 V26 H40 V40Z" fill="#2f7a2f"/>' +
      '<circle cx="9" cy="20" r="7" fill="#3f9a3f"/><circle cx="21" cy="15" r="8.5" fill="#2f8a35"/><circle cx="32" cy="21" r="6.5" fill="#4aa84a"/>' +
      '<circle cx="15" cy="25" r="6" fill="#2a7a30"/><circle cx="27" cy="26" r="6" fill="#3a9040"/>' +
      '<path d="M20,40 v-12 M9,40 v-10 M31,40 v-9" stroke="#6b4a2e" stroke-width="2"/>'),
    // ── North America ──
    united_states: g(SKY + water(32) + '<path d="M13,33 h14 l-2-4 h-10Z" fill="#9c8f80"/>' +
      '<path d="M16,29 l1-12 h6 l1,12Z" fill="#6fbfa6"/><path d="M23,17 l1,12 h-3Z" fill="#58a890"/>' +
      '<circle cx="20" cy="14.5" r="2.6" fill="#6fbfa6"/><path d="M16.6,12.6 l-1.4-2.4 M18.2,11.6 l-.6-2.8 M20,11.2 v-2.9 M21.8,11.6 l.6-2.8 M23.4,12.6 l1.4-2.4" stroke="#58a890" stroke-width="1.1" stroke-linecap="round"/>' +
      '<path d="M23,16 l3-8" stroke="#6fbfa6" stroke-width="2" stroke-linecap="round"/><path d="M25.2,7.6 q1.4-2.6 1.4-4 q1.4,1.6 0,4Z" fill="#ffb02e"/>'),
    canada: g(SKY + cloud(30, 10, .8) + water(34) + '<path d="M0,34 h40 v-3 H0Z" fill="#8c96a3"/>' +
      '<path d="M19.2,31 L19.6,7 h.8 L20.8,31Z" fill="#9aa1aa"/><path d="M18,31 l1.2-14 h1.6 l1.2,14Z" fill="#b5bcc4"/>' +
      '<ellipse cx="20" cy="16.5" rx="3.4" ry="1.8" fill="#7e8691"/><path d="M20,7 v-5" stroke="#6e757f" stroke-width=".9"/>' +
      '<path d="M5,31 v-6 h3 v6 M9,31 v-9 h3 v9 M28,31 v-8 h3 v8 M32,31 v-5 h4 v5" fill="#a7b0ba"/>'),
    mexico: g(SKY + '<path d="M0,34 Q20,30 40,34 V40 H0Z" fill="#7cbf5e"/>' +
      '<path d="M5,34 L11,16 h18 L35,34Z" fill="#d8c08f"/><path d="M29,16 L35,34 h-5 L26,16Z" fill="#c2a876"/>' +
      '<path d="M7,29 h26 M8.7,24 h22.6 M10.3,19.5 h19.4" stroke="#b49a68" stroke-width="1"/>' +
      '<path d="M18,34 V16 h4 V34Z" fill="#c9b07e"/><path d="M14,16 v-5 h12 v5Z" fill="#cdb684"/><path d="M13,11 h14 v-1.6 H13Z" fill="#b49a68"/><path d="M18.6,16 v-3.4 h2.8 V16Z" fill="#6b5a3e"/>'),
    // ── Europe ──
    italy: g(SKY + '<path d="M0,34 H40 V40 H0Z" fill="#c9b99a"/>' +
      '<path d="M4,34 V14 Q20,6 36,14 V34Z" fill="#d6b07a"/><path d="M26,10.4 Q32,11.6 36,14 V34 H29 V20Z" fill="#c09564"/>' +
      '<g fill="#7a5a36">' + [7, 12, 17, 22].map(function(x) { return '<path d="M' + x + ',33 v-4 a1.8,1.8 0 0,1 3.6,0 v4Z M' + x + ',25 v-3.4 a1.8,1.8 0 0,1 3.6,0 V25Z M' + x + ',18 v-2.4 a1.8,1.8 0 0,1 3.6,0 V18Z"/>'; }).join('') + '</g>' +
      '<path d="M4,26.4 H30 M4,19.4 H30" stroke="#b58e5e" stroke-width="1"/>'),
    spain: g(SKY + '<path d="M0,35 H40 V40 H0Z" fill="#c9b99a"/>' +
      '<path d="M6,35 V20 h28 V35Z" fill="#d8c197"/>' +
      '<path d="M9,20 L11,5 L13,20Z M15,20 L17.5,3 L20,20Z M21,20 L23.5,3 L26,20Z M28,20 L30,6 L32,20Z" fill="#c8a978"/>' +
      '<path d="M17.5,3 L20,20 H18.4Z M23.5,3 L26,20 h-1.6Z" fill="#b39060"/>' +
      '<circle cx="11" cy="5" r="1" fill="#e2a33b"/><circle cx="17.5" cy="3" r="1" fill="#e2a33b"/><circle cx="23.5" cy="3" r="1" fill="#e2a33b"/><circle cx="30" cy="6" r="1" fill="#e2a33b"/>' +
      '<path d="M17,35 v-7 a3,3 0 0,1 6,0 v7Z" fill="#8a6b44"/><path d="M9,24h3v4H9Z M28,24h3v4h-3Z" fill="#9c7c50"/>'),
    france: g(SKY + cloud(32, 9, .7) + '<path d="M0,35 H40 V40 H0Z" fill="#9ccc7a"/>' +
      '<path d="M10,35 L17,14 L19.2,3 h1.6 L23,14 L30,35 h-5 q-5-8-10,0Z" fill="#8a6a4a"/>' +
      '<path d="M13.6,26 h12.8 M15.6,20 h8.8 M17.4,14 h5.2" stroke="#6f5338" stroke-width="1.4"/>' +
      '<path d="M15,35 q5-8 10,0" fill="none" stroke="#6f5338" stroke-width="1"/><path d="M20,3 v-2" stroke="#6f5338" stroke-width=".8"/>' +
      '<path d="M17,14 L19.2,3 L18.6,14Z M14,26 L17,14 l1,0 -2,12Z" fill="#a8845e"/>'),
    germany: g(SKY + '<path d="M0,35 H40 V40 H0Z" fill="#c9c2b2"/>' +
      '<path d="M5,35 V16 H35 V35Z" fill="#e6d9bd"/><path d="M4,16 h32 v-3 H4Z" fill="#d7c7a5"/><path d="M8,13 h24 v-2.6 H8Z" fill="#e6d9bd"/>' +
      '<g fill="#b9a780">' + [7, 12.2, 17.4, 22.6, 27.8].map(function(x) { return '<rect x="' + x + '" y="17" width="2.2" height="18"/>'; }).join('') + '</g>' +
      '<path d="M16,10.4 l1-3 h6 l1,3Z" fill="#5f8a7a"/><path d="M17.4,7.4 l1-2.4 l1.6,1.2 l1.6-1.2 l1,2.4Z" fill="#4e7466"/>'),
    united_kingdom: g(SKY + cloud(9, 10, .8) + '<path d="M0,36 H40 V40 H0Z" fill="#7a8794"/>' +
      '<path d="M15,36 V15 h10 V36Z" fill="#d4b77e"/><path d="M22,15 h3 V36 h-3Z" fill="#bb9c62"/>' +
      '<rect x="14" y="12" width="12" height="4" fill="#c2a46a"/><circle cx="20" cy="18.6" r="3.2" fill="#fff9e8" stroke="#5c4a2e" stroke-width=".8"/><path d="M20,18.6 v-2 M20,18.6 h1.6" stroke="#333" stroke-width=".6"/>' +
      '<path d="M14.5,12 L20,3 L25.5,12Z" fill="#56707a"/><path d="M20,3 v-2.4" stroke="#56707a" stroke-width=".8"/>' +
      '<path d="M16.6,24 h6.8 M16.6,28 h6.8 M16.6,32 h6.8" stroke="#a88a52" stroke-width=".9"/>'),
    greece: g(SKY + sun(33, 8) + '<path d="M0,33 Q20,29 40,33 V40 H0Z" fill="#c9b37f"/>' +
      '<path d="M4,31 h32 v2.4 H4Z" fill="#e6dcc6"/><path d="M5,17 h30 v-2.6 H5Z" fill="#e6dcc6"/><path d="M5,14.4 L20,8 L35,14.4Z" fill="#eee5d0"/>' +
      '<g fill="#efe7d4">' + [6, 10.4, 14.8, 19.2, 23.6, 28, 32.2].map(function(x) { return '<rect x="' + x + '" y="17" width="2.3" height="14"/>'; }).join('') + '</g>' +
      '<g fill="#d2c6a8">' + [7.6, 12, 16.4, 20.8, 25.2, 29.6, 33.8].map(function(x) { return '<rect x="' + x + '" y="17" width=".7" height="14"/>'; }).join('') + '</g>'),
    portugal: g(SKY + water(30) +
      '<path d="M9,34 V21 h22 V34Z" fill="#efe9dc"/><path d="M15,21 V8 h10 V21Z" fill="#f4efe4"/><path d="M22,8 h3 V21 h-3Z M27,21 h4 V34 h-4Z" fill="#ddd4c2"/>' +
      '<path d="M15,8 v-2 h1.6 v2 h1.8 v-2 h1.6 v2 h1.8 v-2 h1.6 v2 h1.8 v-2 h1.6 v2Z" fill="#e7dfcd"/>' +
      '<path d="M9,21 v-2 h2 v2 h2.5 v-2 h2 v2 M25,21 v-2 h2 v2 h2 v-2 h2 v2" fill="#e7dfcd"/>' +
      '<path d="M18.6,16 v-2.8 a1.4,1.4 0 0,1 2.8,0 V16Z M12,30 v-3 a1.2,1.2 0 0,1 2.4,0 v3Z" fill="#8a7b62"/>' +
      '<path d="M14.4,10 l-1.4,-1 v3Z M25.6,10 l1.4,-1 v3Z" fill="#cbbf9f"/>'),
    // ── Africa ──
    kenya: g(SKY + '<path d="M2,36 L14,18 L18,20 L22,8 L26,17 L30,14 L38,36Z" fill="#7c7f86"/>' +
      '<path d="M22,8 L26,17 L24,15.6 L22,17 L20.6,13.4 L18,20 L19.4,13Z" fill="#fff"/><path d="M14,18 L16,19.6 L13,21Z M30,14 l2,4 -3,-1Z" fill="#fff"/>' +
      '<path d="M0,36 Q20,31 40,36 V40 H0Z" fill="#c8b35a"/><path d="M6,36 v-4 M7.5,34 h-3 M33,36 v-5 M35,33 h-4" stroke="#5c7a2e" stroke-width="1.6" stroke-linecap="round"/>'),
    egypt: g('<rect width="40" height="40" rx="9" fill="#fbe8c4"/>' + sun(33, 8) +
      '<path d="M0,34 H40 V40 H0Z" fill="#e2bf7c"/>' +
      '<path d="M3,34 L14,14 L25,34Z" fill="#e2b866"/><path d="M14,14 L25,34 H18Z" fill="#c7974a"/>' +
      '<path d="M20,34 L28,19 L36,34Z" fill="#e2b866"/><path d="M28,19 L36,34 H31Z" fill="#c7974a"/>' +
      '<path d="M1,34 L6,25.5 L11,34Z" fill="#d9ab58"/>'),
    south_africa: g(SKY + water(33) +
      '<path d="M0,33 L6,16 Q8,13 12,13.6 H30 Q34,13 35.6,16 L40,33Z" fill="#7d8a6a"/><path d="M30,13.6 Q34,13 35.6,16 L40,33 H34Z" fill="#66724f"/>' +
      '<path d="M5,15 q4-4 9-2 q3-3 7-1 q4-3 8,0 q4-1 7,3 q-14,1-31,0Z" fill="#fff"/>' +
      '<path d="M2,33 h36" stroke="#e8e2cf" stroke-width="1.2"/><path d="M6,33 v-2 h3 v2 M12,33 v-3 h2 v3 M27,33 v-3 h3 v3" fill="#e8e2cf"/>'),
    morocco: g('<rect width="40" height="40" rx="9" fill="#fde5c4"/>' + '<path d="M0,35 H40 V40 H0Z" fill="#d9a66b"/>' +
      '<path d="M14,35 V10 h12 V35Z" fill="#cf8f5a"/><path d="M22,10 h4 V35 h-4Z" fill="#b8784a"/>' +
      '<path d="M14,10 v-2 h12 v2Z" fill="#e0a774"/><path d="M17,8 V4 h6 V8Z" fill="#cf8f5a"/><path d="M18.2,4 a1.8,1.8 0 0,1 3.6,0Z" fill="#e3b24a"/><path d="M20,2.2 v-1.8" stroke="#a87b2c" stroke-width=".7"/>' +
      '<path d="M16.4,14 h7.2 v3 h-7.2Z M16.4,21 h7.2 v3 h-7.2Z" fill="#a56a3e" opacity=".55"/><path d="M18.4,30 a1.6,1.6 0 0,1 3.2,0 V35 h-3.2Z" fill="#7a4a2a"/>' +
      '<path d="M4,35 c-1-4 1-7 2-9 c1,2 3,5 2,9Z M33,35 c-1-4 1-7 2-9 c1,2 3,5 2,9Z" fill="#4f8a3e"/>'),
    nigeria: g(SKY + '<path d="M0,34 Q20,30 40,34 V40 H0Z" fill="#7cbf5e"/>' +
      '<path d="M5,34 C5,18 11,9 20,9 C29,9 35,18 35,34Z" fill="#8c7766"/><path d="M27,11.6 C32,15 35,22 35,34 H30 C30,23 29,16 27,11.6Z" fill="#76625a"/>' +
      '<path d="M12,20 q3-2 5,0 M21,16 q3-2 5,0 M14,27 q2-1.4 4,0" stroke="#5e4c42" stroke-width="1" fill="none"/>' +
      '<path d="M16.6,23 a1.2,1.6 0 1,0 2.4,0 a1.2,1.6 0 1,0 -2.4,0 M22,23 a1.2,1.6 0 1,0 2.4,0 a1.2,1.6 0 1,0 -2.4,0" fill="#5e4c42" opacity=".6"/>'),
    // ── Asia ──
    japan: g(SKY + sun(9, 9) + '<path d="M2,34 L16,13 Q20,9 24,13 L38,34Z" fill="#5f7fb8"/><path d="M24,13 L38,34 H31Z" fill="#4b6aa0"/>' +
      '<path d="M16,13 Q20,9 24,13 L26,16 L23.4,15 L22,17 L20,15.4 L18,17 L16.6,15 L14,16Z" fill="#fff"/>' +
      '<path d="M0,34 Q20,30 40,34 V40 H0Z" fill="#7cbf5e"/><path d="M28,34 v-6 h2 v6 M26.4,28.4 h5.2 M26,26.8 h6" stroke="#d64a3a" stroke-width="1.2"/>'),
    china: g(SKY + '<path d="M0,40 V24 Q8,16 16,22 Q24,14 32,20 Q36,22 40,18 V40Z" fill="#6aa84f"/>' +
      '<path d="M0,30 Q8,22 16,28 Q24,20 32,26 Q36,28 40,24" fill="none" stroke="#b9a68a" stroke-width="4"/>' +
      '<path d="M0,28 Q8,20 16,26 Q24,18 32,24 Q36,26 40,22" fill="none" stroke="#d6c4a6" stroke-width="1.2" stroke-dasharray="1.4 1"/>' +
      '<path d="M13,26 v-8 h7 v7Z" fill="#c4b08f"/><path d="M12.4,18 h8.2 v-1.6 h-8.2Z" fill="#a8946f"/><path d="M15.2,26 v-3 a1.3,1.3 0 0,1 2.6,0 v2.6Z" fill="#6b5a40"/>' +
      '<path d="M29,23 v-6 h5 v6Z" fill="#c4b08f"/>'),
    india: g(SKY + '<path d="M0,35 H40 V40 H0Z" fill="#9fd0e8"/>' +
      '<path d="M8,35 V22 h24 V35Z" fill="#f6f3ec"/><path d="M13,22 Q13,12 20,9 Q27,12 27,22Z" fill="#fbfaf6"/><path d="M20,9 Q27,12 27,22 h-4 Q23,13 20,9Z" fill="#e7e2d6"/>' +
      '<path d="M20,9 v-3" stroke="#d4c49a" stroke-width=".8"/><path d="M17,35 v-7 a3,3 0 0,1 6,0 v7Z" fill="#d8d0bd"/>' +
      '<path d="M4,35 V15 h1.8 V35Z M34.2,35 V15 H36 V35Z" fill="#f2eee4"/><circle cx="4.9" cy="14" r="1.4" fill="#f2eee4"/><circle cx="35.1" cy="14" r="1.4" fill="#f2eee4"/>' +
      '<circle cx="11" cy="20.4" r="2" fill="#f6f3ec"/><circle cx="29" cy="20.4" r="2" fill="#f6f3ec"/>'),
    south_korea: g(SKY + '<path d="M0,40 V31 Q16,28 40,31 V40Z" fill="#c9b99a"/>' +
      '<path d="M8,31 V22 h24 V31Z" fill="#c8513f"/><path d="M8,22 h24" stroke="#3f7a5a" stroke-width="1.6"/>' +
      '<path d="M2,22 Q8,19 10,15 H30 Q32,19 38,22Z" fill="#3c4a5a"/><path d="M2,22 Q5,20.6 6.4,19 h27.2 Q35,20.6 38,22Z" fill="#2c3846"/>' +
      '<path d="M13,15 Q15,12 16.6,10.4 H23.4 Q25,12 27,15Z" fill="#3c4a5a"/><path d="M12,31 V24 M17,31 V24 M23,31 V24 M28,31 V24" stroke="#9c3a2c" stroke-width="1.2"/>'),
    thailand: g(SKY + '<path d="M0,35 H40 V40 H0Z" fill="#c9b99a"/>' +
      '<path d="M7,35 V24 h26 V35Z" fill="#f4ead4"/><path d="M4,25 L11,17 H29 L36,25Z" fill="#d9473a"/><path d="M9,19.6 L14,13.6 H26 L31,19.6Z" fill="#2f7a5a"/>' +
      '<path d="M14,14 L20,4 L26,14Z" fill="#e8b43c"/><path d="M20,4 L26,14 h-3Z" fill="#c8942a"/><path d="M20,4 V1" stroke="#c8942a" stroke-width=".9"/>' +
      '<path d="M4,25 l-1.4-2.6 M36,25 l1.4-2.6 M9,19.6 l-1.2-2.2 M31,19.6 l1.2-2.2" stroke="#e8b43c" stroke-width="1.1" stroke-linecap="round"/>' +
      '<path d="M18,35 v-6 a2,2 0 0,1 4,0 v6Z" fill="#8a6a3a"/>'),
    singapore: g('<rect width="40" height="40" rx="9" fill="#ffe1cf"/>' + water(32) +
      '<path d="M7,32 L9,13 h5 L13,32Z M17.5,32 L18.5,13 h5 L22.5,32Z M27,32 L26,13 h5 L33,32Z" fill="#9fb4c8"/>' +
      '<path d="M9,13 h5 L13,32 h-1.6Z M18.5,13 h5 L22.5,32 H21Z M26,13 h5 L33,32 h-2Z" fill="#7f94a8" opacity=".55"/>' +
      '<path d="M5,12.6 Q20,9 36,11.4 L35.4,13.4 Q20,11.4 5.4,14Z" fill="#5b6f84"/><path d="M33,11.2 q3,-1 4,.4" stroke="#5b6f84" stroke-width="1.6" fill="none"/>'),
    indonesia: g(SKY + '<path d="M0,36 Q20,31 40,36 V40 H0Z" fill="#6aa84f"/>' +
      '<path d="M3,36 h34 v-3 H3Z M6,33 h28 v-3 H6Z M9,30 h22 v-3 H9Z" fill="#8f8a80"/><path d="M3,36 h34 v-1 H3Z M6,33 h28 v-1 H6Z M9,30 h22 v-1 H9Z" fill="#77726a"/>' +
      '<path d="M12,27 a8,7 0 0,1 16,0Z" fill="#a29d92"/><path d="M20,13 v7" stroke="#8f8a80" stroke-width="2.4" stroke-linecap="round"/><path d="M17,21 a3,3 0 0,1 6,0Z" fill="#8f8a80"/>' +
      '<path d="M10,26 a1.4,1.6 0 0,1 2.8,0Z M27.2,26 a1.4,1.6 0 0,1 2.8,0Z M5,30 a1.4,1.6 0 0,1 2.8,0Z M32.2,30 a1.4,1.6 0 0,1 2.8,0Z" fill="#a29d92"/>'),
    taiwan: g(SKY + cloud(9, 12, .8) + '<path d="M0,36 H40 V40 H0Z" fill="#7d93a8"/>' +
      '<path d="M16,36 L17,6 h6 L24,36Z" fill="#5b8f8a"/><path d="M21,6 h2 L24,36 h-3Z" fill="#4a7a76"/>' +
      '<path d="M15.6,30 h8.8 M15.8,25 h8.4 M16.1,20 h7.8 M16.4,15 h7.2 M16.7,10 h6.6" stroke="#3b6662" stroke-width="1.2"/>' +
      '<path d="M18.6,6 V2 h2.8 V6Z" fill="#4a7a76"/><path d="M20,2 V0" stroke="#3b6662" stroke-width=".8"/>' +
      '<path d="M5,36 v-8 h4 v8 M29,36 v-10 h4 v10" fill="#94a7b8"/>'),
    // ── Oceania ──
    australia: g(SKY + water(29) +
      '<path d="M2,30 h36 v2.6 H2Z" fill="#c8a77a"/>' +
      '<path d="M5,30 Q8,15 18,13 Q14,21 15,30Z" fill="#fbfaf5"/><path d="M14,30 Q17,13 27,10 Q22,20 24,30Z" fill="#fff"/><path d="M23,30 Q26,18 35,17 Q31,23 32,30Z" fill="#f1efe8"/>' +
      '<path d="M15,30 Q14,21 18,13 Q16,22 17.2,30Z M24,30 Q22,20 27,10 Q24.6,21 26,30Z" fill="#dedbd1"/>'),
    new_zealand: g(SKY + cloud(31, 8, .8) + '<path d="M0,28 H40 V40 H0Z" fill="#3f7fa8"/>' +
      '<path d="M8,28 L18,6 L26,28Z" fill="#4c6b5a"/><path d="M18,6 L26,28 H21Z" fill="#3c5848"/><path d="M18,6 l2.6,5.6 -2.2-1 -2,1.6Z" fill="#fff"/>' +
      '<path d="M0,28 L5,14 L11,28Z M27,28 L33,13 L40,24 V28Z" fill="#5f8a6a"/>' +
      '<path d="M8,28 L18,40 H6Z" fill="#355a48" opacity=".5"/><path d="M4,33 h8 M22,35 h10" stroke="#9fd0ea" stroke-width="1" stroke-linecap="round"/>')
  };

  // Rounds the icon's corners by painting the outside of a rounded
  // square in the badge colour (no clipPath ids needed).
  function corners(bg) {
    return '<path fill-rule="evenodd" fill="' + (bg || '#fff') + '" d="M-1,-1H41V41H-1Z M9,0H31A9,9 0 0,1 40,9V31A9,9 0 0,1 31,40H9A9,9 0 0,1 0,31V9A9,9 0 0,1 9,0Z"/>' +
      '<rect x=".5" y=".5" width="39" height="39" rx="8.6" fill="none" stroke="rgba(30,40,60,.18)"/>';
  }
  function landmarkSVG(key, cls, label, bg) {
    if (!L[key]) return '';
    return '<svg class="' + (cls || 'we-lm-svg') + '" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"' +
      (label ? ' role="img" aria-label="' + String(label).replace(/[&<>"]/g, '') + '"' : ' aria-hidden="true"') + '>' +
      L[key] + corners(bg) + '</svg>';
  }
  function has(key) { return !!L[key]; }

  return { landmark: function(k, bg) { return L[k] ? L[k] + corners(bg) : ''; }, landmarkSVG: landmarkSVG, has: has };
})();
