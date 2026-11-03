/* ================================================================
   LITTLE ENGINEER — data (js/little-engineer-data.js)
   Materials, test vehicles, the level ladder (with hint designs and
   pre-placed partial bridges for younger builders) and lesson cards.

   Units: 1 grid square = 1 metre. Masses in kg, forces in newtons.
   A design is a list of members [x1, y1, x2, y2, materialId] on the
   integer grid; joints are the members' end points. y points UP,
   the road on both cliffs is at y = 0.
   ================================================================ */

var LittleEngineerData = (function() {
  'use strict';

  // ---- materials ---------------------------------------------------
  // strength: breaking force (N). buckle: members longer than this
  // (m) are weaker when squeezed — long thin sticks bend sideways.
  var MATERIALS = {
    wood:  { id: 'wood',  name: 'Wood beam',   es: 'Viga de madera', cost: 1000, density: 30,
             EA: 3.0e7, strength: 52000,  buckle: 3.0, maxLen: 4,  tensionOnly: false,
             note: 'Cheap and light. Good for short pieces.' },
    steel: { id: 'steel', name: 'Steel beam',  es: 'Viga de acero',  cost: 3500, density: 80,
             EA: 1.2e8, strength: 165000, buckle: 4.2, maxLen: 5,  tensionOnly: false,
             note: 'Very strong — and costs more.' },
    cable: { id: 'cable', name: 'Steel cable', es: 'Cable de acero', cost: 1200, density: 10,
             EA: 8.0e7, strength: 150000, buckle: 0,   maxLen: 14, tensionOnly: true,
             note: 'Strong when PULLED. Goes floppy when pushed.' },
    road:  { id: 'road',  name: 'Road deck',   es: 'Tablero vial',   cost: 2500, density: 100,
             EA: 1.0e8, strength: 120000, buckle: 3.0, maxLen: 3,  tensionOnly: false,
             note: 'The road the vehicle drives on. Needs support!' }
  };
  var MATERIAL_ORDER = ['road', 'wood', 'steel', 'cable'];
  var JOINT_COST = 400;

  // ---- test vehicles -------------------------------------------------
  var VEHICLES = {
    car:    { id: 'car',    name: 'Small car',     es: 'Auto',            mass: 1200,  wheelbase: 2.5, r: 0.33, rideH: 0.62, speed: 4.2, len: 4.1 },
    pickup: { id: 'pickup', name: 'Pickup truck',  es: 'Camioneta',       mass: 2300,  wheelbase: 3.2, r: 0.40, rideH: 0.78, speed: 4.0, len: 5.3 },
    bus:    { id: 'bus',    name: 'Country bus',   es: 'Bus rural',       mass: 7500,  wheelbase: 6.0, r: 0.50, rideH: 0.95, speed: 3.4, len: 10.5 },
    truck:  { id: 'truck',  name: 'Log truck',     es: 'Camión forestal', mass: 11000, wheelbase: 6.4, r: 0.52, rideH: 1.0,  speed: 3.2, len: 10.0 }
  };

  // ---- design helpers (used to write hint bridges compactly) --------
  function road(x0, x1, step, y) {
    var out = [], yy = y || 0;
    for (var x = x0; x < x1; x += step) out.push([x, yy, Math.min(x + step, x1), yy, 'road']);
    return out;
  }
  // A Warren truss: bottom joints every `p` m along y = 0 from x0 to x1,
  // top joints half-way between them at height h (negative = below).
  function warren(x0, x1, p, h, mat, chordMat) {
    var out = [], cm = chordMat || mat;
    for (var x = x0; x < x1; x += p) {
      var mx = x + p / 2;
      out.push([x, 0, mx, h, mat]);
      out.push([mx, h, x + p, 0, mat]);
      if (x + p < x1) out.push([mx, h, mx + p, h, cm]);
    }
    return out;
  }
  // A Pratt / Howe style truss with verticals: panels of p m, height h.
  // Pratt diagonals lean toward the middle from the top (pulled);
  // Howe diagonals lean the other way (squeezed).
  function panelTruss(x0, x1, p, h, kind, mat, chordMat) {
    var out = [], cm = chordMat || mat, mid = (x0 + x1) / 2, x;
    out.push([x0, 0, x0 + p, h, mat]);
    out.push([x1 - p, h, x1, 0, mat]);
    for (x = x0 + p; x < x1; x += p) out.push([x, 0, x, h, mat]);
    for (x = x0 + p; x + p <= x1 - p; x += p) {
      out.push([x, h, x + p, h, cm]);
      var leftHalf = x + p / 2 < mid;
      if (leftHalf === (kind === 'pratt')) out.push([x, h, x + p, 0, mat]);
      else out.push([x, 0, x + p, h, mat]);
    }
    return out;
  }
  function cat() {
    var out = [];
    for (var i = 0; i < arguments.length; i++) out = out.concat(arguments[i]);
    return out;
  }

  // ---- levels --------------------------------------------------------
  // budget = 2-star limit, tight = 3-star limit (CLP).
  // pillars: [{x, top, w, anchor:true}] ; tower: same, tall, anchor at top.
  // clear: no-build box {x0,x1,y0,y1} (boats pass below).
  // preset: members already placed for younger builders (they can delete them).
  var LEVELS = [
    { id: 'l1', name: 'Little Creek', es: 'Estero Chico', span: 6, water: -5, vehicle: 'car', time: 'morning', rock: 'andes',
      anchors: [[0, 0], [6, 0], [0, -2], [6, -2]],
      tip: 'Triangles are strong! A triangle cannot change shape unless a side breaks.',
      hint: cat(road(0, 6, 2), [[0, -2, 2, 0, 'wood'], [6, -2, 4, 0, 'wood']]),
      preset: road(0, 6, 2),
      budget: 28000, tight: 21000 },

    { id: 'l2', name: 'Pudú Crossing', es: 'Paso del Pudú', span: 8, water: -6, vehicle: 'car', time: 'noon', rock: 'south',
      anchors: [[0, 0], [8, 0]],
      tip: 'No low supports here. Build triangles ABOVE the road — a truss.',
      hint: cat(road(0, 8, 2), warren(0, 8, 2, 2, 'wood')),
      preset: cat(road(0, 8, 2), [[0, 0, 1, 2, 'wood'], [1, 2, 2, 0, 'wood']]),
      budget: 65000, tight: 50000 },

    { id: 'l3', name: 'Fox Gorge', es: 'Quebrada del Zorro', span: 10, water: -7, vehicle: 'car', time: 'golden', rock: 'andes',
      anchors: [[0, 0], [10, 0], [0, -3], [10, -3]],
      tip: 'Supports below the road can push UP on it. Try triangles underneath.',
      hint: cat(road(0, 10, 2), [[0, -3, 2, -2, 'wood'], [2, -2, 2, 0, 'wood'], [2, -2, 4, 0, 'wood'], [2, -2, 4, -2, 'wood'], [4, -2, 4, 0, 'wood'],
            [4, -2, 6, 0, 'wood'], [4, -2, 6, -2, 'wood'], [6, -2, 6, 0, 'wood'], [6, -2, 8, -2, 'wood'], [6, -2, 4, 0, 'wood'],
            [8, -2, 8, 0, 'wood'], [8, -2, 6, 0, 'wood'], [10, -3, 8, -2, 'wood'], [0, -3, 2, 0, 'wood'], [10, -3, 8, 0, 'wood']]),
      preset: cat(road(0, 10, 2), [[0, -3, 2, -2, 'wood'], [2, -2, 2, 0, 'wood'], [0, -3, 2, 0, 'wood']]),
      budget: 70000, tight: 47000 },

    { id: 'l4', name: 'Pangue River', es: 'Río Pangue', span: 12, water: -7, vehicle: 'pickup', time: 'morning', rock: 'south',
      anchors: [[0, 0], [12, 0], [6, -3]],
      pillars: [{ x: 6, top: -3, w: 1.6 }],
      tip: 'A pillar in the river! Lean beams from its top up to the road.',
      hint: cat(road(0, 12, 2), [[6, -3, 4, 0, 'wood'], [6, -3, 8, 0, 'wood'], [6, -3, 6, 0, 'wood'],
            [6, -3, 3, -2, 'wood'], [3, -2, 0, 0, 'wood'], [3, -2, 2, 0, 'wood'], [3, -2, 4, 0, 'wood'],
            [6, -3, 9, -2, 'wood'], [9, -2, 12, 0, 'wood'], [9, -2, 10, 0, 'wood'], [9, -2, 8, 0, 'wood']]),
      preset: cat(road(0, 12, 2), [[6, -3, 4, 0, 'wood'], [6, -3, 8, 0, 'wood']]),
      budget: 86000, tight: 66000 },

    { id: 'l5', name: 'Laja Falls', es: 'Salto del Laja', span: 12, water: -7, vehicle: 'pickup', time: 'noon', rock: 'volcanic',
      anchors: [[0, 0], [12, 0], [0, -2], [12, -2]],
      tip: 'A heavier pickup. Mix strong steel where the forces are biggest.',
      hint: cat(road(0, 12, 2), warren(0, 12, 2, 2, 'wood', 'steel')),
      preset: road(0, 12, 2),
      budget: 104000, tight: 80000 },

    { id: 'l6', name: 'Cable Tower', es: 'Torre de Cables', span: 14, water: -7, vehicle: 'pickup', time: 'golden', rock: 'andes',
      anchors: [[0, 0], [14, 0], [7, 7]],
      tower: { x: 7, top: 7, w: 1.0 },
      tip: 'Cables only PULL. Hang the road from the tall tower — cable-stayed!',
      hint: cat(road(0, 6, 2), [[6, 0, 8, 0, 'road']], road(8, 14, 2),
            [[7, 7, 2, 0, 'cable'], [7, 7, 4, 0, 'cable'], [7, 7, 6, 0, 'cable'], [7, 7, 8, 0, 'cable'], [7, 7, 10, 0, 'cable'], [7, 7, 12, 0, 'cable']]),
      preset: cat(road(0, 6, 2), [[6, 0, 8, 0, 'road']], road(8, 14, 2), [[7, 7, 6, 0, 'cable'], [7, 7, 8, 0, 'cable']]),
      budget: 137000, tight: 105000 },

    { id: 'l7', name: 'Stone Arch', es: 'Arco de Piedra', span: 14, water: -8, vehicle: 'pickup', time: 'dusk', rock: 'andes',
      anchors: [[0, 0], [14, 0], [0, -4], [14, -4]],
      tip: 'An arch is squeezed all along its curve and pushes out on the cliffs.',
      hint: cat(road(0, 14, 2), [[0, -4, 2, -2, 'steel'], [2, -2, 4, -1, 'steel'], [4, -1, 7, -1, 'steel'], [7, -1, 10, -1, 'steel'], [10, -1, 12, -2, 'steel'], [12, -2, 14, -4, 'steel'],
            [2, -2, 2, 0, 'wood'], [4, -1, 4, 0, 'wood'], [10, -1, 10, 0, 'wood'], [12, -2, 12, 0, 'wood'],
            [4, -1, 6, 0, 'wood'], [7, -1, 6, 0, 'wood'], [7, -1, 8, 0, 'wood'], [10, -1, 8, 0, 'wood'], [2, -2, 4, 0, 'wood'], [12, -2, 10, 0, 'wood']]),
      preset: cat(road(0, 14, 2), [[0, -4, 2, -2, 'steel'], [2, -2, 4, -1, 'steel'], [2, -2, 2, 0, 'wood']]),
      budget: 130000, tight: 100000 },

    { id: 'l8', name: 'Boat Channel', es: 'Canal de Lanchas', span: 14, water: -7, vehicle: 'bus', time: 'morning', rock: 'south',
      anchors: [[0, 0], [14, 0]],
      clear: { x0: 0.5, x1: 13.5, y0: -7, y1: -0.6 },
      tip: 'Boats pass below — nothing may hang under this road. Build up high!',
      hint: cat(road(0, 14, 2), panelTruss(0, 14, 2, 3, 'pratt', 'steel', 'steel')),
      preset: road(0, 14, 2),
      budget: 240000, tight: 173000 },

    { id: 'l9', name: 'Biobío Viaduct', es: 'Viaducto del Biobío', span: 18, water: -7, vehicle: 'bus', time: 'noon', rock: 'south',
      anchors: [[0, 0], [18, 0], [9, -2]],
      pillars: [{ x: 9, top: -2, w: 1.8 }],
      tip: 'A heavy bus and a long gap. Let the pillar carry the middle.',
      hint: cat(road(0, 18, 2), [[9, -2, 8, 0, 'steel'], [9, -2, 10, 0, 'steel']], warren(0, 8, 2, 2, 'steel'), warren(10, 18, 2, 2, 'steel'), [[7, 2, 11, 2, 'steel'], [8, 0, 10, 0, 'road']]),
      preset: road(0, 18, 2),
      budget: 269000, tight: 135000 },

    { id: 'l10', name: 'Desert Canyon', es: 'Cañón de Tarapacá', span: 20, water: -8, vehicle: 'bus', time: 'noon', rock: 'desert',
      anchors: [[0, 0], [20, 0], [0, -3], [20, -3]],
      tip: 'The Atacama sun is hot — and the gap is wide. Deep trusses are stiffer.',
      hint: cat(road(0, 20, 2), panelTruss(0, 20, 2, 3, 'pratt', 'steel', 'steel'), [[0, -3, 2, 0, 'steel'], [0, -3, 4, 0, 'steel'], [20, -3, 18, 0, 'steel'], [20, -3, 16, 0, 'steel']]),
      preset: road(0, 20, 2),
      budget: 418000, tight: 312000 },

    { id: 'l11', name: 'Forest Road', es: 'Camino Forestal', span: 20, water: -8, vehicle: 'truck', time: 'golden', rock: 'south',
      anchors: [[0, 0], [20, 0], [7, -3], [13, -3]],
      pillars: [{ x: 7, top: -3, w: 1.6 }, { x: 13, top: -3, w: 1.6 }],
      tip: 'A loaded log truck! Two pillars help — use them well.',
      hint: cat(road(0, 20, 2), [[7, -3, 6, 0, 'steel'], [7, -3, 8, 0, 'steel'], [13, -3, 12, 0, 'steel'], [13, -3, 14, 0, 'steel'], [7, -3, 10, -3, 'steel'], [10, -3, 13, -3, 'steel'], [10, -3, 10, 0, 'steel'],
            [7, -3, 10, 0, 'steel'], [13, -3, 10, 0, 'steel']], warren(0, 6, 2, 2, 'steel'), warren(14, 20, 2, 2, 'steel')),
      preset: road(0, 20, 2),
      budget: 301000, tight: 168000 },

    { id: 'l12', name: 'Condor Canyon', es: 'Cañón del Cóndor', span: 24, water: -9, vehicle: 'truck', time: 'dusk', rock: 'andes',
      anchors: [[0, 0], [24, 0], [0, -4], [24, -4], [12, -4]],
      pillars: [{ x: 12, top: -4, w: 2.0 }],
      tip: 'The grand finale. Everything you learned: triangles, arches, steel.',
      hint: cat(road(0, 24, 2), panelTruss(0, 12, 2, 3, 'pratt', 'steel', 'steel'), panelTruss(12, 24, 2, 3, 'pratt', 'steel', 'steel'),
            [[12, -4, 12, 0, 'steel'], [12, -4, 10, 0, 'steel'], [12, -4, 14, 0, 'steel'], [0, -4, 2, 0, 'steel'], [24, -4, 22, 0, 'steel']]),
      preset: road(0, 24, 2),
      budget: 485000, tight: 352000 }
  ];

  // ---- lesson cards (factual) -----------------------------------------
  // art: key into LittleEngineerArt.lessonSvg
  var LESSONS = [
    { id: 'triangle', icon: '🔺', title: 'Why triangles are strong', es: 'Por qué el triángulo es firme', art: 'triangle', interactive: 'shear',
      body: [
        'Join four sticks with pins into a square and push one corner: it leans over into a squashed diamond. Its sides did not change length — only the angles did.',
        'Now join three sticks into a triangle. Three side lengths fit together in only ONE way, so the angles are locked. To change its shape, a stick must stretch, shrink or break.',
        'That is why bridges, cranes and roof frames are full of triangles. Adding one diagonal brace turns a wobbly square into two strong triangles.'
      ] },
    { id: 'forces', icon: '↔️', title: 'Pulled or squeezed?', es: 'Tracción y compresión', art: 'forces',
      body: [
        'Every piece of a bridge is either being PULLED (tension · tracción) or SQUEEZED (compression · compresión).',
        'In this app, blue means pulled and red means squeezed. Tap a joint during a test to see it.',
        'A rope or cable is great at being pulled but useless when pushed — it just goes floppy. A long thin stick is easy to pull but, when squeezed, it bends sideways and snaps. Engineers call that buckling. Short, thick pieces resist squeezing best.'
      ] },
    { id: 'truss', icon: '🔩', title: 'Truss bridges', es: 'Puentes de celosía', art: 'truss',
      body: [
        'A truss is a frame made of triangles. The top edge (top chord) is squeezed and the bottom edge (bottom chord) is pulled when a load sits in the middle.',
        'Warren truss — diagonals zig-zag in a row of triangles, taking turns being pulled and squeezed. Patented in Britain in 1848 by James Warren and Willoughby Monzani.',
        'Pratt truss — upright posts with diagonals that slope down toward the middle; under a load the diagonals are pulled and the posts squeezed. Patented in 1844 by Thomas and Caleb Pratt.',
        'Howe truss — the mirror idea: diagonals slope the other way and are squeezed, while the uprights are pulled. Patented by William Howe in 1840, when wooden diagonals with iron rods were common.'
      ] },
    { id: 'arch', icon: '🌈', title: 'Arch bridges', es: 'Puentes en arco', art: 'arch',
      body: [
        'An arch carries its load by being squeezed along its whole curve. That is why it can be built from stone, which is very strong when squeezed but weak when pulled.',
        'The arch also pushes OUTWARD at its feet. Strong ground or heavy blocks at each end — called abutments (estribos) — hold it in.',
        'Romans built stone arch bridges and aqueducts that still stand today, such as the Pont du Gard in France, built in the 1st century AD.'
      ] },
    { id: 'suspension', icon: '🌉', title: 'Suspension bridges', es: 'Puentes colgantes', art: 'suspension',
      body: [
        'Two huge main cables hang over tall towers and are anchored into the ground at each end. Thin vertical cables (hangers) hold up the road.',
        'The cables are pulled; the towers are squeezed. This design can cross the longest gaps of all.',
        'The Golden Gate Bridge in San Francisco opened in 1937. Its main span is 1,280 m long, and it held the record for the longest main span for many years.',
        'The Brooklyn Bridge in New York opened in 1883 over the East River. It was designed by John A. Roebling and finished by his son Washington Roebling, and it was one of the first big bridges to use steel-wire cables.'
      ] },
    { id: 'stayed', icon: '📐', title: 'Cable-stayed bridges', es: 'Puentes atirantados', art: 'stayed',
      body: [
        'In a cable-stayed bridge the cables run in straight lines from the tower directly to the road — no big hanging main cable.',
        'Each cable is pulled, and it pulls the road toward the tower, so the road itself is squeezed along its length. The tower is squeezed down into its foundation.',
        'The Millau Viaduct in France, opened in 2004, is a cable-stayed bridge. The top of its tallest mast is 343 m above the ground.'
      ] },
    { id: 'chile', icon: '🇨🇱', title: 'Bridges of Chile', es: 'Puentes de Chile', art: 'chile',
      body: [
        'Viaducto del Malleco (1890) — a steel railway viaduct in La Araucanía, about 102 m above the Malleco River. It was opened by President José Manuel Balmaceda and is a National Monument.',
        'Chacao Bridge (Puente Chacao) — a suspension bridge being built across the Chacao Channel to join Chiloé Island to the mainland. Its middle tower stands on a rock in the channel called Roca Remolino. When finished it will be about 2.7 km long, one of the longest suspension bridges in South America.',
        'The Forth Bridge in Scotland (1890) is a famous cantilever railway bridge — a design that reaches out from each tower like balanced arms.'
      ] }
  ];

  var REAL_BUILD = {
    title: 'Build it for real!', es: '¡Constrúyelo de verdad!',
    need: ['Dry spaghetti (a whole packet)', 'Mini marshmallows or small balls of modelling clay', 'Two equal stacks of books', 'A paper cup and a handful of coins', 'A ruler'],
    steps: [
      'Put the two stacks of books 20 cm apart. That is your gorge.',
      'Use marshmallows as joints and spaghetti as beams. Build a flat road of spaghetti first.',
      'Add triangles — above or below the road. Remember: squares wobble, triangles stay firm!',
      'Lay your bridge across the gap. Hang the paper cup from the middle with a loop of string or a bent paper clip.',
      'Add coins one at a time. Count how many it holds before it breaks. Watch which pieces bend (squeezed) and which snap apart (pulled)!',
      'Improve it and test again. Can you beat your record with the same amount of spaghetti?'
    ]
  };

  return {
    MATERIALS: MATERIALS, MATERIAL_ORDER: MATERIAL_ORDER, JOINT_COST: JOINT_COST,
    VEHICLES: VEHICLES, LEVELS: LEVELS, LESSONS: LESSONS, REAL_BUILD: REAL_BUILD,
    helpers: { road: road, warren: warren, panelTruss: panelTruss, cat: cat }
  };
})();
