/* ================================================================
   EUCLID'S WORKSHOP — level data, history cards and tool catalogue.
   Coordinates are drawing units, y pointing DOWN (like the screen).

   Each level has:
     givens  — points [label, x, y, labelAngleDeg?] and objects
     goal(P) — returns a list of alternatives; each alternative is a
               list of targets that must ALL exist (checked exactly,
               with a tiny tolerance, by the engine)
     script  — a model solution, used for hints, guided mode and the
               ideal move count. Steps:
                 ['circle', centre, through]
                 ['transfer', a, b, centre]   fixed-opening compass
                 ['line', a, b]  ['segment', a, b]
                 ['perpbis', a, b]  ['midpoint', a, b]
                 ['perp', [a, b], p]  ['parallel', [a, b], p]
                 ['anglebis', a, vertex, b]
                 ['name', label, x, y]  label the constructed point
                                        nearest to (x, y)
               Shortcut steps are expanded into compass/straightedge
               moves for a player who has not unlocked them yet.
   ================================================================ */

var EuclidData = (function() {
  'use strict';

  var R3 = Math.sqrt(3);
  var PHI = (1 + Math.sqrt(5)) / 2;

  // ---- goal target helpers ----------------------------------------
  function pt(p) { return { k: 'pt', x: p[0], y: p[1] }; }
  function seg(a, b) { return { k: 'seg', ax: a[0], ay: a[1], bx: b[0], by: b[1] }; }
  function lineDir(p, dx, dy) {
    var l = Math.hypot(dx, dy);
    return { k: 'line', x: p[0], y: p[1], dx: dx / l, dy: dy / l };
  }
  function circ(c, r) { return { k: 'circle', cx: c[0], cy: c[1], r: r }; }
  function polygon(vs) {
    var out = [];
    for (var i = 0; i < vs.length; i++) out.push(seg(vs[i], vs[(i + 1) % vs.length]));
    return out;
  }
  function polar(c, r, deg) {
    var a = deg * Math.PI / 180;
    return [c[0] + r * Math.cos(a), c[1] - r * Math.sin(a)];
  }

  var CHAPTERS = [
    { n: 1, name: 'Apprentice', es: 'Aprendiz',        note: 'Circles, lines and your first triangle.', ages: 6 },
    { n: 2, name: 'Journeyman', es: 'Oficial',         note: 'Right angles, bisectors and parallels.',  ages: 8 },
    { n: 3, name: 'Master Builder', es: 'Maestro constructor', note: 'Squares, polygons and special circles.', ages: 10 },
    { n: 4, name: 'Expert', es: 'Experto',             note: 'Equal parts, the octagon and the golden ratio.', ages: 12 }
  ];

  // Shortcut tools: unlocked by solving the level that teaches them.
  var SHORTCUTS = {
    perpbis:  { teach: 'perp-bisector', name: 'Perpendicular bisector', es: 'Mediatriz' },
    midpoint: { teach: 'midpoint',      name: 'Midpoint',               es: 'Punto medio' },
    perp:     { teach: 'drop-perp',     name: 'Perpendicular',          es: 'Perpendicular' },
    anglebis: { teach: 'angle-bisector', name: 'Angle bisector',        es: 'Bisectriz' },
    parallel: { teach: 'parallel',      name: 'Parallel',               es: 'Paralela' }
  };

  var LEVELS = [
    // ---------------- Chapter 1 ----------------
    { id: 'equilateral', ch: 1, name: 'Equilateral Triangle', es: 'Triángulo equilátero',
      ref: 'Elements, Book I, Proposition 1',
      task: 'Build a triangle on AB whose three sides are all equal.',
      givens: { points: [['A', -80, 40, 200], ['B', 80, 40, -20]],
                objs: [{ t: 'segment', a: 'A', b: 'B' }] },
      goal: function(P) {
        var up = [0, 40 - 80 * R3], dn = [0, 40 + 80 * R3];
        return [[seg(P.A, up), seg(P.B, up)], [seg(P.A, dn), seg(P.B, dn)]];
      },
      script: [['circle', 'A', 'B'], ['circle', 'B', 'A'], ['name', 'C', 0, -98],
               ['segment', 'A', 'C'], ['segment', 'B', 'C']],
      why: 'Both circles have radius AB. C lies on the circle around A, so AC = AB. C also lies on the circle around B, so BC = AB. All three sides equal AB, so they are equal to each other.' },

    { id: 'copy-segment', ch: 1, name: 'Copy a Segment', es: 'Copiar un segmento',
      ref: 'Elements, Book I, Propositions 2–3',
      task: 'Mark a point D on the ray from C so that CD is exactly as long as AB.',
      introduces: 'transfer',
      givens: { points: [['A', -150, -70, 160], ['B', -50, -110, 20], ['C', -80, 60, 220]],
                objs: [{ t: 'segment', a: 'A', b: 'B' }, { t: 'ray', a: 'C', dir: [1, 0] }] },
      goal: function(P) {
        var L = Math.hypot(P.B[0] - P.A[0], P.B[1] - P.A[1]);
        return [[pt([P.C[0] + L, P.C[1]])]];
      },
      script: [['transfer', 'A', 'B', 'C'], ['name', 'D', 28, 60]],
      why: 'The fixed compass keeps its opening. Every point of the new circle is exactly AB away from its centre C, so where the circle crosses the ray, CD = AB. Euclid proved in Propositions 2 and 3 that an ordinary compass can do the same job, so this tool is a fair shortcut.' },

    { id: 'perp-bisector', ch: 1, name: 'Perpendicular Bisector', es: 'Mediatriz',
      ref: 'Elements, Book I, Proposition 10',
      task: 'Draw the line that cuts AB in half at a right angle.',
      givens: { points: [['A', -90, 40, 200], ['B', 90, -20, -10]],
                objs: [{ t: 'segment', a: 'A', b: 'B' }] },
      goal: function(P) {
        var m = [(P.A[0] + P.B[0]) / 2, (P.A[1] + P.B[1]) / 2];
        return [[lineDir(m, -(P.B[1] - P.A[1]), P.B[0] - P.A[0])]];
      },
      script: [['circle', 'A', 'B'], ['circle', 'B', 'A'], ['name', 'P', -52, -146], ['name', 'Q', 52, 166],
               ['line', 'P', 'Q']],
      why: 'P and Q are each the same distance from A as from B (both circles have radius AB). Every point that is equally far from A and from B lies on one straight line — the line through P and Q. It crosses AB at its midpoint, at a right angle.' },

    { id: 'midpoint', ch: 1, name: 'Midpoint', es: 'Punto medio',
      ref: 'Elements, Book I, Proposition 10',
      task: 'Find the point M exactly halfway between A and B.',
      givens: { points: [['A', -120, 30, 200], ['B', 110, -20, -10]],
                objs: [{ t: 'segment', a: 'A', b: 'B' }] },
      goal: function(P) { return [[pt([(P.A[0] + P.B[0]) / 2, (P.A[1] + P.B[1]) / 2])]]; },
      script: [['perpbis', 'A', 'B'], ['name', 'M', -5, 5]],
      why: 'The perpendicular bisector is made of all the points equally far from A and B. The one point of it that also lies on segment AB must be halfway: AM = MB.' },

    // ---------------- Chapter 2 ----------------
    { id: 'perp-at-point', ch: 2, name: 'Perpendicular at a Point', es: 'Perpendicular por un punto',
      ref: 'Elements, Book I, Proposition 11',
      task: 'Draw the line through P that makes a right angle with the line.',
      givens: { points: [['Q', -70, 40, 110], ['P', 30, 40, 70]],
                objs: [{ t: 'line', a: 'Q', b: 'P' }] },
      goal: function(P) { return [[lineDir(P.P, 0, 1)]]; },
      script: [['circle', 'P', 'Q'], ['name', 'R', 130, 40], ['perpbis', 'Q', 'R']],
      why: 'The circle around P gives two points, Q and R, the same distance from P on either side. The perpendicular bisector of QR passes through P (because PQ = PR) and meets the line at a right angle.' },

    { id: 'drop-perp', ch: 2, name: 'Drop a Perpendicular', es: 'Perpendicular desde un punto',
      ref: 'Elements, Book I, Proposition 12',
      task: 'Draw the line through P that meets the line AB at a right angle.',
      givens: { points: [['A', -110, 70, 250], ['B', 90, 70, 290], ['P', 20, -70, 90]],
                objs: [{ t: 'line', a: 'A', b: 'B' }] },
      goal: function(P) { return [[lineDir(P.P, 0, 1)]]; },
      script: [['circle', 'P', 'A'], ['name', 'X', 150, 70], ['perpbis', 'A', 'X']],
      why: 'The circle around P crosses the line at A and X, so PA = PX. P is equally far from A and X, so P lies on the perpendicular bisector of AX — and that line is perpendicular to AB.' },

    { id: 'angle-bisector', ch: 2, name: 'Angle Bisector', es: 'Bisectriz de un ángulo',
      ref: 'Elements, Book I, Proposition 9',
      task: 'Cut the angle at V into two equal angles.',
      givens: { points: [['V', -130, 90, 210], ['A', 80, 90, -90], ['B', -34.94, -50.93, 150]],
                objs: [{ t: 'ray', a: 'V', b: 'A' }, { t: 'ray', a: 'V', b: 'B' }] },
      goal: function(P) {
        var a = Math.atan2(P.A[1] - P.V[1], P.A[0] - P.V[0]), b = Math.atan2(P.B[1] - P.V[1], P.B[0] - P.V[0]);
        var m = (a + b) / 2;
        return [[lineDir(P.V, Math.cos(m), Math.sin(m))]];
      },
      script: [['circle', 'V', 'B'], ['name', 'D', 40, 90], ['perpbis', 'B', 'D']],
      why: 'VB = VD because both are radii of the same circle. The perpendicular bisector of BD passes through V and splits triangle VBD into two matching halves, so the two angles at V are equal.' },

    { id: 'copy-angle', ch: 2, name: 'Copy an Angle', es: 'Copiar un ángulo',
      ref: 'Elements, Book I, Proposition 23',
      task: 'At W, build an angle above the ray equal to the angle at V.',
      givens: { points: [['V', -200, 70, 220], ['A', -90, 70, 270], ['B', -106.32, -34.04, 160], ['W', 10, 70, 230]],
                objs: [{ t: 'ray', a: 'V', b: 'A' }, { t: 'ray', a: 'V', b: 'B' }, { t: 'ray', a: 'W', dir: [1, 0] }] },
      goal: function(P) {
        var a = Math.atan2(P.B[1] - P.V[1], P.B[0] - P.V[0]);
        return [[lineDir(P.W, Math.cos(a), Math.sin(a))]];
      },
      script: [['circle', 'V', 'A'], ['name', 'E', -126, -12],
               ['transfer', 'V', 'A', 'W'], ['name', 'F', 120, 70],
               ['transfer', 'A', 'E', 'F'], ['name', 'G', 84, -12],
               ['line', 'W', 'G']],
      why: 'Triangles VAE and WFG have three matching sides: VA = WF and VE = WG (same compass opening) and AE = FG (copied with the fixed compass). Triangles with equal sides have equal angles, so the angle at W equals the angle at V.' },

    { id: 'parallel', ch: 2, name: 'Parallel Line', es: 'Recta paralela',
      ref: 'Elements, Book I, Proposition 31',
      task: 'Draw the line through P that never meets line AB.',
      givens: { points: [['A', -130, 80, 250], ['B', 130, 80, 290], ['P', -20, -50, 120]],
                objs: [{ t: 'line', a: 'A', b: 'B' }] },
      goal: function(P) { return [[lineDir(P.P, 1, 0)]]; },
      script: [['perp', ['A', 'B'], 'P'], ['name', 'F', -20, 80], ['perp', ['P', 'F'], 'P']],
      why: 'The first line makes a right angle with AB. The second makes a right angle with the first. Two lines that are both perpendicular to the same line point the same way, so they are parallel and never meet.' },

    // ---------------- Chapter 3 ----------------
    { id: 'square', ch: 3, name: 'Square on a Segment', es: 'Cuadrado sobre un segmento',
      ref: 'Elements, Book I, Proposition 46',
      task: 'Build a square with AB as one of its sides.',
      givens: { points: [['A', -70, 70, 220], ['B', 70, 70, -40]],
                objs: [{ t: 'segment', a: 'A', b: 'B' }] },
      goal: function(P) {
        return [polygon([P.A, P.B, [70, -70], [-70, -70]]).slice(1),
                polygon([P.A, P.B, [70, 210], [-70, 210]]).slice(1)];
      },
      script: [['perp', ['A', 'B'], 'A'], ['perp', ['A', 'B'], 'B'],
               ['circle', 'A', 'B'], ['name', 'D', -70, -70],
               ['circle', 'B', 'A'], ['name', 'C', 70, -70],
               ['segment', 'D', 'C']],
      why: 'The two perpendiculars give right angles at A and B. The circles make AD = AB and BC = AB. A four-sided figure with equal sides and right angles is a square.' },

    { id: 'hexagon', ch: 3, name: 'Hexagon in a Circle', es: 'Hexágono en un círculo',
      ref: 'Elements, Book IV, Proposition 15',
      task: 'Draw a regular hexagon inside the circle, with one corner at A.',
      givens: { points: [['O', 0, 0, 200], ['A', 120, 0, 0]],
                objs: [{ t: 'circle', c: 'O', p: 'A' }] },
      goal: function() {
        var vs = [];
        for (var i = 0; i < 6; i++) vs.push(polar([0, 0], 120, 60 * i));
        return [polygon(vs)];
      },
      script: [['circle', 'A', 'O'], ['name', 'B', 60, -104], ['name', 'F', 60, 104],
               ['circle', 'B', 'O'], ['name', 'C', -60, -104],
               ['circle', 'F', 'O'], ['name', 'E', -60, 104],
               ['circle', 'C', 'O'], ['name', 'D', -120, 0],
               ['segment', 'A', 'B'], ['segment', 'B', 'C'], ['segment', 'C', 'D'],
               ['segment', 'D', 'E'], ['segment', 'E', 'F'], ['segment', 'F', 'A']],
      why: 'Each small circle has the same radius as the big one, so triangles like OAB have three equal sides — they are equilateral. Six equilateral triangles fit exactly around O, so the six sides of the hexagon all equal the radius.' },

    { id: 'circle-centre', ch: 3, name: 'Find the Centre', es: 'Encontrar el centro',
      ref: 'Elements, Book III, Proposition 1',
      task: 'This circle lost its centre. Find it exactly.',
      givens: { points: [['A'].concat(polar([10, 0], 130, 200), [200]), ['B'].concat(polar([10, 0], 130, 320), [-30])],
                objs: [{ t: 'circle', c: [10, 0], r: 130 }] },
      goal: function() { return [[pt([10, 0])]]; },
      script: [['perpbis', 'A', 'B'], ['name', 'P', 33, -128], ['name', 'Q', -13, 128],
               ['perpbis', 'P', 'Q']],
      why: 'The centre is equally far from A and B, so it lies on the perpendicular bisector of AB. That line crosses the circle at P and Q, which makes PQ a diameter. The centre is the midpoint of the diameter.' },

    { id: 'circumcircle', ch: 3, name: 'Circle Through Three Points', es: 'Circunferencia por tres puntos',
      ref: 'Elements, Book IV, Proposition 5',
      task: 'Draw one circle that passes through A, B and C.',
      givens: { points: [['A', -110, 60, 200], ['B', 100, 80, -20], ['C', 20, -90, 90]], objs: [] },
      goal: function() { return [[circ([-0.57185, 23.50440], 115.35358)]]; },
      script: [['perpbis', 'A', 'B'], ['perpbis', 'B', 'C'], ['name', 'O', -0.57, 23.5], ['circle', 'O', 'A']],
      why: 'Points on the first bisector are equally far from A and B; points on the second are equally far from B and C. Where they cross, O is equally far from all three, so one circle around O touches A, B and C.' },

    { id: 'incircle', ch: 3, name: 'Inscribed Circle', es: 'Circunferencia inscrita',
      ref: 'Elements, Book IV, Proposition 4',
      task: 'Draw the largest circle that fits inside the triangle, touching all three sides.',
      givens: { points: [['A', -120, 80, 210], ['B', 130, 80, -30], ['C', -20, -110, 90]],
                objs: [{ t: 'segment', a: 'A', b: 'B' }, { t: 'segment', a: 'B', b: 'C' }, { t: 'segment', a: 'C', b: 'A' }] },
      goal: function() { return [[circ([-8.68263, 12.79413], 67.20587)]]; },
      script: [['anglebis', 'B', 'A', 'C'], ['anglebis', 'A', 'B', 'C'], ['name', 'I', -8.68, 12.79],
               ['perp', ['A', 'B'], 'I'], ['name', 'T', -8.68, 80], ['circle', 'I', 'T']],
      why: 'Every point on an angle bisector is equally far from the two sides of that angle. I lies on two bisectors, so it is equally far from all three sides. The perpendicular IT measures that distance, and the circle with radius IT touches every side.' },

    { id: 'tangent', ch: 3, name: 'Tangent at a Point', es: 'Tangente en un punto',
      ref: 'Elements, Book III, Proposition 16',
      task: 'Draw the line that just touches the circle at P.',
      givens: { points: [['O', 0, 0, 200], ['P', 98.30, -68.83, 40]],
                objs: [{ t: 'circle', c: 'O', p: 'P' }] },
      goal: function(P) { return [[lineDir(P.P, P.P[1], -P.P[0])]]; },
      script: [['line', 'O', 'P'], ['perp', ['O', 'P'], 'P']],
      why: 'Every point of the circle is the same distance from O. A line at right angles to the radius OP has every other point farther from O than P is, so it touches the circle at P only.' },

    // ---------------- Chapter 4 ----------------
    { id: 'thirds', ch: 4, name: 'Three Equal Parts', es: 'Dividir en tres partes',
      ref: 'Elements, Book VI, Proposition 9',
      task: 'Divide AB into three equal parts. Use the helper ray from A.',
      givens: { points: [['A', -120, 80, 220], ['B', 120, 80, -40], ['C', -70, -10, 160]],
                objs: [{ t: 'segment', a: 'A', b: 'B' }, { t: 'ray', a: 'A', b: 'C' }] },
      goal: function(P) {
        return [[pt([P.A[0] + (P.B[0] - P.A[0]) / 3, 80]), pt([P.A[0] + 2 * (P.B[0] - P.A[0]) / 3, 80])]];
      },
      script: [['circle', 'C', 'A'], ['name', 'D', -20, -100],
               ['circle', 'D', 'C'], ['name', 'E', 30, -190],
               ['segment', 'E', 'B'],
               ['parallel', ['E', 'B'], 'C'], ['parallel', ['E', 'B'], 'D']],
      why: 'AC, CD and DE are equal steps along the ray. Lines parallel to EB slice every line they cross in the same proportions, so the three equal steps on the ray become three equal parts of AB.' },

    { id: 'octagon', ch: 4, name: 'Regular Octagon', es: 'Octágono regular',
      ref: 'After Elements, Book IV',
      task: 'Draw a regular octagon inside the circle, with one corner at A.',
      givens: { points: [['O', 0, 0, 225], ['A', 130, 0, 0]],
                objs: [{ t: 'circle', c: 'O', p: 'A' }] },
      goal: function() {
        var vs = [];
        for (var i = 0; i < 8; i++) vs.push(polar([0, 0], 130, 45 * i));
        return [polygon(vs)];
      },
      script: [['line', 'O', 'A'], ['name', 'E', -130, 0],
               ['perpbis', 'A', 'E'], ['name', 'C', 0, -130], ['name', 'G', 0, 130],
               ['anglebis', 'A', 'O', 'C'], ['name', 'B', 91.9, -91.9], ['name', 'F', -91.9, 91.9],
               ['anglebis', 'C', 'O', 'E'], ['name', 'D', -91.9, -91.9], ['name', 'H', 91.9, 91.9],
               ['segment', 'A', 'B'], ['segment', 'B', 'C'], ['segment', 'C', 'D'], ['segment', 'D', 'E'],
               ['segment', 'E', 'F'], ['segment', 'F', 'G'], ['segment', 'G', 'H'], ['segment', 'H', 'A']],
      why: 'Two perpendicular diameters cut the circle into four right angles — the corners of a square. Bisecting each right angle doubles the number of equal arcs from four to eight, and equal arcs have equal chords, so all eight sides match.' },

    { id: 'golden', ch: 4, name: 'The Golden Ratio', es: 'La razón áurea',
      ref: 'Elements, Book VI, Definition 3 and Proposition 30',
      task: 'Find G on AB so that AB : AG is the same as AG : GB (the golden ratio).',
      givens: { points: [['A', -100, 80, 220], ['B', 100, 80, -40]],
                objs: [{ t: 'segment', a: 'A', b: 'B' }] },
      goal: function(P) { return [[pt([P.A[0] + (P.B[0] - P.A[0]) / PHI, 80])]]; },
      script: [['midpoint', 'A', 'B'], ['name', 'M', 0, 80],
               ['perp', ['A', 'B'], 'B'],
               ['circle', 'B', 'M'], ['name', 'C', 100, -20],
               ['segment', 'A', 'C'],
               ['circle', 'C', 'B'], ['name', 'D', 10.56, 24.72],
               ['circle', 'A', 'D'], ['name', 'G', 23.6, 80]],
      why: 'With AB = 2, BC = 1 and Pythagoras gives AC = √5. Then AD = √5 − 1, and AG = AD. That makes AB : AG = 2 : (√5 − 1) ≈ 1.618 — the golden ratio φ, which Euclid called cutting a line in "extreme and mean ratio".' }
  ];

  // ---- history cards (factual) ---------------------------------------
  var HISTORY = [
    { id: 'euclid', icon: '📜', title: 'Euclid of Alexandria', es: 'Euclides de Alejandría', when: 'c. 300 BC',
      text: 'Euclid was a Greek mathematician who taught in Alexandria, Egypt. Very little is known about his life, but his book, the Elements, became one of the most copied and printed books in history.',
      more: 'The Elements has 13 books. It starts with definitions, five postulates and a few "common notions", then proves each new fact from the ones before it. Schools used it to teach geometry for more than 2,000 years.' },
    { id: 'tools', icon: '📐', title: 'Only a compass and a straightedge', es: 'Solo compás y regla', when: 'Ancient Greece',
      text: 'Euclid\'s first postulates allow just three things: draw a straight line between two points, extend a line, and draw a circle with any centre and radius. Everything else must be built from those.',
      more: 'The straightedge has no markings, so it cannot measure. Euclid\'s compass may close when lifted, yet Proposition 2 shows it can still copy a length. Working this way, every construction is exact and can be checked step by step.' },
    { id: 'gauss', icon: '⭐', title: 'Gauss and the 17-sided polygon', es: 'Gauss y el polígono de 17 lados', when: '1796',
      text: 'At 18, Carl Friedrich Gauss discovered how to construct a regular 17-sided polygon with compass and straightedge. It was the first new regular polygon built this way since the ancient Greeks.',
      more: 'He was so pleased that it became the first entry in his mathematical diary, and the discovery helped him decide to study mathematics. He later described exactly which regular polygons can be constructed. A monument to Gauss in Braunschweig, Germany, has a 17-pointed star on it.' },
    { id: 'impossible', icon: '🔒', title: 'Three famous impossible problems', es: 'Tres problemas imposibles', when: '1837 · 1882',
      text: 'The Greeks tried to trisect any angle, double a cube and square a circle using only these tools. For two thousand years nobody managed it.',
      more: 'In 1837 Pierre Wantzel proved that trisecting every angle and doubling the cube are impossible with compass and straightedge. In 1882 Ferdinand von Lindemann proved that π is transcendental, which shows that squaring the circle is impossible too. Dividing a segment into three parts, however, is easy — you will do it in Chapter 4!' }
  ];

  // ---- skill badges ---------------------------------------------------
  var BADGES = [
    { id: 'first',  icon: '🔺', name: 'First Proposition', es: 'Primera proposición', need: ['equilateral'] },
    { id: 'appr',   icon: '🧭', name: 'Compass Apprentice', es: 'Aprendiz del compás', needCh: 1 },
    { id: 'right',  icon: '📐', name: 'Right-Angle Expert', es: 'Experto en ángulos rectos', need: ['perp-at-point', 'drop-perp', 'parallel'] },
    { id: 'poly',   icon: '⬡', name: 'Polygon Builder', es: 'Constructor de polígonos', need: ['square', 'hexagon', 'octagon'] },
    { id: 'circle', icon: '◯', name: 'Circle Master', es: 'Maestro del círculo', need: ['circle-centre', 'circumcircle', 'incircle', 'tangent'] },
    { id: 'golden', icon: '🐚', name: 'Golden Section', es: 'Sección áurea', need: ['golden'] },
    { id: 'all',    icon: '🏛️', name: 'Geometer of Alexandria', es: 'Geómetra de Alejandría', needAll: true }
  ];

  return { LEVELS: LEVELS, CHAPTERS: CHAPTERS, SHORTCUTS: SHORTCUTS, HISTORY: HISTORY, BADGES: BADGES };
})();
