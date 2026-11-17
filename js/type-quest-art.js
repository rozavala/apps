/* ================================================================
   TYPE QUEST — art (js/type-quest-art.js)

   Hand-built SVG: a keyboard drawn key by key (keycaps with a lit top
   face, the bumps on F and J, the ISO Enter on the Latin-American
   layout), coloured by the finger that presses each key; two hands
   with coloured finger caps; rank medals and section icons.

     TypeQuestArt.keyboard(opts)   opts: layout, zones, next (steps),
                                   heat {code: 0..1}, label (aria)
     TypeQuestArt.hands(opts)      opts: active (finger ids), label
     TypeQuestArt.medal(i, size)   the typing rank i
     TypeQuestArt.icon(name, size)
   All text passed in is our own; nothing typed by a kid is drawn here.
   ================================================================ */

var TypeQuestArt = (function() {
  'use strict';

  var D = TypeQuestData;
  var U = 44, GAP = 4, PAD = 14;
  var FINGER = {};
  D.FINGERS.forEach(function(f) { FINGER[f.id] = f; });

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  var uid = 0;

  function lang() { return typeof getKidLang === 'function' && getKidLang() === 'en' ? 1 : 0; }

  // A keycap: the dark skirt, then the lighter dished top.
  function cap(x, y, w, h, top, edge, id) {
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="7" fill="' + edge + '"/>' +
      '<rect x="' + (x + 3) + '" y="' + (y + 2) + '" width="' + (w - 6) + '" height="' + (h - 8) + '" rx="5" fill="' + top + '"/>' +
      '<rect x="' + (x + 3) + '" y="' + (y + 2) + '" width="' + (w - 6) + '" height="' + (h - 8) + '" rx="5" fill="url(#' + id + '-sheen)"/>';
  }

  function legend(k, x, y, w, h, li) {
    var cx = x + w / 2, out = '';
    var ink = '#1f2937';
    if (!k.base) {
      var lab = (D.CONTROL_LABELS[k.code] || ['', ''])[li];
      if (!lab) return '';
      var left = /Left|Tab|Caps|Shift/.test(k.code) && k.code !== 'ShiftRight';
      return '<text x="' + (left ? x + 9 : x + w - 9) + '" y="' + (y + h - 14) + '" font-size="11" font-weight="700" fill="#4b5563" text-anchor="' + (left ? 'start' : 'end') + '">' + esc(lab) + '</text>';
    }
    if (k.code === 'Space') return '';
    if (/^[a-zñ]$/.test(k.base)) {
      return '<text x="' + cx + '" y="' + (y + h / 2 + 4) + '" font-size="19" font-weight="800" fill="' + ink + '" text-anchor="middle">' + esc(k.base.toUpperCase()) + '</text>';
    }
    out += '<text x="' + cx + '" y="' + (y + 15) + '" font-size="11" font-weight="700" fill="#4b5563" text-anchor="middle">' + esc(k.shift) + '</text>';
    out += '<text x="' + cx + '" y="' + (y + h - 11) + '" font-size="14" font-weight="800" fill="' + ink + '" text-anchor="middle">' + esc(k.base) + '</text>';
    return out;
  }

  // keyboard({ layout:'us'|'latam', zones:true, next:[{code,shift,alt}], heat:{code:rate}, label })
  function keyboard(opts) {
    opts = opts || {};
    var L = D.LAYOUTS[opts.layout] || D.LAYOUTS.us, li = lang(), id = 'tqk' + (++uid);
    var next = opts.next || [], first = next[0] || null;
    var want = {}, mods = {};
    next.forEach(function(s, i) {
      want[s.code] = i === 0 ? 'now' : 'then';
      if (s.shift) { var f = D.FINGER_OF[s.code]; mods[f && f.charAt(0) === 'l' ? 'ShiftRight' : 'ShiftLeft'] = i === 0 ? 'now' : 'then'; }
      if (s.alt) mods[(D.FINGER_OF[s.code] || 'l').charAt(0) === 'l' ? 'AltRight' : 'AltLeft'] = i === 0 ? 'now' : 'then';
    });
    var width = 15 * U, height = 5 * U;
    var W = width + PAD * 2, H = height + PAD * 2 + 6;
    var s = '<svg class="tq-kb" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(opts.label || (li ? 'Keyboard' : 'Teclado')) + '" xmlns="http://www.w3.org/2000/svg" font-family="Nunito, system-ui, sans-serif">';
    s += '<defs>' +
      '<linearGradient id="' + id + '-case" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e5e7eb"/><stop offset=".55" stop-color="#cfd3da"/><stop offset="1" stop-color="#aeb4be"/></linearGradient>' +
      '<linearGradient id="' + id + '-sheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".45" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#000" stop-opacity=".05"/></linearGradient>' +
      '<filter id="' + id + '-glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '</defs>';
    // the case, with a soft shadow under it
    s += '<rect x="6" y="10" width="' + (W - 12) + '" height="' + (H - 10) + '" rx="22" fill="#000" opacity=".12"/>';
    s += '<rect x="2" y="2" width="' + (W - 4) + '" height="' + (H - 8) + '" rx="20" fill="url(#' + id + '-case)" stroke="#9ca3af"/>';
    s += '<rect x="' + (PAD - 5) + '" y="' + (PAD - 5) + '" width="' + (width + 10) + '" height="' + (height + 10) + '" rx="12" fill="#4b5563" opacity=".85"/>';

    var rings = '';
    L.list.forEach(function(k) {
      if (k.code === 'EnterLow') return;
      var x = PAD + k.x * U + GAP / 2, y = PAD + k.row * U + GAP / 2, w = k.w * U - GAP, h = U - GAP;
      var f = FINGER[k.finger];
      var top = opts.zones !== false && f ? f.color : '#f9fafb';
      if (!k.finger) top = '#e5e7eb';
      var edge = '#9ca3af';
      if (opts.heat && opts.heat[k.code] > 0) {
        var r = Math.min(1, opts.heat[k.code]);
        top = r > 0.25 ? '#ef4444' : r > 0.12 ? '#f97316' : '#fbbf24';
      }
      var shape;
      if (k.code === 'Enter' && L.id === 'latam') {
        // the tall ISO Enter: wide on top, narrower below
        var low = L.keys.EnterLow, x2 = PAD + low.x * U + GAP / 2, yb = y + 2 * U - GAP;
        var p = 'M' + (x + 7) + ',' + y + ' H' + (x + w - 7) + ' Q' + (x + w) + ',' + y + ' ' + (x + w) + ',' + (y + 7) +
          ' V' + (yb - 7) + ' Q' + (x + w) + ',' + yb + ' ' + (x + w - 7) + ',' + yb + ' H' + (x2 + 7) + ' Q' + x2 + ',' + yb + ' ' + x2 + ',' + (yb - 7) +
          ' V' + (y + h + 7) + ' Q' + x2 + ',' + (y + h) + ' ' + (x2 - 7) + ',' + (y + h) + ' H' + (x + 7) + ' Q' + x + ',' + (y + h) + ' ' + x + ',' + (y + h - 7) + ' V' + (y + 7) + ' Q' + x + ',' + y + ' ' + (x + 7) + ',' + y + ' Z';
        shape = '<path d="' + p + '" fill="' + edge + '"/><path d="' + p + '" fill="' + top + '" transform="translate(0,-3)"/><path d="' + p + '" fill="url(#' + id + '-sheen)" transform="translate(0,-3)"/>';
      } else {
        shape = cap(x, y, w, h, top, edge, id);
      }
      var dim = next.length && !want[k.code] && !mods[k.code];
      s += '<g class="tq-key" data-code="' + k.code + '"' + (dim ? ' opacity=".62"' : '') + '>' + shape + legend(k, x, y, w, h, li);
      if (k.code === 'KeyF' || k.code === 'KeyJ') s += '<rect x="' + (x + w / 2 - 7) + '" y="' + (y + h - 15) + '" width="14" height="3" rx="1.5" fill="#374151" opacity=".55"/>';
      s += '</g>';
      var mark = want[k.code] || mods[k.code];
      if (mark) {
        var ink = f ? f.ink : '#111827';
        if (mark === 'now') rings += '<rect x="' + (x - 5) + '" y="' + (y - 5) + '" width="' + (w + 10) + '" height="' + (h + 10) + '" rx="11" fill="' + ink + '" opacity=".22" filter="url(#' + id + '-glow)"/>';
        rings += '<rect class="tq-ring tq-ring-' + mark + '" x="' + (x - 2) + '" y="' + (y - 2) + '" width="' + (w + 4) + '" height="' + (h + 4) + '" rx="9" fill="none" stroke="' + ink + '" stroke-width="' + (mark === 'now' ? 4.5 : 3) + '"' +
          (mark === 'then' ? ' stroke-dasharray="6 5"' : '') + '/>';
      }
    });
    s += rings;
    if (first) s += '<desc>' + esc(first.code) + '</desc>';
    s += '</svg>';
    return s;
  }

  // ── Hands ───────────────────────────────────────────────────────
  // Seen from above, palms down: the left hand's little finger is on
  // the far left, the thumbs meet in the middle over the space bar.
  var FINGER_GEOM = [ // [dx from palm left, length, width, tilt]
    [8, 62, 22, -8], [34, 80, 24, -3], [62, 88, 25, 0], [91, 80, 25, 4]
  ];
  function hand(side, active, x0) {
    var ids = side === 'l' ? ['lp', 'lr', 'lm', 'li'] : ['ri', 'rm', 'rr', 'rp'];
    var geom = side === 'l' ? FINGER_GEOM : FINGER_GEOM.slice().reverse().map(function(g, i) { return [8 + i * 28 + (i ? 1 : 0), g[1], g[2], -g[3]]; });
    var out = '<g class="tq-hand">';
    var palmY = 120, skin = '#f3c9a6', line = '#b9845f';
    var px = x0, pw = 122;
    // thumb, toward the middle, drawn first so the palm covers its root
    var tx = side === 'l' ? px + pw - 20 : px + 20, dir = side === 'l' ? 1 : -1;
    var thumbOn = active.indexOf('th') >= 0;
    out += '<g transform="rotate(' + (dir * 34) + ' ' + tx + ' ' + (palmY + 88) + ')">' +
      '<rect x="' + (tx - 14) + '" y="' + (palmY + 6) + '" width="28" height="84" rx="14" fill="' + skin + '" stroke="' + line + '" stroke-width="2"/>' +
      '<rect x="' + (tx - 14) + '" y="' + (palmY + 6) + '" width="28" height="24" rx="13" fill="' + (thumbOn ? '#9ca3af' : FINGER.th.color) + '" stroke="' + (thumbOn ? '#111827' : line) + '" stroke-width="' + (thumbOn ? 3 : 1.5) + '"/>' +
      '<ellipse cx="' + tx + '" cy="' + (palmY + 15) + '" rx="8" ry="5" fill="#fff" opacity=".55"/>' +
      '</g>';
    // palm and wrist
    out += '<path d="M' + (px + 2) + ',' + (palmY + 6) + ' C' + (px - 2) + ',' + (palmY + 50) + ' ' + (px + 14) + ',' + (palmY + 92) + ' ' + (px + 30) + ',' + (palmY + 110) +
      ' L' + (px + pw - 26) + ',' + (palmY + 110) + ' C' + (px + pw - 8) + ',' + (palmY + 90) + ' ' + (px + pw + 4) + ',' + (palmY + 50) + ' ' + (px + pw) + ',' + (palmY + 4) +
      ' Q' + (px + pw / 2) + ',' + (palmY - 14) + ' ' + (px + 2) + ',' + (palmY + 6) + ' Z" fill="' + skin + '" stroke="' + line + '" stroke-width="2"/>';
    geom.forEach(function(g, i) {
      var fid = ids[i], f = FINGER[fid], on = active.indexOf(fid) >= 0;
      var fx = px + g[0], fy = palmY + 8 - g[1], cx = fx + g[2] / 2;
      out += '<g transform="rotate(' + g[3] + ' ' + cx + ' ' + (palmY + 10) + ')"' + (on ? ' class="tq-finger-on"' : '') + '>' +
        '<rect x="' + fx + '" y="' + fy + '" width="' + g[2] + '" height="' + (g[1] + 14) + '" rx="' + (g[2] / 2) + '" fill="' + skin + '" stroke="' + line + '" stroke-width="2"/>' +
        // knuckle creases
        '<path d="M' + (fx + 5) + ',' + (fy + g[1] * 0.42) + ' q' + (g[2] / 2 - 5) + ',3 ' + (g[2] - 10) + ',0" stroke="' + line + '" stroke-width="1.4" fill="none" opacity=".6"/>' +
        '<path d="M' + (fx + 5) + ',' + (fy + g[1] * 0.7) + ' q' + (g[2] / 2 - 5) + ',3 ' + (g[2] - 10) + ',0" stroke="' + line + '" stroke-width="1.4" fill="none" opacity=".5"/>' +
        // a coloured finger cap with the nail on it
        '<rect x="' + fx + '" y="' + fy + '" width="' + g[2] + '" height="' + (g[1] * 0.34) + '" rx="' + (g[2] / 2) + '" fill="' + f.color + '" stroke="' + (on ? f.ink : line) + '" stroke-width="' + (on ? 3.5 : 1.5) + '"/>' +
        '<ellipse cx="' + cx + '" cy="' + (fy + 9) + '" rx="' + (g[2] / 2 - 5) + '" ry="6" fill="#fff" opacity=".55"/>' +
        (on ? '<circle cx="' + cx + '" cy="' + (fy - 12) + '" r="7" fill="' + f.ink + '"/><path d="M' + (cx - 4) + ',' + (fy - 13) + ' l4,5 l4,-5" stroke="#fff" stroke-width="2" fill="none"/>' : '') +
        '</g>';
    });
    out += '</g>';
    return out;
  }

  function hands(opts) {
    opts = opts || {};
    var active = opts.active || [];
    var s = '<svg class="tq-hands" viewBox="0 0 400 236" role="img" aria-label="' + esc(opts.label || '') + '" xmlns="http://www.w3.org/2000/svg">';
    s += hand('l', active, 40) + hand('r', active, 238);
    s += '</svg>';
    return s;
  }

  // ── Medal for a typing rank ──────────────────────────────────────
  var METALS = [['#cbd5e1', '#64748b'], ['#fde68a', '#b45309'], ['#a7f3d0', '#047857'], ['#bae6fd', '#0369a1'],
    ['#fecaca', '#b91c1c'], ['#ddd6fe', '#6d28d9'], ['#a5f3fc', '#0e7490'], ['#fde047', '#a16207']];
  function medal(i, size) {
    var m = METALS[Math.max(0, Math.min(METALS.length - 1, i | 0))], id = 'tqm' + (++uid), n = (i | 0), stars = '';
    for (var k = 0; k < Math.min(n, 7); k++) {
      var a = -Math.PI / 2 + (k - (Math.min(n, 7) - 1) / 2) * 0.42;
      stars += star(50 + Math.cos(a) * 34, 56 + Math.sin(a) * 34, 5, '#fff');
    }
    return '<svg class="tq-medal" width="' + (size || 64) + '" height="' + (size || 64) + '" viewBox="0 0 100 110" aria-hidden="true">' +
      '<defs><radialGradient id="' + id + '" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="' + m[0] + '"/><stop offset="1" stop-color="' + m[1] + '"/></radialGradient></defs>' +
      '<path d="M30,2 L44,34 L56,34 L70,2 Z" fill="#1d4ed8"/><path d="M42,2 L50,22 L58,2 Z" fill="#dc2626"/>' +
      '<circle cx="50" cy="66" r="40" fill="' + m[1] + '"/><circle cx="50" cy="64" r="36" fill="url(#' + id + ')"/>' +
      '<circle cx="50" cy="64" r="27" fill="none" stroke="' + m[1] + '" stroke-width="2" opacity=".5"/>' +
      // a little keycap in the middle
      '<rect x="36" y="52" width="28" height="26" rx="5" fill="' + m[1] + '"/><rect x="38" y="53" width="24" height="20" rx="4" fill="#fff" opacity=".9"/>' +
      '<text x="50" y="68" font-size="12" font-weight="900" text-anchor="middle" fill="' + m[1] + '" font-family="Nunito, sans-serif">' + (n + 1) + '</text>' +
      stars + '</svg>';
  }
  function star(cx, cy, r, fill) {
    var p = [];
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
      p.push((cx + Math.cos(a) * rr).toFixed(1) + ',' + (cy + Math.sin(a) * rr).toFixed(1));
    }
    return '<polygon points="' + p.join(' ') + '" fill="' + fill + '" stroke="#00000033" stroke-width=".8"/>';
  }

  // ── Section icons ───────────────────────────────────────────────
  function keycapIcon(ch, color) {
    return '<rect x="6" y="10" width="52" height="46" rx="10" fill="#6b7280"/><rect x="9" y="11" width="46" height="38" rx="8" fill="' + color + '"/>' +
      '<rect x="9" y="11" width="46" height="18" rx="8" fill="#fff" opacity=".35"/>' +
      '<text x="32" y="38" font-size="22" font-weight="900" text-anchor="middle" fill="#1f2937" font-family="Nunito, sans-serif">' + esc(ch) + '</text>';
  }
  var ICONS = {
    lessons: function() { return keycapIcon('F', '#86EFAC') + '<rect x="24" y="42" width="16" height="3" rx="1.5" fill="#374151" opacity=".6"/>'; },
    words: function() { return keycapIcon('Aa', '#7DD3FC'); },
    passage: function() {
      return '<path d="M8,14 Q20,8 32,14 L32,56 Q20,50 8,56 Z" fill="#fef3c7" stroke="#92400e" stroke-width="2.5"/>' +
        '<path d="M56,14 Q44,8 32,14 L32,56 Q44,50 56,56 Z" fill="#fffbeb" stroke="#92400e" stroke-width="2.5"/>' +
        '<path d="M13,24 h14 M13,31 h14 M13,38 h12 M37,24 h14 M37,31 h14 M37,38 h10" stroke="#b45309" stroke-width="2" stroke-linecap="round"/>';
    },
    hunt: function() {
      return keycapIcon('?', '#FDE047') + '<circle cx="46" cy="44" r="11" fill="none" stroke="#1e3a8a" stroke-width="4"/><path d="M54,52 l7,7" stroke="#1e3a8a" stroke-width="5" stroke-linecap="round"/>';
    },
    stats: function() {
      return '<rect x="6" y="8" width="52" height="48" rx="8" fill="#fff" stroke="#94a3b8" stroke-width="2"/>' +
        '<rect x="14" y="36" width="8" height="14" rx="2" fill="#86EFAC"/><rect x="26" y="28" width="8" height="22" rx="2" fill="#7DD3FC"/><rect x="38" y="20" width="8" height="30" rx="2" fill="#A5B4FC"/>' +
        '<path d="M12,30 L26,22 L38,16 L52,12" stroke="#dc2626" stroke-width="2.5" fill="none" stroke-linecap="round"/>';
    },
    lock: function() {
      return '<rect x="16" y="28" width="32" height="26" rx="5" fill="#9ca3af"/><path d="M22,28 v-7 a10,10 0 0 1 20,0 v7" stroke="#6b7280" stroke-width="5" fill="none"/><circle cx="32" cy="40" r="4" fill="#4b5563"/>';
    },
    keyboard: function() {
      var s = '<rect x="3" y="16" width="58" height="34" rx="6" fill="#d1d5db" stroke="#6b7280" stroke-width="2"/>';
      for (var r = 0; r < 3; r++) for (var c = 0; c < 7; c++) s += '<rect x="' + (7 + c * 7.5) + '" y="' + (20 + r * 8) + '" width="6" height="6" rx="1.5" fill="#fff"/>';
      return s + '<rect x="18" y="43" width="28" height="4" rx="1.5" fill="#fff"/>';
    }
  };
  function icon(name, size) {
    var f = ICONS[name] || ICONS.lessons;
    return '<svg class="tq-ic" width="' + (size || 48) + '" height="' + (size || 48) + '" viewBox="0 0 64 64" aria-hidden="true">' + f() + '</svg>';
  }

  return { keyboard: keyboard, hands: hands, medal: medal, icon: icon, star: star };
})();
