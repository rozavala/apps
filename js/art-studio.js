/* ================================================================
   ART STUDIO — CORE LOGIC & DRAWING
   ================================================================ */

const ArtStudio = (() => {

  // ── Configuration ─────────────────────────────────────────────
  const COLORS = [
    '#EF4444', '#F97316', '#FBBF24', '#10B981', '#67E8F9', '#3B82F6', 
    '#8B5CF6', '#EC4899', '#92400E', '#000000', '#FFFFFF'
  ];
  const BRUSH_SIZES = [3, 8, 16];

  const LESSONS = [
    {
      id: 'shapes',
      title: 'Shapes & Patterns',
      description: 'Learn to draw basic shapes like circles and squares.',
      icon: '⭕',
      tier: 'beginner',
      steps: [
        { text: 'Draw a big circle!', type: 'circle', x: 100, y: 100, r: 50 },
        { text: 'Now draw a square inside it.', type: 'rect', x: 75, y: 75, w: 50, h: 50 },
        { text: 'Add some dots around your shapes.', type: 'pencil' }
      ]
    },
    {
      id: 'mixing',
      title: 'Color Mixing',
      description: 'Discover what happens when you mix colors together!',
      icon: '🎨',
      tier: 'beginner',
      steps: [] // Special handling for color mixing
    },
    {
      id: 'house',
      title: 'Draw a House',
      description: 'Build a house using rectangles and triangles.',
      icon: '🏠',
      tier: 'beginner',
      steps: [
        { text: 'Draw a large rectangle for the house body.', type: 'rect', x: 50, y: 100, w: 100, h: 80 },
        { text: 'Add a triangle on top for the roof.', type: 'line', points: [[50,100], [100,50], [150,100]] },
        { text: 'Draw a small rectangle for the door.', type: 'rect', x: 85, y: 140, w: 30, h: 40 }
      ]
    },
    {
      id: 'tree',
      title: 'Draw a Tree',
      description: 'Use shapes to create a beautiful tree.',
      icon: '🌳',
      tier: 'intermediate',
      steps: [
        { text: 'Draw a tall rectangle for the trunk.', type: 'rect', x: 90, y: 120, w: 20, h: 80 },
        { text: 'Draw a large circle on top for the leaves.', type: 'circle', x: 100, y: 90, r: 50 },
        { text: 'Add some small red circles for apples!', type: 'circle', x: 80, y: 80, r: 5 }
      ]
    },
    {
      id: 'symmetry',
      title: 'Symmetry',
      description: 'Draw on one side and watch it appear on the other!',
      icon: '🦋',
      tier: 'intermediate',
      steps: [
        { text: 'Draw anything on the left side!', type: 'symmetry' }
      ]
    },
    {
      id: 'styles',
      title: 'Art Styles',
      description: 'Try Pointillism like Seurat or a Mondrian grid.',
      icon: '🖼️',
      tier: 'advanced',
      steps: [
        { text: 'Pointillism: Tap to make dots only!', type: 'dots' },
        { text: 'Mondrian: Use straight lines and primary colors.', type: 'grid' },
        { text: 'Pixel Art: Color squares on the grid!', type: 'pixelgrid' }
      ]
    }
  ];

  // ── State ─────────────────────────────────────────────────────
  let mainCanvas, mainCtx;
  let tempCanvas, tempCtx;
  let guideCanvas, guideCtx;
  let isDrawing = false;
  let startX, startY;
  let currentTool = 'pencil';
  let currentColor = COLORS[0];
  let currentSize = BRUSH_SIZES[1];
  let points = [];
  
  // History for undo/redo
  let history = [];
  let redoStack = [];
  const MAX_HISTORY = 20;

  // Lesson state
  let currentLesson = null;
  let currentStepIdx = 0;
  let mixColors = [null, null];

  function getUserKey() {
    return typeof getUserAppKey === 'function' ? getUserAppKey('zs_art_') : null;
  }

  function getProgress() {
    const k = getUserKey();
    if (!k) return { gallery: [], totalStars: 0, lessonsCompleted: [] };
    try { return JSON.parse(localStorage.getItem(k)) || { gallery: [], totalStars: 0, lessonsCompleted: [] }; }
    catch { return { gallery: [], totalStars: 0, lessonsCompleted: [] }; }
  }

  function saveProgress(data) {
    const k = getUserKey();
    if (!k) return;
    const p = getProgress();
    Object.assign(p, data);
    localStorage.setItem(k, JSON.stringify(p));
    if (typeof CloudSync !== 'undefined' && CloudSync.online) CloudSync.push(k);
  }


  // ── Initialization ────────────────────────────────────────────
  function init() {
    // Auto-pull sync
    if (typeof CloudSync !== 'undefined' && CloudSync.online) {
      const u = getActiveUser();
      if (u) CloudSync.pull('zs_art_' + u.name.toLowerCase().replace(/\s+/g, '_'));
    }

    mainCanvas = document.getElementById('main-canvas');
    mainCtx = mainCanvas.getContext('2d', { willReadFrequently: true });
    tempCanvas = document.getElementById('temp-canvas');
    tempCtx = tempCanvas.getContext('2d');

    // Lesson canvases
    const lmCanvas = document.getElementById('lesson-main-canvas');
    const lgCanvas = document.getElementById('lesson-guide-canvas');
    const ltCanvas = document.getElementById('lesson-temp-canvas');
    if (lmCanvas) {
      guideCanvas = lgCanvas;
      guideCtx = guideCanvas.getContext('2d');
    }

    resize();
    window.addEventListener('resize', resize);

    setupPalette();
    setupTools();
    setupCanvasEvents();
    
    // Initial history state
    saveHistory();
  }

  function resize() {
    const tempImg = mainCanvas.toDataURL();
    const dpr = window.devicePixelRatio || 1;
    const rect = mainCanvas.parentElement.getBoundingClientRect();
    
    [mainCanvas, tempCanvas].forEach(c => {
      if (!c) return;
      c.width = rect.width * dpr;
      c.height = rect.height * dpr;
      c.getContext('2d').scale(dpr, dpr);
    });

    const img = new Image();
    img.src = tempImg;
    img.onload = () => mainCtx.drawImage(img, 0, 0, rect.width, rect.height);

    // Resize lesson canvases too if they exist
    const lm = document.getElementById('lesson-main-canvas');
    if (lm) {
      const lRect = lm.parentElement.getBoundingClientRect();
      [lm, guideCanvas, document.getElementById('lesson-temp-canvas')].forEach(c => {
        if (!c) return;
        c.width = lRect.width * dpr;
        c.height = lRect.height * dpr;
        c.getContext('2d').scale(dpr, dpr);
      });
    }
  }

  function setupPalette() {
    ['color-palette', 'lesson-color-palette'].forEach(id => {
      const p = document.getElementById(id);
      if (!p) return;
      p.innerHTML = COLORS.map((c, i) => `
        <div class="color-swatch ${i === 0 ? 'active' : ''}" 
             style="background: ${c}" 
             onclick="ArtStudio.setColor('${c}', this)"></div>
      `).join('');

      const eraser = document.createElement('div');
      eraser.className = 'color-swatch';
      eraser.innerHTML = '🧽';
      eraser.style.display = 'flex';
      eraser.style.alignItems = 'center';
      eraser.style.justifyContent = 'center';
      eraser.onclick = () => setColor('#FFFFFF', eraser);
      p.appendChild(eraser);
    });
  }

  function setupTools() {
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.onclick = () => {
        const tool = btn.dataset.tool;
        currentTool = tool;
        document.querySelectorAll(`.tool-btn`).forEach(b => b.classList.remove('active'));
        document.querySelectorAll(`.tool-btn[data-tool="${tool}"]`).forEach(b => b.classList.add('active'));
      };
    });

    document.querySelectorAll('.brush-size').forEach(btn => {
      btn.onclick = () => {
        const size = parseInt(btn.dataset.size);
        currentSize = size;
        document.querySelectorAll(`.brush-size`).forEach(b => b.classList.remove('active'));
        document.querySelectorAll(`.brush-size[data-size="${size}"]`).forEach(b => b.classList.add('active'));
      };
    });

    const undoBtn = document.getElementById('undo-btn');
    if (undoBtn) undoBtn.onclick = undo;
    const lessonUndo = document.getElementById('lesson-undo-btn');
    if (lessonUndo) lessonUndo.onclick = undo;

    const redoBtn = document.getElementById('redo-btn');
    if (redoBtn) redoBtn.onclick = redo;
    const lessonRedo = document.getElementById('lesson-redo-btn');
    if (lessonRedo) lessonRedo.onclick = redo;

    const clearBtn = document.getElementById('clear-btn');
    if (clearBtn) clearBtn.onclick = clearCanvas;
    const lessonClear = document.getElementById('lesson-clear-btn');
    if (lessonClear) lessonClear.onclick = clearCanvas;
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) saveBtn.onclick = openSaveDialog;
  }

  function setColor(color, el) {
    currentColor = color;
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
    // Activate all swatches with this color across all toolbars
    document.querySelectorAll('.color-swatch').forEach(s => {
      if (s.style.backgroundColor === color || s.getAttribute('style')?.includes(color)) {
        s.classList.add('active');
      }
    });
  }


  // ── Drawing Logic ─────────────────────────────────────────────
  function setupCanvasEvents() {
    const wrappers = [mainCanvas?.parentElement, document.getElementById('lesson-main-canvas')?.parentElement];
    
    wrappers.forEach(wrap => {
      if (!wrap) return;
      wrap.addEventListener('pointerdown', startDrawing);
    });
    window.addEventListener('pointermove', draw);
    window.addEventListener('pointerup', stopDrawing);
  }

  function getCanvasForEvent(e) {
    if (currentLesson) return { canvas: document.getElementById('lesson-main-canvas'), ctx: document.getElementById('lesson-main-canvas').getContext('2d'), temp: document.getElementById('lesson-temp-canvas').getContext('2d') };
    return { canvas: mainCanvas, ctx: mainCtx, temp: tempCtx };
  }

  function startDrawing(e) {
    const { canvas, ctx } = getCanvasForEvent(e);
    const rect = canvas.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
    isDrawing = true;
    points = [{ x: startX, y: startY }];

    if (currentTool === 'fill') {
      floodFill(ctx, canvas, Math.round(startX), Math.round(startY), currentColor);
      isDrawing = false;
      saveHistory();
    }
    
    // Special lesson tools
    const step = currentLesson?.steps[currentStepIdx];
    if (step?.type === 'dots') {
      ctx.fillStyle = currentColor;
      ctx.beginPath();
      ctx.arc(startX, startY, currentSize / 2, 0, Math.PI * 2);
      ctx.fill();
      isDrawing = false;
      saveHistory();
    } else if (step?.type === 'pixelgrid') {
      const gridCount = 16;
      const cellSize = canvas.width / (gridCount * (window.devicePixelRatio || 1));
      const col = Math.floor(startX / cellSize);
      const row = Math.floor(startY / cellSize);
      ctx.fillStyle = currentColor;
      ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      isDrawing = false;
      saveHistory();
    }
  }

  function draw(e) {
    if (!isDrawing) return;
    const { canvas, ctx, temp } = getCanvasForEvent(e);
    if (!canvas || canvas.width === 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentTool === 'pencil') {
      points.push({ x, y });
      drawPencil(ctx);
      
      const step = currentLesson?.steps[currentStepIdx];
      if (step?.type === 'symmetry') {
        const mid = canvas.width / (2 * (window.devicePixelRatio || 1));
        const mirroredPoints = points.map(p => ({ x: mid + (mid - p.x), y: p.y }));
        drawPencil(ctx, mirroredPoints);
      }
    } else {
      drawShapePreview(temp, x, y);
    }
  }

  function stopDrawing(e) {
    if (!isDrawing) return;
    isDrawing = false;

    const { canvas, ctx, temp } = getCanvasForEvent(e);
    if (currentTool !== 'pencil' && currentTool !== 'fill') {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      commitShape(ctx, temp, x, y);
    }

    saveHistory();
    points = [];
  }

  function drawPencil(ctx, pts = points) {
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentSize;

    if (pts.length < 3) {
      ctx.beginPath();
      ctx.arc(pts[0].x, pts[0].y, currentSize / 2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 2; i++) {
      const xc = (pts[i].x + pts[i + 1].x) / 2;
      const yc = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
    }
    ctx.quadraticCurveTo(pts[pts.length - 2].x, pts[pts.length - 2].y, pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.stroke();
  }

  function drawShapePreview(ctx, x, y) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentSize;
    ctx.lineCap = 'round';

    if (currentTool === 'line') {
      let tx = x, ty = y;
      if (currentLesson?.steps[currentStepIdx]?.type === 'grid') {
        if (Math.abs(x - startX) > Math.abs(y - startY)) ty = startY;
        else tx = startX;
      }
      ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(tx, ty); ctx.stroke();
    } else if (currentTool === 'rectangle') {
      ctx.strokeRect(startX, startY, x - startX, y - startY);
    } else if (currentTool === 'circle') {
      const radius = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2));
      ctx.beginPath(); ctx.arc(startX, startY, radius, 0, Math.PI * 2); ctx.stroke();
    }
  }

  function commitShape(ctx, tempCtx, x, y) {
    tempCtx.clearRect(0, 0, tempCtx.canvas.width, tempCtx.canvas.height);
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentSize;
    ctx.lineCap = 'round';

    if (currentTool === 'line') {
      let tx = x, ty = y;
      if (currentLesson?.steps[currentStepIdx]?.type === 'grid') {
        if (Math.abs(x - startX) > Math.abs(y - startY)) ty = startY;
        else tx = startX;
      }
      ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(tx, ty); ctx.stroke();
    } else if (currentTool === 'rectangle') {
      ctx.strokeRect(startX, startY, x - startX, y - startY);
    } else if (currentTool === 'circle') {
      const radius = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2));
      ctx.beginPath(); ctx.arc(startX, startY, radius, 0, Math.PI * 2); ctx.stroke();
    }
  }

  function floodFill(ctx, canvas, startX, startY, fillColor) {
    const dpr = window.devicePixelRatio || 1;
    const x = Math.floor(startX * dpr);
    const y = Math.floor(startY * dpr);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const targetColor = getPixelColor(data, canvas.width, x, y);
    const fillRGB = hexToRgb(fillColor);
    if (colorsMatch(targetColor, [fillRGB.r, fillRGB.g, fillRGB.b, 255])) return;
    const stack = [[x, y]];
    while (stack.length > 0) {
      const [curX, curY] = stack.pop();
      let left = curX;
      while (left > 0 && colorsMatch(getPixelColor(data, canvas.width, left - 1, curY), targetColor)) left--;
      let reachTop = false, reachBottom = false;
      for (let i = left; i < canvas.width && colorsMatch(getPixelColor(data, canvas.width, i, curY), targetColor); i++) {
        setPixelColor(data, canvas.width, i, curY, fillRGB);
        if (curY > 0) {
          if (colorsMatch(getPixelColor(data, canvas.width, i, curY - 1), targetColor)) { if (!reachTop) { stack.push([i, curY - 1]); reachTop = true; } }
          else reachTop = false;
        }
        if (curY < canvas.height - 1) {
          if (colorsMatch(getPixelColor(data, canvas.width, i, curY + 1), targetColor)) { if (!reachBottom) { stack.push([i, curY + 1]); reachBottom = true; } }
          else reachBottom = false;
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }

  function getPixelColor(data, width, x, y) {
    const idx = (y * width + x) * 4;
    return [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
  }
  function setPixelColor(data, width, x, y, rgb) {
    const idx = (y * width + x) * 4;
    data[idx] = rgb.r; data[idx+1] = rgb.g; data[idx+2] = rgb.b; data[idx+3] = 255;
  }
  function colorsMatch(c1, c2, tolerance = 30) {
    return Math.abs(c1[0]-c2[0])<=tolerance && Math.abs(c1[1]-c2[1])<=tolerance && Math.abs(c1[2]-c2[2])<=tolerance && Math.abs(c1[3]-c2[3])<=tolerance;
  }
  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : { r: 0, g: 0, b: 0 };
  }


  // ── History & Actions ─────────────────────────────────────────
  function saveHistory() {
    redoStack = [];
    const { canvas } = currentLesson ? { canvas: document.getElementById('lesson-main-canvas') } : { canvas: mainCanvas };
    if (!canvas) return;
    const snapshot = canvas.toDataURL();
    history.push(snapshot);
    if (history.length > MAX_HISTORY) history.shift();
  }
  function undo() { if (history.length <= 1) return; redoStack.push(history.pop()); restoreFromHistory(history[history.length - 1]); }
  function redo() { if (redoStack.length === 0) return; const snapshot = redoStack.pop(); history.push(snapshot); restoreFromHistory(snapshot); }
  function restoreFromHistory(dataUrl) {
    const { ctx, canvas } = currentLesson ? { ctx: document.getElementById('lesson-main-canvas').getContext('2d'), canvas: document.getElementById('lesson-main-canvas') } : { ctx: mainCtx, canvas: mainCanvas };
    const img = new Image(); img.src = dataUrl;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
    };
  }
  function clearCanvas() { if (confirm('Clear the entire canvas?')) {
    const { ctx, canvas } = currentLesson ? { ctx: document.getElementById('lesson-main-canvas').getContext('2d'), canvas: document.getElementById('lesson-main-canvas') } : { ctx: mainCtx, canvas: mainCanvas };
    ctx.clearRect(0, 0, canvas.width, canvas.height); saveHistory();
  }}


  // ── Guided Lessons ────────────────────────────────────────────
  function initLearn() {
    const tier = getAgeTier();
    const tierOrder = ['beginner', 'intermediate', 'advanced', 'expert'];
    const maxIdx = tierOrder.indexOf(tier);
    const visibleLessons = LESSONS.filter(l => tierOrder.indexOf(l.tier) <= maxIdx);
    
    const listEl = document.getElementById('lesson-list');
    if (!listEl) return;
    const p = getProgress();
    listEl.innerHTML = visibleLessons.map(l => `
      <div class="lesson-card ${p.lessonsCompleted.includes(l.id) ? 'done' : ''}" onclick="ArtStudio.startLesson('${l.id}')">
        <div class="lesson-icon">${l.icon}</div>
        <div class="lesson-card-title">${l.title}</div>
        <div class="lesson-card-tier">${l.tier}</div>
      </div>
    `).join('');
  }

  function startLesson(id) {
    currentLesson = LESSONS.find(l => l.id === id);
    currentStepIdx = 0;
    
    document.getElementById('lesson-select-screen').style.display = 'none';
    if (id === 'mixing') {
      initMixing();
    } else {
      document.getElementById('lesson-game-screen').style.display = 'flex';
      document.getElementById('lesson-title').textContent = currentLesson.title;
      // FIX: Resize lesson canvases now that the container is visible
      requestAnimationFrame(() => resize());
      renderLessonStep();
    }
  }

  function renderLessonStep() {
    const step = currentLesson.steps[currentStepIdx];
    document.getElementById('lesson-step-counter').textContent = `Step ${currentStepIdx + 1}/${currentLesson.steps.length}`;
    document.getElementById('instruction-banner').textContent = step.text;
    document.getElementById('lesson-next-btn').textContent = (currentStepIdx === currentLesson.steps.length - 1) ? 'Finish ✨' : 'Next Step →';
    
    // Set tool based on step
    if (step.type === 'rect') currentTool = 'rectangle';
    else if (step.type === 'circle') currentTool = 'circle';
    else if (step.type === 'line' || step.type === 'grid') currentTool = 'line';
    else currentTool = 'pencil';

    // Special palette for Mondrian
    if (step.type === 'grid') {
      const pal = document.getElementById('color-palette');
      const mondrianColors = ['#EF4444', '#3B82F6', '#FBBF24', '#000000', '#FFFFFF'];
      pal.innerHTML = mondrianColors.map(c => `<div class="color-swatch" style="background:${c}" onclick="ArtStudio.setColor('${c}', this)"></div>`).join('');
      setColor('#000000', pal.firstChild);
    } else if (currentStepIdx === 0) {
      setupPalette();
    }

    // Guide layer
    guideCtx.clearRect(0, 0, guideCanvas.width, guideCanvas.height);
    
    if (step.type === 'pixelgrid') {
      const gridCount = 16;
      const cellSize = guideCanvas.width / gridCount;
      guideCtx.strokeStyle = '#DDD';
      guideCtx.lineWidth = 1;
      guideCtx.setLineDash([]);
      for (let i = 0; i <= gridCount; i++) {
        guideCtx.beginPath(); guideCtx.moveTo(i * cellSize, 0); guideCtx.lineTo(i * cellSize, guideCanvas.height); guideCtx.stroke();
        guideCtx.beginPath(); guideCtx.moveTo(0, i * cellSize); guideCtx.lineTo(guideCanvas.width, i * cellSize); guideCtx.stroke();
      }
      return;
    }

    guideCtx.setLineDash([10, 10]);
    guideCtx.strokeStyle = '#CCC';
    guideCtx.lineWidth = 4;
    
    if (step.type === 'rect') guideCtx.strokeRect(step.x, step.y, step.w, step.h);
    else if (step.type === 'circle') { guideCtx.beginPath(); guideCtx.arc(step.x, step.y, step.r, 0, Math.PI * 2); guideCtx.stroke(); }
    else if (step.points) {
      guideCtx.beginPath(); guideCtx.moveTo(step.points[0][0], step.points[0][1]);
      for(let i=1; i<step.points.length; i++) guideCtx.lineTo(step.points[i][0], step.points[i][1]);
      guideCtx.stroke();
    }
  }

  function nextLessonStep() {
    if (currentStepIdx < currentLesson.steps.length - 1) {
      currentStepIdx++;
      if (typeof SFX !== 'undefined') SFX.correct();
      renderLessonStep();
    } else {
      finishLesson();
    }
  }

  function finishLesson() {
    const p = getProgress();
    if (!p.lessonsCompleted.includes(currentLesson.id)) {
      p.lessonsCompleted.push(currentLesson.id);
      saveProgress({ lessonsCompleted: p.lessonsCompleted });
      checkStarMilestones();
      
      if (typeof ActivityLog !== 'undefined') {
        ActivityLog.log('Art Studio', '🎨', `Completed lesson: "${currentLesson.title}"`);
      }
    }
    if (typeof SFX !== 'undefined') SFX.cheer();
    showFeedback('🎨 Lesson Done!');
    if (typeof LearningCheck !== 'undefined') {
      LearningCheck.maybePrompt('art', () => exitLesson());
    } else {
      exitLesson();
    }
  }

  function exitLesson() {
    currentLesson = null;
    document.getElementById('lesson-game-screen').style.display = 'none';
    document.getElementById('color-mixing-screen').style.display = 'none';
    document.getElementById('lesson-select-screen').style.display = 'block';
    // FIX: Restore main canvas dimensions
    requestAnimationFrame(() => resize());
    initLearn();
  }

  // Color Mixing Special
  function initMixing() {
    document.getElementById('color-mixing-screen').style.display = 'flex';
    mixColors = [null, null];
    const pal = document.getElementById('mix-palette');
    const mixable = ['#EF4444', '#FBBF24', '#3B82F6', '#FFFFFF', '#000000'];
    pal.innerHTML = mixable.map(c => `
      <div class="color-swatch" style="background:${c}" onclick="ArtStudio.pickMixColorFromPal('${c}')"></div>
    `).join('');
    updateMixingUI();
  }
  function pickMixColorFromPal(c) {
    if (!mixColors[0]) mixColors[0] = c;
    else if (!mixColors[1]) mixColors[1] = c;
    updateMixingUI();
  }
  function pickMixColor(idx) { mixColors[idx-1] = null; updateMixingUI(); }
  function updateMixingUI() {
    const p1 = document.getElementById('mix-pot-1');
    const p2 = document.getElementById('mix-pot-2');
    p1.style.background = mixColors[0] || ''; p1.textContent = mixColors[0] ? '' : '?'; p1.className = 'mix-pot' + (mixColors[0] ? '' : ' empty');
    p2.style.background = mixColors[1] || ''; p2.textContent = mixColors[1] ? '' : '?'; p2.className = 'mix-pot' + (mixColors[1] ? '' : ' empty');
    document.getElementById('mix-result').style.background = '';
    document.getElementById('mix-btn').disabled = !(mixColors[0] && mixColors[1]);
  }
  function performMix() {
    const r = document.getElementById('mix-result');
    const c1 = hexToRgb(mixColors[0]); const c2 = hexToRgb(mixColors[1]);
    const res = { r: Math.round((c1.r+c2.r)/2), g: Math.round((c1.g+c2.g)/2), b: Math.round((c1.b+c2.b)/2) };
    const hex = '#' + ((1 << 24) + (res.r << 16) + (res.g << 8) + res.b).toString(16).slice(1);
    r.style.background = hex; r.textContent = '';
    if (typeof SFX !== 'undefined') SFX.correct();
    setTimeout(finishLesson, 2000);
  }


  // ── Gallery & Saving ──────────────────────────────────────────
  function openSaveDialog() { document.getElementById('save-dialog').classList.add('active'); document.getElementById('art-title').focus(); }
  function closeSaveDialog() { document.getElementById('save-dialog').classList.remove('active'); }
  function confirmSave() {
    const title = document.getElementById('art-title').value.trim() || 'My Masterpiece';
    const dataUrl = mainCanvas.toDataURL('image/png');
    const p = getProgress();
    if (p.gallery.length >= 10) {
      const oldest = p.gallery[p.gallery.length - 1];
      if (!confirm(`Your gallery is full (10 artworks). Saving will remove "${oldest.title}". Continue?`)) {
        return;
      }
    }
    p.gallery.unshift({ id: Date.now(), title, dataUrl, date: new Date().toISOString() });
    if (p.gallery.length > 10) p.gallery.pop();
    saveProgress({ gallery: p.gallery });
    closeSaveDialog();
    if (typeof SFX !== 'undefined') SFX.correct();
    
    if (typeof ActivityLog !== 'undefined') {
      ActivityLog.log('Art Studio', '🎨', `Saved artwork: "${title}"`);
    }

    showFeedback('💾 Saved!');
    checkStarMilestones();
    renderGallery();
    if (typeof LearningCheck !== 'undefined') {
      LearningCheck.maybePrompt('art');
    }
  }
  function renderGallery() {
    const grid = document.getElementById('gallery-grid');
    const p = getProgress();
    if (p.gallery.length === 0) { grid.innerHTML = '<div class="placeholder-msg" style="grid-column: 1/-1"><h2>Your gallery is empty</h2><p>Draw something and save it!</p></div>'; return; }
    grid.innerHTML = p.gallery.map(art => `
      <div class="gallery-card" onclick="ArtStudio.viewArt(${art.id})">
        <img src="${art.dataUrl}" class="gallery-thumb" alt="${art.title}">
        <div class="gallery-info"><div class="gallery-title">${art.title}</div><div class="gallery-date">${new Date(art.date).toLocaleDateString()}</div></div>
      </div>
    `).join('');
  }
  function viewArt(id) {
    const art = getProgress().gallery.find(a => a.id === id); if (!art) return;
    document.getElementById('viewer-img').src = art.dataUrl;
    document.getElementById('viewer-title').textContent = art.title;
    document.getElementById('gallery-viewer').classList.add('active');
    document.getElementById('viewer-delete').onclick = () => {
      if (confirm('Delete this artwork forever?')) {
        const p = getProgress(); p.gallery = p.gallery.filter(a => a.id !== id);
        saveProgress({ gallery: p.gallery }); closeViewer(); renderGallery();
      }
    };
  }
  function closeViewer() { document.getElementById('gallery-viewer').classList.remove('active'); }

  function checkStarMilestones() {
    const p = getProgress(); 
    const lessonStars = p.lessonsCompleted.length; // 1 star per lesson (max 6)
    const galleryStars = Math.min(2, Math.floor(p.gallery.length / 5)); // 1 star per 5 artworks (max 2)
    
    const totalCalculated = lessonStars + galleryStars;

    if (totalCalculated > p.totalStars) {
      saveProgress({ totalStars: totalCalculated });
      if (typeof SFX !== 'undefined') setTimeout(() => SFX.cheer(), 500);
      showFeedback('🌟');
    }
  }
  function showFeedback(emoji) {
    const el = document.getElementById('feedback'); if (!el) return;
    el.querySelector('span').textContent = emoji; el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 1200);
  }

  function bindTabs() {
    document.querySelectorAll('.tab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tabId = e.target.dataset.tab;
        document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        e.target.classList.add('active');
        document.getElementById(`tab-${tabId}`).classList.add('active');
        if (tabId === 'draw') requestAnimationFrame(() => resize());
        if (tabId === 'gallery') renderGallery();
        if (tabId === 'learn') initLearn();
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => { bindTabs(); init(); });
  return { setColor, viewArt, closeViewer, closeSaveDialog, confirmSave, startLesson, nextLessonStep, exitLesson, pickMixColorFromPal, pickMixColor, performMix };
})();