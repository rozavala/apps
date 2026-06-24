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
    },
    {
      id: 'great_wave',
      title: 'The Great Wave off Kanagawa',
      artist: 'Katsushika Hokusai',
      year: 1831,
      note: 'A woodblock print. The huge wave curls left like a claw and frames tiny Mount Fuji behind it. Draw the big wave arc first, then the foam fingers, then the boats and the mountain.',
      thumbBg: 'linear-gradient(135deg,#1d4ed8,#0ea5e9,#e0f2fe)',
      guideSvg:
        '<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">' +
        '<g fill="none" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          // Great cresting wave — big curl on the left
          '<path d="M20 380 Q120 160 320 160 Q470 160 520 280 Q470 220 380 240 Q300 260 300 330"/>' +
          // Curling foam crest
          '<path d="M300 160 Q260 120 300 90 Q360 80 360 140 Q340 190 290 180"/>' +
          // Foam fingers reaching down
          '<path d="M340 200 Q360 250 330 300"/>' +
          '<path d="M400 200 Q420 260 390 320"/>' +
          '<path d="M460 220 Q480 280 450 340"/>' +
          // Trough wave (middle)
          '<path d="M40 460 Q200 400 360 440 Q520 480 760 420"/>' +
          // Far smaller wave
          '<path d="M520 360 Q620 320 760 360"/>' +
          // Mount Fuji (small, in distance, with snow notch)
          '<path d="M560 380 L650 300 L740 380"/>' +
          '<path d="M625 325 L635 340 L650 330 L665 345 L675 335"/>' +
          // Two long boats riding the swells
          '<path d="M120 430 Q200 470 300 440"/>' +
          '<path d="M260 470 Q340 510 440 480"/>' +
        '</g>' +
        '</svg>'
    },
    {
      id: 'mona_lisa',
      title: 'Mona Lisa',
      artist: 'Leonardo da Vinci',
      year: 1503,
      note: 'A portrait built on a calm triangle: the folded hands form the base and the head the top. The figure sits slightly turned (three-quarter view). Block in the triangle and the oval face before any detail.',
      thumbBg: 'linear-gradient(135deg,#78350f,#a16207,#1c1917)',
      guideSvg:
        '<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">' +
        '<g fill="none" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          // Stable triangle of the pose (compositional guide)
          '<path d="M400 150 L250 560 L550 560 Z"/>' +
          // Head — oval, slightly turned
          '<ellipse cx="400" cy="200" rx="80" ry="100"/>' +
          // Hairline framing the face
          '<path d="M325 180 Q400 110 475 180"/>' +
          // Eyes, nose, the famous faint smile
          '<path d="M350 195 Q370 185 390 195"/>' +
          '<path d="M410 195 Q430 185 450 195"/>' +
          '<path d="M400 200 L392 235 L408 235"/>' +
          '<path d="M370 260 Q400 275 430 260"/>' +
          // Shoulders and body (three-quarter turn)
          '<path d="M300 300 Q400 260 500 300 L530 560 L270 560 Z"/>' +
          // Folded hands at the base
          '<path d="M330 470 Q400 440 470 470 Q430 510 370 510 Q345 500 330 470 Z"/>' +
          // Distant landscape horizon behind the shoulders
          '<path d="M40 300 Q200 270 360 300"/>' +
          '<path d="M440 300 Q600 270 760 300"/>' +
        '</g>' +
        '</svg>'
    },
    {
      id: 'the_scream',
      title: 'The Scream',
      artist: 'Edvard Munch',
      year: 1893,
      note: 'A strong diagonal bridge pulls your eye from the front figure back to two small walkers. The sky flows in wavy bands above a swirling fjord. Draw the bridge rails first to set the diagonal.',
      thumbBg: 'linear-gradient(135deg,#b45309,#f59e0b,#7c2d12)',
      guideSvg:
        '<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">' +
        '<g fill="none" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          // Wavy sky bands
          '<path d="M0 90 Q200 50 400 90 Q600 130 800 80"/>' +
          '<path d="M0 150 Q200 110 400 150 Q600 190 800 140"/>' +
          '<path d="M0 210 Q200 170 400 210 Q600 250 800 200"/>' +
          // Swirling fjord water below
          '<path d="M0 320 Q200 290 400 330 Q600 370 800 320"/>' +
          '<path d="M0 380 Q200 350 400 390 Q600 430 800 380"/>' +
          // Diagonal bridge rail (the line that drives the composition)
          '<path d="M20 580 L520 300"/>' +
          '<path d="M120 580 L560 330"/>' +
          // Bridge deck edge
          '<path d="M20 580 L120 580"/>' +
          // Foreground figure: oval head, wavy body, hands to cheeks
          '<ellipse cx="200" cy="360" rx="55" ry="70"/>' +
          '<path d="M200 430 Q150 500 170 580"/>' +
          '<path d="M200 430 Q250 500 230 580"/>' +
          '<path d="M150 350 Q140 400 165 420"/>' +
          '<path d="M250 350 Q260 400 235 420"/>' +
          // Two small distant figures on the bridge
          '<path d="M470 320 L470 360"/>' +
          '<path d="M510 305 L510 345"/>' +
        '</g>' +
        '</svg>'
    },
    {
      id: 'pointillist_park',
      title: 'A Pointillist Park',
      artist: 'after Georges Seurat',
      year: 1886,
      note: 'Pointillism: build the whole scene from tiny separate dots of pure colour. Up close they are specks; step back and your eye blends them. Keep figures as simple upright shapes along the riverbank.',
      thumbBg: 'linear-gradient(135deg,#15803d,#65a30d,#fde68a)',
      guideSvg:
        '<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">' +
        '<g fill="none" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          // Riverbank lawn line and water edge
          '<path d="M0 440 Q200 420 400 440 Q600 460 800 430"/>' +
          '<path d="M0 520 L800 520"/>' +
          // Tall tree trunk and rounded canopy (right)
          '<path d="M650 440 L650 200"/>' +
          '<path d="M650 200 Q560 180 560 110 Q650 60 740 110 Q740 180 650 200"/>' +
          // Smaller tree (left)
          '<path d="M150 440 L150 280"/>' +
          '<circle cx="150" cy="240" r="60"/>' +
          // A standing figure (parasol lady) — simple oval head + bell skirt
          '<circle cx="440" cy="300" r="26"/>' +
          '<path d="M440 326 L410 460 L470 460 Z"/>' +
          '<path d="M380 270 Q440 230 500 270"/>' +
          '<path d="M440 270 L440 300"/>' +
          // A seated figure
          '<circle cx="280" cy="380" r="22"/>' +
          '<path d="M280 402 L260 470 L320 470 Z"/>' +
          // Small sailboat on the water
          '<path d="M560 480 L620 480 L590 460 Z"/>' +
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

    // Defer one frame so the new screen has had a chance to lay out
    // before we read getBoundingClientRect — older WebKit (iPad
    // WebMIDIBrowser shell) can return 0×0 if we read synchronously.
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(_mountCanvas);
    } else {
      setTimeout(_mountCanvas, 0);
    }
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
