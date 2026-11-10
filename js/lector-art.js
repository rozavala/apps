/* ================================================================
   LECTOR — art core (js/lector-art.js)

   Everything Lector shows is drawn here as inline SVG. No images, no
   network, no emoji standing in for a picture.

   Objects are drawn in a 100 x 100 box (ground line at y = 92, light
   from the upper left) by a function that gets a drawing context `c`:

     LectorArt.add('cat', function (c) { c.ell(50, 60, 20, 18, '#E49B4F'); ... });

   The context shades every shape for you: a soft gradient lit from the
   upper left, a darker rim and an optional highlight, so all the
   pictures share one warm, slightly realistic look.

     c.path(d, fill, o)     a filled path        o: {stroke, sw, op, mode, flat, rad}
     c.ell(cx, cy, rx, ry, fill, o)
     c.circ(cx, cy, r, fill, o)
     c.rect(x, y, w, h, fill, o)      o.r = corner radius
     c.line(d, color, width, o)       a stroke only (round caps)
     c.shadow(cx, cy, rx, ry, op)     soft contact shadow on the ground
     c.shine(d, op)                   white highlight, no outline
     c.raw(svg)                       anything else
     c.g(transform, fn)               a group

   Public API:
     LectorArt.obj(id, size)          a stand-alone <svg> of one object
     LectorArt.scene(bg, items)       a 320 x 200 page picture. items are
                                      [object, centreX, groundY, size, flip]
     LectorArt.has(id)  LectorArt.ids()  LectorArt.backdrops()
     LectorArt.add(id, fn)            register an object (other art files do this)
   ================================================================ */

var LectorArt = (function() {
  'use strict';

  var _n = 0;
  var OBJ = {};

  // ── colour ──────────────────────────────────────────────────
  function rgb(h) {
    h = String(h).replace('#', '');
    if (h.length === 3) h = h.replace(/(.)/g, '$1$1');
    return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)];
  }
  function hex(a) {
    return '#' + a.map(function(v) {
      v = Math.max(0, Math.min(255, Math.round(v)));
      return (v < 16 ? '0' : '') + v.toString(16);
    }).join('');
  }
  function mix(c, t, k) {
    var a = rgb(c), b = rgb(t);
    return hex([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]);
  }
  function lite(c, k) { return mix(c, '#FFFFFF', k); }
  function dark(c, k) { return mix(c, '#2A1608', k); }      // a warm shadow, never pure black
  function f1(n) { return Math.round(n * 10) / 10; }

  // ── drawing context ─────────────────────────────────────────
  function Ctx() { this.u = 'lx' + (++_n) + '_'; this.defs = ''; this.body = ''; this.k = 0; this.cache = {}; }
  var P = Ctx.prototype;

  P._id = function() { return this.u + (++this.k); };

  // A linear gradient lit from the upper left: lighter, the colour, darker.
  P.grad = function(c, mode) {
    var key = 'l' + c + (mode || 'd');
    if (this.cache[key]) return this.cache[key];
    var id = this._id();
    var xy = mode === 'v' ? 'x1="0" y1="0" x2="0" y2="1"' : mode === 'h' ? 'x1="0" y1="0" x2="1" y2="0"' : 'x1=".1" y1="0" x2=".9" y2="1"';
    this.defs += '<linearGradient id="' + id + '" ' + xy + '><stop offset="0" stop-color="' + lite(c, 0.34) + '"/>' +
      '<stop offset=".5" stop-color="' + c + '"/><stop offset="1" stop-color="' + dark(c, 0.26) + '"/></linearGradient>';
    return (this.cache[key] = 'url(#' + id + ')');
  };
  // A rounded, sphere-like gradient with the light at the upper left.
  P.rad = function(c) {
    var key = 'r' + c;
    if (this.cache[key]) return this.cache[key];
    var id = this._id();
    this.defs += '<radialGradient id="' + id + '" cx=".36" cy=".3" r=".85"><stop offset="0" stop-color="' + lite(c, 0.42) + '"/>' +
      '<stop offset=".45" stop-color="' + c + '"/><stop offset="1" stop-color="' + dark(c, 0.32) + '"/></radialGradient>';
    return (this.cache[key] = 'url(#' + id + ')');
  };

  P._fill = function(fill, o) {
    if (fill === 'none') return 'none';
    if (o.flat || fill.charAt(0) !== '#') return fill;
    return o.rad ? this.rad(fill) : this.grad(fill, o.mode);
  };
  P._attrs = function(fill, o) {
    o = o || {};
    var s = ' fill="' + this._fill(fill, o) + '"';
    if (o.stroke !== false && fill !== 'none') {
      var col = o.stroke || (fill.charAt(0) === '#' ? dark(fill, 0.5) : '#5a3a1c');
      s += ' stroke="' + col + '" stroke-width="' + (o.sw || 1.1) + '" stroke-linejoin="round" stroke-linecap="round"';
    }
    if (o.op != null) s += ' opacity="' + o.op + '"';
    return s;
  };

  P.path = function(d, fill, o) { this.body += '<path d="' + d + '"' + this._attrs(fill, o) + '/>'; return this; };
  P.ell = function(cx, cy, rx, ry, fill, o) {
    this.body += '<ellipse cx="' + f1(cx) + '" cy="' + f1(cy) + '" rx="' + f1(rx) + '" ry="' + f1(ry) + '"' + this._attrs(fill, o) + '/>'; return this;
  };
  P.circ = function(cx, cy, r, fill, o) {
    this.body += '<circle cx="' + f1(cx) + '" cy="' + f1(cy) + '" r="' + f1(r) + '"' + this._attrs(fill, o) + '/>'; return this;
  };
  P.rect = function(x, y, w, h, fill, o) {
    o = o || {};
    this.body += '<rect x="' + f1(x) + '" y="' + f1(y) + '" width="' + f1(w) + '" height="' + f1(h) + '"' +
      (o.r ? ' rx="' + o.r + '"' : '') + this._attrs(fill, o) + '/>'; return this;
  };
  P.line = function(d, color, w, o) {
    o = o || {};
    this.body += '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="' + (w || 1.5) + '" stroke-linecap="round" stroke-linejoin="round"' +
      (o.op != null ? ' opacity="' + o.op + '"' : '') + (o.dash ? ' stroke-dasharray="' + o.dash + '"' : '') + '/>'; return this;
  };
  P.shadow = function(cx, cy, rx, ry, op) {
    var id = this.u + 'sh';
    if (!this.cache.sh) {
      this.cache.sh = 1;
      this.defs += '<radialGradient id="' + id + '"><stop offset="0" stop-color="#3a2410" stop-opacity=".5"/>' +
        '<stop offset=".6" stop-color="#3a2410" stop-opacity=".22"/><stop offset="1" stop-color="#3a2410" stop-opacity="0"/></radialGradient>';
    }
    this.body += '<ellipse cx="' + f1(cx) + '" cy="' + f1(cy) + '" rx="' + f1(rx) + '" ry="' + f1(ry) + '" fill="url(#' + id + ')"' +
      (op != null ? ' opacity="' + op + '"' : '') + '/>'; return this;
  };
  P.shine = function(d, op) { this.body += '<path d="' + d + '" fill="#fff" opacity="' + (op == null ? 0.55 : op) + '"/>'; return this; };
  P.raw = function(s) { this.body += s; return this; };
  P.g = function(tr, fn) {
    this.body += '<g' + (tr ? ' transform="' + tr + '"' : '') + '>'; fn(this); this.body += '</g>'; return this;
  };
  // A colour band behind something (sky, wall): vertical gradient, no outline.
  P.bandGrad = function(c1, c2) {
    var id = this._id();
    this.defs += '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient>';
    return 'url(#' + id + ')';
  };
  P.radGrad = function(c1, c2, cx, cy, r) {
    var id = this._id();
    this.defs += '<radialGradient id="' + id + '" cx="' + (cx == null ? 0.5 : cx) + '" cy="' + (cy == null ? 0.5 : cy) + '" r="' + (r == null ? 0.5 : r) + '"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></radialGradient>';
    return 'url(#' + id + ')';
  };

  // ── a person (shared by mom, dad and the kid) ───────────────
  var SKIN = '#E8B48A';
  function face(c, x, y, r, mood) {
    c.circ(x - r * 0.42, y + r * 0.1, r * 0.17, '#F2A08A', { flat: true, stroke: false, op: 0.5 });
    c.circ(x + r * 0.42, y + r * 0.1, r * 0.17, '#F2A08A', { flat: true, stroke: false, op: 0.5 });
    c.ell(x - r * 0.36, y - r * 0.06, r * 0.09, r * 0.13, '#3a2312', { flat: true, stroke: false });
    c.ell(x + r * 0.36, y - r * 0.06, r * 0.09, r * 0.13, '#3a2312', { flat: true, stroke: false });
    c.line('M' + f1(x - r * 0.28) + ' ' + f1(y + r * 0.36) + ' Q' + f1(x) + ' ' + f1(y + r * (mood === 'o' ? 0.7 : 0.62)) + ' ' + f1(x + r * 0.28) + ' ' + f1(y + r * 0.36), '#8a3d2a', 1.2);
  }

  // ── backdrops (320 x 200) ───────────────────────────────────
  var BG = {};

  function sky(c, top, bottom, h) {
    c.raw('<rect width="320" height="' + (h || 200) + '" fill="' + c.bandGrad(top, bottom) + '"/>');
  }
  function cloud(c, x, y, s) {
    c.g('translate(' + x + ' ' + y + ') scale(' + (s || 1) + ')', function() {
      c.raw('<g fill="#fff" opacity=".92"><ellipse cx="0" cy="6" rx="26" ry="8"/><ellipse cx="-10" cy="0" rx="13" ry="10"/><ellipse cx="8" cy="-3" rx="16" ry="12"/><ellipse cx="20" cy="4" rx="11" ry="7"/></g>');
    });
  }
  function hills(c, y, col1, col2) {
    c.raw('<path d="M0 ' + (y + 10) + ' Q60 ' + (y - 24) + ' 130 ' + (y - 4) + ' T260 ' + (y - 14) + ' T320 ' + (y - 2) + ' V200 H0Z" fill="' + c.bandGrad(col1, col2) + '"/>');
  }
  function grass(c, y, a, b) {
    c.raw('<rect y="' + y + '" width="320" height="' + (200 - y) + '" fill="' + c.bandGrad(a || '#8CCB5E', b || '#4E9A3A') + '"/>');
    var s = '';
    for (var i = 0; i < 34; i++) {
      var gx = (i * 53 + 17) % 320, gy = y + 6 + ((i * 37) % (190 - y));
      s += '<path d="M' + gx + ' ' + gy + ' l-2 -5 M' + gx + ' ' + gy + ' l0 -6 M' + gx + ' ' + gy + ' l2 -5" stroke="#3E8A32" stroke-width="1" opacity=".5" fill="none" stroke-linecap="round"/>';
    }
    c.raw(s);
  }

  BG.garden = function(c) {
    sky(c, '#9ED8F2', '#EAF8FC', 130);
    cloud(c, 60, 34, 1); cloud(c, 245, 26, 0.8);
    hills(c, 120, '#8DC76B', '#5FA34A');
    grass(c, 128, '#8FCF62', '#4F9B3A');
    c.raw('<path d="M0 200 Q120 160 330 178 V200Z" fill="#C7A06A" opacity=".0"/>');
    var f = '', cols = ['#F4B4C4', '#FFE27A', '#fff'];
    for (var i = 0; i < 9; i++) {
      var x = (i * 71 + 23) % 310 + 5, y = 140 + ((i * 29) % 52);
      f += '<circle cx="' + x + '" cy="' + y + '" r="2.4" fill="' + cols[i % 3] + '"/><circle cx="' + x + '" cy="' + y + '" r=".9" fill="#E7A21C"/>';
    }
    c.raw(f);
  };
  BG.sunny = function(c) {
    sky(c, '#7CCBEF', '#DDF4FB', 135);
    c.raw('<circle cx="262" cy="42" r="40" fill="' + c.radGrad('#FFF3B0', '#FFF3B000', 0.5, 0.5, 0.5) + '"/>');
    cloud(c, 80, 40, 1.1); cloud(c, 190, 60, 0.7);
    hills(c, 128, '#9CD27A', '#68AE4F');
    grass(c, 134, '#98D468', '#52A03C');
  };
  BG.room = function(c) {
    c.raw('<rect width="320" height="200" fill="' + c.bandGrad('#F8E9CF', '#EFD7B0') + '"/>');
    c.raw('<rect y="118" width="320" height="82" fill="' + c.bandGrad('#CE9F66', '#A87A45') + '"/>');
    var s = '';
    for (var i = 1; i < 6; i++) s += '<path d="M0 ' + (118 + i * 16) + ' H320" stroke="#7E5630" stroke-width="1" opacity=".35"/>';
    c.raw(s);
    c.raw('<rect y="112" width="320" height="8" fill="#B8864F"/><rect y="112" width="320" height="2" fill="#E3BC86" opacity=".7"/>');
    // window
    c.raw('<rect x="214" y="22" width="76" height="70" rx="4" fill="#fff"/><rect x="220" y="28" width="64" height="58" fill="' + c.bandGrad('#9ED8F2', '#E4F6FC') + '"/>' +
      '<path d="M252 28 V86 M220 57 H284" stroke="#fff" stroke-width="3"/><path d="M222 78 Q238 66 254 80 T284 74 V86 H220Z" fill="#8DC76B" opacity=".8"/>' +
      '<path d="M214 24 q-8 30 -2 66 h12 q-6 -34 2 -66z" fill="#E7A7A0" opacity=".9"/><path d="M290 24 q8 30 2 66 h-12 q6 -34 -2 -66z" fill="#E7A7A0" opacity=".9"/>');
    // rug
    c.raw('<ellipse cx="150" cy="176" rx="104" ry="15" fill="#C9594B" opacity=".85"/><ellipse cx="150" cy="176" rx="90" ry="11" fill="none" stroke="#F4D9A8" stroke-width="2" stroke-dasharray="6 5"/>');
  };
  BG.kitchen = function(c) {
    c.raw('<rect width="320" height="200" fill="' + c.bandGrad('#FBF1DC', '#F1DDB8') + '"/>');
    var t = '';
    for (var y = 20; y < 100; y += 16) for (var x = ((y / 16) % 2) * 8; x < 330; x += 16) t += '<rect x="' + x + '" y="' + y + '" width="15" height="15" rx="1.5" fill="#fff" opacity=".7"/>';
    c.raw(t);
    c.raw('<rect y="110" width="320" height="90" fill="' + c.bandGrad('#D4A56B', '#A97A44') + '"/>');
    var s = '';
    for (var i = 1; i < 5; i++) s += '<path d="M0 ' + (110 + i * 18) + ' H320" stroke="#7E5630" stroke-width="1" opacity=".35"/>';
    c.raw(s);
    c.raw('<rect x="20" y="30" width="86" height="56" rx="4" fill="#C98A52" stroke="#8D5A2E"/><rect x="26" y="36" width="74" height="44" rx="2" fill="#D9A06A"/>' +
      '<circle cx="63" cy="58" r="3" fill="#7a4a22"/><rect x="214" y="26" width="64" height="50" rx="3" fill="#fff"/><rect x="219" y="31" width="54" height="40" fill="' + c.bandGrad('#9ED8F2', '#E4F6FC') + '"/><path d="M246 31 V71 M219 51 H273" stroke="#fff" stroke-width="3"/>');
  };
  BG.beach = function(c) {
    sky(c, '#8AD2F0', '#E9F8FC', 100);
    cloud(c, 70, 34, 0.9); cloud(c, 230, 48, 0.7);
    c.raw('<rect y="84" width="320" height="52" fill="' + c.bandGrad('#2F9BC4', '#6DC6DE') + '"/>');
    var w = '';
    for (var i = 0; i < 8; i++) { var x = (i * 47 + 10) % 300, y = 92 + (i * 11) % 38; w += '<path d="M' + x + ' ' + y + ' q6 -4 12 0 t12 0" stroke="#fff" stroke-width="1.6" fill="none" opacity=".7" stroke-linecap="round"/>'; }
    c.raw(w);
    c.raw('<path d="M0 134 Q80 122 160 134 T320 128 V200 H0Z" fill="' + c.bandGrad('#F3DDAA', '#D9B97A') + '"/><path d="M0 134 Q80 122 160 134 T320 128" stroke="#fff" stroke-width="3" fill="none" opacity=".8"/>');
  };
  BG.night = function(c) {
    sky(c, '#14224D', '#3B4F8C');
    var s = '';
    for (var i = 0; i < 26; i++) { var x = (i * 61 + 11) % 316 + 2, y = (i * 29 + 7) % 110 + 6, r = i % 4 === 0 ? 1.7 : 1; s += '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#FFF6D0" opacity="' + (0.5 + (i % 3) * 0.2) + '"/>'; }
    c.raw(s);
    c.raw('<path d="M0 150 Q70 120 140 144 T320 132 V200 H0Z" fill="' + c.bandGrad('#233A5C', '#14263F') + '"/>');
  };
  BG.pond = function(c) {
    sky(c, '#9ED8F2', '#EAF8FC', 110);
    cloud(c, 90, 30, 0.9);
    hills(c, 108, '#8DC76B', '#5FA34A');
    grass(c, 114, '#8FCF62', '#4F9B3A');
    c.raw('<ellipse cx="160" cy="156" rx="140" ry="34" fill="' + c.bandGrad('#5FB3D6', '#2F8DB4') + '" stroke="#6B4E2A" stroke-width="3"/>');
    c.raw('<path d="M60 150 q10 -5 20 0 t20 0 M180 164 q10 -5 20 0 t20 0" stroke="#fff" stroke-width="1.6" fill="none" opacity=".7" stroke-linecap="round"/>');
  };
  BG.mud = function(c) {
    sky(c, '#9ED8F2', '#EAF8FC', 100);
    cloud(c, 80, 32, 0.9); cloud(c, 245, 44, 0.7);
    hills(c, 98, '#8DC76B', '#5FA34A');
    grass(c, 106, '#8FCF62', '#4F9B3A');
    c.raw('<ellipse cx="164" cy="160" rx="132" ry="34" fill="' + c.bandGrad('#8A5F3A', '#5E3E22') + '"/>' +
      '<ellipse cx="150" cy="152" rx="80" ry="14" fill="#A57448" opacity=".55"/><ellipse cx="236" cy="168" rx="34" ry="7" fill="#4B311B" opacity=".5"/>');
  };
  BG.field = function(c) {
    sky(c, '#8FD0EE', '#E6F6FB', 120);
    cloud(c, 70, 36, 1); cloud(c, 230, 52, 0.75);
    hills(c, 112, '#9CD27A', '#6FB252');
    grass(c, 120, '#A8DA70', '#5BA842');
    c.raw('<path d="M130 200 Q150 150 188 124 L204 124 Q176 156 214 200Z" fill="' + c.bandGrad('#D9B88A', '#B8935F') + '"/>');
    var fe = '<g stroke="#8D6A3C" stroke-width="3" fill="none" stroke-linecap="round"><path d="M0 122 H110 M0 134 H112"/>';
    for (var x = 8; x < 110; x += 26) fe += '<path d="M' + x + ' 114 V142"/>';
    c.raw(fe + '</g>');
  };
  BG.road = function(c) {
    sky(c, '#8FD0EE', '#E6F6FB', 110);
    cloud(c, 80, 34, 0.9); cloud(c, 240, 48, 0.7);
    hills(c, 106, '#9CD27A', '#6FB252');
    grass(c, 112, '#A8DA70', '#5BA842');
    c.raw('<rect y="132" width="320" height="52" fill="' + c.bandGrad('#7C8088', '#5A5E66') + '"/><path d="M0 158 H320" stroke="#F6E27A" stroke-width="3" stroke-dasharray="22 16"/><rect y="130" width="320" height="3" fill="#B9BCC2"/>');
  };
  BG.church = function(c) {
    c.raw('<rect width="320" height="200" fill="' + c.bandGrad('#F5E8CC', '#E8D3A8') + '"/>');
    c.raw('<rect y="130" width="320" height="70" fill="' + c.bandGrad('#C9A678', '#9E7B4E') + '"/>');
    var s = '';
    [34, 134, 234].forEach(function(x) {
      s += '<path d="M' + x + ' 124 V54 Q' + (x + 26) + ' 18 ' + (x + 52) + ' 54 V124Z" fill="' + '#E8C979' + '" stroke="#B88B3F" stroke-width="4"/>' +
        '<path d="M' + (x + 8) + ' 118 V58 Q' + (x + 26) + ' 30 ' + (x + 44) + ' 58 V118Z" fill="' + c.bandGrad('#8DB7E6', '#E8D7A0') + '" opacity=".9"/>' +
        '<path d="M' + (x + 26) + ' 34 V118 M' + (x + 8) + ' 76 H' + (x + 44) + '" stroke="#B88B3F" stroke-width="2.5"/>';
    });
    c.raw(s);
    c.raw('<path d="M0 130 H320" stroke="#7B5A33" stroke-width="2" opacity=".5"/>');
  };
  BG.plain = function(c) {
    c.raw('<rect width="320" height="200" fill="' + c.bandGrad('#FFF6E2', '#F2E2BE') + '"/>');
    c.raw('<ellipse cx="160" cy="176" rx="150" ry="16" fill="#D9BE8A" opacity=".5"/>');
  };

  // ── placeholders and stand-alone drawings ───────────────────
  function placeholder(c, id) {
    c.rect(18, 22, 64, 64, '#D9C7A3', { r: 10 });
    c.raw('<text x="50" y="66" text-anchor="middle" font-size="34" font-family="sans-serif" fill="#8a6a3a">' + String(id).charAt(0).toUpperCase() + '</text>');
  }
  function drawObj(c, id) {
    var fn = OBJ[id];
    if (fn) fn(c); else placeholder(c, id);
  }

  function svgWrap(vb, c, cls, label, w, h) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '" class="' + (cls || 'lx-art') + '"' +
      (w ? ' width="' + w + '"' : '') + (h ? ' height="' + h + '"' : '') +
      (label ? ' role="img" aria-label="' + String(label).replace(/"/g, '') + '"' : ' aria-hidden="true"') +
      ' focusable="false"><defs>' + c.defs + '</defs>' + c.body + '</svg>';
  }

  function obj(id, size, label) {
    var c = new Ctx();
    drawObj(c, id);
    return svgWrap('0 0 100 100', c, 'lx-obj', label, size, size);
  }

  // items: [object, centreX, groundY, size, flip]
  function scene(bg, items, label) {
    var c = new Ctx();
    (BG[bg] || BG.plain)(c);
    (items || []).forEach(function(it) {
      var id = it[0], x = it[1], y = it[2], s = it[3] || 80, flip = it[4];
      var k = s / 100;
      var tr = 'translate(' + f1(x - s / 2) + ' ' + f1(y - s * 0.92) + ') scale(' + f1(k * 1000) / 1000 + ')';
      if (flip) tr = 'translate(' + f1(x + s / 2) + ' ' + f1(y - s * 0.92) + ') scale(' + (-f1(k * 1000) / 1000) + ' ' + f1(k * 1000) / 1000 + ')';
      c.g(tr, function() { drawObj(c, id); });
    });
    return svgWrap('0 0 320 200', c, 'lx-scene', label);
  }

  function add(id, fn) { OBJ[id] = fn; }

  // ── objects drawn in this file ──────────────────────────────
  add('sun', function(c) {
    c.circ(50, 50, 44, c.radGrad('#FFF1A8', '#FFF1A800', 0.5, 0.5, 0.5), { flat: true, stroke: false });
    var rays = '';
    for (var i = 0; i < 12; i++) {
      rays += '<path d="M50 6 L55 22 L45 22Z" transform="rotate(' + i * 30 + ' 50 50)" fill="#F5B02E" stroke="#C98414" stroke-width=".8" stroke-linejoin="round"/>';
    }
    c.raw(rays);
    c.circ(50, 50, 24, '#FFCF45', { rad: true, sw: 1.4 });
    c.shine('M36 40 Q42 30 54 31 Q44 35 40 46Z', 0.6);
  });

  add('moon', function(c) {
    c.circ(50, 50, 44, c.radGrad('#FFF8D6', '#FFF8D600', 0.5, 0.5, 0.5), { flat: true, stroke: false, op: 0.6 });
    c.path('M62 14 A38 38 0 1 0 84 66 A30 30 0 1 1 62 14Z', '#FBE9A0', { rad: true, sw: 1.4 });
    c.circ(36, 56, 5, '#E6CF7F', { flat: true, stroke: false, op: 0.7 });
    c.circ(46, 74, 3.4, '#E6CF7F', { flat: true, stroke: false, op: 0.7 });
    c.circ(30, 38, 3, '#E6CF7F', { flat: true, stroke: false, op: 0.7 });
    c.shine('M30 30 Q36 22 46 18 Q38 26 34 36Z', 0.5);
  });

  add('tree', function(c) {
    c.shadow(50, 91, 30, 5);
    c.path('M44 92 Q46 70 43 56 L57 56 Q54 70 57 92Z', '#8B5A2B');
    c.line('M46 80 q-6 -6 -10 -8 M54 74 q6 -6 10 -9', '#6B4220', 3);
    c.circ(33, 44, 20, '#4FA044', { rad: true });
    c.circ(67, 44, 20, '#4FA044', { rad: true });
    c.circ(50, 28, 24, '#5BB04C', { rad: true });
    c.circ(50, 50, 20, '#47963D', { rad: true });
    c.shine('M34 24 Q42 12 56 12 Q44 16 38 30Z', 0.4);
    [[38, 34], [58, 24], [64, 50], [44, 52], [30, 52]].forEach(function(p) { c.circ(p[0], p[1], 3.2, '#D8352B', { rad: true, sw: 0.8 }); });
  });

  add('cat', function(c) {
    c.shadow(50, 91, 32, 5);
    c.path('M70 82 Q96 80 90 52 Q88 44 82 48 Q86 62 70 70Z', '#E49B4F');
    c.ell(50, 70, 24, 21, '#E8A257', { rad: true });
    c.ell(36, 88, 9, 4.5, '#F3E3C8'); c.ell(58, 88, 9, 4.5, '#F3E3C8');
    c.line('M40 56 q4 6 0 12 M60 56 q-4 6 0 12', '#B9692A', 2.2, { op: 0.6 });
    c.ell(50, 78, 11, 12, '#F6E6CA', { flat: true, stroke: false, op: 0.8 });
    c.path('M30 30 L33 10 L46 22Z', '#E49B4F'); c.path('M70 30 L67 10 L54 22Z', '#E49B4F');
    c.path('M34 26 L35 15 L43 22Z', '#F0A9A0', { stroke: false }); c.path('M66 26 L65 15 L57 22Z', '#F0A9A0', { stroke: false });
    c.circ(50, 36, 22, '#E8A257', { rad: true });
    c.line('M44 17 v6 M50 15 v7 M56 17 v6', '#B9692A', 2, { op: 0.55 });
    c.ell(41, 34, 3.6, 4.6, '#6FA84A', { flat: true, sw: 0.8 }); c.ell(59, 34, 3.6, 4.6, '#6FA84A', { flat: true, sw: 0.8 });
    c.ell(41, 34, 1.3, 4, '#2a1608', { flat: true, stroke: false }); c.ell(59, 34, 1.3, 4, '#2a1608', { flat: true, stroke: false });
    c.path('M47 42 h6 l-3 4Z', '#E88A8A', { sw: 0.7 });
    c.line('M50 46 v2 M50 48 q-3 3 -6 1 M50 48 q3 3 6 1', '#7a3d2a', 1);
    c.line('M30 42 l-14 -3 M30 46 l-14 3 M70 42 l14 -3 M70 46 l14 3', '#fff', 1, { op: 0.9 });
    c.shine('M34 26 Q42 16 54 16 Q44 20 38 32Z', 0.35);
  });

  add('table', function(c) {
    c.shadow(50, 91, 42, 5);
    c.path('M20 40 L24 90 H31 L33 48Z', '#8E5F31'); c.path('M80 40 L76 90 H69 L67 48Z', '#8E5F31');
    c.path('M10 32 L90 32 L96 40 L4 40Z', '#D49A57');
    c.path('M4 40 H96 V46 H4Z', '#A8733C');
    c.path('M32 46 L35 90 H42 L41 46Z', '#B07A42'); c.path('M68 46 L65 90 H58 L59 46Z', '#B07A42');
    c.shine('M14 33.5 H66 L69 36 H12Z', 0.4);
    c.line('M10 43 H90', '#6E4720', 0.9, { op: 0.35 });
  });

  add('soup', function(c) {
    c.shadow(50, 90, 36, 5);
    c.line('M38 34 q-6 -8 0 -14 q6 -6 0 -14 M52 32 q-6 -8 0 -14 q6 -6 0 -14 M66 34 q-6 -8 0 -14 q6 -6 0 -14', '#fff', 3, { op: 0.75 });
    c.path('M12 48 Q14 84 50 86 Q86 84 88 48Z', '#F4F1EA', { mode: 'd' });
    c.path('M20 74 Q50 90 80 74 L78 80 Q50 94 22 80Z', '#4F86C6', { stroke: false, op: 0.9 });
    c.ell(50, 48, 38, 11, '#E9E3D6');
    c.ell(50, 49, 33, 8.4, '#E8892F', { rad: true, sw: 0.8 });
    c.ell(38, 50, 3.4, 2, '#F7C25A', { flat: true, stroke: false }); c.ell(56, 47, 3, 1.8, '#F7C25A', { flat: true, stroke: false });
    c.ell(64, 51, 3.4, 2, '#4C9A3F', { flat: true, stroke: false }); c.ell(46, 46, 2.6, 1.6, '#4C9A3F', { flat: true, stroke: false });
    c.shine('M14 52 Q15 66 22 74 Q18 62 18 52Z', 0.5);
    c.path('M68 40 L92 24 L96 29 L74 46Z', '#C9CED4', { sw: 0.8 });
  });

  add('mom', function(c) {
    c.shadow(50, 91, 24, 4);
    c.path('M42 80 L40 90 H49 L49 80Z', SKIN, { sw: 0.8 }); c.path('M51 80 L51 90 H60 L58 80Z', SKIN, { sw: 0.8 });
    c.ell(45, 91, 7, 2.6, '#6B4A32'); c.ell(55, 91, 7, 2.6, '#6B4A32');
    c.path('M36 40 Q50 34 64 40 L74 84 Q50 92 26 84Z', '#2E9C9A');
    c.path('M32 44 L22 66 Q22 70 27 69 L38 52Z', '#2E9C9A', { sw: 0.9 }); c.path('M68 44 L78 66 Q78 70 73 69 L62 52Z', '#2E9C9A', { sw: 0.9 });
    c.circ(24, 69, 4, SKIN, { rad: true, sw: 0.8 }); c.circ(76, 69, 4, SKIN, { rad: true, sw: 0.8 });
    c.rect(36, 56, 28, 3, '#F2C94C', { r: 1.5, sw: 0.6 });
    c.rect(45, 34, 10, 9, SKIN, { r: 3, sw: 0.8 });
    c.circ(50, 24, 14, '#6B3F22', { rad: true });
    c.circ(50, 8, 7, '#6B3F22', { rad: true });
    c.circ(50, 26, 12.4, SKIN, { rad: true, sw: 1 });
    c.path('M37 24 Q40 11 50 12 Q61 11 63 24 Q57 16 50 17 Q43 16 37 24Z', '#7A4A2A', { sw: 0.8 });
    face(c, 50, 27, 12);
    c.shine('M36 38 Q36 50 40 56 Q38 48 38 40Z', 0.35);
  });

  add('dad', function(c) {
    c.shadow(50, 91, 24, 4);
    c.path('M39 66 L38 90 H48 L50 66Z', '#3E5C86'); c.path('M50 66 L52 90 H62 L61 66Z', '#3E5C86');
    c.ell(43, 91, 7.5, 2.6, '#5A3E2A'); c.ell(57, 91, 7.5, 2.6, '#5A3E2A');
    c.path('M33 40 Q50 34 67 40 L66 70 H34Z', '#C95B3C');
    c.path('M33 42 L22 64 Q23 68 28 67 L38 52Z', '#C95B3C', { sw: 0.9 }); c.path('M67 42 L78 64 Q77 68 72 67 L62 52Z', '#C95B3C', { sw: 0.9 });
    c.circ(25, 68, 4.2, SKIN, { rad: true, sw: 0.8 }); c.circ(75, 68, 4.2, SKIN, { rad: true, sw: 0.8 });
    c.path('M44 38 L50 46 L56 38', '#fff', { sw: 0.9 });
    c.line('M50 46 V70', '#8d3a22', 1, { op: 0.6 });
    c.rect(44, 33, 12, 9, SKIN, { r: 3, sw: 0.8 });
    c.circ(50, 24, 12.6, SKIN, { rad: true, sw: 1 });
    c.path('M37 22 Q38 9 50 9 Q62 9 63 22 Q58 15 50 15 Q42 15 37 22Z', '#3A2515', { sw: 0.8 });
    face(c, 50, 26, 12);
    c.shine('M36 44 Q35 56 38 64 Q37 54 38 46Z', 0.3);
  });

  add('kid', function(c) {
    c.shadow(50, 91, 20, 4);
    c.path('M41 74 L40 90 H48 L49 74Z', '#4B6FA8'); c.path('M51 74 L52 90 H60 L59 74Z', '#4B6FA8');
    c.ell(44, 91, 6.5, 2.4, '#C94A3A'); c.ell(56, 91, 6.5, 2.4, '#C94A3A');
    c.path('M36 50 Q50 44 64 50 L62 76 H38Z', '#F2B63A');
    c.path('M36 52 L27 68 Q28 71 32 70 L40 58Z', '#F2B63A', { sw: 0.9 }); c.path('M64 52 L73 68 Q72 71 68 70 L60 58Z', '#F2B63A', { sw: 0.9 });
    c.circ(29, 70, 3.8, SKIN, { rad: true, sw: 0.8 }); c.circ(71, 70, 3.8, SKIN, { rad: true, sw: 0.8 });
    c.rect(45, 44, 10, 8, SKIN, { r: 3, sw: 0.8 });
    c.circ(50, 31, 15, SKIN, { rad: true, sw: 1 });
    c.path('M35 29 Q36 13 50 13 Q64 13 65 29 Q60 21 52 21 Q44 22 35 29Z', '#7A4A2A', { sw: 0.8 });
    face(c, 50, 33, 14);
    c.shine('M38 54 Q37 64 40 72 Q39 62 40 56Z', 0.3);
  });

  add('map', function(c) {
    c.shadow(50, 88, 38, 5);
    c.path('M10 30 L36 24 L64 32 L90 24 V76 L64 84 L36 76 L10 84Z', '#F1E0B5');
    c.path('M36 24 V76 M64 32 V84', '#C9B07A', { flat: true, sw: 1.2, stroke: '#C9B07A' });
    c.path('M16 40 Q24 34 30 42 Q28 52 20 54 Q14 48 16 40Z', '#8DBB6A', { sw: 0.8 });
    c.path('M42 50 Q52 42 58 52 Q56 64 46 64 Q40 58 42 50Z', '#8DBB6A', { sw: 0.8 });
    c.path('M70 38 Q80 34 84 44 Q80 52 72 50Z', '#8DBB6A', { sw: 0.8 });
    c.ell(30, 68, 8, 3, '#8FC4DC', { flat: true, stroke: false, op: 0.7 });
    c.line('M22 56 Q32 66 44 58 T66 60 T80 54', '#B5322A', 1.6, { dash: '3 3' });
    c.line('M76 50 l8 8 M84 50 l-8 8', '#B5322A', 2.4);
    c.shine('M12 30 L34 25 L34 28 L14 33Z', 0.4);
  });

  // The mark beside the app's name: an open book with a star.
  add('lector-mark', function(c) {
    c.shadow(50, 88, 38, 4);
    c.path('M8 30 Q29 20 50 32 V84 Q29 72 8 82Z', '#FFF1CF');
    c.path('M92 30 Q71 20 50 32 V84 Q71 72 92 82Z', '#FFFBEE');
    c.path('M8 82 Q29 72 50 84 Q71 72 92 82 V88 Q71 78 50 90 Q29 78 8 88Z', '#0E8F86');
    c.line('M16 42 Q29 38 42 44 M16 52 Q29 48 42 54 M16 62 Q29 58 42 64 M58 44 Q71 38 84 42 M58 54 Q71 48 84 52', '#C9B88E', 2.2);
    c.path('M50 2 L55 14 L68 15 L58 24 L61 37 L50 30 L39 37 L42 24 L32 15 L45 14Z', '#F4B63F', { rad: true });
  });

  return { add: add, obj: obj, scene: scene, has: function(id) { return !!OBJ[id]; }, ids: function() { return Object.keys(OBJ); },
           backdrops: function() { return Object.keys(BG); }, _Ctx: Ctx, _mix: mix, _face: face, _skin: SKIN };
})();
