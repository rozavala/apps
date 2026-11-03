/* ================================================================
   CODE CADET — code-cadet.js
   Block-based logic puzzles. Program a six-wheeled rover across a
   desert test site by snapping blocks together: move, turn, repeat,
   count loops, conditions, sensors and a function (F1).

   Art lives in js/code-cadet-art.js (CodeCadetArt).
   Requires: auth.js, sounds.js, activity-log.js, dialog.js

   Saved progress (localStorage, key zs_codecadet_<user>):
     { '<puzzleId>': { stars: 0-3, best: <blocks used> }, …,
       _prefs: { speed: 'slow'|'normal'|'fast' } }      ← _prefs added v2
   The star total is the sum of every puzzle's `stars` (auth.js).
   ================================================================ */

const CodeCadet = (() => {
  'use strict';

  // ── Config ──
  const STORE_PREFIX = 'zs_codecadet_';
  // Hard cap on primitive operations executed in one run. Prevents a
  // function that calls itself, or a deeply-nested repeat, from
  // running forever in the browser.
  const MAX_STEPS = 500;
  const MAX_DEPTH = 60;
  const MAX_TICKS = 20000;        // loop/condition checks per run
  const SPEEDS = { slow: 700, normal: 400, fast: 170 };

  // ── Direction helpers ──
  // 0=N, 1=E, 2=S, 3=W
  const DX = [0, 1, 0, -1];
  const DY = [-1, 0, 1, 0];
  const DIR_NAMES = ['north', 'east', 'south', 'west'];

  // ── Block catalog ──
  // Each block's `bodies` lists the names of nested-block lanes it owns.
  // cat = colour family of the block (motion / loop / logic / func).
  const BLOCK_DEFS = {
    move:       { label: 'Move',              cat: 'motion', bodies: [] },
    turnLeft:   { label: 'Turn left',         cat: 'turn',   bodies: [] },
    turnRight:  { label: 'Turn right',        cat: 'turn',   bodies: [] },
    repeat:     { label: 'Repeat',            cat: 'loop',   bodies: ['body'], hasCount: true, min: 1, max: 20, def: 3 },
    forLoop:    { label: 'Count i: 1 →',      cat: 'counter', bodies: ['body'], hasCount: true, min: 1, max: 10, def: 3 },
    whileClear: { label: 'While clear ahead', cat: 'loop',   bodies: ['body'] },
    ifGreen:    { label: 'If on green pad',   cat: 'logic',  bodies: ['body'] },
    ifStar:     { label: 'If on crystal',     cat: 'logic',  bodies: ['body'] },
    ifRock:     { label: 'If rock ahead',     cat: 'logic',  bodies: ['body'] },
    callF1:     { label: 'Call F1',           cat: 'func',   bodies: [] }
  };

  // World titles, a one-line idea for each, and who it is pitched at.
  const WORLDS = {
    1:  { name: 'Move',         es: 'Mover',             age: 4,  tip: 'Line up Move and Turn blocks to drive the rover to the landing pad.' },
    2:  { name: 'Repeat',       es: 'Repetir',           age: 5,  tip: 'Repeat runs the blocks inside it again and again, so long trips need fewer blocks.' },
    3:  { name: 'Functions',    es: 'Funciones',         age: 7,  tip: 'Build a move once in F1, then Call F1 wherever you need it.' },
    4:  { name: 'Conditions',   es: 'Condiciones',       age: 7,  tip: 'If blocks only run when the rover is standing on a crystal or a green pad.' },
    5:  { name: 'Adventure',    es: 'Aventura',          age: 8,  tip: 'Mix everything you know to cross bigger maps.' },
    6:  { name: 'Expert',       es: 'Experto',           age: 9,  tip: 'Tight block limits: find the pattern hiding in each path.' },
    7:  { name: 'Loop Counters', es: 'Contadores',       age: 8,  tip: 'Count i: 1 → N keeps track of the lap. Use i as a Repeat count to make each lap longer.' },
    8:  { name: 'Nested Loops', es: 'Bucles anidados',   age: 10, tip: 'Put loops inside loops, even three deep, to draw squares, stairs and petals.' },
    9:  { name: 'Sensors & Smart Functions', es: 'Sensores', age: 10, tip: 'The mast camera sees the tile ahead. Make programs that react to rocks.' },
    10: { name: 'Bug Hunt',     es: 'Caza de errores',   age: 8,  tip: 'Each program has a bug. Run it, spot where it goes wrong, and fix it.' }
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
      allow: ['move','turnLeft','turnRight','repeat','ifStar','ifGreen','callF1'], funcAllowed: true, ideal: 8 },

    // ── World 6 — Expert ───────────────────────────────────────────
    { id: 'w6-1', world: 6, name: 'Square Dance',
      // Walk the full perimeter of the 5×5 grid clockwise, then step
      // onto G. Solution (ideal 5):
      //   repeat 4 [ repeat 4 [move], turnRight ], move
      // Trace from (0,0)E: each outer iter walks one 4-cell side and
      // turns right; after 4 sides the rover is back at (0,0) facing E,
      // then one move lands on G at (1,0).
      tiles: [
        'SG...',
        '.....',
        '.....',
        '.....',
        '.....'
      ],
      rover: { x: 0, y: 0, dir: 1 },
      allow: ['move','turnRight','repeat'], ideal: 5 },
    { id: 'w6-2', world: 6, name: 'Star Frame',
      // Sweep the star-paved perimeter of the 6×6 grid clockwise and
      // stop on G just below the start. Solution (ideal 6):
      //   repeat 3 [ repeat 5 [move], turnRight ], repeat 4 [move]
      // Trace from (0,0)E: three full 5-cell sides (E, S, W) leave the
      // rover at (0,5) facing N; four moves north end on G at (0,1).
      // Every '*' on the perimeter is collected while passing over it.
      tiles: [
        'S*****',
        'G....*',
        '*....*',
        '*....*',
        '*....*',
        '******'
      ],
      rover: { x: 0, y: 0, dir: 1 },
      allow: ['move','turnRight','repeat'], ideal: 6 },
    { id: 'w6-3', world: 6, name: 'Star Corners',
      // Clockwise lap where each corner is a star. ifStar turns the
      // rover right at every corner so a single loop body navigates the
      // whole perimeter. Solution (ideal 4):
      //   repeat 11 [ move, ifStar[turnRight] ]
      // Trace from (0,0)E: moves collect corner stars at (3,0),(3,3),
      // (0,3) — turning right on each — and the 11th move lands on G at
      // (0,1). Without the turns the rover would run into the edge.
      tiles: [
        'S..*',
        'G...',
        '....',
        '*..*'
      ],
      rover: { x: 0, y: 0, dir: 1 },
      allow: ['move','turnRight','ifStar','repeat'], ideal: 4 },
    { id: 'w6-4', world: 6, name: 'Decision Stairs',
      // Descending staircase. Green tiles mean turn right (go down),
      // star tiles mean turn left (go right) — both conditions drive one
      // loop body. Solution (ideal 6):
      //   repeat 6 [ move, ifGreen[turnRight], ifStar[turnLeft] ]
      // Trace from (0,0)E: move→(1,0)g turnR; move→(1,1)* turnL; move→
      // (2,1)g turnR; move→(2,2)* turnL; move→(3,2)g turnR; move→(3,3)G.
      // Both stars are collected on the way down.
      tiles: [
        'Sg..',
        '.*g.',
        '..*g',
        '...G'
      ],
      rover: { x: 0, y: 0, dir: 1 },
      allow: ['move','turnLeft','turnRight','ifGreen','ifStar','repeat'], ideal: 6 },
    { id: 'w6-5', world: 6, name: 'Diagonal Function',
      // The same SE step repeats four times, so define it once in F1.
      // F1 = move, turnRight, move, turnLeft  (moves +1,+1, ends facing
      // E). Solution (ideal 6):
      //   F1: move, turnRight, move, turnLeft
      //   main: repeat 4 [callF1]
      // Trace from (0,0)E: each call advances one diagonal step,
      // collecting stars at (1,1),(2,2),(3,3); the fourth call ends on G
      // at (4,4).
      tiles: [
        'S....',
        '.*...',
        '..*..',
        '...*.',
        '....G'
      ],
      rover: { x: 0, y: 0, dir: 1 },
      allow: ['move','turnLeft','turnRight','repeat','callF1'], funcAllowed: true, ideal: 6 },
    { id: 'w6-6', world: 6, name: 'Comb Function',
      // Three identical comb teeth: pop up, grab the star, come back,
      // advance. Define the tooth once in F1 and repeat it.
      // F1 = turnLeft, move, turnRight, turnRight, move, turnLeft, move
      //   (from a base cell facing E: go up & collect, return, step to
      //    the next base, ending facing E).
      // Solution (ideal 9):  main: repeat 3 [callF1]
      // Trace from (0,1)E: calls collect stars at (0,0),(1,0),(2,0) and
      // the third call ends on G at (3,1).
      tiles: [
        '***.',
        'S..G'
      ],
      rover: { x: 0, y: 1, dir: 1 },
      allow: ['move','turnLeft','turnRight','repeat','callF1'], funcAllowed: true, ideal: 9 },

    // ── World 7 — Loop Counters ────────────────────────────────────
    // "Count i: 1 → N" runs its body N times and remembers the lap
    // number in i. A Repeat inside it can use i as its count, so each
    // lap can be longer than the last.
    { id: 'w7-1', world: 7, name: 'Counting Laps',
      // Solution (2): count 8 [move]
      tiles: ['..*..*..G'],
      rover: { x: 0, y: 0, dir: 1 },
      allow: ['move','forLoop'], ideal: 2,
      hint: 'Count i from 1 to N works like Repeat N. Watch the lap number i go up as the rover drives.' },
    { id: 'w7-2', world: 7, name: 'Growing Steps',
      // Solution (6): count 3 [ repeat i [move], turnLeft, move, turnRight ]
      tiles: [
        '......G',
        '...*..*',
        '.*..###',
        '..#####'
      ],
      rover: { x: 0, y: 3, dir: 1 },
      allow: ['move','turnLeft','turnRight','repeat','forLoop'], ideal: 6,
      hint: 'Each step is one tile longer than the last. Set a Repeat inside the Count loop to i.' },
    { id: 'w7-3', world: 7, name: 'Spiral Out',
      // Solution (4): count 5 [ repeat i [move], turnRight ]
      tiles: [
        'G....',
        '...#.',
        '.#*.*',
        '.#.#.',
        '.###.',
        '*...*'
      ],
      rover: { x: 2, y: 3, dir: 0 },
      allow: ['move','turnLeft','turnRight','repeat','forLoop'], ideal: 4,
      hint: 'Drive 1, turn, drive 2, turn, drive 3… The spiral grows by one tile on every side.' },
    { id: 'w7-4', world: 7, name: 'Giant Stairs',
      // Solution (7): count 3 [ repeat i [move], turnRight, repeat i [move], turnLeft ]
      tiles: [
        '.*.....',
        '#..*...',
        '###....',
        '.##...*',
        '..####.',
        '....##.',
        '......G'
      ],
      rover: { x: 0, y: 0, dir: 1 },
      allow: ['move','turnLeft','turnRight','repeat','forLoop'], ideal: 7,
      hint: 'Every stair is i tiles across and i tiles down. Use i twice in the same lap.' },
    { id: 'w7-5', world: 7, name: 'Rising Comb',
      // Solution (10): count 3 [ turnLeft, repeat i [move], turnRight, turnRight,
      //                          repeat i [move], turnLeft, move ]
      tiles: [
        '##*#',
        '#*.#',
        '*..#',
        '...G'
      ],
      rover: { x: 0, y: 3, dir: 1 },
      allow: ['move','turnLeft','turnRight','repeat','forLoop'], ideal: 10,
      hint: 'Each tooth of the comb is one tile taller: go up i, come back down i, then step right.' },
    { id: 'w7-6', world: 7, name: 'Square Spiral',
      // Solution (7): count 4 [ repeat i [move], turnLeft, repeat i [move], turnLeft ]
      tiles: [
        '*...#',
        '.*..#',
        '....#',
        '...*#',
        '*...G'
      ],
      rover: { x: 2, y: 2, dir: 0 },
      allow: ['move','turnLeft','turnRight','repeat','forLoop'], ideal: 7,
      hint: 'Sides go 1, 1, 2, 2, 3, 3, 4, 4. Two sides share each value of i.' },

    // ── World 8 — Nested Loops ─────────────────────────────────────
    { id: 'w8-1', world: 8, name: 'Corner Crystals',
      // Solution (4): repeat 4 [ repeat 3 [move], turnRight ]
      tiles: [
        'G..*',
        '.##.',
        '.##.',
        '*..*'
      ],
      rover: { x: 0, y: 0, dir: 1 },
      allow: ['move','turnLeft','turnRight','repeat'], ideal: 4,
      hint: 'Drive all the way round and come home to the pad. A loop inside a loop does it in 4 blocks.' },
    { id: 'w8-2', world: 8, name: 'Long Stairs',
      // Solution (6): repeat 3 [ repeat 3 [move], turnLeft, move, turnRight ]
      tiles: [
        '.........G',
        '.........*',
        '......*###',
        '...*######'
      ],
      rover: { x: 0, y: 3, dir: 1 },
      allow: ['move','turnLeft','turnRight','repeat'], ideal: 6,
      hint: 'Three moves, one step up, again and again. Put a Repeat inside a Repeat.' },
    { id: 'w8-3', world: 8, name: 'Chain of Squares',
      // Solution (7): repeat 3 [ repeat 4 [ repeat 2 [move], turnRight ], repeat 2 [move] ]
      tiles: [
        '......G',
        '.#.#.#.',
        '*.*.*.*'
      ],
      rover: { x: 0, y: 0, dir: 1 },
      allow: ['move','turnLeft','turnRight','repeat'], ideal: 7,
      hint: 'Drive one small square, slide over to the next one, repeat. That is three loops deep!' },
    { id: 'w8-4', world: 8, name: 'Castle Wall',
      // Solution (9): repeat 3 [ turnLeft, move, repeat 2 [turnRight, move],
      //                          turnLeft, repeat 2 [move] ]
      tiles: [
        '.*#.*#.*##',
        '.........G'
      ],
      rover: { x: 0, y: 1, dir: 1 },
      allow: ['move','turnLeft','turnRight','repeat'], ideal: 9,
      hint: 'Climb each tower, grab its crystal, climb down, walk on. Find the part that repeats inside the part that repeats.' },
    { id: 'w8-5', world: 8, name: 'Four Petals',
      // Solution (6): repeat 4 [ repeat 4 [ repeat 2 [move], turnRight ], turnRight ]
      tiles: [
        '*...*',
        '.#.#.',
        '..G..',
        '.#.#.',
        '*...*'
      ],
      rover: { x: 2, y: 2, dir: 0 },
      allow: ['move','turnLeft','turnRight','repeat'], ideal: 6,
      hint: 'Each petal is a little square that ends back on the pad. Do one petal, turn, do the next.' },
    { id: 'w8-6', world: 8, name: 'Mountain Range',
      // Solution (11): repeat 3 [ repeat 2 [turnLeft, move, turnRight, move],
      //                           repeat 2 [turnRight, move, turnLeft, move] ]
      tiles: [
        '#.*##.*##.*##',
        '.............',
        '.##..##..##.G'
      ],
      rover: { x: 0, y: 2, dir: 1 },
      allow: ['move','turnLeft','turnRight','repeat'], ideal: 11,
      hint: 'Two steps up, two steps down: that is one mountain. Three mountains make the range.' },

    // ── World 9 — Sensors & Smart Functions ────────────────────────
    // ifRock: the rover looks at the tile in front of it (the edge of
    // the map counts as rock). whileClear: keep going until blocked.
    { id: 'w9-1', world: 9, name: 'Rock Sensor',
      // Solution (4): repeat 8 [ ifRock [turnLeft], move ]
      tiles: [
        '....G.',
        '.#....',
        '....*.',
        '......',
        '..*..#'
      ],
      rover: { x: 0, y: 4, dir: 1 },
      allow: ['move','turnLeft','turnRight','repeat','ifRock'], ideal: 4,
      hint: 'The camera can see the tile ahead. If a rock is in the way, turn left. Then move.' },
    { id: 'w9-2', world: 9, name: 'Drive to the Wall',
      // Solution (5): whileClear [move], turnLeft, whileClear [move]
      tiles: [
        '.....G..',
        '.....*..',
        '........',
        '...*..#.'
      ],
      rover: { x: 0, y: 3, dir: 1 },
      allow: ['move','turnLeft','turnRight','whileClear'], ideal: 5,
      hint: '"While clear ahead" keeps the rover going until something blocks it. No counting needed!' },
    { id: 'w9-3', world: 9, name: 'Canyon Run',
      // Solution (9): F1 = whileClear [move]
      //   main: callF1, turnLeft, callF1, turnRight, callF1, turnRight, callF1
      tiles: [
        '.........',
        '.....####',
        '....#..*.',
        '....#.##.',
        '#####.##.',
        '...*..##G'
      ],
      rover: { x: 0, y: 5, dir: 1 },
      allow: ['move','turnLeft','turnRight','whileClear','callF1'], funcAllowed: true, ideal: 9,
      hint: 'Teach F1 to "drive until blocked", then call it on every stretch of the canyon.' },
    { id: 'w9-4', world: 9, name: 'Spiral Canyon',
      // Solution (4): repeat 7 [ whileClear [move], turnRight ]
      tiles: [
        '...*...',
        '######.',
        '..*..#.',
        '.#G..#*',
        '*#####.',
        '.......'
      ],
      rover: { x: 0, y: 0, dir: 1 },
      allow: ['move','turnLeft','turnRight','repeat','whileClear'], ideal: 4,
      hint: 'Every wall is a different length, but the rule is always the same: drive until blocked, turn right.' },
    { id: 'w9-5', world: 9, name: 'Signal Maze',
      // Solution (6): repeat 11 [ ifGreen [turnLeft], ifRock [turnRight], move ]
      tiles: [
        '#####.*G',
        '###.*g##',
        '###.####',
        '###.####',
        '..*g####'
      ],
      rover: { x: 0, y: 4, dir: 1 },
      allow: ['move','turnLeft','turnRight','repeat','ifGreen','ifRock'], ideal: 6,
      hint: 'Two rules: on a green pad turn left; facing a rock turn right. Then move. Repeat.' },
    { id: 'w9-6', world: 9, name: 'Rock Dodger',
      // Solution (15): F1 = ifRock [turnLeft, move, turnRight, move, move,
      //                             turnRight, move, turnLeft], move
      //   main: repeat 4 [callF1], turnRight, repeat 3 [callF1]
      tiles: [
        '..*...*...',
        '..#...#...',
        '..........',
        '.#......#*',
        '..........',
        '....#.....',
        '........G.'
      ],
      rover: { x: 0, y: 1, dir: 1 },
      allow: ['move','turnLeft','turnRight','repeat','ifRock','callF1'], funcAllowed: true, ideal: 15,
      hint: 'Make F1 a smart step: if a rock is ahead, drive around it; then move. Use F1 on both roads.' },

    // ── World 10 — Bug Hunt ────────────────────────────────────────
    // Each puzzle starts with a program that has a bug. Run it, watch
    // where it goes wrong, then fix it.
    { id: 'w10-1', world: 10, name: 'Wrong Turn',
      // Fix: the turn should be turnLeft. (5)
      tiles: [
        '..G',
        '.#.',
        '..*'
      ],
      rover: { x: 0, y: 2, dir: 1 },
      allow: ['move','turnLeft','turnRight'], ideal: 5,
      start: { main: [ { t: 'move' }, { t: 'move' }, { t: 'turnRight' }, { t: 'move' }, { t: 'move' } ] },
      hint: 'The rover turns the wrong way at the crystal. Which block is wrong?' },
    { id: 'w10-2', world: 10, name: 'Off by One',
      // Fix: repeat 6, not 5. (2)
      tiles: ['.*..*.G'],
      rover: { x: 0, y: 0, dir: 1 },
      allow: ['move','repeat'], ideal: 2,
      start: { main: [ { t: 'repeat', n: 5, body: [ { t: 'move' } ] } ] },
      hint: 'So close! The rover stops one tile short. Count the tiles again.' },
    { id: 'w10-3', world: 10, name: 'Missing Turn',
      // Fix: add turnRight inside the outer repeat. (4)
      tiles: [
        '...*',
        '.##.',
        '.##.',
        'G..*'
      ],
      rover: { x: 0, y: 0, dir: 1 },
      allow: ['move','turnLeft','turnRight','repeat'], ideal: 4,
      start: { main: [ { t: 'repeat', n: 3, body: [ { t: 'repeat', n: 3, body: [ { t: 'move' } ] } ] } ] },
      hint: 'The rover drives straight into the edge. Something is missing after each side.' },
    { id: 'w10-4', world: 10, name: 'Wrong Order',
      // Fix: turnLeft must come before the first move. (5)
      tiles: [
        '..*G',
        '.*.#',
        '*.##',
        '.###'
      ],
      rover: { x: 0, y: 3, dir: 1 },
      allow: ['move','turnLeft','turnRight','repeat'], ideal: 5,
      start: { main: [ { t: 'repeat', n: 3, body: [ { t: 'move' }, { t: 'turnLeft' }, { t: 'move' }, { t: 'turnRight' } ] } ] },
      hint: 'All the right blocks are here, but two of them are in the wrong order. Drag to fix.' },
    { id: 'w10-5', world: 10, name: 'Function Bug',
      // Fix: the last turn in F1 should be turnLeft. (10)
      tiles: [
        '#*#*#*#',
        '......G'
      ],
      rover: { x: 0, y: 1, dir: 1 },
      allow: ['move','turnLeft','turnRight','repeat','callF1'], funcAllowed: true, ideal: 10,
      start: {
        main: [ { t: 'repeat', n: 3, body: [ { t: 'callF1' } ] } ],
        f1: [ { t: 'move' }, { t: 'turnLeft' }, { t: 'move' }, { t: 'turnRight' }, { t: 'turnRight' },
              { t: 'move' }, { t: 'turnRight' }, { t: 'move' } ]
      },
      hint: 'Main is fine; the bug is inside F1. Step through it and watch which way the rover faces.' },
    { id: 'w10-6', world: 10, name: 'Sensor Bug',
      // Fix: move belongs after the ifRock block, not inside it. (4)
      tiles: [
        '....#.',
        '..G...',
        '....*.',
        '......',
        '..*..#'
      ],
      rover: { x: 0, y: 4, dir: 1 },
      allow: ['move','turnLeft','turnRight','repeat','ifRock'], ideal: 4,
      start: { main: [ { t: 'repeat', n: 9, body: [ { t: 'ifRock', body: [ { t: 'turnLeft' }, { t: 'move' } ] } ] } ] },
      hint: 'The rover does not move at all! Look at what is inside the If block.' }
  ];

  const Art = (typeof CodeCadetArt !== 'undefined') ? CodeCadetArt : null;
  const $ = id => document.getElementById(id);

  // ── Storage helpers ──
  function _storageKey() {
    return typeof getUserAppKey === 'function'
      ? getUserAppKey(STORE_PREFIX)
      : STORE_PREFIX + 'default';
  }
  function _loadProgress() {
    try {
      const p = JSON.parse(localStorage.getItem(_storageKey()));
      return (p && typeof p === 'object' && !Array.isArray(p)) ? p : {};
    } catch (e) { return {}; }
  }
  function _saveProgress(p) {
    try { localStorage.setItem(_storageKey(), JSON.stringify(p)); } catch (e) {}
    if (typeof CloudSync !== 'undefined' && CloudSync.online) {
      try { CloudSync.push(_storageKey()); } catch (e) {}
    }
  }
  function _puzzleRec(progress, id) {
    const r = progress[id];
    return (r && typeof r === 'object') ? r : null;
  }
  function _recStars(progress, id) {
    const r = _puzzleRec(progress, id);
    return r ? Math.max(0, Math.min(3, r.stars || 0)) : 0;
  }

  function _tier() {
    try {
      const u = typeof getActiveUser === 'function' ? getActiveUser() : null;
      return typeof getAgeTier === 'function' ? getAgeTier(u && u.age) : 'intermediate';
    } catch (e) { return 'intermediate'; }
  }

  // ── State ──
  const state = {
    puzzle: null,             // current puzzle definition
    world: null,              // idle (not running) world for display
    program: { main: [], f1: [] },
    activeKey: 'main',        // lane that tap-to-add puts blocks into
    speed: 'normal'
  };
  const ui = { run: null, timer: null, playing: false, locked: false, bumpedThisRun: false };
  let board = null, hero = null, heroTimer = null;

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
  function _blockedAhead(world) {
    const r = world.rover;
    return _tileAt(world, r.x + DX[r.dir], r.y + DY[r.dir]) === '#';
  }
  function _crystalsLeft(world) {
    let n = 0;
    for (let y = 0; y < world.h; y++) for (let x = 0; x < world.w; x++) {
      if (world.tiles[y][x] === '*' && !world.collected['s_' + x + '_' + y]) n++;
    }
    return n;
  }
  function _crystalsTotal(world) {
    let n = 0;
    for (let y = 0; y < world.h; y++) for (let x = 0; x < world.w; x++) if (world.tiles[y][x] === '*') n++;
    return n;
  }

  // ── AST helpers ──
  function _makeBlock(type) {
    const def = BLOCK_DEFS[type];
    const b = { id: _newNodeId(), type };
    if (def.hasCount) b.count = def.def || 3;
    (def.bodies || []).forEach(name => { b[name] = []; });
    return b;
  }
  // Puzzle `start` programs are plain data: { t, n, body }.
  function _fromSpec(list) {
    return (list || []).filter(s => s && BLOCK_DEFS[s.t]).map(s => {
      const b = _makeBlock(s.t);
      if (BLOCK_DEFS[s.t].hasCount && s.n !== undefined) b.count = s.n;
      if (b.body) b.body = _fromSpec(s.body);
      return b;
    });
  }
  function _toSpec(list) {
    return list.map(b => {
      const s = { t: b.type };
      if (BLOCK_DEFS[b.type].hasCount) s.n = b.count;
      if (b.body) s.body = _toSpec(b.body);
      return s;
    });
  }
  function _startProgram(p) {
    const s = p.start || {};
    return { main: _fromSpec(s.main), f1: _fromSpec(s.f1) };
  }

  function _laneKey(root, path) {
    return root + path.map(p => '/' + p.idx + '.' + p.body).join('');
  }
  function _parseLaneKey(key) {
    const parts = String(key).split('/');
    const root = parts.shift();
    return { root, path: parts.map(s => { const i = s.indexOf('.'); return { idx: +s.slice(0, i), body: s.slice(i + 1) }; }) };
  }
  function _findLane(rootName, path) {
    let arr = state.program[rootName];
    if (!arr) return null;
    for (const step of path) {
      const block = arr[step.idx];
      if (!block || !Array.isArray(block[step.body])) return null;
      arr = block[step.body];
    }
    return arr;
  }
  function _laneArr(key) { const k = _parseLaneKey(key); return _findLane(k.root, k.path); }

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
  function _usedCount(program) {
    const pr = program || state.program;
    return _countBlocks(pr.main) + _countBlocks(pr.f1);
  }
  function _starsFor(used, ideal) {
    let stars = 1;
    if (used <= ideal + 2) stars = 2;
    if (used <= ideal) stars = 3;
    return stars;
  }

  // ── Interpreter (generator-based) ──
  // A run owns its own copy of the world, so the same code drives the
  // animated run and the instant checks used by the tests.
  function _newRun(puzzle, program) {
    return { world: _parsePuzzle(puzzle), program, counters: [], ops: 0, ticks: 0, iter: null, finished: false };
  }
  function _tick(run) {
    run.ticks++;
    if (run.ticks > MAX_TICKS) throw new Error('too-long');
  }
  function* _walk(run, blocks, depth) {
    if (depth > MAX_DEPTH) throw new Error('depth-exceeded');
    for (const b of blocks) yield* _walkOne(run, b, depth);
  }
  function _countOf(run, b) {
    if (b.count === 'i') {
      if (!run.counters.length) throw new Error('no-counter');
      return run.counters[run.counters.length - 1];
    }
    return b.count || 1;
  }
  function* _walkOne(run, b, depth) {
    _tick(run);
    yield { focus: b.id };
    const t = b.type;
    const w = run.world;
    const r = w.rover;
    if (t === 'move')           yield { op: 'move', node: b.id };
    else if (t === 'turnLeft')  yield { op: 'turnL', node: b.id };
    else if (t === 'turnRight') yield { op: 'turnR', node: b.id };
    else if (t === 'repeat') {
      const n = _countOf(run, b);
      for (let i = 0; i < n; i++) {
        _tick(run);
        yield { focus: b.id, lap: i + 1, of: n };
        yield* _walk(run, b.body, depth + 1);
      }
    }
    else if (t === 'forLoop') {
      const n = b.count || 1;
      for (let i = 1; i <= n; i++) {
        _tick(run);
        run.counters.push(i);
        try {
          yield { focus: b.id, lap: i, of: n, counter: true };
          yield* _walk(run, b.body, depth + 1);
        } finally { run.counters.pop(); }
      }
    }
    else if (t === 'whileClear') {
      let k = 0;
      while (!_blockedAhead(w)) {
        _tick(run);
        k++;
        yield { focus: b.id, lap: k, cond: true };
        yield* _walk(run, b.body, depth + 1);
      }
      yield { focus: b.id, cond: false };
    }
    else if (t === 'ifGreen') {
      const raw = w.tiles[r.y] && w.tiles[r.y][r.x];
      const yes = raw === 'g';
      yield { focus: b.id, cond: yes };
      if (yes) yield* _walk(run, b.body, depth + 1);
    }
    else if (t === 'ifStar') {
      // Use the raw tile rather than _tileAt, which would return '.'
      // for stars that were auto-collected on arrival. The kid is
      // asking "did I step onto a star?" — auto-collection shouldn't
      // erase that fact for the purpose of the conditional.
      const raw = w.tiles[r.y] && w.tiles[r.y][r.x];
      const yes = raw === '*';
      yield { focus: b.id, cond: yes };
      if (yes) yield* _walk(run, b.body, depth + 1);
    }
    else if (t === 'ifRock') {
      const yes = _blockedAhead(w);
      yield { focus: b.id, cond: yes };
      if (yes) yield* _walk(run, b.body, depth + 1);
    }
    else if (t === 'callF1') {
      yield* _walk(run, run.program.f1, depth + 1);
    }
  }

  // Apply one primitive op to the run's world; return an event that
  // the art layer can animate.
  function _applyOp(run, step) {
    const w = run.world;
    const r = w.rover;
    if (step.op === 'turnL') { const from = r.dir; r.dir = (r.dir + 3) % 4; return { kind: 'turn', left: true, from, to: r.dir }; }
    if (step.op === 'turnR') { const from = r.dir; r.dir = (r.dir + 1) % 4; return { kind: 'turn', left: false, from, to: r.dir }; }
    const nx = r.x + DX[r.dir];
    const ny = r.y + DY[r.dir];
    if (_tileAt(w, nx, ny) === '#') {
      // Blocked — the move does nothing. The kid sees the bump.
      return { kind: 'bump', at: { x: r.x, y: r.y }, dir: r.dir };
    }
    const from = { x: r.x, y: r.y };
    r.x = nx; r.y = ny;
    let collect = null;
    // Auto-collect stars on the tile we arrive at.
    if (_tileAt(w, r.x, r.y) === '*') {
      collect = 's_' + r.x + '_' + r.y;
      w.collected[collect] = true;
    }
    return { kind: 'move', from, to: { x: r.x, y: r.y }, collect };
  }

  function _isComplete(world) {
    const r = world.rover;
    const g = world.goal;
    if (!g || r.x !== g.x || r.y !== g.y) return false;
    // Also require all stars collected.
    return _crystalsLeft(world) === 0;
  }

  // Advance to the next primitive op. Focus events go to onFocus.
  function _advance(run, onFocus) {
    for (;;) {
      const res = run.iter.next();
      if (res.done) return { done: true };
      const v = res.value;
      if (v && v.focus) { if (onFocus) onFocus(v); continue; }
      const ev = _applyOp(run, v);
      run.ops++;
      if (run.ops > MAX_STEPS) throw new Error('too-many-steps');
      return { done: false, ev, win: _isComplete(run.world) };
    }
  }

  // Instant, invisible run (used by the self-checks).
  function _simulate(puzzle, program) {
    const run = _newRun(puzzle, program);
    run.iter = _walk(run, program.main, 0);
    try {
      for (;;) {
        const s = _advance(run);
        if (s.done) return { win: _isComplete(run.world), ops: run.ops, world: run.world };
        if (s.win) return { win: true, ops: run.ops, world: run.world };
      }
    } catch (e) {
      return { win: false, error: e.message, ops: run.ops, world: run.world };
    }
  }

  // ── Run controller ──
  function _stepMs() { return SPEEDS[state.speed] || SPEEDS.normal; }

  function _clearTimer() { if (ui.timer) { clearTimeout(ui.timer); ui.timer = null; } }

  function _beginRun() {
    _clearTimer();
    ui.run = _newRun(state.puzzle, state.program);
    ui.run.iter = _walk(ui.run, state.program.main, 0);
    ui.bumpedThisRun = false;
    _clearFocus();
    if (board) { board.reset(ui.run.world); board.setRunning(true); }
    _updateHUD();
  }

  function _currentWorld() { return ui.run ? ui.run.world : state.world; }

  // One visible step. Returns true while the program has more to do.
  function _stepVisual() {
    let s;
    try { s = _advance(ui.run, _onFocus); }
    catch (e) { _runError(e); return false; }
    if (s.done) { _finishRun(false); return false; }
    const ms = _stepMs();
    if (board) board.play(s.ev, Math.round(ms * 0.86));
    if (s.ev.kind === 'move' && s.ev.collect) _playSfx('star');
    if (s.ev.kind === 'bump') {
      _playSfx('wrong');
      if (!ui.bumpedThisRun) { ui.bumpedThisRun = true; _showFeedback('Bonk! A rock is in the way.', 'warn'); }
    }
    _updateHUD();
    if (s.win) { _finishRun(true); return false; }
    return true;
  }

  function _loop() {
    ui.timer = null;
    if (!ui.playing) return;
    if (_stepVisual()) ui.timer = setTimeout(_loop, _stepMs());
  }

  function _play() {
    if (ui.locked || !state.puzzle) return;
    if (_countBlocks(state.program.main) === 0) {
      _showFeedback('Add some blocks to the main program first.', 'info');
      _pulseSlot();
      return;
    }
    if (!ui.run || ui.run.finished) _beginRun();
    ui.playing = true;
    if (board) board.setRunning(true);
    _updateControls();
    _loop();
  }
  function _pause() {
    ui.playing = false;
    _clearTimer();
    _updateControls();
  }
  function _step() {
    if (ui.locked || !state.puzzle) return;
    if (ui.playing) { _pause(); return; }
    if (_countBlocks(state.program.main) === 0) { _showFeedback('Add some blocks to the main program first.', 'info'); return; }
    if (!ui.run || ui.run.finished) _beginRun();
    _stepVisual();
    _updateControls();
  }
  function _resetExecution() {
    _clearTimer();
    ui.playing = false;
    ui.locked = false;
    ui.run = null;
    if (state.puzzle) state.world = _parsePuzzle(state.puzzle);
    _clearFocus();
    if (board && state.world) { board.reset(state.world); board.setRunning(false); }
    _updateHUD();
    _updateControls();
  }

  function _finishRun(win) {
    ui.playing = false;
    _clearTimer();
    if (ui.run) ui.run.finished = true;
    if (board) board.setRunning(false);
    _updateControls();
    if (win) {
      ui.locked = true;
      const wait = Math.round(_stepMs() * 0.9);
      setTimeout(() => {
        if (board) board.celebrate();
        _playSfx('cheer');
        setTimeout(() => { ui.locked = false; _onWin(); }, 1700);
      }, wait);
      return;
    }
    const w = ui.run.world;
    const left = _crystalsLeft(w);
    const g = w.goal, r = w.rover;
    let msg;
    if (g && r.x === g.x && r.y === g.y && left) msg = 'You reached the pad, but ' + left + (left === 1 ? ' crystal is' : ' crystals are') + ' still out there.';
    else if (left) msg = 'Not yet! ' + left + (left === 1 ? ' crystal' : ' crystals') + ' still to collect, and the pad is waiting.';
    else if (g) { const d = Math.abs(g.x - r.x) + Math.abs(g.y - r.y); msg = 'The program ended ' + d + (d === 1 ? ' tile' : ' tiles') + ' from the pad.'; }
    else msg = 'The program ended before the pad.';
    if (ui.bumpedThisRun) msg = 'Bonk! A rock got in the way. ' + msg;
    setTimeout(() => { if (board) board.sad(); }, Math.round(_stepMs() * 0.9));
    _showFeedback(msg, 'warn');
  }

  function _runError(e) {
    ui.playing = false;
    _clearTimer();
    if (ui.run) ui.run.finished = true;
    if (board) { board.setRunning(false); board.sad(); }
    const m = e && e.message;
    let msg = 'The rover got confused and stopped.';
    if (m === 'too-many-steps') msg = MAX_STEPS + ' steps and still going. Is a loop running forever?';
    else if (m === 'too-long') msg = 'A loop is spinning without moving the rover. Check what is inside it.';
    else if (m === 'depth-exceeded') msg = 'F1 keeps calling itself, so the rover never gets going.';
    else if (m === 'no-counter') msg = 'A Repeat set to i must sit inside a Count i loop.';
    _showFeedback(msg, 'warn');
    _updateControls();
  }

  function _onWin() {
    const used = _usedCount();
    const ideal = state.puzzle.ideal || used;
    const stars = _starsFor(used, ideal);

    const progress = _loadProgress();
    const prev = _puzzleRec(progress, state.puzzle.id) || { stars: 0, best: Infinity };
    const next = Object.assign({}, prev, {
      stars: Math.max(prev.stars || 0, stars),
      best: Math.min(prev.best || Infinity, used)
    });
    const firstTime = !(prev.stars > 0);
    const improved = stars > (prev.stars || 0);
    progress[state.puzzle.id] = next;
    _saveProgress(progress);

    if (typeof ActivityLog !== 'undefined' && ActivityLog.log) {
      ActivityLog.log('Code Cadet', '🤖',
        'Solved ' + state.puzzle.name + ' (' + '⭐'.repeat(stars) + ')');
    }

    _showWinDialog(stars, used, ideal, { firstTime, improved });
  }

  // ── Running highlight ──
  function _blockEl(nodeId) { return document.querySelector('.cc-blk[data-node-id="' + nodeId + '"]'); }
  function _onFocus(v) {
    const el = _blockEl(v.focus);
    if (!el) return;
    if (v.lap !== undefined) {
      const badge = el.querySelector(':scope > .cc-blk-row > .cc-blk-badge');
      if (badge) {
        badge.textContent = v.counter ? 'i = ' + v.lap : (v.of ? 'lap ' + v.lap + '/' + v.of : 'lap ' + v.lap);
        badge.hidden = false;
      }
      el.classList.add('cc-looping');
    }
    if (v.cond !== undefined && v.lap === undefined) {
      el.classList.remove('cc-cond-yes', 'cc-cond-no');
      void el.offsetWidth;
      el.classList.add(v.cond ? 'cc-cond-yes' : 'cc-cond-no');
    }
    document.querySelectorAll('.cc-blk.cc-focused').forEach(x => x.classList.remove('cc-focused'));
    el.classList.add('cc-focused');
    _scrollIntoProgram(el);
  }
  function _clearFocus() {
    document.querySelectorAll('.cc-blk.cc-focused, .cc-blk.cc-looping, .cc-blk.cc-cond-yes, .cc-blk.cc-cond-no')
      .forEach(el => el.classList.remove('cc-focused', 'cc-looping', 'cc-cond-yes', 'cc-cond-no'));
    document.querySelectorAll('.cc-blk-badge').forEach(b => { b.hidden = true; b.textContent = ''; });
  }
  function _scrollIntoProgram(el) {
    const box = $('cc-program');
    if (!box || box.scrollHeight <= box.clientHeight + 4) return;
    const r = el.getBoundingClientRect(), br = box.getBoundingClientRect();
    if (r.top < br.top + 8 || r.top > br.bottom - 40) box.scrollTop += (r.top - br.top) - box.clientHeight / 3;
  }

  // ── Editing ──
  function _programChanged() {
    if (ui.run || ui.playing) _resetExecution();
    _renderProgram();
    _updateHUD();
  }
  function _setActive(key) {
    if (!_laneArr(key)) key = 'main';
    state.activeKey = key;
    _renderProgram();
  }
  function _addToActive(type) {
    let lane = _laneArr(state.activeKey);
    if (!lane) { state.activeKey = 'main'; lane = state.program.main; }
    const b = _makeBlock(type);
    lane.push(b);
    // A fresh loop or condition becomes the place the next tap goes.
    if (BLOCK_DEFS[type].bodies.length) state.activeKey = state.activeKey + '/' + (lane.length - 1) + '.body';
    _playSfx('click');
    _programChanged();
    const el = _blockEl(b.id);
    if (el) { el.classList.add('cc-snap'); setTimeout(() => el.classList.remove('cc-snap'), 300); }
  }
  function _removeAt(key, idx) {
    const lane = _laneArr(key);
    if (!lane || !lane[idx]) return;
    const removedKey = key + '/' + idx + '.';
    lane.splice(idx, 1);
    if (state.activeKey.indexOf(removedKey) === 0 || !_laneArr(state.activeKey)) state.activeKey = key;
    // Indices after the removed block shift down by one.
    _fixActiveAfterRemoval(key, idx);
    _programChanged();
  }
  function _fixActiveAfterRemoval(key, idx) {
    const a = state.activeKey;
    const prefix = key + '/';
    if (a.indexOf(prefix) !== 0) return;
    const rest = a.slice(prefix.length);
    const dot = rest.indexOf('.');
    const i = +rest.slice(0, dot);
    if (i > idx) state.activeKey = prefix + (i - 1) + rest.slice(dot);
    if (!_laneArr(state.activeKey)) state.activeKey = key;
  }
  function _adjustCount(b, delta) {
    const def = BLOCK_DEFS[b.type];
    if (!def.hasCount) return;
    if (b.count === 'i') return;
    b.count = Math.max(def.min || 1, Math.min(def.max || 20, (b.count || 1) + delta));
    _playSfx('click');
    _programChanged();
  }
  function _toggleCounter(b) {
    b.count = b.count === 'i' ? (BLOCK_DEFS[b.type].def || 3) : 'i';
    _playSfx('click');
    _programChanged();
  }
  async function _startOver() {
    const p = state.puzzle;
    if (!p) return;
    const used = _usedCount();
    if (used > 2) {
      let ok = true;
      if (typeof ZsDialog !== 'undefined' && ZsDialog.confirm) {
        ok = await ZsDialog.confirm({
          title: p.start ? 'Bring back the buggy program?' : 'Clear your program?',
          message: p.start ? 'Your changes will be replaced by the original program.' : 'All ' + used + ' blocks will be removed.',
          confirmLabel: p.start ? 'Restore' : 'Clear', cancelLabel: 'Keep'
        });
      }
      if (!ok) return;
    }
    state.program = _startProgram(p);
    state.activeKey = 'main';
    _programChanged();
  }

  // ── Rendering: program lanes ──
  function _icon(t) { return Art ? Art.icon(t) : ''; }
  function _mk(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function _renderProgram() {
    const main = $('cc-lane-main');
    if (main) _renderRoot('main', main);
    const f1 = $('cc-lane-f1');
    if (f1) {
      if (state.puzzle && state.puzzle.funcAllowed) {
        f1.hidden = false;
        _renderRoot('f1', f1);
      } else {
        f1.hidden = true;
        f1.innerHTML = '';
      }
    }
    _updateHUD();
  }

  function _renderRoot(root, host) {
    host.innerHTML = '';
    const hat = _mk('button', 'cc-hat cc-hat-' + root);
    hat.type = 'button';
    hat.innerHTML = root === 'main'
      ? _icon('run') + '<span>When <b>Run</b> is pressed</span>'
      : _icon('f1hat') + '<span><b>F1</b> function</span>';
    hat.setAttribute('aria-label', root === 'main' ? 'Main program: add blocks here' : 'Function F1: add blocks here');
    hat.onclick = () => _setActive(root);
    host.appendChild(hat);
    host.appendChild(_renderLane(root, [], state.program[root]));
  }

  function _renderLane(root, path, arr) {
    const key = _laneKey(root, path);
    const lane = _mk('div', 'cc-lane-body');
    if (state.activeKey === key) lane.classList.add('cc-lane-active');
    lane.dataset.laneKey = key;
    arr.forEach((b, idx) => lane.appendChild(_renderBlock(root, path, b, idx)));
    const slot = _mk('button', 'cc-slot');
    slot.type = 'button';
    if (arr.length) {
      slot.classList.add('cc-slot-more');
      slot.innerHTML = '<span aria-hidden="true">＋</span>';
      slot.setAttribute('aria-label', 'Add the next block here');
    } else {
      slot.textContent = path.length ? 'Drop blocks inside' : (root === 'main' ? 'Tap or drag blocks here' : 'Build F1 here');
    }
    slot.onclick = () => _setActive(key);
    lane.appendChild(slot);
    return lane;
  }

  function _renderBlock(root, path, b, idx) {
    const def = BLOCK_DEFS[b.type];
    const key = _laneKey(root, path);
    const isC = def.bodies.length > 0;
    const el = _mk('div', 'cc-blk cc-cat-' + def.cat + ' cc-k-' + b.type + (isC ? ' cc-c' : ''));
    el.dataset.nodeId = b.id;
    el.dataset.lane = key;
    el.dataset.idx = idx;

    const row = _mk('div', 'cc-blk-row');
    row.innerHTML = _icon(b.type);
    row.appendChild(_mk('span', 'cc-blk-label', def.label));
    if (def.hasCount) {
      const cnt = _mk('span', 'cc-cnt');
      const minus = _mk('button', 'cc-mini-btn', '−');
      minus.type = 'button';
      minus.setAttribute('aria-label', 'Fewer');
      minus.disabled = b.count === 'i';
      minus.onclick = (e) => { e.stopPropagation(); _adjustCount(b, -1); };
      const num = _mk('output', 'cc-cnt-num', b.count === 'i' ? 'i' : String(b.count));
      const plus = _mk('button', 'cc-mini-btn', '+');
      plus.type = 'button';
      plus.setAttribute('aria-label', 'More');
      plus.disabled = b.count === 'i';
      plus.onclick = (e) => { e.stopPropagation(); _adjustCount(b, 1); };
      cnt.appendChild(minus); cnt.appendChild(num); cnt.appendChild(plus);
      row.appendChild(cnt);
      if (b.type === 'repeat') row.appendChild(_mk('span', 'cc-blk-after', 'times'));
      if (b.type === 'repeat' && state.puzzle && (state.puzzle.allow || []).indexOf('forLoop') !== -1) {
        const ib = _mk('button', 'cc-i-btn', 'i');
        ib.type = 'button';
        ib.setAttribute('aria-pressed', b.count === 'i' ? 'true' : 'false');
        ib.setAttribute('aria-label', b.count === 'i' ? 'Use a number instead of i' : 'Repeat i times (the lap number)');
        ib.onclick = (e) => { e.stopPropagation(); _toggleCounter(b); };
        row.appendChild(ib);
      }
    }
    const badge = _mk('span', 'cc-blk-badge');
    badge.hidden = true;
    row.appendChild(badge);
    const rm = _mk('button', 'cc-blk-rm');
    rm.type = 'button';
    rm.innerHTML = '<span aria-hidden="true">✕</span>';
    rm.setAttribute('aria-label', 'Remove ' + def.label + ' block');
    rm.onclick = (e) => { e.stopPropagation(); _removeAt(key, idx); };
    row.appendChild(rm);
    row.querySelectorAll('button').forEach(btn => btn.addEventListener('pointerdown', e => e.stopPropagation()));

    row.addEventListener('pointerdown', e => _pointerDown(e, { kind: 'block', key, idx, el, block: b }));
    row.addEventListener('click', () => {
      if (Date.now() < drag.suppressUntil) return;
      _setActive(isC ? key + '/' + idx + '.body' : key);
    });
    el.appendChild(row);

    if (isC) {
      const mouth = _renderLane(root, path.concat([{ idx, body: 'body' }]), b.body);
      mouth.classList.add('cc-mouth');
      el.appendChild(mouth);
      el.appendChild(_mk('div', 'cc-blk-foot'));
    }
    return el;
  }

  // ── Rendering: palette ──
  function _renderPalette() {
    const p = $('cc-palette');
    if (!p || !state.puzzle) return;
    p.innerHTML = '';
    const allow = state.puzzle.allow || ['move'];
    allow.forEach(t => {
      const def = BLOCK_DEFS[t];
      if (!def) return;
      const btn = _mk('button', 'cc-pal cc-cat-' + def.cat + ' cc-k-' + t);
      btn.type = 'button';
      btn.innerHTML = _icon(t) + '<span>' + def.label + (def.hasCount ? ' …' : '') + '</span>';
      btn.setAttribute('aria-label', 'Add ' + def.label + ' block');
      btn.onclick = () => {
        if (Date.now() < drag.suppressUntil) return;
        _addToActive(t);
      };
      btn.addEventListener('pointerdown', e => _pointerDown(e, { kind: 'palette', type: t, el: btn }));
      p.appendChild(btn);
    });
    const trash = _mk('div', 'cc-trash');
    trash.innerHTML = '<span aria-hidden="true">🗑️</span> Drop here to remove';
    p.appendChild(trash);
  }

  // ── Drag and drop (pointer events: mouse, pen and touch) ──
  const drag = { pending: null, active: false, ghost: null, mark: null, target: null, x: 0, y: 0, raf: 0, suppressUntil: 0, offX: 0, offY: 0 };

  function _pointerDown(e, src) {
    if (e.button !== undefined && e.button > 0) return;
    if (ui.locked) return;
    drag.pending = { src, x: e.clientX, y: e.clientY, id: e.pointerId };
    window.addEventListener('pointermove', _pointerMove, { passive: false });
    window.addEventListener('pointerup', _pointerUp);
    window.addEventListener('pointercancel', _pointerCancel);
  }
  function _detach() {
    window.removeEventListener('pointermove', _pointerMove);
    window.removeEventListener('pointerup', _pointerUp);
    window.removeEventListener('pointercancel', _pointerCancel);
  }
  function _pointerMove(e) {
    const pd = drag.pending;
    if (!pd || e.pointerId !== pd.id) return;
    if (!drag.active) {
      if (Math.hypot(e.clientX - pd.x, e.clientY - pd.y) < 8) return;
      _beginDrag(e);
    }
    e.preventDefault();
    drag.x = e.clientX; drag.y = e.clientY;
    _placeGhost();
    _updateTarget();
  }
  function _beginDrag(e) {
    const src = drag.pending.src;
    drag.active = true;
    if (ui.run || ui.playing) _resetExecution();
    const srcEl = src.el;
    const rect = srcEl.getBoundingClientRect();
    const g = srcEl.cloneNode(true);
    g.removeAttribute('id');
    g.classList.add('cc-ghost');
    g.style.width = Math.min(rect.width, 320) + 'px';
    document.body.appendChild(g);
    drag.ghost = g;
    drag.offX = Math.min(e.clientX - rect.left, 60);
    drag.offY = Math.min(e.clientY - rect.top, 24);
    if (src.kind === 'block') srcEl.classList.add('cc-dragging');
    document.body.classList.add('cc-is-dragging');
    if (src.kind === 'block') $('cc-palette').classList.add('cc-pal-trash');
    drag.x = e.clientX; drag.y = e.clientY;
    _placeGhost();
    if (!drag.raf) drag.raf = requestAnimationFrame(_autoScroll);
  }
  function _placeGhost() {
    if (!drag.ghost) return;
    drag.ghost.style.transform = 'translate(' + Math.round(drag.x - drag.offX) + 'px,' + Math.round(drag.y - drag.offY) + 'px) rotate(-2deg)';
  }
  function _autoScroll() {
    drag.raf = 0;
    if (!drag.active) return;
    const edge = 56, y = drag.y;
    let dy = 0;
    if (y < edge) dy = -Math.ceil((edge - y) / 4);
    else if (y > window.innerHeight - edge) dy = Math.ceil((y - (window.innerHeight - edge)) / 4);
    const box = $('cc-program');
    if (box && box.scrollHeight > box.clientHeight + 4) {
      const br = box.getBoundingClientRect();
      if (drag.x >= br.left && drag.x <= br.right) {
        if (y < br.top + 40 && y > br.top - 30) box.scrollTop -= 8;
        else if (y > br.bottom - 40 && y < br.bottom + 30) box.scrollTop += 8;
      }
    }
    if (dy) { window.scrollBy(0, dy); _updateTarget(); }
    drag.raf = requestAnimationFrame(_autoScroll);
  }
  function _laneUnder(x, y) {
    const hit = document.elementFromPoint(x, y);
    if (!hit) return null;
    if (hit.closest('#cc-palette')) return { trash: true };
    let lane = hit.closest('.cc-lane-body');
    if (!lane) {
      const root = hit.closest('.cc-root');
      if (root) lane = root.querySelector(':scope > .cc-lane-body');
    }
    if (!lane) {
      // Near the program panel (e.g. on its padding): use the closest root.
      const prog = $('cc-program');
      const pr = prog && prog.getBoundingClientRect();
      if (pr && x >= pr.left - 20 && x <= pr.right + 20 && y >= pr.top - 20 && y <= pr.bottom + 20) {
        let best = null, bd = Infinity;
        document.querySelectorAll('.cc-root:not([hidden]) > .cc-lane-body').forEach(l => {
          const r = l.getBoundingClientRect();
          const d = y < r.top ? r.top - y : (y > r.bottom ? y - r.bottom : 0);
          if (d < bd) { bd = d; best = l; }
        });
        lane = best;
      }
    }
    return lane ? { lane } : null;
  }
  function _updateTarget() {
    const src = drag.pending && drag.pending.src;
    if (!src) return;
    const hit = _laneUnder(drag.x, drag.y);
    let target = null;
    if (hit && hit.trash) target = { trash: true };
    else if (hit && hit.lane) {
      const key = hit.lane.dataset.laneKey;
      // A block can't be dropped inside itself.
      const own = src.kind === 'block' ? src.key + '/' + src.idx + '.' : null;
      if (!own || key.indexOf(own) !== 0) {
        const kids = Array.from(hit.lane.children).filter(c => c.classList.contains('cc-blk'));
        let idx = kids.length;
        for (let i = 0; i < kids.length; i++) {
          const row = kids[i].querySelector(':scope > .cc-blk-row');
          const r = (row || kids[i]).getBoundingClientRect();
          if (drag.y < r.top + r.height / 2) { idx = i; break; }
        }
        target = { key, idx, lane: hit.lane, kids };
      }
    }
    const same = drag.target && target && drag.target.key === target.key && drag.target.idx === target.idx && !!drag.target.trash === !!target.trash;
    if (same) return;
    drag.target = target;
    if (drag.mark) { drag.mark.remove(); drag.mark = null; }
    document.querySelectorAll('.cc-lane-drop').forEach(l => l.classList.remove('cc-lane-drop'));
    const pal = $('cc-palette');
    if (pal) pal.classList.toggle('cc-pal-hot', !!(target && target.trash && src.kind === 'block'));
    if (target && !target.trash) {
      const m = _mk('div', 'cc-drop-mark');
      const before = target.kids[target.idx] || target.lane.querySelector(':scope > .cc-slot');
      target.lane.insertBefore(m, before);
      target.lane.classList.add('cc-lane-drop');
      drag.mark = m;
    }
  }
  function _endDrag() {
    if (drag.ghost) drag.ghost.remove();
    if (drag.mark) drag.mark.remove();
    drag.ghost = null; drag.mark = null;
    document.querySelectorAll('.cc-dragging').forEach(x => x.classList.remove('cc-dragging'));
    document.querySelectorAll('.cc-lane-drop').forEach(l => l.classList.remove('cc-lane-drop'));
    document.body.classList.remove('cc-is-dragging');
    const pal = $('cc-palette');
    if (pal) pal.classList.remove('cc-pal-trash', 'cc-pal-hot');
    if (drag.raf) cancelAnimationFrame(drag.raf);
    drag.raf = 0;
    drag.active = false;
    drag.pending = null;
    drag.target = null;
  }
  function _pointerCancel() { _detach(); _endDrag(); }
  function _pointerUp(e) {
    const pd = drag.pending;
    if (!pd || e.pointerId !== pd.id) return;
    _detach();
    if (!drag.active) { drag.pending = null; return; }   // a tap: click handles it
    drag.suppressUntil = Date.now() + 200;
    const src = pd.src, target = drag.target;
    _endDrag();
    if (!target) return;
    if (target.trash) {
      if (src.kind === 'block') { _playSfx('click'); _removeAt(src.key, src.idx); }
      return;
    }
    const dst = _laneArr(target.key);
    if (!dst) return;
    if (src.kind === 'palette') {
      dst.splice(target.idx, 0, _makeBlock(src.type));
      state.activeKey = target.key;
    } else {
      const from = _laneArr(src.key);
      if (!from || !from[src.idx]) return;
      const [blk] = from.splice(src.idx, 1);
      let ti = target.idx;
      if (from === dst && src.idx < ti) ti--;
      dst.splice(ti, 0, blk);
      // Lane keys may have shifted; fall back to the main lane.
      state.activeKey = _laneArr(state.activeKey) ? state.activeKey : 'main';
      if (from !== dst || ti !== src.idx) state.activeKey = 'main';
    }
    _playSfx('click');
    _programChanged();
  }

  // ── HUD / controls ──
  function _updateHUD() {
    const p = state.puzzle;
    if (!p) return;
    const used = _usedCount();
    const ideal = p.ideal;
    const idealEl = $('cc-ideal'), usedEl = $('cc-used');
    if (idealEl) idealEl.textContent = ideal;
    if (usedEl) usedEl.textContent = used;
    const meter = $('cc-meter');
    if (meter) {
      const s = used === 0 ? 3 : _starsFor(used, ideal);
      meter.innerHTML = [1, 2, 3].map(k => '<span class="' + (k <= s ? 'on' : '') + '" aria-hidden="true">★</span>').join('');
      meter.setAttribute('aria-label', used === 0 ? 'Up to 3 stars' : 'This program would earn ' + s + (s === 1 ? ' star' : ' stars'));
      const blocks = $('cc-blocks');
      if (blocks) blocks.classList.toggle('cc-over', used > ideal);
    }
    const w = _currentWorld();
    if (!w) return;
    const total = _crystalsTotal(w);
    const cEl = $('cc-crystals');
    if (cEl) {
      cEl.hidden = total === 0;
      const got = total - _crystalsLeft(w);
      cEl.querySelector('b').textContent = got + '/' + total;
    }
    const dir = $('cc-dir');
    if (dir && w.rover) {
      dir.style.setProperty('--rot', (w.rover.dir * 90) + 'deg');
      dir.setAttribute('aria-label', 'Rover facing ' + DIR_NAMES[w.rover.dir]);
    }
  }

  function _updateControls() {
    const run = $('cc-run-btn');
    if (run) {
      const paused = ui.run && !ui.run.finished && !ui.playing;
      run.innerHTML = ui.playing ? '<span aria-hidden="true">⏸</span> Pause' : (paused ? '<span aria-hidden="true">▶</span> Resume' : '<span aria-hidden="true">▶</span> Run');
      run.classList.toggle('cc-running', ui.playing);
    }
    document.querySelectorAll('.cc-speed button').forEach(b => {
      b.setAttribute('aria-pressed', b.dataset.speed === state.speed ? 'true' : 'false');
    });
  }

  function _pulseSlot() {
    const s = document.querySelector('#cc-lane-main .cc-slot');
    if (s) { s.classList.remove('cc-pulse'); void s.offsetWidth; s.classList.add('cc-pulse'); }
  }

  function _setSpeed(sp) {
    if (!SPEEDS[sp]) return;
    state.speed = sp;
    const progress = _loadProgress();
    const prefs = (progress._prefs && typeof progress._prefs === 'object') ? progress._prefs : {};
    prefs.speed = sp;
    progress._prefs = prefs;
    try { localStorage.setItem(_storageKey(), JSON.stringify(progress)); } catch (e) {}
    _updateControls();
  }

  // ── Feedback / dialogs ──
  let _fbTimer = null;
  function _showFeedback(text, kind) {
    const f = $('cc-feedback');
    if (!f) return;
    f.textContent = text;
    f.className = 'cc-feedback show' + (kind ? ' cc-fb-' + kind : '');
    if (_fbTimer) clearTimeout(_fbTimer);
    _fbTimer = setTimeout(() => f.classList.remove('show'), 2600);
  }

  const STAR_SVG = '<svg viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="ccsg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FDE68A"/><stop offset=".55" stop-color="#F59E0B"/><stop offset="1" stop-color="#B45309"/></linearGradient></defs><path d="M24 3l6.2 13.4 14.6 1.6-10.9 9.9 3 14.4L24 35l-12.9 7.3 3-14.4L3.2 18l14.6-1.6z" fill="url(#ccsg)" stroke="#92400E" stroke-width="1.6" stroke-linejoin="round"/><path d="M24 8l4.6 10 10.4 1.2" fill="none" stroke="#FFFBEB" stroke-width="2" stroke-linecap="round" opacity=".8"/></svg>';
  const STAR_OFF = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 3l6.2 13.4 14.6 1.6-10.9 9.9 3 14.4L24 35l-12.9 7.3 3-14.4L3.2 18l14.6-1.6z" fill="#E7E5EF" stroke="#C9C5D8" stroke-width="1.6" stroke-linejoin="round"/></svg>';

  function _showWinDialog(stars, used, ideal, info) {
    const dlg = $('cc-win');
    if (!dlg) return;
    const st = $('cc-win-stars');
    st.innerHTML = [1, 2, 3].map(k => '<span class="cc-wstar' + (k <= stars ? ' on' : '') + '" style="animation-delay:' + (0.15 + k * 0.18) + 's">' + (k <= stars ? STAR_SVG : STAR_OFF) + '</span>').join('');
    st.setAttribute('aria-label', stars + (stars === 1 ? ' star' : ' stars'));
    $('cc-win-used').textContent = used;
    $('cc-win-ideal').textContent = ideal;
    const title = $('cc-win-title');
    const msg = $('cc-win-msg');
    if (title) title.textContent = stars === 3 ? 'Mission complete!' : 'Rover parked!';
    if (msg) {
      if (stars === 3) msg.textContent = used < ideal ? 'Wow, even shorter than our best program!' : 'A perfect program, as short as it can be.';
      else msg.textContent = 'Solved! Now try it with ' + ideal + ' blocks for 3 stars.';
    }
    const next = $('cc-win-next');
    const idx = PUZZLES.findIndex(p => p.id === state.puzzle.id);
    if (next) next.hidden = !PUZZLES[idx + 1];
    dlg.classList.add('show');
    setTimeout(() => { const b = next && !next.hidden ? next : $('cc-win-replay'); if (b) b.focus(); }, 60);
  }
  function _hideWinDialog() {
    const dlg = $('cc-win');
    if (dlg) dlg.classList.remove('show');
  }

  function _playSfx(name) {
    if (typeof SFX === 'undefined') return;
    try {
      if (name === 'click' && SFX.click) SFX.click();
      else if (name === 'cheer' && SFX.cheer) SFX.cheer();
      else if (name === 'star' && SFX.star) SFX.star();
      else if (name === 'correct' && SFX.correct) SFX.correct();
      else if (name === 'wrong' && SFX.wrong) SFX.wrong();
    } catch (e) {}
  }

  // ── Screen transitions ──
  function _showScreen(id) {
    document.querySelectorAll('.cc-screen').forEach(s => s.classList.remove('active'));
    const el = $(id);
    if (el) el.classList.add('active');
    document.body.classList.toggle('cc-in-game', id === 'cc-screen-game');
    if (id === 'cc-screen-game') { _stopHero(); if (board) board.start(); }
    else { if (board) board.stop(); _startHero(); }
    window.scrollTo(0, 0);
  }

  function _worldOf(n) { return WORLDS[n] || { name: 'World ' + n, es: '', age: 8, tip: '' }; }

  function _renderWorldSelect() {
    const grid = $('cc-world-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const progress = _loadProgress();
    const byWorld = {};
    PUZZLES.forEach(p => { (byWorld[p.world] = byWorld[p.world] || []).push(p); });
    const nextUp = PUZZLES.find(p => _recStars(progress, p.id) === 0);
    let total = 0;
    PUZZLES.forEach(p => { total += _recStars(progress, p.id); });
    const tot = $('cc-total');
    if (tot) tot.textContent = '★ ' + total + ' / ' + (PUZZLES.length * 3) + ' stars · ' + PUZZLES.filter(p => _recStars(progress, p.id) > 0).length + ' of ' + PUZZLES.length + ' missions';

    Object.keys(byWorld).map(Number).sort((a, b) => a - b).forEach(wId => {
      const W = _worldOf(wId);
      const list = byWorld[wId];
      const got = list.reduce((s, p) => s + _recStars(progress, p.id), 0);
      const card = _mk('section', 'cc-world-card cc-wc-' + wId);
      const head = _mk('div', 'cc-wc-head');
      const num = _mk('span', 'cc-wc-num', String(wId));
      num.setAttribute('aria-hidden', 'true');
      const titles = _mk('div', 'cc-wc-titles');
      const h3 = _mk('h3', '', 'World ' + wId + ' · ' + W.name);
      titles.appendChild(h3);
      titles.appendChild(_mk('span', 'cc-wc-es', W.es + ' · ages ' + W.age + '+'));
      const prog = _mk('span', 'cc-wc-prog', '★ ' + got + '/' + list.length * 3);
      head.appendChild(num); head.appendChild(titles); head.appendChild(prog);
      card.appendChild(head);
      const bar = _mk('div', 'cc-wc-bar');
      const fill = _mk('span');
      fill.style.width = Math.round(100 * got / (list.length * 3)) + '%';
      bar.appendChild(fill);
      card.appendChild(bar);
      if (W.tip) card.appendChild(_mk('p', 'cc-wc-tip', W.tip));
      const ul = _mk('div', 'cc-puzzle-list');
      list.forEach((p, i) => {
        const btn = _mk('button', 'cc-puzzle-btn');
        btn.type = 'button';
        btn.dataset.pid = p.id;
        const s = _recStars(progress, p.id);
        if (s > 0) btn.classList.add('cc-solved');
        if (nextUp && nextUp.id === p.id) btn.classList.add('cc-next');
        const th = document.createElement('canvas');
        th.className = 'cc-thumb';
        th.setAttribute('aria-hidden', 'true');
        if (Art) Art.drawThumb(th, p);
        btn.appendChild(th);
        const meta = _mk('span', 'cc-pmeta');
        meta.appendChild(_mk('span', 'cc-pnum', wId + '-' + (i + 1) + (p.start ? ' · bug' : '')));
        meta.appendChild(_mk('span', 'cc-puzzle-name', p.name));
        const stars = _mk('span', 'cc-puzzle-stars');
        stars.innerHTML = [1, 2, 3].map(k => '<i class="' + (k <= s ? 'on' : '') + '">★</i>').join('');
        meta.appendChild(stars);
        btn.appendChild(meta);
        if (nextUp && nextUp.id === p.id) btn.appendChild(_mk('span', 'cc-next-tag', 'Next'));
        btn.setAttribute('aria-label', 'World ' + wId + ' puzzle ' + (i + 1) + ': ' + p.name + ', ' + s + ' of 3 stars' + (p.start ? ', bug hunt' : ''));
        btn.onclick = () => _openPuzzle(p.id);
        ul.appendChild(btn);
      });
      card.appendChild(ul);
      grid.appendChild(card);
    });
  }

  function _goalText(p, world) {
    const n = _crystalsTotal(world);
    let t = n ? 'Collect ' + (n === 1 ? 'the crystal' : 'all ' + n + ' crystals') + ', then park on the landing pad.' : 'Drive the rover onto the landing pad.';
    return t;
  }
  function _renderGoal() {
    const p = state.puzzle;
    const box = $('cc-goal');
    if (!box || !p) return;
    box.innerHTML = '';
    box.classList.toggle('cc-goal-bug', !!p.start);
    const W = _worldOf(p.world);
    const list = PUZZLES.filter(q => q.world === p.world);
    const first = list[0] && list[0].id === p.id;
    const main = _mk('p', 'cc-goal-main');
    if (p.start) main.appendChild(_mk('b', 'cc-bug-tag', 'Bug hunt'));
    main.appendChild(document.createTextNode(p.start ? ' This program has a bug. Run it, find the bug, fix it.' : _goalText(p, state.world)));
    box.appendChild(main);
    const tipText = p.hint || (first ? W.tip : '');
    if (tipText) box.appendChild(_mk('p', 'cc-goal-tip', tipText));
    const best = _puzzleRec(_loadProgress(), p.id);
    const tgt = _mk('p', 'cc-goal-target');
    tgt.textContent = '3 stars: ' + p.ideal + (p.ideal === 1 ? ' block' : ' blocks') + ' or fewer' + (best && best.best && isFinite(best.best) ? ' · your best: ' + best.best : '');
    box.appendChild(tgt);
  }

  function _fitBoard() {
    if (!board || !state.world) return;
    const wrap = $('cc-board-wrap');
    if (!wrap) return;
    const cs = getComputedStyle(wrap);
    const availW = wrap.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const narrow = window.innerWidth < 900;
    const availH = narrow ? Math.max(170, window.innerHeight * (window.innerWidth < 600 ? 0.32 : 0.36)) : Math.max(260, window.innerHeight * 0.62);
    board.fit(availW, availH);
  }

  function _openPuzzle(id) {
    const p = PUZZLES.find(x => x.id === id);
    if (!p) return;
    _hideWinDialog();
    _clearTimer();
    ui.run = null; ui.playing = false; ui.locked = false;
    state.puzzle = p;
    state.program = _startProgram(p);
    state.activeKey = 'main';
    state.world = _parsePuzzle(p);
    $('cc-puzzle-name').textContent = p.name;
    const W = _worldOf(p.world);
    const idx = PUZZLES.filter(q => q.world === p.world).indexOf(p) + 1;
    $('cc-puzzle-world').textContent = 'World ' + p.world + ' · ' + W.name + ' · ' + idx + '/' + PUZZLES.filter(q => q.world === p.world).length;
    _showScreen('cc-screen-game');
    if (board) board.setWorld(state.world, { seedKey: p.id });
    _fitBoard();
    _renderGoal();
    _renderPalette();
    _renderProgram();
    _updateControls();
    _updateHUD();
  }

  function _backToWorlds() {
    _clearTimer();
    ui.playing = false; ui.run = null; ui.locked = false;
    _hideWinDialog();
    const pid = state.puzzle && state.puzzle.id;
    state.puzzle = null;
    _renderWorldSelect();
    _showScreen('cc-screen-select');
    if (pid) {
      const b = document.querySelector('.cc-puzzle-btn[data-pid="' + pid + '"]');
      if (b) { b.scrollIntoView({ block: 'center' }); b.focus({ preventScroll: true }); }
    }
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
    state.program = _startProgram(state.puzzle);
    state.activeKey = 'main';
    _resetExecution();
    _renderGoal();
    _renderProgram();
  }

  // ── Hero (title screen): a rover patrolling a little test site ──
  const HERO_WORLD = {
    tiles: ['#...*...#..', '..g.....G..', '.....#...*.'],
    rover: { x: 1, y: 1, dir: 1 }
  };
  const HERO_LOOP = ['m', 'm', 'm', 'm', 'r', 'm', 'r', 'm', 'm', 'm', 'm', 'r', 'm', 'r'];
  function _heroWorld() {
    const rows = HERO_WORLD.tiles.map(r => r.split(''));
    return { tiles: rows, w: rows[0].length, h: rows.length, collected: {}, rover: Object.assign({}, HERO_WORLD.rover) };
  }
  function _startHero() {
    const c = $('cc-hero');
    if (!c || !Art) return;
    if (!hero) {
      hero = Art.createBoard(c);
      hero.world0 = _heroWorld();
      hero.setWorld(hero.world0, { seedKey: 'hero' });
      hero.lights = true;
    }
    _fitHero();
    hero.start();
    if (heroTimer) clearInterval(heroTimer);
    const reduce = document.documentElement.classList.contains('zs-a11y-reduce-motion') ||
      (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (reduce) return;
    let i = 0;
    const r = { x: HERO_WORLD.rover.x, y: HERO_WORLD.rover.y, dir: HERO_WORLD.rover.dir };
    heroTimer = setInterval(() => {
      if (document.hidden) return;
      const op = HERO_LOOP[i++ % HERO_LOOP.length];
      if (op === 'm') {
        const to = { x: r.x + DX[r.dir], y: r.y + DY[r.dir] };
        hero.play({ kind: 'move', from: { x: r.x, y: r.y }, to }, 760);
        r.x = to.x; r.y = to.y;
      } else {
        hero.play({ kind: 'turn', left: false }, 640);
        r.dir = (r.dir + 1) % 4;
      }
    }, 900);
  }
  function _stopHero() {
    if (heroTimer) { clearInterval(heroTimer); heroTimer = null; }
    if (hero) hero.stop();
  }
  function _fitHero() {
    const c = $('cc-hero');
    if (!hero || !c || !c.parentElement) return;
    const w = Math.min(c.parentElement.clientWidth, 640);
    hero.fit(w, 220);
  }

  // ── Public API ──
  function init() {
    const prefs = _loadProgress()._prefs;
    const tier = _tier();
    state.speed = (prefs && SPEEDS[prefs.speed]) ? prefs.speed : (tier === 'beginner' ? 'slow' : 'normal');
    document.body.classList.add('cc-tier-' + tier);

    const canvas = $('cc-canvas');
    if (canvas && Art) board = Art.createBoard(canvas);

    $('cc-run-btn').onclick = () => { if (ui.playing) _pause(); else _play(); };
    $('cc-step-btn').onclick = _step;
    $('cc-reset-btn').onclick = _resetExecution;
    $('cc-back-btn').onclick = _backToWorlds;
    $('cc-win-replay').onclick = _replayPuzzle;
    $('cc-win-next').onclick = _nextPuzzle;
    $('cc-win-back').onclick = _backToWorlds;
    const so = $('cc-startover-btn');
    if (so) so.onclick = _startOver;
    document.querySelectorAll('.cc-speed button').forEach(b => { b.onclick = () => _setSpeed(b.dataset.speed); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && $('cc-win').classList.contains('show')) _hideWinDialog();
    });

    let rt = null;
    window.addEventListener('resize', () => {
      if (rt) clearTimeout(rt);
      rt = setTimeout(() => {
        if (state.puzzle) _fitBoard();
        else _fitHero();
      }, 150);
    });

    _renderWorldSelect();
    _showScreen('cc-screen-select');
    _updateControls();
  }

  // Test hooks: instant solving with the real interpreter.
  const _t = {
    PUZZLES, BLOCK_DEFS,
    simulate(id, spec) {
      const p = PUZZLES.find(x => x.id === id);
      if (!p) return { error: 'no-puzzle' };
      const program = { main: _fromSpec(spec.main), f1: _fromSpec(spec.f1) };
      const r = _simulate(p, program);
      const used = _usedCount(program);
      return { win: r.win, error: r.error || null, ops: r.ops, used, ideal: p.ideal, stars: r.win ? _starsFor(used, p.ideal) : 0,
               rover: r.world.rover, left: _crystalsLeft(r.world) };
    },
    load(spec) {
      state.program = { main: _fromSpec(spec.main), f1: _fromSpec(spec.f1) };
      _programChanged();
    },
    program() { return { main: _toSpec(state.program.main), f1: _toSpec(state.program.f1) }; },
    open: _openPuzzle,
    run: _play,
    setSpeed: _setSpeed,
    state() { return { puzzle: state.puzzle && state.puzzle.id, playing: ui.playing, locked: ui.locked, speed: state.speed, active: state.activeKey }; }
  };

  return { init, _t };
})();

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof CodeCadet !== 'undefined') CodeCadet.init();
  });
}
