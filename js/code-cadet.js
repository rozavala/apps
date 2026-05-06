/* ================================================================
   CODE CADET — code-cadet.js
   Block-based logic puzzles. Move a rover on a grid by composing
   blocks: move, turn, repeat, if-on-green/star, call function.

   Requires: auth.js, sounds.js, activity-log.js, zs-diag.js
   ================================================================ */

const CodeCadet = (() => {
  'use strict';

  // ── Config ──
  const STORE_PREFIX = 'zs_codecadet_';
  const TILE_PX = 64;
  const RUN_STEP_MS = 280;
  // Hard cap on primitive operations executed in one run. Prevents a
  // function that calls itself, or a deeply-nested repeat, from
  // running forever in the browser.
  const MAX_STEPS = 500;
  const MAX_DEPTH = 60;

  // ── Direction helpers ──
  // 0=N, 1=E, 2=S, 3=W
  const DX = [0, 1, 0, -1];
  const DY = [-1, 0, 1, 0];
  const DIR_EMOJI = ['⬆️', '➡️', '⬇️', '⬅️'];

  // ── Block catalog ──
  // Each block's `bodies` lists the names of nested-block lanes it owns.
  const BLOCK_DEFS = {
    move:        { label: '➡ Move',     short: '→',  bodies: [] },
    turnLeft:    { label: '↺ Left',     short: '↺',  bodies: [] },
    turnRight:   { label: '↻ Right',    short: '↻',  bodies: [] },
    repeat:      { label: '🔁 Repeat',  short: '🔁', bodies: ['body'], hasCount: true },
    ifGreen:     { label: '🟢 If Green', short: '🟢', bodies: ['body'] },
    ifStar:      { label: '⭐ If Star',  short: '⭐', bodies: ['body'] },
    callF1:      { label: '🧩 Call F1', short: 'F1', bodies: [] }
  };

  // ── Puzzle library ───────────────────────────────────────────────
  // Tile codes:  '.' empty   '#' wall   'g' green   '*' star   'G' goal
  // Rover: { x, y, dir }
  // allow: subset of block types available in the palette
  // funcAllowed: true → function lane visible/usable
  // ideal: target block count for 3★
  const PUZZLES = [
    // ── World 1 — Move ─────────────────────────────────────────────
    { id: 'w1-1', world: 1, name: 'First Steps',
      tiles: ['....G'],
      rover: { x: 0, y: 0, dir: 1 },
      allow: ['move'], ideal: 4 },
    { id: 'w1-2', world: 1, name: 'Turn the Corner',
      tiles: [
        '....G',
        'S....'
      ],
      rover: { x: 0, y: 1, dir: 0 },
      allow: ['move','turnLeft','turnRight'], ideal: 6 },
    { id: 'w1-3', world: 1, name: 'Around the Block',
      tiles: [
        '..G',
        '...',
        '...',
        'S..'
      ],
      rover: { x: 0, y: 3, dir: 0 },
      allow: ['move','turnLeft','turnRight'], ideal: 6 },
    { id: 'w1-4', world: 1, name: 'U-Turn',
      tiles: [
        'G....',
        '.####',
        '....S'
      ],
      rover: { x: 4, y: 2, dir: 3 },
      allow: ['move','turnLeft','turnRight'], ideal: 7 },
    { id: 'w1-5', world: 1, name: 'Zigzag',
      tiles: [
        '..G..',
        '.###.',
        '.....',
        '.###.',
        'S....'
      ],
      rover: { x: 0, y: 4, dir: 0 },
      allow: ['move','turnLeft','turnRight'], ideal: 7 },
    { id: 'w1-6', world: 1, name: 'Detour',
      tiles: [
        'G....',
        '.###.',
        '.....',
        '.###.',
        '....S'
      ],
      rover: { x: 4, y: 4, dir: 3 },
      allow: ['move','turnLeft','turnRight'], ideal: 9 },

    // ── World 2 — Repeat ───────────────────────────────────────────
    { id: 'w2-1', world: 2, name: 'Five Steps',
      tiles: ['.....G....'],
      rover: { x: 0, y: 0, dir: 1 },
      allow: ['move','repeat'], ideal: 2 /* repeat 5 [move] */ },
    { id: 'w2-2', world: 2, name: 'Long March',
      tiles: ['.........G'],
      rover: { x: 0, y: 0, dir: 1 },
      allow: ['move','repeat'], ideal: 2 },
    { id: 'w2-3', world: 2, name: 'Across the Floor',
      tiles: [
        '......G',
        'S......'
      ],
      rover: { x: 0, y: 1, dir: 0 },
      allow: ['move','repeat','turnLeft','turnRight'], ideal: 4 },
    { id: 'w2-4', world: 2, name: 'Star Hop',
      tiles: [
        '.*.*.*G'
      ],
      rover: { x: 0, y: 0, dir: 1 },
      allow: ['move','repeat'], ideal: 2 },
    { id: 'w2-5', world: 2, name: 'Nested Loop',
      tiles: [
        '..........',
        '..........',
        'S........G'
      ],
      rover: { x: 0, y: 2, dir: 1 },
      allow: ['move','repeat'], ideal: 2 },
    { id: 'w2-6', world: 2, name: 'Stair Climb',
      tiles: [
        '....G',
        '...#.',
        '..#..',
        '.#...',
        'S....'
      ],
      rover: { x: 0, y: 4, dir: 0 },
      allow: ['move','repeat','turnLeft','turnRight'], ideal: 5 },

    // ── World 3 — Functions ────────────────────────────────────────
    { id: 'w3-1', world: 3, name: 'Call F1',
      tiles: ['..*..*..*..G'],
      rover: { x: 0, y: 0, dir: 1 },
      allow: ['move','callF1','repeat'], funcAllowed: true, ideal: 5 },
    { id: 'w3-2', world: 3, name: 'Pattern Master',
      tiles: [
        '...G',
        '....',
        '....',
        'S...'
      ],
      rover: { x: 0, y: 3, dir: 0 },
      allow: ['move','turnLeft','turnRight','callF1'], funcAllowed: true, ideal: 4 },
    { id: 'w3-3', world: 3, name: 'Reuse',
      tiles: [
        '..G..G..G..G'
      ],
      rover: { x: 0, y: 0, dir: 1 },
      allow: ['move','callF1','repeat'], funcAllowed: true, ideal: 3 },
    { id: 'w3-4', world: 3, name: 'Compress',
      tiles: [
        '..G',
        '...',
        '..G',
        '...',
        '..G',
        'S..'
      ],
      rover: { x: 0, y: 5, dir: 0 },
      allow: ['move','turnLeft','turnRight','callF1','repeat'], funcAllowed: true, ideal: 4 },
    { id: 'w3-5', world: 3, name: 'Snake Path',
      tiles: [
        '....G',
        '#####',
        '.....',
        '#####',
        'S....'
      ],
      rover: { x: 0, y: 4, dir: 1 },
      allow: ['move','turnLeft','turnRight','callF1','repeat'], funcAllowed: true, ideal: 5 },
    { id: 'w3-6', world: 3, name: 'Star Sweep',
      tiles: [
        '**********G'
      ],
      rover: { x: 0, y: 0, dir: 1 },
      allow: ['move','callF1','repeat'], funcAllowed: true, ideal: 3 },

    // ── World 4 — Conditions ───────────────────────────────────────
    { id: 'w4-1', world: 4, name: 'Pick the Star',
      tiles: [
        '..*..G',
        'S.....'
      ],
      rover: { x: 0, y: 1, dir: 1 },
      allow: ['move','ifStar','turnLeft','turnRight','repeat'], ideal: 5 },
    { id: 'w4-2', world: 4, name: 'Green Means Turn',
      tiles: [
        '..g..G',
        'S.....'
      ],
      // Going east on row 1 then on green tile turn up. We give them
      // ifGreen + move + turn.
      rover: { x: 0, y: 1, dir: 1 },
      allow: ['move','ifGreen','turnLeft','turnRight','repeat'], ideal: 5 },
    { id: 'w4-3', world: 4, name: 'Mixed Path',
      tiles: [
        '*.g.*.G'
      ],
      rover: { x: 0, y: 0, dir: 1 },
      allow: ['move','ifStar','ifGreen','repeat'], ideal: 4 },
    { id: 'w4-4', world: 4, name: 'Picky Picker',
      tiles: [
        '.*.g.*.g.*.G'
      ],
      rover: { x: 0, y: 0, dir: 1 },
      allow: ['move','ifStar','ifGreen','repeat'], ideal: 4 },
    { id: 'w4-5', world: 4, name: 'Two Branches',
      tiles: [
        '...g...G',
        'S.......'
      ],
      rover: { x: 0, y: 1, dir: 1 },
      allow: ['move','ifGreen','turnLeft','turnRight','repeat'], ideal: 5 },
    { id: 'w4-6', world: 4, name: 'Conditional Loop',
      tiles: [
        '*g*g*g*gG'
      ],
      rover: { x: 0, y: 0, dir: 1 },
      allow: ['move','ifStar','ifGreen','repeat'], ideal: 4 },

    // ── World 5 — Adventure ────────────────────────────────────────
    { id: 'w5-1', world: 5, name: 'The Maze',
      tiles: [
        '..........',
        '.######.#.',
        '.#......#.',
        '.#.####.#.',
        '.#.*..#.#.',
        '.#.####.#.',
        '.#......#.',
        '.########.',
        'S........G'
      ],
      rover: { x: 0, y: 8, dir: 1 },
      allow: ['move','turnLeft','turnRight','repeat','callF1'], funcAllowed: true, ideal: 8 },
    { id: 'w5-2', world: 5, name: 'Star Hunt',
      tiles: [
        '*.*.*.*',
        '.......',
        '*.*.*.*',
        '.......',
        '*.*.*.G'
      ],
      rover: { x: 0, y: 4, dir: 0 },
      allow: ['move','turnLeft','turnRight','ifStar','repeat','callF1'], funcAllowed: true, ideal: 6 },
    { id: 'w5-3', world: 5, name: 'Smart Sweep',
      tiles: [
        'g.*.g.*.g.G'
      ],
      rover: { x: 0, y: 0, dir: 1 },
      allow: ['move','ifStar','ifGreen','repeat','callF1'], funcAllowed: true, ideal: 5 },
    { id: 'w5-4', world: 5, name: 'Fork in the Road',
      tiles: [
        '....g....G',
        '#########.',
        'S.........'
      ],
      rover: { x: 0, y: 2, dir: 1 },
      allow: ['move','turnLeft','turnRight','ifGreen','repeat'], ideal: 6 },
    { id: 'w5-5', world: 5, name: 'Long Quest',
      tiles: [
        '..........G',
        '##########.',
        '.*.*.*.*...',
        '.##########',
        'S..........'
      ],
      rover: { x: 0, y: 4, dir: 1 },
      allow: ['move','turnLeft','turnRight','repeat','ifStar','callF1'], funcAllowed: true, ideal: 8 },
    { id: 'w5-6', world: 5, name: 'Final Challenge',
      tiles: [
        '*.g.*.g.*.G',
        '###########',
        '*.g.*.g.*..',
        '.##########',
        'S..........'
      ],
      rover: { x: 0, y: 4, dir: 1 },
      allow: ['move','turnLeft','turnRight','repeat','ifStar','ifGreen','callF1'], funcAllowed: true, ideal: 8 }
  ];

  // ── Storage helpers ──
  function _storageKey() {
    return typeof getUserAppKey === 'function'
      ? getUserAppKey(STORE_PREFIX)
      : STORE_PREFIX + 'default';
  }
  function _loadProgress() {
    try { return JSON.parse(localStorage.getItem(_storageKey())) || {}; }
    catch { return {}; }
  }
  function _saveProgress(p) {
    try { localStorage.setItem(_storageKey(), JSON.stringify(p)); } catch {}
    if (typeof CloudSync !== 'undefined' && CloudSync.online) {
      try { CloudSync.push(_storageKey()); } catch {}
    }
  }

  // ── State ──
  const state = {
    puzzle: null,             // current puzzle definition
    world: { tiles: [], collected: {}, w: 0, h: 0, rover: null },
    program: { main: [], f1: [] },
    activeLane: null,         // { laneRoot: 'main'|'f1', path: [] } — path of indices into bodies
    running: false,
    runHandle: null,
    iter: null,
    blockCount: 0,
    completed: false,
    stars: 0
  };

  let _nodeIdSeq = 0;
  function _newNodeId() { _nodeIdSeq++; return 'n' + _nodeIdSeq; }

  // ── World setup ──
  function _parsePuzzle(p) {
    const rows = p.tiles.map(r => r.split(''));
    const h = rows.length;
    const w = rows[0].length;
    let goal = null;
    const collected = {};
    // Strip rover-start markers ('S') — rover position is in p.rover.
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (rows[y][x] === 'S') rows[y][x] = '.';
        if (rows[y][x] === 'G') goal = { x, y };
      }
    }
    const rover = { x: p.rover.x, y: p.rover.y, dir: p.rover.dir };
    // If the rover starts on a star, count it as collected so the kid
    // doesn't have to leave and re-enter the cell to satisfy the win
    // check.
    if (rows[rover.y] && rows[rover.y][rover.x] === '*') {
      collected['s_' + rover.x + '_' + rover.y] = true;
    }
    return { tiles: rows, w, h, goal, collected, rover };
  }

  function _tileAt(world, x, y) {
    if (x < 0 || y < 0 || x >= world.w || y >= world.h) return '#';
    const t = world.tiles[y][x];
    if (t === '*' && world.collected['s_' + x + '_' + y]) return '.';
    return t;
  }

  // ── AST helpers ──
  function _makeBlock(type) {
    const def = BLOCK_DEFS[type];
    const b = { id: _newNodeId(), type };
    if (def.hasCount) b.count = 3;
    (def.bodies || []).forEach(name => { b[name] = []; });
    return b;
  }

  function _findLane(rootName, path) {
    let arr = state.program[rootName];
    for (const step of path) {
      const block = arr[step.idx];
      if (!block) return null;
      arr = block[step.body];
    }
    return arr;
  }

  function _setActiveLane(rootName, path) {
    state.activeLane = { laneRoot: rootName, path: path.slice() };
  }

  function _addToActive(blockType) {
    if (!state.activeLane) state.activeLane = { laneRoot: 'main', path: [] };
    const lane = _findLane(state.activeLane.laneRoot, state.activeLane.path);
    if (!lane) return;
    lane.push(_makeBlock(blockType));
    _refreshAll();
  }

  function _removeBlock(rootName, path, idx) {
    const lane = _findLane(rootName, path);
    if (!lane) return;
    lane.splice(idx, 1);
    _refreshAll();
  }

  function _adjustCount(rootName, path, idx, delta) {
    const lane = _findLane(rootName, path);
    if (!lane) return;
    const b = lane[idx];
    if (!b || !BLOCK_DEFS[b.type].hasCount) return;
    b.count = Math.max(1, Math.min(20, b.count + delta));
    _refreshAll();
  }

  function _countBlocks(blocks) {
    if (!Array.isArray(blocks)) return 0;
    let c = 0;
    for (const b of blocks) {
      c++;
      const def = BLOCK_DEFS[b.type];
      (def.bodies || []).forEach(name => { c += _countBlocks(b[name]); });
    }
    return c;
  }

  // ── Interpreter (generator-based) ──
  function* _walk(blocks, depth) {
    if (depth > MAX_DEPTH) throw new Error('depth-exceeded');
    for (const b of blocks) yield* _walkOne(b, depth);
  }

  function* _walkOne(b, depth) {
    yield { focus: b.id };
    const t = b.type;
    if (t === 'move')        yield { op: 'move', node: b.id };
    else if (t === 'turnLeft')  yield { op: 'turnL', node: b.id };
    else if (t === 'turnRight') yield { op: 'turnR', node: b.id };
    else if (t === 'repeat') {
      const n = b.count || 1;
      for (let i = 0; i < n; i++) yield* _walk(b.body, depth + 1);
    }
    else if (t === 'ifGreen') {
      const r = state.world.rover;
      const raw = state.world.tiles[r.y] && state.world.tiles[r.y][r.x];
      if (raw === 'g') yield* _walk(b.body, depth + 1);
    }
    else if (t === 'ifStar') {
      // Use the raw tile rather than _tileAt, which would return '.'
      // for stars that were auto-collected on arrival. The kid is
      // asking "did I step onto a star?" — auto-collection shouldn't
      // erase that fact for the purpose of the conditional.
      const r = state.world.rover;
      const raw = state.world.tiles[r.y] && state.world.tiles[r.y][r.x];
      if (raw === '*') yield* _walk(b.body, depth + 1);
    }
    else if (t === 'callF1') {
      yield* _walk(state.program.f1, depth + 1);
    }
  }

  function _applyOp(step) {
    if (!step || !step.op) return;
    const r = state.world.rover;
    if (step.op === 'turnL') r.dir = (r.dir + 3) % 4;
    else if (step.op === 'turnR') r.dir = (r.dir + 1) % 4;
    else if (step.op === 'move') {
      const nx = r.x + DX[r.dir];
      const ny = r.y + DY[r.dir];
      if (_tileAt(state.world, nx, ny) === '#') {
        // Blocked — ignore the move silently. Kid can see they
        // didn't advance and reason about it.
        _flashBlocked();
        return;
      }
      r.x = nx; r.y = ny;
      // Auto-collect stars on the tile we arrive at.
      if (_tileAt(state.world, r.x, r.y) === '*') {
        state.world.collected['s_' + r.x + '_' + r.y] = true;
        _playSfx('correct');
      }
    }
  }

  function _isComplete() {
    const r = state.world.rover;
    const g = state.world.goal;
    if (!g || r.x !== g.x || r.y !== g.y) return false;
    // Also require all stars collected.
    for (let y = 0; y < state.world.h; y++) {
      for (let x = 0; x < state.world.w; x++) {
        if (state.world.tiles[y][x] === '*' && !state.world.collected['s_' + x + '_' + y]) return false;
      }
    }
    return true;
  }

  // ── Run / step controls ──
  function _stop() {
    state.running = false;
    if (state.runHandle) { clearInterval(state.runHandle); state.runHandle = null; }
  }

  function _resetExecution() {
    _stop();
    state.iter = null;
    state.world = _parsePuzzle(state.puzzle);
    state.completed = false;
    _clearFocus();
    _drawCanvas();
    _updateHUD();
  }

  function _startIter() {
    state.iter = _walk([
      // Wrap main in a fake outer block so we don't yield a focus on it
      ...state.program.main
    ], 0);
  }

  function _stepOnce() {
    if (!state.iter) _startIter();
    let stepsThisCall = 0;
    while (stepsThisCall < 1) {
      let r;
      try { r = state.iter.next(); }
      catch (e) {
        _showFeedback('💥 Error: ' + e.message);
        _stop();
        return false;
      }
      if (r.done) {
        _stop();
        _onProgramEnd();
        return false;
      }
      const v = r.value;
      if (v && v.focus) {
        _setFocus(v.focus);
        // focus events don't count as a step
        continue;
      }
      _applyOp(v);
      _drawCanvas();
      _updateHUD();
      state._stepBudget = (state._stepBudget || 0) + 1;
      if (state._stepBudget > MAX_STEPS) {
        _showFeedback('🛑 Too many steps');
        _stop();
        return false;
      }
      stepsThisCall++;
      if (_isComplete()) {
        _stop();
        _onWin();
        return false;
      }
    }
    return true;
  }

  function _runProgram() {
    if (state.running) return;
    if (_countBlocks(state.program.main) === 0) {
      _showFeedback('🤔 Add some blocks first');
      return;
    }
    state.running = true;
    state._stepBudget = 0;
    state.iter = null;
    state.world = _parsePuzzle(state.puzzle);
    state.completed = false;
    _drawCanvas();
    state.runHandle = setInterval(() => {
      const cont = _stepOnce();
      if (!cont) _stop();
    }, RUN_STEP_MS);
    _updateControls();
  }

  function _onProgramEnd() {
    if (_isComplete()) _onWin();
    else _showFeedback('🤔 Not at the goal');
    _updateControls();
  }

  function _onWin() {
    state.completed = true;
    _playSfx('win');
    const used = _countBlocks(state.program.main) + _countBlocks(state.program.f1);
    const ideal = state.puzzle.ideal || used;
    let stars = 1;
    if (used <= ideal + 2) stars = 2;
    if (used <= ideal) stars = 3;

    const progress = _loadProgress();
    const prev = progress[state.puzzle.id] || { stars: 0, best: Infinity };
    const next = {
      stars: Math.max(prev.stars, stars),
      best: Math.min(prev.best || Infinity, used)
    };
    progress[state.puzzle.id] = next;
    _saveProgress(progress);

    if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
      ActivityLog.log('Code Cadet', '🤖',
        'Solved ' + state.puzzle.name + ' (' + '⭐'.repeat(stars) + ')');
    }

    _showWinDialog(stars, used, ideal);
    _renderWorldSelect(); // refresh badges
  }

  function _flashBlocked() {
    const c = document.getElementById('cc-canvas');
    if (!c) return;
    c.classList.add('cc-flash');
    setTimeout(() => c.classList.remove('cc-flash'), 200);
  }

  // ── Rendering: canvas ──
  function _drawCanvas() {
    const c = document.getElementById('cc-canvas');
    if (!c) return;
    const w = state.world;
    c.width = w.w * TILE_PX;
    c.height = w.h * TILE_PX;
    const ctx = c.getContext('2d');

    // Background
    ctx.fillStyle = '#0E1A2E';
    ctx.fillRect(0, 0, c.width, c.height);

    // Tiles
    for (let y = 0; y < w.h; y++) {
      for (let x = 0; x < w.w; x++) {
        const t = w.tiles[y][x];
        const px = x * TILE_PX;
        const py = y * TILE_PX;

        // Cell base
        ctx.fillStyle = ((x + y) % 2 === 0) ? '#16263F' : '#142337';
        ctx.fillRect(px, py, TILE_PX, TILE_PX);
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.strokeRect(px + 0.5, py + 0.5, TILE_PX - 1, TILE_PX - 1);

        if (t === '#') {
          ctx.fillStyle = '#3B4868';
          ctx.fillRect(px + 4, py + 4, TILE_PX - 8, TILE_PX - 8);
        } else if (t === 'g') {
          ctx.fillStyle = 'rgba(52,211,153,0.35)';
          ctx.fillRect(px + 6, py + 6, TILE_PX - 12, TILE_PX - 12);
        } else if (t === '*') {
          if (!w.collected['s_' + x + '_' + y]) {
            ctx.fillStyle = '#FBBF24';
            ctx.font = (TILE_PX - 16) + 'px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⭐', px + TILE_PX / 2, py + TILE_PX / 2);
          }
        } else if (t === 'G') {
          ctx.strokeStyle = '#34D399';
          ctx.lineWidth = 3;
          ctx.strokeRect(px + 6, py + 6, TILE_PX - 12, TILE_PX - 12);
          ctx.fillStyle = '#34D399';
          ctx.font = (TILE_PX - 18) + 'px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🚩', px + TILE_PX / 2, py + TILE_PX / 2);
        }
      }
    }

    // Rover
    const r = w.rover;
    if (r) {
      const cx = r.x * TILE_PX + TILE_PX / 2;
      const cy = r.y * TILE_PX + TILE_PX / 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(r.dir * Math.PI / 2);
      // body
      ctx.fillStyle = '#22D3EE';
      ctx.beginPath();
      ctx.arc(0, 0, TILE_PX * 0.35, 0, Math.PI * 2);
      ctx.fill();
      // direction arrow
      ctx.fillStyle = '#0E1A2E';
      ctx.beginPath();
      ctx.moveTo(0, -TILE_PX * 0.20);
      ctx.lineTo(TILE_PX * 0.18, TILE_PX * 0.10);
      ctx.lineTo(-TILE_PX * 0.18, TILE_PX * 0.10);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  // ── Rendering: program lanes ──
  function _renderLane(rootName, lane, path, container) {
    container.innerHTML = '';
    container.classList.add('cc-lane');

    // Header / focus tap target
    const head = document.createElement('div');
    head.className = 'cc-lane-head';
    head.textContent = path.length === 0 ? (rootName === 'main' ? 'Main' : 'F1') : '↳';
    head.onclick = () => {
      _setActiveLane(rootName, path);
      _refreshLanes();
    };
    container.appendChild(head);

    // Active highlight
    if (state.activeLane && state.activeLane.laneRoot === rootName
        && state.activeLane.path.length === path.length
        && state.activeLane.path.every((p, i) => p.idx === path[i].idx && p.body === path[i].body)) {
      container.classList.add('cc-lane-active');
    }

    // Blocks
    lane.forEach((block, idx) => {
      const def = BLOCK_DEFS[block.type];
      const el = document.createElement('div');
      el.className = 'cc-block cc-block-' + block.type;
      el.dataset.nodeId = block.id;

      const label = document.createElement('span');
      label.className = 'cc-block-label';
      label.textContent = def.label;
      el.appendChild(label);

      if (def.hasCount) {
        const ctr = document.createElement('span');
        ctr.className = 'cc-block-count';
        const minus = document.createElement('button');
        minus.className = 'cc-mini-btn';
        minus.textContent = '−';
        minus.onclick = (e) => { e.stopPropagation(); _adjustCount(rootName, path, idx, -1); };
        const num = document.createElement('span');
        num.textContent = '×' + (block.count || 1);
        const plus = document.createElement('button');
        plus.className = 'cc-mini-btn';
        plus.textContent = '+';
        plus.onclick = (e) => { e.stopPropagation(); _adjustCount(rootName, path, idx, 1); };
        ctr.appendChild(minus);
        ctr.appendChild(num);
        ctr.appendChild(plus);
        el.appendChild(ctr);
      }

      const rm = document.createElement('button');
      rm.className = 'cc-block-rm';
      rm.textContent = '✕';
      rm.setAttribute('aria-label', 'Remove block');
      rm.onclick = (e) => { e.stopPropagation(); _removeBlock(rootName, path, idx); };
      el.appendChild(rm);

      // Nested bodies
      (def.bodies || []).forEach(bodyName => {
        const sub = document.createElement('div');
        sub.className = 'cc-sublane';
        const subPath = path.concat([{ idx, body: bodyName }]);
        _renderLane(rootName, block[bodyName], subPath, sub);
        el.appendChild(sub);
      });

      container.appendChild(el);
    });

    // Empty hint
    if (lane.length === 0) {
      const hint = document.createElement('div');
      hint.className = 'cc-lane-empty';
      hint.textContent = 'Tap a block below to add';
      hint.onclick = () => {
        _setActiveLane(rootName, path);
        _refreshLanes();
      };
      container.appendChild(hint);
    }
  }

  function _refreshLanes() {
    const main = document.getElementById('cc-lane-main');
    if (main) _renderLane('main', state.program.main, [], main);
    const f1 = document.getElementById('cc-lane-f1');
    if (f1) {
      if (state.puzzle && state.puzzle.funcAllowed) {
        f1.style.display = '';
        _renderLane('f1', state.program.f1, [], f1);
      } else {
        f1.style.display = 'none';
      }
    }
  }

  // ── Rendering: palette ──
  function _renderPalette() {
    const p = document.getElementById('cc-palette');
    if (!p || !state.puzzle) return;
    p.innerHTML = '';
    const allow = state.puzzle.allow || ['move'];
    allow.forEach(t => {
      const def = BLOCK_DEFS[t];
      const btn = document.createElement('button');
      btn.className = 'cc-pal-btn cc-block-' + t;
      btn.textContent = def.label;
      btn.onclick = () => {
        _addToActive(t);
        _playSfx('click');
      };
      p.appendChild(btn);
    });
  }

  // ── HUD / controls ──
  function _updateHUD() {
    const used = _countBlocks(state.program.main) + _countBlocks(state.program.f1);
    const idealEl = document.getElementById('cc-ideal');
    const usedEl = document.getElementById('cc-used');
    if (idealEl) idealEl.textContent = state.puzzle ? state.puzzle.ideal : '-';
    if (usedEl) usedEl.textContent = used;
    const dir = document.getElementById('cc-dir');
    if (dir && state.world.rover) dir.textContent = DIR_EMOJI[state.world.rover.dir];
  }

  function _updateControls() {
    const run = document.getElementById('cc-run-btn');
    if (run) run.textContent = state.running ? '⏸ Pause' : '▶ Run';
  }

  function _setFocus(nodeId) {
    document.querySelectorAll('.cc-block.cc-focused').forEach(el => el.classList.remove('cc-focused'));
    const el = document.querySelector('[data-node-id="' + nodeId + '"]');
    if (el) el.classList.add('cc-focused');
  }
  function _clearFocus() {
    document.querySelectorAll('.cc-block.cc-focused').forEach(el => el.classList.remove('cc-focused'));
  }

  function _refreshAll() {
    _refreshLanes();
    _renderPalette();
    _updateHUD();
  }

  // ── Feedback / dialogs ──
  function _showFeedback(text) {
    const f = document.getElementById('cc-feedback');
    if (!f) return;
    f.textContent = text;
    f.classList.add('show');
    setTimeout(() => f.classList.remove('show'), 1600);
  }

  function _showWinDialog(stars, used, ideal) {
    const dlg = document.getElementById('cc-win');
    if (!dlg) return;
    document.getElementById('cc-win-stars').textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    document.getElementById('cc-win-used').textContent = used;
    document.getElementById('cc-win-ideal').textContent = ideal;
    dlg.classList.add('show');
  }
  function _hideWinDialog() {
    const dlg = document.getElementById('cc-win');
    if (dlg) dlg.classList.remove('show');
  }

  function _playSfx(name) {
    if (typeof SFX !== 'undefined') {
      if (name === 'click' && SFX.click) return SFX.click();
      if (name === 'win' && SFX.win) return SFX.win();
      if (name === 'correct' && SFX.correct) return SFX.correct();
    }
    if (typeof playSound === 'function') playSound(name);
  }

  // ── Screen transitions ──
  function _showScreen(id) {
    document.querySelectorAll('.cc-screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
  }

  function _renderWorldSelect() {
    const grid = document.getElementById('cc-world-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const progress = _loadProgress();
    // group puzzles by world
    const byWorld = {};
    PUZZLES.forEach(p => { (byWorld[p.world] = byWorld[p.world] || []).push(p); });
    const worldNames = { 1:'Move', 2:'Repeat', 3:'Functions', 4:'Conditions', 5:'Adventure' };
    Object.keys(byWorld).sort().forEach(wId => {
      const card = document.createElement('div');
      card.className = 'cc-world-card';
      const head = document.createElement('h3');
      head.textContent = 'World ' + wId + ' — ' + (worldNames[wId] || '');
      card.appendChild(head);
      const list = document.createElement('div');
      list.className = 'cc-puzzle-list';
      byWorld[wId].forEach(p => {
        const btn = document.createElement('button');
        btn.className = 'cc-puzzle-btn';
        const prog = progress[p.id];
        const starStr = prog ? '⭐'.repeat(prog.stars) + '☆'.repeat(3 - prog.stars) : '☆☆☆';
        btn.innerHTML = '<span class="cc-puzzle-name">' + p.name + '</span>' +
                        '<span class="cc-puzzle-stars">' + starStr + '</span>';
        btn.onclick = () => _openPuzzle(p.id);
        list.appendChild(btn);
      });
      card.appendChild(list);
      grid.appendChild(card);
    });
  }

  function _openPuzzle(id) {
    const p = PUZZLES.find(x => x.id === id);
    if (!p) return;
    state.puzzle = p;
    state.program = { main: [], f1: [] };
    state.activeLane = { laneRoot: 'main', path: [] };
    _resetExecution();
    document.getElementById('cc-puzzle-name').textContent = p.name;
    document.getElementById('cc-puzzle-world').textContent = 'World ' + p.world;
    _refreshAll();
    _showScreen('cc-screen-game');
  }

  function _backToWorlds() {
    _stop();
    _hideWinDialog();
    state.puzzle = null;
    _renderWorldSelect();
    _showScreen('cc-screen-select');
  }

  function _nextPuzzle() {
    _hideWinDialog();
    if (!state.puzzle) return _backToWorlds();
    const idx = PUZZLES.findIndex(p => p.id === state.puzzle.id);
    const next = PUZZLES[idx + 1];
    if (next) _openPuzzle(next.id);
    else _backToWorlds();
  }

  function _replayPuzzle() {
    _hideWinDialog();
    state.program = { main: [], f1: [] };
    _resetExecution();
    _refreshAll();
  }

  // ── Public API ──
  function init() {
    document.getElementById('cc-run-btn').onclick = () => {
      if (state.running) _stop();
      else _runProgram();
      _updateControls();
    };
    document.getElementById('cc-step-btn').onclick = () => {
      if (state.running) return;
      if (!state.iter) {
        state._stepBudget = 0;
        state.world = _parsePuzzle(state.puzzle);
        _drawCanvas();
        _startIter();
      }
      _stepOnce();
    };
    document.getElementById('cc-reset-btn').onclick = () => {
      _resetExecution();
    };
    document.getElementById('cc-back-btn').onclick = _backToWorlds;
    document.getElementById('cc-win-replay').onclick = _replayPuzzle;
    document.getElementById('cc-win-next').onclick = _nextPuzzle;
    document.getElementById('cc-win-back').onclick = _backToWorlds;

    _renderWorldSelect();
    _showScreen('cc-screen-select');
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (typeof CodeCadet !== 'undefined') CodeCadet.init();
});
