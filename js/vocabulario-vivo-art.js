/* ================================================================
   VOCABULARIO VIVO — hand-built graphics (canvas + inline SVG)
   Wood-grain tile textures, small drawn illustrations for concrete
   roots, stone medallions for the rest, the animated word tree and
   the mode icons. No external images.
   Exposes one global: VocabularioVivoArt
   ================================================================ */

var VocabularioVivoArt = (function() {
  'use strict';

  var uid = 0;
  function nid(p) { uid++; return 'vv' + p + uid; }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function rng(seed) {
    var s = seed >>> 0;
    return function() {
      s = s + 0x6D2B79F5 | 0;
      var t = Math.imul(s ^ s >>> 15, 1 | s);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function makeNoise(seed) {
    var r = rng(seed), P = new Float32Array(256 * 256);
    for (var i = 0; i < P.length; i++) P[i] = r();
    function v(ix, iy) { return P[((iy & 255) << 8) | (ix & 255)]; }
    return function(x, y) {
      var ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
      var sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      var a = v(ix, iy), b = v(ix + 1, iy), c = v(ix, iy + 1), d = v(ix + 1, iy + 1);
      return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
    };
  }

  // ---------------------------------------------------------------
  //  Wood grain → data URL (horizontal grain, a knot now and then)
  // ---------------------------------------------------------------
  var SPECIES = {
    maple:  { base: [233, 199, 146], dark: [196, 150, 92], seed: 3 },
    walnut: { base: [134, 88, 52],   dark: [84, 52, 28],   seed: 8 },
    cherry: { base: [196, 112, 70],  dark: [146, 70, 38],  seed: 5 },
    oak:    { base: [176, 128, 78],  dark: [122, 82, 44],  seed: 11 }
  };
  var woodCache = {};
  function woodURL(name) {
    if (woodCache[name]) return woodCache[name];
    var sp = SPECIES[name] || SPECIES.maple;
    var Wd = 260, Hd = 110;
    var c = document.createElement('canvas');
    c.width = Wd; c.height = Hd;
    var g = c.getContext('2d');
    if (!g) return '';
    var img = g.createImageData(Wd, Hd), d = img.data;
    var n = makeNoise(sp.seed), r = rng(sp.seed * 7);
    var kx = 60 + r() * 140, ky = 20 + r() * 70;
    for (var y = 0; y < Hd; y++) {
      for (var x = 0; x < Wd; x++) {
        var dx = x - kx, dy = (y - ky) * 2.2;
        var knot = 26 / (Math.sqrt(dx * dx + dy * dy) + 8);
        var w = y + n(x * 0.012, y * 0.05) * 22 + knot * 9;
        var ring = Math.sin(w * 0.55) * 0.5 + 0.5;
        ring = Math.pow(ring, 3);
        var fib = n(x * 0.6, y * 2.2) * 0.35;
        var t = Math.min(1, ring * 0.55 + fib * 0.4 + knot * 0.12);
        var i = (y * Wd + x) * 4;
        d[i]     = sp.base[0] + (sp.dark[0] - sp.base[0]) * t;
        d[i + 1] = sp.base[1] + (sp.dark[1] - sp.base[1]) * t;
        d[i + 2] = sp.base[2] + (sp.dark[2] - sp.base[2]) * t;
        d[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    try { woodCache[name] = c.toDataURL('image/jpeg', 0.86); } catch (e) { woodCache[name] = ''; }
    return woodCache[name];
  }
  function installWood() {
    var root = document.documentElement;
    Object.keys(SPECIES).forEach(function(k) {
      var u = woodURL(k);
      if (u) root.style.setProperty('--vv-wood-' + k, 'url(' + u + ')');
    });
  }

  // ---------------------------------------------------------------
  //  Illustrations (64×64). Ink outline + flat colour + highlight.
  // ---------------------------------------------------------------
  var INK = '#4a3422';
  function S(body) { return body; }
  var ICONS = {
    water: function() {
      return '<path d="M32 7C32 7 13 30 13 41a19 19 0 0 0 38 0C51 30 32 7 32 7z" fill="#3d9be0" stroke="' + INK + '" stroke-width="2.2"/>' +
        '<path d="M32 13C27 20 18 32 18 41a14 14 0 0 0 6 11" fill="none" stroke="#8fd0ff" stroke-width="3" stroke-linecap="round" opacity="0.8"/>' +
        '<ellipse cx="25" cy="38" rx="3.5" ry="6.5" fill="#fff" opacity="0.75" transform="rotate(20 25 38)"/>' +
        '<path d="M22 47q5 4 10 0t10 0" fill="none" stroke="#1d5f9c" stroke-width="2" stroke-linecap="round"/>';
    },
    earth: function() {
      return '<circle cx="32" cy="32" r="22" fill="#3b8fd8" stroke="' + INK + '" stroke-width="2.2"/>' +
        '<path d="M19 20c5-3 10-2 12 2s-2 6 1 9-1 8-5 8-6-5-9-6-4-5-2-8 1-4 3-5zM38 14c4 1 9 4 11 9-3 0-5 2-7 1s-4-3-5-6 0-4 1-4zM40 34c4-2 8 0 9 3s-2 9-6 11-5-2-5-5 0-7 2-9z" fill="#5fae4a" stroke="' + INK + '" stroke-width="1.4"/>' +
        '<path d="M16 27a17 17 0 0 1 9-11" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.55"/>';
    },
    sprout: function() {
      return '<ellipse cx="32" cy="52" rx="20" ry="7" fill="#8a5a33" stroke="' + INK + '" stroke-width="2"/>' +
        '<path d="M32 50C32 40 32 33 31 26" stroke="#3e8a2e" stroke-width="3.4" fill="none" stroke-linecap="round"/>' +
        '<path d="M31 30C22 31 15 25 14 16c9 0 16 4 17 14z" fill="#6cc04a" stroke="' + INK + '" stroke-width="2"/>' +
        '<path d="M32 26C34 16 42 11 51 12c-1 9-8 15-19 14z" fill="#86d35b" stroke="' + INK + '" stroke-width="2"/>' +
        '<path d="M18 19q6 3 11 9M48 15q-7 3-13 9" stroke="#3e8a2e" stroke-width="1.4" fill="none"/>';
    },
    sun: function() {
      var rays = '';
      for (var i = 0; i < 10; i++) {
        var a = i * Math.PI / 5;
        rays += '<path d="M' + (32 + Math.cos(a - 0.17) * 16).toFixed(1) + ' ' + (32 + Math.sin(a - 0.17) * 16).toFixed(1) +
          'L' + (32 + Math.cos(a) * 28).toFixed(1) + ' ' + (32 + Math.sin(a) * 28).toFixed(1) +
          'L' + (32 + Math.cos(a + 0.17) * 16).toFixed(1) + ' ' + (32 + Math.sin(a + 0.17) * 16).toFixed(1) + 'z" fill="#f7a42b" stroke="' + INK + '" stroke-width="1.5" stroke-linejoin="round"/>';
      }
      return rays + '<circle cx="32" cy="32" r="14" fill="#ffd23f" stroke="' + INK + '" stroke-width="2.2"/>' +
        '<path d="M24 28a9 9 0 0 1 7-7" stroke="#fff6c2" stroke-width="3" fill="none" stroke-linecap="round"/>';
    },
    moon: function() {
      return '<path d="M38 8a24 24 0 1 0 18 38A20 20 0 1 1 38 8z" fill="#f3e6a8" stroke="' + INK + '" stroke-width="2.2"/>' +
        '<circle cx="24" cy="30" r="3.4" fill="#d8c77d"/><circle cx="31" cy="44" r="2.4" fill="#d8c77d"/><circle cx="20" cy="42" r="1.8" fill="#d8c77d"/>' +
        '<circle cx="50" cy="14" r="1.6" fill="#f7c948"/><circle cx="56" cy="26" r="1.2" fill="#f7c948"/>';
    },
    star: function() {
      return '<path d="M32 6l7.6 16 17.4 2-12.9 12 3.4 17.4L32 44.6 16.5 53.4 19.9 36 7 24l17.4-2z" fill="#ffcc33" stroke="' + INK + '" stroke-width="2.2" stroke-linejoin="round"/>' +
        '<path d="M32 14l4 9" stroke="#fff4b8" stroke-width="3" stroke-linecap="round"/>';
    },
    bulb: function() {
      return '<path d="M32 8a17 17 0 0 0-10 31c2 2 3 4 3 7h14c0-3 1-5 3-7a17 17 0 0 0-10-31z" fill="#fff1a6" stroke="' + INK + '" stroke-width="2.2"/>' +
        '<path d="M28 40c0-6-4-9-4-14M36 40c0-6 4-9 4-14M28 40h8" stroke="#d99a06" stroke-width="1.6" fill="none"/>' +
        '<rect x="25" y="46" width="14" height="9" rx="2" fill="#b8bec7" stroke="' + INK + '" stroke-width="2"/>' +
        '<path d="M25 50h14" stroke="' + INK + '" stroke-width="1.4"/>' +
        '<path d="M8 22l-4-2M56 22l4-2M10 34H5M54 34h5M14 10l-3-3M50 10l3-3" stroke="#f59e0b" stroke-width="2.4" stroke-linecap="round"/>';
    },
    candle: function() {
      return '<circle cx="32" cy="18" r="13" fill="#ffd56b" opacity="0.35"/>' +
        '<path d="M32 6c5 6 6 10 3 14-1 2-5 2-6 0-3-4-2-8 3-14z" fill="#ff9d2e" stroke="' + INK + '" stroke-width="1.8"/>' +
        '<path d="M32 12c2 3 2 5 1 7h-2c-1-2-1-4 1-7z" fill="#fff3a0"/>' +
        '<rect x="24" y="24" width="16" height="28" rx="3" fill="#fbf4e2" stroke="' + INK + '" stroke-width="2.2"/>' +
        '<path d="M28 24v10" stroke="#e8dcc0" stroke-width="3" stroke-linecap="round"/>' +
        '<ellipse cx="32" cy="54" rx="15" ry="4" fill="#c9a36a" stroke="' + INK + '" stroke-width="2"/>';
    },
    foot: function() {
      return '<path d="M26 22c8-2 15 4 15 14 0 9-3 14-2 19 1 4-3 6-7 6s-9-3-9-9c0-5-4-9-4-16s1-13 7-14z" fill="#f2b896" stroke="' + INK + '" stroke-width="2.2"/>' +
        '<ellipse cx="21" cy="14" rx="4.6" ry="5.6" fill="#f2b896" stroke="' + INK + '" stroke-width="2"/>' +
        '<ellipse cx="30" cy="10" rx="3.6" ry="4.6" fill="#f2b896" stroke="' + INK + '" stroke-width="2"/>' +
        '<ellipse cx="37.5" cy="11" rx="3" ry="3.8" fill="#f2b896" stroke="' + INK + '" stroke-width="2"/>' +
        '<ellipse cx="43" cy="14.5" rx="2.6" ry="3.2" fill="#f2b896" stroke="' + INK + '" stroke-width="2"/>' +
        '<ellipse cx="47" cy="19.5" rx="2.2" ry="2.8" fill="#f2b896" stroke="' + INK + '" stroke-width="2"/>' +
        '<path d="M27 30c0 6 2 10 2 16" stroke="#e39a78" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
    },
    hand: function() {
      return '<path d="M20 34V16a3.5 3.5 0 0 1 7 0v13V11a3.5 3.5 0 0 1 7 0v18V13a3.5 3.5 0 0 1 7 0v17-9a3.5 3.5 0 0 1 7 0v17c0 11-7 19-17 19-6 0-10-3-13-8l-7-11a3.5 3.5 0 0 1 6-4z" fill="#f2c09d" stroke="' + INK + '" stroke-width="2.2" stroke-linejoin="round"/>' +
        '<path d="M27 29v-4M34 29v-6M41 30v-5" stroke="#d99a7a" stroke-width="1.6" stroke-linecap="round"/>';
    },
    ship: function() {
      return '<path d="M31 8v34" stroke="' + INK + '" stroke-width="2.4"/>' +
        '<path d="M33 10c10 6 15 16 15 27H33z" fill="#fdf8ea" stroke="' + INK + '" stroke-width="2"/>' +
        '<path d="M29 15c-6 5-9 13-9 22h9z" fill="#f1e6c8" stroke="' + INK + '" stroke-width="2"/>' +
        '<path d="M31 8l8 3-8 3z" fill="#d6453a" stroke="' + INK + '" stroke-width="1.2"/>' +
        '<path d="M8 42h48l-6 10H15z" fill="#9b5a2e" stroke="' + INK + '" stroke-width="2.2" stroke-linejoin="round"/>' +
        '<path d="M11 46h42" stroke="#c07a43" stroke-width="2"/>' +
        '<path d="M4 56q5-4 10 0t10 0 10 0 10 0 10 0 6 0" fill="none" stroke="#3b8fd8" stroke-width="2.6" stroke-linecap="round"/>';
    },
    city: function() {
      return '<rect x="6" y="28" width="13" height="28" fill="#c9b79c" stroke="' + INK + '" stroke-width="2"/>' +
        '<rect x="18" y="14" width="14" height="42" fill="#9fb4c9" stroke="' + INK + '" stroke-width="2"/>' +
        '<rect x="31" y="22" width="13" height="34" fill="#e0a15e" stroke="' + INK + '" stroke-width="2"/>' +
        '<rect x="43" y="32" width="15" height="24" fill="#b7c99f" stroke="' + INK + '" stroke-width="2"/>' +
        '<path d="M25 14V7" stroke="' + INK + '" stroke-width="2"/>' +
        '<g fill="#ffe27a">' +
        '<rect x="9" y="33" width="3" height="4"/><rect x="13.5" y="33" width="3" height="4"/><rect x="9" y="41" width="3" height="4"/>' +
        '<rect x="21" y="19" width="3" height="4"/><rect x="26" y="19" width="3" height="4"/><rect x="21" y="28" width="3" height="4"/><rect x="26" y="36" width="3" height="4"/>' +
        '<rect x="34" y="27" width="3" height="4"/><rect x="39" y="27" width="3" height="4"/><rect x="34" y="36" width="3" height="4"/>' +
        '<rect x="46" y="37" width="3" height="4"/><rect x="52" y="37" width="3" height="4"/><rect x="46" y="45" width="3" height="4"/></g>' +
        '<path d="M3 56h58" stroke="' + INK + '" stroke-width="2.4"/>';
    },
    house: function() {
      return '<path d="M12 30h40v24H12z" fill="#f6ecd6" stroke="' + INK + '" stroke-width="2.2"/>' +
        '<path d="M6 32L32 10l26 22z" fill="#c4542f" stroke="' + INK + '" stroke-width="2.2" stroke-linejoin="round"/>' +
        '<path d="M14 27h36M20 22h24" stroke="#9c3f22" stroke-width="1.4" stroke-dasharray="3 2"/>' +
        '<rect x="28" y="38" width="9" height="16" fill="#7a4a24" stroke="' + INK + '" stroke-width="1.8"/>' +
        '<rect x="16" y="36" width="8" height="8" fill="#8ec5ec" stroke="' + INK + '" stroke-width="1.8"/>' +
        '<rect x="41" y="36" width="8" height="8" fill="#8ec5ec" stroke="' + INK + '" stroke-width="1.8"/>' +
        '<rect x="42" y="12" width="6" height="11" fill="#a78b6d" stroke="' + INK + '" stroke-width="1.8"/>';
    },
    eye: function() {
      return '<path d="M4 32C12 18 22 13 32 13s20 5 28 19c-8 14-18 19-28 19S12 46 4 32z" fill="#fff" stroke="' + INK + '" stroke-width="2.4"/>' +
        '<circle cx="32" cy="32" r="12" fill="#3f8a6b" stroke="' + INK + '" stroke-width="2"/>' +
        '<circle cx="32" cy="32" r="5.5" fill="#1d1d1d"/>' +
        '<circle cx="28" cy="27" r="3" fill="#fff"/>' +
        '<path d="M14 18l-3-4M24 13l-1-5M40 13l1-5M50 18l3-4" stroke="' + INK + '" stroke-width="2" stroke-linecap="round"/>';
    },
    lens: function() {
      return '<path d="M38 40l15 15" stroke="#7a4a24" stroke-width="7" stroke-linecap="round"/>' +
        '<path d="M38 40l15 15" stroke="' + INK + '" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>' +
        '<circle cx="27" cy="27" r="17" fill="#cfeaf7" stroke="' + INK + '" stroke-width="2.2"/>' +
        '<circle cx="27" cy="27" r="13" fill="none" stroke="#9aa3ad" stroke-width="3"/>' +
        '<path d="M18 22a10 10 0 0 1 8-7" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>';
    },
    far: function() {
      return '<rect x="4" y="8" width="56" height="30" rx="4" fill="#cfe6f7"/>' +
        '<path d="M4 38l12-12 8 7 10-14 12 12 8-5 6 12z" fill="#9db6c9" stroke="' + INK + '" stroke-width="1.6" stroke-linejoin="round"/>' +
        '<rect x="4" y="38" width="56" height="20" fill="#8cc45b" stroke="' + INK + '" stroke-width="2"/>' +
        '<path d="M28 58l3-20h2l3 20z" fill="#6b6f76" stroke="' + INK + '" stroke-width="1.6"/>' +
        '<path d="M32 56v-3M32 49v-3M32 43v-2" stroke="#f2c230" stroke-width="1.4"/>' +
        '<rect x="30" y="33" width="4" height="5" fill="#c4542f" stroke="' + INK + '" stroke-width="1"/>';
    },
    microbe: function() {
      var cil = '';
      for (var i = 0; i < 12; i++) {
        var a = i * Math.PI / 6;
        cil += '<path d="M' + (32 + Math.cos(a) * 17).toFixed(1) + ' ' + (32 + Math.sin(a) * 14).toFixed(1) + 'l' + (Math.cos(a) * 6).toFixed(1) + ' ' + (Math.sin(a) * 6).toFixed(1) + '" stroke="' + INK + '" stroke-width="1.8" stroke-linecap="round"/>';
      }
      return cil + '<ellipse cx="32" cy="32" rx="18" ry="15" fill="#8fd16a" stroke="' + INK + '" stroke-width="2.2"/>' +
        '<circle cx="36" cy="30" r="5" fill="#4f9a3a" stroke="' + INK + '" stroke-width="1.5"/>' +
        '<circle cx="24" cy="36" r="2" fill="#4f9a3a"/><circle cx="27" cy="25" r="1.5" fill="#4f9a3a"/>';
    },
    mountain: function() {
      return '<path d="M2 56L26 12l12 18 6-8 18 34z" fill="#8a9fb3" stroke="' + INK + '" stroke-width="2.2" stroke-linejoin="round"/>' +
        '<path d="M26 12l-7 13 4-2 3 4 4-5 3 2z" fill="#fff" stroke="' + INK + '" stroke-width="1.4" stroke-linejoin="round"/>' +
        '<path d="M2 56h60" stroke="' + INK + '" stroke-width="2.4"/>' +
        '<circle cx="52" cy="50" r="1.6" fill="' + INK + '"/><path d="M52 52v3" stroke="' + INK + '" stroke-width="1.4"/>';
    },
    hourglass: function() {
      return '<rect x="14" y="6" width="36" height="6" rx="2" fill="#a0683a" stroke="' + INK + '" stroke-width="2"/>' +
        '<rect x="14" y="52" width="36" height="6" rx="2" fill="#a0683a" stroke="' + INK + '" stroke-width="2"/>' +
        '<path d="M19 12c0 10 11 14 11 20S19 42 19 52h26c0-10-11-14-11-20s11-10 11-20z" fill="#e8f4fb" stroke="' + INK + '" stroke-width="2"/>' +
        '<path d="M23 16h18c-2 5-7 8-9 11-2-3-7-6-9-11zM22 51c2-5 7-8 10-8s8 3 10 8z" fill="#f2c063"/>' +
        '<path d="M32 30v13" stroke="#f2c063" stroke-width="1.6" stroke-dasharray="2 2"/>';
    },
    quill: function() {
      return '<path d="M52 6C34 10 22 24 17 44l5 2c6-18 18-30 30-40z" fill="#fdfaf3" stroke="' + INK + '" stroke-width="2.2" stroke-linejoin="round"/>' +
        '<path d="M50 9C38 16 28 28 21 44" stroke="#b9b0a0" stroke-width="1.6" fill="none"/>' +
        '<path d="M42 14l-6-2M36 20l-7-1M31 27l-7 0" stroke="#d6cfbf" stroke-width="1.4"/>' +
        '<path d="M17 44l-3 9 6-6" fill="#3b3f46" stroke="' + INK + '" stroke-width="1.8" stroke-linejoin="round"/>' +
        '<ellipse cx="14" cy="57" rx="10" ry="3.4" fill="#2b2f3a" stroke="' + INK + '" stroke-width="1.6"/>' +
        '<path d="M30 56q8-4 12 0t10-1" stroke="#2f4f8f" stroke-width="2" fill="none" stroke-linecap="round"/>';
    },
    speech: function() {
      return '<path d="M8 14a6 6 0 0 1 6-6h36a6 6 0 0 1 6 6v20a6 6 0 0 1-6 6H26l-12 10 2-10h-2a6 6 0 0 1-6-6z" fill="#fff" stroke="' + INK + '" stroke-width="2.4" stroke-linejoin="round"/>' +
        '<path d="M17 18h30M17 25h24M17 32h16" stroke="#e05a8a" stroke-width="3" stroke-linecap="round"/>';
    },
    ear: function() {
      return '<path d="M36 8c-12 0-21 9-21 21 0 6 3 9 5 12s2 10 8 11c5 1 7-3 7-6 0-4 7-7 9-13 2-4 3-6 3-10 0-9-4-15-11-15z" fill="#f2c09d" stroke="' + INK + '" stroke-width="2.2"/>' +
        '<path d="M28 28c0-7 4-11 9-11s8 4 7 9c-1 4-5 5-7 8" fill="none" stroke="#c98a68" stroke-width="2.4" stroke-linecap="round"/>' +
        '<path d="M50 20q5 6 0 12M55 15q8 11 0 22" stroke="#3b8fd8" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
    },
    sound: function() {
      return '<path d="M8 24h10l14-12v40L18 40H8z" fill="#d9603c" stroke="' + INK + '" stroke-width="2.2" stroke-linejoin="round"/>' +
        '<path d="M40 24q5 8 0 16M46 18q10 14 0 28M52 12q14 20 0 40" stroke="#3b8fd8" stroke-width="2.6" fill="none" stroke-linecap="round"/>';
    },
    crate: function() {
      return '<rect x="10" y="20" width="44" height="32" rx="2" fill="#c98a4b" stroke="' + INK + '" stroke-width="2.2"/>' +
        '<path d="M10 31h44M10 41h44" stroke="#9b5f2b" stroke-width="2"/>' +
        '<path d="M10 20l44 32M54 20L10 52" stroke="#9b5f2b" stroke-width="2.2" opacity="0.7"/>' +
        '<path d="M22 20c0-8 20-8 20 0" fill="none" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/>' +
        '<path d="M2 58h14l-4-3M16 58l-4 3" stroke="#e05a8a" stroke-width="2.4" stroke-linecap="round" fill="none"/>' +
        '<path d="M40 58h20l-4-3M60 58l-4 3" stroke="#e05a8a" stroke-width="2.4" stroke-linecap="round" fill="none"/>';
    },
    thermo: function() {
      return '<rect x="26" y="6" width="12" height="40" rx="6" fill="#fff" stroke="' + INK + '" stroke-width="2.2"/>' +
        '<rect x="29.5" y="18" width="5" height="30" rx="2.5" fill="#e0352b"/>' +
        '<circle cx="32" cy="50" r="9" fill="#e0352b" stroke="' + INK + '" stroke-width="2.2"/>' +
        '<path d="M38 14h5M38 20h3M38 26h5M38 32h3M38 38h5" stroke="' + INK + '" stroke-width="1.6"/>' +
        '<circle cx="29" cy="47" r="2.4" fill="#ff9c94"/>';
    },
    wheel: function() {
      var sp = '';
      for (var i = 0; i < 8; i++) {
        var a = i * Math.PI / 4;
        sp += '<path d="M' + (32 + Math.cos(a) * 6) + ' ' + (32 + Math.sin(a) * 6) + 'L' + (32 + Math.cos(a) * 20).toFixed(1) + ' ' + (32 + Math.sin(a) * 20).toFixed(1) + '" stroke="#a0683a" stroke-width="3.6" stroke-linecap="round"/>';
      }
      return '<circle cx="32" cy="32" r="25" fill="none" stroke="' + INK + '" stroke-width="2.2"/>' +
        '<circle cx="32" cy="32" r="22" fill="none" stroke="#b9773e" stroke-width="6"/>' +
        '<circle cx="32" cy="32" r="19" fill="none" stroke="' + INK + '" stroke-width="1.6"/>' + sp +
        '<circle cx="32" cy="32" r="7" fill="#7a4a24" stroke="' + INK + '" stroke-width="2"/><circle cx="32" cy="32" r="2.4" fill="#d9d3c7"/>';
    },
    ruler: function() {
      var t = '';
      for (var i = 0; i <= 10; i++) {
        var x = 10 + i * 4.4, h = i % 5 === 0 ? 9 : 5;
        t += '<path d="M' + x.toFixed(1) + ' 25v' + h + '" stroke="' + INK + '" stroke-width="1.4"/>';
      }
      return '<g transform="rotate(-18 32 32)"><rect x="6" y="24" width="52" height="16" rx="2" fill="#ffd54a" stroke="' + INK + '" stroke-width="2.2"/>' + t + '</g>' +
        '<path d="M10 52h44M10 49v6M54 49v6" stroke="#e05a8a" stroke-width="2.2" stroke-linecap="round"/>';
    },
    bricks: function() {
      var b = '';
      for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) {
        var off = r % 2 ? -7 : 0;
        var x = 6 + c * 14 + off;
        var w = 13;
        if (x < 6) { w -= 6 - x; x = 6; }
        if (x + w > 58) w = 58 - x;
        if (w > 2) b += '<rect x="' + x + '" y="' + (16 + r * 10) + '" width="' + w + '" height="9" rx="1" fill="' + (['#c4542f', '#b24a28', '#d0653d'][(r + c) % 3]) + '" stroke="' + INK + '" stroke-width="1.5"/>';
      }
      return '<rect x="5" y="15" width="54" height="42" fill="#d9ccb2"/>' + b +
        '<path d="M44 6l8 8-4 4-8-8zM44 10l-8 8" stroke="' + INK + '" stroke-width="2" fill="#9aa3ad" stroke-linejoin="round"/>';
    },
    heart: function() {
      return '<path d="M32 54C12 40 6 30 6 21c0-8 6-13 13-13 6 0 10 4 13 9 3-5 7-9 13-9 7 0 13 5 13 13 0 9-6 19-26 33z" fill="#e5484d" stroke="' + INK + '" stroke-width="2.2" stroke-linejoin="round"/>' +
        '<path d="M14 19c1-4 4-6 7-6" stroke="#ffb3b5" stroke-width="3" fill="none" stroke-linecap="round"/>';
    },
    crown: function() {
      return '<path d="M8 22l12 10 12-18 12 18 12-10-5 26H13z" fill="#f6c343" stroke="' + INK + '" stroke-width="2.2" stroke-linejoin="round"/>' +
        '<rect x="12" y="46" width="40" height="8" rx="2" fill="#e0a92a" stroke="' + INK + '" stroke-width="2"/>' +
        '<circle cx="32" cy="38" r="3.4" fill="#d6453a" stroke="' + INK + '" stroke-width="1.4"/>' +
        '<circle cx="21" cy="40" r="2.4" fill="#2f6db0"/><circle cx="43" cy="40" r="2.4" fill="#2f9a5b"/>' +
        '<circle cx="8" cy="22" r="2.6" fill="#f6c343" stroke="' + INK + '" stroke-width="1.6"/><circle cx="32" cy="13" r="2.6" fill="#f6c343" stroke="' + INK + '" stroke-width="1.6"/><circle cx="56" cy="22" r="2.6" fill="#f6c343" stroke="' + INK + '" stroke-width="1.6"/>';
    },
    tower: function() {
      return '<path d="M16 18h6v-6h6v6h8v-6h6v6h6v38H16z" fill="#b9b1a3" stroke="' + INK + '" stroke-width="2.2" stroke-linejoin="round"/>' +
        '<path d="M16 28h32M16 38h32M16 48h32M24 28v10M38 38v10M30 48v8M30 18v10" stroke="#8f877a" stroke-width="1.4"/>' +
        '<path d="M27 56V46a5 5 0 0 1 10 0v10z" fill="#6b4423" stroke="' + INK + '" stroke-width="1.8"/>' +
        '<rect x="29" y="24" width="6" height="8" rx="3" fill="#2b2f3a"/>' +
        '<path d="M32 12V2l10 4-10 4" fill="#d6453a" stroke="' + INK + '" stroke-width="1.4"/>';
    },
    envelope: function() {
      return '<rect x="10" y="16" width="44" height="32" rx="3" fill="#fdf8ea" stroke="' + INK + '" stroke-width="2.2"/>' +
        '<path d="M10 18l22 17 22-17" fill="none" stroke="' + INK + '" stroke-width="2"/>' +
        '<circle cx="32" cy="34" r="5" fill="#c0392b" stroke="' + INK + '" stroke-width="1.4"/>' +
        '<path d="M2 24h5M0 32h6M2 40h5" stroke="#e05a8a" stroke-width="2.4" stroke-linecap="round"/>';
    },
    calendar: function() {
      var g = '';
      for (var r = 0; r < 3; r++) for (var c = 0; c < 5; c++) g += '<rect x="' + (13 + c * 8) + '" y="' + (30 + r * 7) + '" width="6" height="5" rx="1" fill="' + (r === 1 && c === 2 ? '#e05a8a' : '#e6e1d6') + '"/>';
      return '<rect x="8" y="12" width="48" height="44" rx="4" fill="#fff" stroke="' + INK + '" stroke-width="2.2"/>' +
        '<rect x="8" y="12" width="48" height="13" rx="4" fill="#d6453a" stroke="' + INK + '" stroke-width="2.2"/>' +
        '<path d="M20 8v9M44 8v9" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/>' + g;
    },
    throwing: function() {
      return '<path d="M8 52C16 22 36 12 52 16" fill="none" stroke="#9aa3ad" stroke-width="2.4" stroke-dasharray="4 4" stroke-linecap="round"/>' +
        '<circle cx="50" cy="16" r="9" fill="#e5484d" stroke="' + INK + '" stroke-width="2.2"/>' +
        '<path d="M43 12q7 3 13-1M44 21q6-4 12 0" stroke="#fff" stroke-width="1.6" fill="none"/>' +
        '<path d="M28 8l-6-2M30 14l-8 0" stroke="#f59e0b" stroke-width="2.2" stroke-linecap="round"/>';
    },
    bend: function() {
      return '<path d="M10 56C10 30 22 14 48 12" fill="none" stroke="#6aa84f" stroke-width="7" stroke-linecap="round"/>' +
        '<path d="M10 56C10 30 22 14 48 12" fill="none" stroke="' + INK + '" stroke-width="1.4" stroke-linecap="round" opacity="0.6"/>' +
        '<path d="M46 6l8 6-8 6" fill="none" stroke="#e05a8a" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="M6 58h12" stroke="' + INK + '" stroke-width="2.4" stroke-linecap="round"/>';
    },
    breaking: function() {
      return '<path d="M6 38l22-6 3 5-22 7z" fill="#c98a4b" stroke="' + INK + '" stroke-width="2" stroke-linejoin="round"/>' +
        '<path d="M36 30l22-8 2 6-22 8z" fill="#c98a4b" stroke="' + INK + '" stroke-width="2" stroke-linejoin="round"/>' +
        '<path d="M28 32l2-3 2 4 3-5 1 3" fill="none" stroke="' + INK + '" stroke-width="1.6"/>' +
        '<path d="M32 18v-8M24 20l-4-6M40 18l4-6M32 46v6M24 46l-3 5M40 44l4 5" stroke="#f59e0b" stroke-width="2.4" stroke-linecap="round"/>';
    },
    pull: function() {
      return '<rect x="30" y="30" width="26" height="14" rx="3" fill="#2f6db0" stroke="' + INK + '" stroke-width="2.2"/>' +
        '<circle cx="36" cy="48" r="5" fill="#3b3f46" stroke="' + INK + '" stroke-width="1.8"/><circle cx="50" cy="48" r="5" fill="#3b3f46" stroke="' + INK + '" stroke-width="1.8"/>' +
        '<path d="M30 36C20 36 16 30 8 30" stroke="#a0683a" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<path d="M14 22l-8 8 8 8" fill="none" stroke="#e05a8a" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>';
    },
    shapes: function() {
      return '<rect x="30" y="28" width="24" height="24" rx="2" fill="#5fae4a" stroke="' + INK + '" stroke-width="2.2"/>' +
        '<circle cx="22" cy="40" r="13" fill="#3d9be0" stroke="' + INK + '" stroke-width="2.2" opacity="0.92"/>' +
        '<path d="M32 6l14 24H18z" fill="#f6c343" stroke="' + INK + '" stroke-width="2.2" stroke-linejoin="round"/>';
    },
    morph: function() {
      return '<g>' + [0, 1, 2, 3].map(function(i) {
          return '<circle cx="' + (8 + i * 6) + '" cy="' + (44 - (i % 2) * 3) + '" r="4.2" fill="#8fd16a" stroke="' + INK + '" stroke-width="1.6"/>';
        }).join('') + '<circle cx="31" cy="40" r="4.6" fill="#6cc04a" stroke="' + INK + '" stroke-width="1.6"/></g>' +
        '<path d="M28 24h8l-3-3M36 24l-3 3" stroke="#9aa3ad" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        '<path d="M50 30C42 20 38 10 44 8s8 10 6 22zM50 30c8-10 12-20 6-22s-8 10-6 22z" fill="#f59e0b" stroke="' + INK + '" stroke-width="1.8"/>' +
        '<path d="M50 30c-6 4-8 10-5 12s5-6 5-12zM50 30c6 4 8 10 5 12s-5-6-5-12z" fill="#e05a8a" stroke="' + INK + '" stroke-width="1.6"/>' +
        '<path d="M50 14v22" stroke="' + INK + '" stroke-width="2.2" stroke-linecap="round"/>';
    },
    numI: function() { return numeral('I', '1'); },
    numC: function() { return numeral('C', '100'); },
    numM: function() { return numeral('M', '1000'); },
    dots: function() {
      var r = rng(4), out = '', cols = ['#e05a8a', '#3d9be0', '#f6c343', '#5fae4a', '#a855f7', '#f97316'];
      for (var i = 0; i < 16; i++) {
        out += '<circle cx="' + (12 + r() * 40).toFixed(1) + '" cy="' + (12 + r() * 40).toFixed(1) + '" r="' + (3 + r() * 3).toFixed(1) + '" fill="' + cols[i % 6] + '" stroke="' + INK + '" stroke-width="1.4"/>';
      }
      return out;
    },
    plate: function() {
      return '<ellipse cx="32" cy="36" rx="22" ry="18" fill="#fff" stroke="' + INK + '" stroke-width="2.2"/>' +
        '<ellipse cx="32" cy="36" rx="14" ry="11" fill="#f2efe8" stroke="#c9c2b4" stroke-width="1.4"/>' +
        '<path d="M4 14v14M8 14v14M12 14v14M4 28c0 3 8 3 8 0M8 30v26" stroke="#8a929c" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M56 12c-4 4-4 14 0 18v26" stroke="#8a929c" stroke-width="2.6" stroke-linecap="round" fill="none"/>';
    },
    scales: function() {
      return '<path d="M32 8v44M18 56h28" stroke="' + INK + '" stroke-width="2.6" stroke-linecap="round"/>' +
        '<path d="M10 16h44" stroke="#c9952b" stroke-width="3.4" stroke-linecap="round"/>' +
        '<path d="M14 16L6 34h16zM50 16l-8 18h16z" fill="none" stroke="' + INK + '" stroke-width="1.4"/>' +
        '<path d="M4 34a10 5 0 0 0 20 0zM40 34a10 5 0 0 0 20 0z" fill="#f6c343" stroke="' + INK + '" stroke-width="2"/>' +
        '<circle cx="32" cy="8" r="3" fill="#f6c343" stroke="' + INK + '" stroke-width="1.6"/>';
    }
  };
  function numeral(roman, arabic) {
    return '<path d="M12 10h40l-4 6v32l4 6H12l4-6V16z" fill="#e8e1d2" stroke="' + INK + '" stroke-width="2.2" stroke-linejoin="round"/>' +
      '<text x="32" y="' + (roman.length > 1 ? 38 : 40) + '" text-anchor="middle" font-family="Georgia, \'Times New Roman\', serif" font-size="26" font-weight="700" fill="#6b4f2a">' + roman + '</text>' +
      '<text x="32" y="50" text-anchor="middle" font-family="Nunito, Arial, sans-serif" font-size="8" font-weight="800" fill="#8a7a5c">' + arabic + '</text>';
  }

  function iconFor(rootId) {
    var D = typeof VocabularioVivoData !== 'undefined' ? VocabularioVivoData : null;
    var key = D && D.ICON[rootId];
    var map = { throw: 'throwing', break: 'breaking' };
    if (key && map[key]) key = map[key];
    return key && ICONS[key] ? key : null;
  }

  // Stone medallion with the original word, for abstract roots.
  function medallion(rootId, size) {
    var D = typeof VocabularioVivoData !== 'undefined' ? VocabularioVivoData : null;
    var e = D && D.ETYMA[rootId];
    var word = e ? e.orig.split(/[,·]/)[0].trim() : rootId;
    var fs = word.length > 7 ? 9 : word.length > 5 ? 11 : 13;
    var id = nid('md');
    return '<svg viewBox="0 0 64 64" width="' + size + '" height="' + size + '" aria-hidden="true">' +
      '<defs><radialGradient id="' + id + '" cx="0.4" cy="0.35" r="0.75"><stop offset="0" stop-color="#f3efe6"/><stop offset="1" stop-color="#c9c0ad"/></radialGradient></defs>' +
      '<circle cx="32" cy="32" r="28" fill="url(#' + id + ')" stroke="#8f8573" stroke-width="2"/>' +
      '<circle cx="32" cy="32" r="23" fill="none" stroke="#a89e8a" stroke-width="1.2" stroke-dasharray="1.5 2.5"/>' +
      '<text x="32" y="' + (32 + fs * 0.35) + '" text-anchor="middle" font-family="Georgia, \'Times New Roman\', serif" font-style="italic" font-weight="700" font-size="' + fs + '" fill="#5b4a33">' + esc(word) + '</text>' +
      '<text x="32" y="' + (32 + fs * 0.35) + '" dy="-0.6" text-anchor="middle" font-family="Georgia, \'Times New Roman\', serif" font-style="italic" font-weight="700" font-size="' + fs + '" fill="none" stroke="#fff" stroke-width="0.4" opacity="0.6">' + esc(word) + '</text>' +
    '</svg>';
  }

  // Illustration for a root (falls back to the medallion).
  function rootArt(rootId, size) {
    size = size || 56;
    var key = iconFor(rootId);
    if (!key) return medallion(rootId, size);
    return '<svg viewBox="0 0 64 64" width="' + size + '" height="' + size + '" aria-hidden="true">' + ICONS[key]() + '</svg>';
  }
  function icon(key, size) {
    if (!ICONS[key]) return '';
    return '<svg viewBox="0 0 64 64" width="' + (size || 48) + '" height="' + (size || 48) + '" aria-hidden="true">' + ICONS[key]() + '</svg>';
  }

  // Mode icons for the home tiles
  var MODE = {
    roots: function() { return ICONS.sprout(); },
    match: function() {
      return '<circle cx="20" cy="24" r="14" fill="#e8e1d2" stroke="' + INK + '" stroke-width="2.2"/>' +
        '<text x="20" y="28" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-weight="700" font-size="9.5" fill="#5b4a33">aqua</text>' +
        '<rect x="30" y="34" width="28" height="20" rx="4" fill="#3d9be0" stroke="' + INK + '" stroke-width="2.2"/>' +
        '<path d="M44 38c-3 4-5 6-5 8a5 5 0 0 0 10 0c0-2-2-4-5-8z" fill="#fff"/>' +
        '<path d="M30 32l-3-3M33 30l1-4" stroke="#e05a8a" stroke-width="2.4" stroke-linecap="round"/>';
    },
    build: function() {
      return '<rect x="3" y="22" width="20" height="22" rx="3" fill="#e9c792" stroke="' + INK + '" stroke-width="2"/>' +
        '<rect x="22" y="22" width="22" height="22" rx="3" fill="#8a5a35" stroke="' + INK + '" stroke-width="2"/>' +
        '<rect x="43" y="22" width="18" height="22" rx="3" fill="#c07448" stroke="' + INK + '" stroke-width="2"/>' +
        '<path d="M6 30h12M27 28h12M6 36h10M46 32h10" stroke="#00000022" stroke-width="1.6"/>' +
        '<text x="13" y="38" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="11" fill="#5b3a1a">in</text>' +
        '<text x="33" y="38" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="10" fill="#f6e7cf">vis</text>' +
        '<text x="52" y="38" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="9" fill="#fff1e0">ible</text>' +
        '<path d="M8 50h48" stroke="' + INK + '" stroke-width="2.4" stroke-linecap="round"/>';
    },
    dictation: function() { return ICONS.quill(); },
    spot: function() { return ICONS.lens() + '<text x="27" y="31" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="10" fill="#be185d">bio</text>'; },
    cognates: function() {
      return '<rect x="4" y="18" width="26" height="20" rx="4" fill="#2f6db0" stroke="' + INK + '" stroke-width="2"/>' +
        '<text x="17" y="32" text-anchor="middle" font-family="Nunito, Arial, sans-serif" font-weight="900" font-size="11" fill="#fff">EN</text>' +
        '<rect x="34" y="26" width="26" height="20" rx="4" fill="#d6453a" stroke="' + INK + '" stroke-width="2"/>' +
        '<text x="47" y="40" text-anchor="middle" font-family="Nunito, Arial, sans-serif" font-weight="900" font-size="11" fill="#fff">ES</text>' +
        '<path d="M22 46q10 10 20 0M42 16q-10-10-20 0" fill="none" stroke="#f59e0b" stroke-width="2.6" stroke-linecap="round"/>' +
        '<path d="M42 46l1 4-4 0M22 16l-1-4 4 0" fill="none" stroke="#f59e0b" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>';
    }
  };
  function modeIcon(k, size) {
    return '<svg viewBox="0 0 64 64" width="' + (size || 52) + '" height="' + (size || 52) + '" aria-hidden="true">' + (MODE[k] ? MODE[k]() : '') + '</svg>';
  }

  // ---------------------------------------------------------------
  //  Word tree: the root sits in the soil, branches carry the words.
  //  words: [{en, es}], split(word) → {pre,mid,post}|null
  // ---------------------------------------------------------------
  function hl(word, split, cls) {
    var p = split ? split(word) : null;
    if (!p) return esc(word);
    return esc(p.pre) + '<tspan class="' + cls + '">' + esc(p.mid) + '</tspan>' + esc(p.post);
  }
  function wordTree(rootLabel, words, opts) {
    opts = opts || {};
    var id = nid('tr');
    var Wt = 360, Ht = 420;
    var tips = [
      { x: 92, y: 284, side: -1 }, { x: 268, y: 236, side: 1 },
      { x: 92, y: 166, side: -1 }, { x: 268, y: 118, side: 1 },
      { x: 180, y: 58, side: 0 }
    ];
    var n = Math.min(words.length, 5);
    var trunk = 'M180 356 C176 300 186 250 180 200 C176 160 182 120 180 86';
    var branches = '', plaques = '', leaves = '';
    var r = rng(opts.seed || 3);
    for (var i = 0; i < n; i++) {
      var t = tips[i], w = words[i];
      var by = t.y + 40;
      var d = t.side === 0 ? 'M180 100 C180 90 180 80 180 74'
        : 'M180 ' + by + ' C' + (180 + t.side * 36) + ' ' + (by - 6) + ' ' + (t.x + -t.side * 40) + ' ' + (t.y + 18) + ' ' + (t.x - t.side * 2) + ' ' + (t.y + 6);
      var delay = (0.55 + i * 0.28).toFixed(2);
      branches += '<path class="vv-tree-branch" pathLength="1" d="' + d + '" stroke="url(#' + id + 'bark)" stroke-width="' + (9 - i) + '" fill="none" stroke-linecap="round" style="animation-delay:' + delay + 's"/>';
      // leaf clusters around the tip
      for (var k = 0; k < 6; k++) {
        var a = r() * Math.PI * 2, rr = 26 + r() * 18;
        var lx = t.x + Math.cos(a) * rr * 1.5, ly = t.y + Math.sin(a) * rr * 0.75;
        leaves += '<ellipse class="vv-tree-leaf" cx="' + lx.toFixed(1) + '" cy="' + ly.toFixed(1) + '" rx="' + (12 + r() * 9).toFixed(1) + '" ry="' + (8 + r() * 6).toFixed(1) + '" fill="' + ['#6cbf4f', '#57a83f', '#7fcf5f', '#4c9a38'][k % 4] + '" style="animation-delay:' + (Number(delay) + 0.2).toFixed(2) + 's"/>';
      }
      var len = Math.max(w.en.length, w.es.length);
      var fs = len > 14 ? 12.5 : len > 11 ? 14 : 15.5;
      var pw = 158, ph = 46;
      var px = Math.max(4, Math.min(Wt - pw - 4, t.x - pw / 2)), py = t.y - ph / 2;
      plaques += '<g class="vv-tree-plaque" style="animation-delay:' + (Number(delay) + 0.35).toFixed(2) + 's">' +
        '<rect x="' + px + '" y="' + (py + 2) + '" width="' + pw + '" height="' + ph + '" rx="10" fill="#000" opacity="0.12"/>' +
        '<rect x="' + px + '" y="' + py + '" width="' + pw + '" height="' + ph + '" rx="10" fill="#fffdf6" stroke="#d9cdb2" stroke-width="1.4"/>' +
        '<text x="' + (px + pw / 2) + '" y="' + (py + 20) + '" text-anchor="middle" font-family="Nunito, Arial, sans-serif" font-weight="800" font-size="' + fs + '" fill="#1c1b29">' + hl(w.en, opts.split, 'vv-hl') + '</text>' +
        '<text x="' + (px + pw / 2) + '" y="' + (py + 38) + '" text-anchor="middle" font-family="Nunito, Arial, sans-serif" font-style="italic" font-weight="700" font-size="' + (fs - 1.5) + '" fill="#9a3412">' + hl(w.es, opts.split, 'vv-hl-es') + '</text>' +
        '<text x="' + (px + 10) + '" y="' + (py + 14) + '" font-size="7.5" font-weight="900" fill="#2f6db0" font-family="Nunito, Arial, sans-serif">EN</text>' +
        '<text x="' + (px + 10) + '" y="' + (py + 39) + '" font-size="7.5" font-weight="900" fill="#c2410c" font-family="Nunito, Arial, sans-serif">ES</text>' +
      '</g>';
    }
    var rootLines = '';
    [[-1, 40], [1, 46], [-0.4, 58], [0.5, 60], [0, 64]].forEach(function(p, j) {
      rootLines += '<path class="vv-tree-root" pathLength="1" d="M180 360 C' + (180 + p[0] * 20) + ' 372 ' + (180 + p[0] * p[1]) + ' 380 ' + (180 + p[0] * p[1] * 1.6) + ' ' + (390 + j * 3) + '" stroke="#7a5230" stroke-width="' + (4 - j * 0.4) + '" fill="none" stroke-linecap="round"/>';
    });
    // canopy: soft overlapping crowns behind everything
    var canopy = '';
    var crown = [[180, 70, 70, 46], [112, 120, 62, 44], [250, 104, 66, 46], [86, 196, 54, 40], [276, 180, 58, 42], [180, 150, 78, 60], [130, 250, 48, 34], [234, 258, 46, 32]];
    crown.forEach(function(c, j) {
      canopy += '<ellipse class="vv-tree-leaf" cx="' + c[0] + '" cy="' + c[1] + '" rx="' + c[2] + '" ry="' + c[3] + '" fill="' + (j % 2 ? '#8fd16a' : '#79c356') + '" opacity="0.55" style="animation-delay:' + (0.4 + j * 0.08).toFixed(2) + 's"/>';
    });
    var wood = woodURL('walnut');
    var label = esc(rootLabel);
    var tw = Math.max(90, 26 + label.length * 15);
    return '<svg class="vv-tree" viewBox="0 0 ' + Wt + ' ' + Ht + '" role="img" aria-label="' + esc(opts.aria || 'Word tree') + '">' +
      '<defs>' +
        '<linearGradient id="' + id + 'bark" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6b4226"/><stop offset="0.5" stop-color="#93643c"/><stop offset="1" stop-color="#5a361d"/></linearGradient>' +
        '<linearGradient id="' + id + 'soil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a6a3f"/><stop offset="1" stop-color="#6e4728"/></linearGradient>' +
        (wood ? '<pattern id="' + id + 'wood" patternUnits="userSpaceOnUse" width="260" height="110"><image href="' + wood + '" width="260" height="110"/></pattern>' : '') +
        '<linearGradient id="' + id + 'sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eaf4fb"/><stop offset="1" stop-color="#fdfbf4"/></linearGradient>' +
      '</defs>' +
      '<rect width="' + Wt + '" height="' + Ht + '" rx="18" fill="url(#' + id + 'sky)"/>' +
      '<g class="vv-tree-leaves">' + canopy + leaves + '</g>' +
      '<path class="vv-tree-trunk" pathLength="1" d="' + trunk + '" stroke="url(#' + id + 'bark)" stroke-width="16" fill="none" stroke-linecap="round"/>' +
      branches +
      '<path d="M0 352 Q90 340 180 348 T360 350 V420 H0 Z" fill="url(#' + id + 'soil)"/>' +
      '<path d="M0 352 Q90 340 180 348 T360 350" fill="none" stroke="#5e8f3a" stroke-width="5"/>' +
      rootLines +
      plaques +
      '<g class="vv-tree-label">' +
        '<rect x="' + (180 - tw / 2) + '" y="375" width="' + tw + '" height="36" rx="7" fill="#3e2412"/>' +
        '<rect x="' + (180 - tw / 2) + '" y="372" width="' + tw + '" height="36" rx="7" fill="' + (wood ? 'url(#' + id + 'wood)' : '#8a5a35') + '" stroke="#4a2e17" stroke-width="1.5"/>' +
        '<rect x="' + (180 - tw / 2 + 3) + '" y="375" width="' + (tw - 6) + '" height="4" rx="2" fill="#fff" opacity="0.18"/>' +
        '<text x="180" y="397" text-anchor="middle" font-family="Georgia, \'Times New Roman\', serif" font-weight="700" font-size="19" fill="#f8ead2">' + label + '</text>' +
      '</g>' +
    '</svg>';
  }

  return {
    installWood: installWood, woodURL: woodURL, rootArt: rootArt, medallion: medallion,
    icon: icon, iconFor: iconFor, modeIcon: modeIcon, wordTree: wordTree
  };
})();
