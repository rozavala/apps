/* ================================================================
   ART STUDIO — Copy the Master
   Hand-authored simplified SVG "guide" overlays that kids trace
   and paint over. The guides are intentional compositional
   reductions of famous works — not reproductions — so they stay
   copyright-safe and pedagogically useful.

   The screen #screen-copy-master is rendered inside art-studio.html
   alongside the existing #screen-studio. Everything is self-
   contained; no changes to art-studio.js or its tabs.
   ================================================================ */

var CopyMaster = (function() {
  'use strict';

  // ── Compositions ───────────────────────────────────────────────
  // `guideSvg` is drawn at low opacity behind the canvas so kids
  // can paint over the lines. Keep paths simple: <15 per guide.
  var COMPOSITIONS = [
    {
      id: 'starry_night',
      title: 'Starry Night',
      artist: 'Vincent van Gogh',
      year: 1889,
      note: 'Think in swirls. The sky is a river of motion over a quiet town. Paint the sky first, then the cypress, then the village.',
      thumbBg: 'linear-gradient(135deg,#1e3a8a,#312e81,#0f172a)',
      guideSvg:
        '<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">' +
        '<g fill="none" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          // Cypress (left foreground)
          '<path d="M110 600 Q90 450 140 320 Q170 230 150 120"/>' +
          '<path d="M110 600 Q135 470 110 380 Q80 280 130 170"/>' +
          // Village rooftops (silhouette)
          '<path d="M250 520 L250 470 L290 440 L290 490 L340 490 L340 460 L370 430 L400 460 L400 520 Z"/>' +
          '<path d="M400 520 L400 480 L430 450 L470 450 L470 520 Z"/>' +
          '<path d="M470 520 L470 470 L510 440 L550 470 L550 520 Z"/>' +
          '<path d="M550 520 L550 490 L600 460 L630 490 L630 520 Z"/>' +
          '<path d="M250 520 L700 520"/>' +
          // Church steeple
          '<path d="M420 520 L420 430 L440 410 L440 520 Z"/>' +
          '<path d="M440 410 L430 395 L450 395 Z"/>' +
          // Moon + moon halo
          '<circle cx="650" cy="140" r="38"/>' +
          '<circle cx="650" cy="140" r="58"/>' +
          // Star spirals (tight swirls)
          '<path d="M200 180 Q180 160 200 140 Q240 130 240 170 Q220 210 180 200"/>' +
          '<path d="M370 110 Q350 90 370 70 Q410 60 410 100 Q390 140 350 130"/>' +
          // Big swirl across middle-sky
          '<path d="M240 240 Q330 200 420 260 Q510 320 600 260 Q690 200 740 260"/>' +
          '<path d="M240 280 Q330 240 420 300 Q510 360 600 300 Q690 240 740 300"/>' +
          // Hill horizon
          '<path d="M0 500 Q200 460 400 490 Q600 520 800 480"/>' +
        '</g>' +
        '</svg>'
    },
    {
      id: 'water_lilies',
      title: 'Water Lilies',
      artist: 'Claude Monet',
      year: 1919,
      note: 'No hard edges — everything is reflection. Lay soft greens and violets first. Lily pads float in pools of colour, not lines.',
      thumbBg: 'linear-gradient(135deg,#0f766e,#4c1d95,#166534)',
      guideSvg:
        '<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">' +
        '<g fill="none" stroke="#111" stroke-width="2" stroke-linecap="round">' +
          // Pond surface — horizontal ripples
          '<path d="M20 160 Q200 140 400 160 Q600 180 780 160"/>' +
          '<path d="M20 260 Q200 240 400 260 Q600 280 780 260"/>' +
          '<path d="M20 360 Q200 340 400 360 Q600 380 780 360"/>' +
          '<path d="M20 460 Q200 440 400 460 Q600 480 780 460"/>' +
          // Lily pads (flat ellipses, grouped)
          '<ellipse cx="180" cy="200" rx="70" ry="22"/>' +
          '<ellipse cx="260" cy="230" rx="50" ry="16"/>' +
          '<ellipse cx="500" cy="310" rx="85" ry="26"/>' +
          '<ellipse cx="620" cy="340" rx="55" ry="18"/>' +
          '<ellipse cx="300" cy="430" rx="90" ry="28"/>' +
          '<ellipse cx="620" cy="470" rx="70" ry="22"/>' +
          // Individual flowers (tiny circles atop pads)
          '<circle cx="180" cy="198" r="10"/>' +
          '<circle cx="500" cy="308" r="14"/>' +
          '<circle cx="300" cy="428" r="12"/>' +
          // Reflections of "willow" branches
          '<path d="M80 60 Q120 130 80 260 Q60 330 90 430"/>' +
          '<path d="M720 60 Q700 130 740 260 Q760 330 710 430"/>' +
        '</g>' +
        '</svg>'
    },
    {
      id: 'sunflowers',
      title: 'Sunflowers',
      artist: 'Vincent van Gogh',
      year: 1888,
      note: 'Yellow on yellow on yellow. Change the yellows, not the shape. Thick strokes tell the petals apart.',
      thumbBg: 'linear-gradient(135deg,#ca8a04,#facc15,#fbbf24)',
      guideSvg:
        '<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">' +
        '<g fill="none" stroke="#111" stroke-width="2" stroke-linecap="round">' +
          // Vase
          '<path d="M280 440 L280 560 Q280 580 300 580 L500 580 Q520 580 520 560 L520 440 Z"/>' +
          '<path d="M280 440 L260 420 L540 420 L520 440 Z"/>' +
          '<path d="M280 500 L520 500"/>' +
          // Table
          '<path d="M100 580 L700 580"/>' +
          // Stems
          '<path d="M350 440 Q340 360 300 280"/>' +
          '<path d="M400 440 Q400 320 400 220"/>' +
          '<path d="M450 440 Q460 360 500 280"/>' +
          '<path d="M380 440 Q360 400 320 380"/>' +
          '<path d="M420 440 Q440 380 470 360"/>' +
          // Flower heads (circle + radial petals)
          _sunflower(300, 260, 80) +
          _sunflower(400, 180, 90) +
          _sunflower(500, 260, 80) +
          _sunflower(320, 370, 56) +
          _sunflower(470, 360, 56) +
        '</g>' +
        '</svg>'
    },
    {
      id: 'cordillera_sunset',
      title: 'Cordillera al Atardecer',
      artist: 'Paisaje chileno',
      year: null,
      note: 'Los Andes al atardecer: cielo cálido arriba, nieve en las cumbres, valle oscuro abajo. Empieza por el cielo.',
      thumbBg: 'linear-gradient(135deg,#7c2d12,#f97316,#4c1d95)',
      guideSvg:
        '<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">' +
        '<g fill="none" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          // Sky bands (horizontal guides — very faint intentionally)
          '<path d="M0 80 L800 80"/>' +
          '<path d="M0 180 L800 180"/>' +
          '<path d="M0 280 L800 280"/>' +
          // Sun — low, just above ridgeline
          '<circle cx="520" cy="330" r="42"/>' +
          // Far ridgeline
          '<path d="M0 360 L120 300 L230 340 L340 280 L460 330 L580 260 L700 320 L800 290 L800 360 Z"/>' +
          // Mid ridge with snow caps (interior peak pairs)
          '<path d="M0 440 L100 360 L180 400 L260 330 L340 390 L430 320 L520 380 L600 340 L700 400 L800 370 L800 440 Z"/>' +
          '<path d="M260 330 L275 345 L290 332"/>' +
          '<path d="M430 320 L445 335 L460 323"/>' +
          // Foreground valley line + tree clump
          '<path d="M0 520 Q200 500 400 520 Q600 540 800 510"/>' +
          '<path d="M120 520 L125 495 L118 498 Z"/>' +
          '<path d="M150 520 L156 490 L148 494 Z"/>' +
          '<path d="M665 520 L672 490 L660 495 Z"/>' +
        '</g>' +
        '</svg>'
    }
  ];

  // Tiny helper: sunflower head = core circle + 12 radial stroke ticks.
  function _sunflower(cx, cy, r) {
    var out = '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.35) + '"/>';
    out += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '"/>';
    var step = (Math.PI * 2) / 12;
    for (var i = 0; i < 12; i++) {
      var a = i * step;
      var x1 = cx + Math.cos(a) * (r * 0.45);
      var y1 = cy + Math.sin(a) * (r * 0.45);
      var x2 = cx + Math.cos(a) * r;
      var y2 = cy + Math.sin(a) * r;
      out += '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '"/>';
    }
    return out;
  }

  // ── State ──────────────────────────────────────────────────────
  var state = null; // { comp, canvas, ctx, color, size, drawing, lastX, lastY }

  function _esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function _showScreen(id) {
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) screens[i].classList.remove('active');
    var t = document.getElementById(id);
    if (t) t.classList.add('active');
  }

  function open() {
    _showScreen('screen-copy-master');
    _renderPicker();
  }

  function close() {
    _stopDrawing();
    _showScreen('screen-studio');
  }

  function _renderPicker() {
    var wrap = document.getElementById('cm-wrap');
    if (!wrap) return;
    var cards = COMPOSITIONS.map(function(c) {
      return '<button class="cm-card" onclick="CopyMaster.start(\'' + c.id + '\')">' +
        '<div class="cm-thumb" style="background:' + _esc(c.thumbBg) + ';">' +
          c.guideSvg.replace('<svg ', '<svg class="cm-thumb-svg" ') +
        '</div>' +
        '<div class="cm-card-title">' + _esc(c.title) + '</div>' +
        '<div class="cm-card-artist">' + _esc(c.artist) + (c.year ? ' · ' + c.year : '') + '</div>' +
      '</button>';
    }).join('');

    wrap.innerHTML =
      '<div class="cm-header">' +
        '<button class="back-btn" onclick="CopyMaster.close()" aria-label="Back">←</button>' +
        '<h2>🖼 Copy the Master</h2>' +
        '<p>Pinta sobre las líneas de un maestro. Sin puntaje — solo práctica.</p>' +
      '</div>' +
      '<div class="cm-grid">' + cards + '</div>';
  }

  function start(id) {
    var comp = null;
    for (var i = 0; i < COMPOSITIONS.length; i++) {
      if (COMPOSITIONS[i].id === id) { comp = COMPOSITIONS[i]; break; }
    }
    if (!comp) return;

    state = {
      comp: comp,
      color: '#111',
      size: 6
    };
    _renderCanvas();
  }

  var COLORS = ['#111111','#f87171','#fb923c','#facc15','#34d399','#60a5fa','#a78bfa','#ec4899','#ffffff'];
  var SIZES = [3, 6, 12, 20];

  function _renderCanvas() {
    var wrap = document.getElementById('cm-wrap');
    if (!wrap || !state) return;
    var c = state.comp;

    wrap.innerHTML =
      '<div class="cm-header">' +
        '<button class="back-btn" onclick="CopyMaster._backToPicker()" aria-label="Back">←</button>' +
        '<h2>' + _esc(c.title) + '</h2>' +
        '<div class="cm-artist">' + _esc(c.artist) + (c.year ? ' · ' + c.year : '') + '</div>' +
      '</div>' +
      '<div class="cm-note">💡 ' + _esc(c.note) + '</div>' +
      '<div class="cm-stage">' +
        '<div class="cm-guide">' + c.guideSvg + '</div>' +
        '<canvas id="cm-canvas" class="cm-canvas"></canvas>' +
      '</div>' +
      '<div class="cm-tools">' +
        '<div class="cm-palette">' +
          COLORS.map(function(col) {
            var active = col === state.color ? ' active' : '';
            return '<button class="cm-swatch' + active + '" ' +
                   'style="background:' + col + ';" ' +
                   'onclick="CopyMaster._setColor(\'' + col + '\')" ' +
                   'aria-label="Color ' + col + '"></button>';
          }).join('') +
        '</div>' +
        '<div class="cm-sizes">' +
          SIZES.map(function(s) {
            var active = s === state.size ? ' active' : '';
            return '<button class="cm-size' + active + '" ' +
                   'onclick="CopyMaster._setSize(' + s + ')" ' +
                   'aria-label="Pen ' + s + 'px">' +
              '<span class="cm-size-dot" style="width:' + s + 'px;height:' + s + 'px;"></span>' +
            '</button>';
          }).join('') +
        '</div>' +
        '<div class="cm-actions">' +
          '<button class="cm-action" onclick="CopyMaster._clear()">🗑 Borrar</button>' +
          '<button class="cm-action" onclick="CopyMaster._save()">💾 Guardar</button>' +
        '</div>' +
      '</div>';

    _mountCanvas();
  }

  function _backToPicker() {
    _stopDrawing();
    state = null;
    _renderPicker();
  }

  function _mountCanvas() {
    var canvas = document.getElementById('cm-canvas');
    if (!canvas) return;
    var stage = canvas.parentElement;
    var rect = stage.getBoundingClientRect();
    // Use CSS dimensions to back the canvas with a pixel buffer.
    var dpr = window.devicePixelRatio || 1;
    canvas.width  = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    canvas.style.width  = rect.width  + 'px';
    canvas.style.height = rect.height + 'px';
    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    state.canvas = canvas;
    state.ctx = ctx;
    _bindPointerEvents(canvas);
  }

  function _bindPointerEvents(canvas) {
    var drawing = false;
    var lastX = 0, lastY = 0;

    function posFromEvent(ev) {
      var r = canvas.getBoundingClientRect();
      return {
        x: (ev.clientX - r.left),
        y: (ev.clientY - r.top)
      };
    }

    canvas.addEventListener('pointerdown', function(ev) {
      ev.preventDefault();
      canvas.setPointerCapture(ev.pointerId);
      drawing = true;
      var p = posFromEvent(ev);
      lastX = p.x; lastY = p.y;
      state.ctx.strokeStyle = state.color;
      state.ctx.lineWidth = state.size;
      state.ctx.beginPath();
      state.ctx.moveTo(lastX, lastY);
      state.ctx.lineTo(lastX + 0.01, lastY + 0.01); // dot
      state.ctx.stroke();
    });
    canvas.addEventListener('pointermove', function(ev) {
      if (!drawing) return;
      ev.preventDefault();
      var p = posFromEvent(ev);
      state.ctx.strokeStyle = state.color;
      state.ctx.lineWidth = state.size;
      state.ctx.beginPath();
      state.ctx.moveTo(lastX, lastY);
      state.ctx.lineTo(p.x, p.y);
      state.ctx.stroke();
      lastX = p.x; lastY = p.y;
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function(type) {
      canvas.addEventListener(type, function() { drawing = false; });
    });
    state.canvas._zsDrawing = function() { return drawing; };
  }

  function _stopDrawing() {
    if (!state || !state.canvas) return;
    state.canvas = null;
    state.ctx = null;
  }

  function _setColor(c) {
    if (!state) return;
    state.color = c;
    // Update palette active state without re-render
    var btns = document.querySelectorAll('.cm-swatch');
    btns.forEach(function(b) {
      b.classList.toggle('active', b.style.background.replace(/\s/g, '') === c.toLowerCase());
    });
  }

  function _setSize(s) {
    if (!state) return;
    state.size = s;
    var btns = document.querySelectorAll('.cm-size');
    btns.forEach(function(b, i) {
      b.classList.toggle('active', SIZES[i] === s);
    });
  }

  function _clear() {
    if (!state || !state.ctx || !state.canvas) return;
    if (!confirm('¿Borrar todo y empezar de nuevo?')) return;
    var c = state.canvas;
    state.ctx.clearRect(0, 0, c.width, c.height);
  }

  function _save() {
    if (!state || !state.canvas) return;
    try {
      var data = state.canvas.toDataURL('image/png');
      var a = document.createElement('a');
      a.href = data;
      a.download = state.comp.id + '-' + Date.now() + '.png';
      a.click();
      if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
        ActivityLog.log('Art Studio', '🖼', 'Copied "' + state.comp.title + '"');
      }
    } catch (e) {
      alert('No se pudo guardar: ' + e.message);
    }
  }

  return {
    open: open,
    close: close,
    start: start,
    _backToPicker: _backToPicker,
    _setColor: _setColor,
    _setSize: _setSize,
    _clear: _clear,
    _save: _save
  };
})();
