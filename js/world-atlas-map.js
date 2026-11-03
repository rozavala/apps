/* ================================================================
   WORLD ATLAS — map helpers (world-atlas-map.js)
   Uses the shared outlines + flags in js/world-map-data.js (WorldMap).

     AtlasMap.flag(country, cls, wave)  -> SVG flag (emoji fallback)
     AtlasMap.locator(iso, opts)        -> SVG: the country in red, its
                                           neighbours tinted, on a framed map
     AtlasMap.overview(colorOf)         -> whole-world SVG (home screen)
     AtlasMap.neighbours(iso)           -> neighbour ISO codes
     new AtlasMap.Live(host, {onTap})   -> interactive map for the map quiz
   ================================================================ */

var AtlasMap = (function() {
  'use strict';

  var ok = typeof WorldMap !== 'undefined';
  var LAND = '#eeece4', NEIGH = '#c8e6d9', TARGET = '#e8553d', SEA = '#a9d6ee';
  // gentle continent tints for the overview map
  var CONT = { sa: '#cfe8c3', na: '#ddd3f6', eu: '#cfdff6', af: '#f6dcc3', as: '#f6e7b9', oc: '#f5d2e3', an: '#f3f7fa' };

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function flag(c, cls, wave) {
    if (ok && c && WorldMap.hasFlag(c.id)) return WorldMap.flag(c.id, { cls: cls || 'wa-flag', wave: !!wave });
    return '<span class="' + (cls || 'wa-flag') + ' wa-flag-emoji" aria-hidden="true">' + esc(c ? c.flag : '') + '</span>';
  }

  function neighbours(iso) {
    var inf = ok && WorldMap.info(iso);
    return inf ? inf.n.slice() : [];
  }

  function isTiny(iso) {
    var inf = ok && WorldMap.info(iso);
    return !inf || inf.a < 45;
  }

  // A frame around the country, wide enough to show its surroundings.
  function frameFor(iso, aspect, minW) {
    var inf = WorldMap.info(iso);
    aspect = aspect || 1.6; minW = minW || 170;
    var b = inf ? inf.b : [0, 0, WorldMap.W, WorldMap.H];
    var w = b[2] - b[0], h = b[3] - b[1], cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2;
    if (inf && inf.a < 45) { cx = inf.c[0]; cy = inf.c[1]; }
    w = Math.max(w * 2, minW); h = Math.max(h * 1.7, minW / aspect);
    if (w / h > aspect) h = w / aspect; else w = h * aspect;
    return [cx - w / 2, cy - h / 2, w, h];
  }

  function pathsSVG(fillOf, sw) {
    var s = '';
    WorldMap.codes().forEach(function(code) {
      s += '<path d="' + WorldMap.path(code) + '" fill="' + fillOf(code) + '" stroke="#fff" stroke-width="' + sw + '" stroke-linejoin="round" data-code="' + code + '"/>';
    });
    return s;
  }

  function locator(iso, opts) {
    if (!ok) return '';
    opts = opts || {};
    var box = frameFor(iso, opts.aspect || 1.6, opts.minW);
    var nb = neighbours(iso), inf = WorldMap.info(iso), u = box[2] / 340;
    var s = '<svg class="' + (opts.cls || 'wa-locator') + '" viewBox="' + box.map(function(n) { return n.toFixed(1); }).join(' ') + '" preserveAspectRatio="xMidYMid slice" role="img" aria-label="' + esc(opts.label || '') + '">' +
      '<rect x="' + box[0] + '" y="' + box[1] + '" width="' + box[2] + '" height="' + box[3] + '" fill="' + SEA + '"/>' +
      '<path d="' + WorldMap.graticule(10) + '" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="' + (u * 0.8).toFixed(2) + '"/>' +
      pathsSVG(function(code) { return code === iso ? TARGET : nb.indexOf(code) >= 0 ? NEIGH : LAND; }, (u * 0.9).toFixed(2));
    if (inf && inf.a < 45) {
      s += '<circle cx="' + inf.c[0] + '" cy="' + inf.c[1] + '" r="' + (12 * u).toFixed(1) + '" fill="none" stroke="' + TARGET + '" stroke-width="' + (2.6 * u).toFixed(2) + '"/>' +
        '<circle cx="' + inf.c[0] + '" cy="' + inf.c[1] + '" r="' + (2.6 * u).toFixed(1) + '" fill="' + TARGET + '"/>';
    }
    return s + '</svg>';
  }

  function overview(colorOf) {
    if (!ok) return '';
    var F = [-20, -20, WorldMap.W + 40, WorldMap.H + 40];
    var s = '<svg class="wa-overview" viewBox="' + F.join(' ') + '" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' +
      '<path d="' + WorldMap.outline() + '" fill="' + SEA + '" stroke="#8cc3e0" stroke-width="2"/>' +
      '<path d="' + WorldMap.graticule(30) + '" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.4"/>';
    WorldMap.codes().forEach(function(code) {
      s += '<path d="' + WorldMap.path(code) + '" fill="' + (colorOf(code) || CONT[WorldMap.continentOf(code)] || LAND) + '" stroke="#fff" stroke-width="1"/>';
    });
    return s + '</svg>';
  }

  // ── Interactive map for the map quiz ──
  function Live(host, opts) {
    this.host = host; this.opts = opts || {};
    var F = [-20, -20, WorldMap.W + 40, WorldMap.H + 40];
    this.box = F;
    host.innerHTML = '<svg class="wa-live" viewBox="' + F.join(' ') + '" preserveAspectRatio="xMidYMid meet" role="img">' +
      '<path d="' + WorldMap.outline() + '" fill="' + SEA + '"/>' +
      '<path class="wa-live-grat" d="' + WorldMap.graticule(15) + '"/>' +
      '<g class="wa-live-lands">' + WorldMap.codes().map(function(code) { return '<path class="wa-live-land" data-code="' + code + '" d="' + WorldMap.path(code) + '"/>'; }).join('') + '</g>' +
      '<g class="wa-live-marks"></g></svg>';
    this.svg = host.querySelector('svg');
    this.marks = host.querySelector('.wa-live-marks');
    this.lands = {};
    var self = this;
    Array.prototype.forEach.call(host.querySelectorAll('.wa-live-land'), function(p) { self.lands[p.getAttribute('data-code')] = p; });
    var down = null;
    this.svg.addEventListener('pointerdown', function(e) { down = [e.clientX, e.clientY]; });
    this.svg.addEventListener('pointerup', function(e) {
      if (!down) return;
      var moved = Math.abs(e.clientX - down[0]) + Math.abs(e.clientY - down[1]);
      down = null;
      if (moved > 14) return;
      var t = e.target && e.target.closest ? e.target.closest('[data-code],[data-hit]') : null;
      var code = t ? (t.getAttribute('data-code') || t.getAttribute('data-hit')) : null;
      if (self.opts.onTap) self.opts.onTap(code);
    });
  }
  Live.prototype.setBox = function(b) {
    this.box = b;
    this.svg.setAttribute('viewBox', b.map(function(n) { return n.toFixed(1); }).join(' '));
    var r = this.svg.getBoundingClientRect();
    this.upp = r.width ? Math.max(b[2] / r.width, b[3] / r.height) : b[2] / 360;
  };
  // Frame a window around a country; `spread` = window width in grid units.
  Live.prototype.frame = function(iso, spread, jitter) {
    var inf = WorldMap.info(iso), r = this.svg.getBoundingClientRect();
    var aspect = r.width && r.height ? r.width / r.height : 1.3;
    var b = inf.b, cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2;
    var w = Math.max(spread, (b[2] - b[0]) * 2.2), h = Math.max(w / aspect, (b[3] - b[1]) * 1.8);
    w = Math.max(w, h * aspect);
    // shift the window so the answer is not always dead centre
    if (jitter) { cx += (Math.random() - 0.5) * w * jitter; cy += (Math.random() - 0.5) * h * jitter; }
    this.setBox([cx - w / 2, cy - h / 2, w, h]);
  };
  Live.prototype.paint = function(fn) {
    for (var code in this.lands) {
      var st = fn(code) || {};
      this.lands[code].setAttribute('fill', st.fill || LAND);
      this.lands[code].setAttribute('class', 'wa-live-land' + (st.cls ? ' ' + st.cls : ''));
    }
  };
  Live.prototype.ring = function(iso, cls, tap) {
    var inf = WorldMap.info(iso);
    if (!inf) return;
    var u = this.upp || 1;
    this.marks.insertAdjacentHTML('beforeend', '<circle class="wa-live-ring ' + (cls || '') + '" cx="' + inf.c[0] + '" cy="' + inf.c[1] + '" r="' + (11 * u).toFixed(2) + '" stroke-width="' + (2.6 * u).toFixed(2) + '"' + (tap ? ' data-hit="' + iso + '"' : '') + '/>');
  };
  Live.prototype.label = function(iso, text) {
    var inf = WorldMap.info(iso);
    if (!inf) return;
    var u = this.upp || 1;
    this.marks.insertAdjacentHTML('beforeend', '<text class="wa-live-label" x="' + inf.c[0] + '" y="' + (inf.c[1] + 4 * u) + '" font-size="' + (13 * u).toFixed(2) + '" stroke-width="' + (3 * u).toFixed(2) + '" text-anchor="middle">' + esc(text) + '</text>');
  };
  Live.prototype.clearMarks = function() { this.marks.innerHTML = ''; };
  Live.prototype.flash = function(iso, cls) {
    var p = this.lands[iso];
    if (!p) return;
    p.classList.add(cls);
  };

  return { ok: ok, flag: flag, locator: locator, overview: overview, neighbours: neighbours, isTiny: isTiny, Live: Live, TARGET: TARGET };
})();
