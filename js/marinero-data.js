/* ================================================================
   MARINERO — content (js/marinero-data.js)
   Knots (geometry + steps + uses), compass points, IALA buoys,
   International Code of Signals flags, chart places.
   Exposes one global: MarineroData.
   ================================================================ */

var MarineroData = (function() {
  'use strict';

  /* ---------------- KNOTS ----------------
     Geometry is in a 1000 × 720 design space.
     ropes[].pts  control points [x, y, zHint]  (zHint: +1 in front of a
                  post / over a cleat, −1 behind / under it)
     ou           over/under, one letter per crossing in the order the
                  working end reaches it.
     travel       which rope moves (the others are already laid)
     steps[].u    how far along the travelling rope (control-point index)
  */
  var KNOTS = [
    {
      id: 'fig8', en: 'Figure-eight', es: 'Nudo de ocho', tier: 'all',
      scene: 'deck', W: 40,
      ropes: [{ color: 'manila', start: 'none', end: 'whip', pts: [
        [430, -90], [430, 60], [430, 170], [430, 300], [432, 420], [462, 520], [540, 560], [622, 512],
        [640, 410], [612, 332], [520, 300], [340, 300], [276, 250], [290, 170], [360, 150],
        [520, 168], [566, 236], [540, 380], [522, 500], [508, 620], [500, 690]
      ] }],
      ou: 'OUOU', travel: 0, u0: 2.2,
      steps: [
        { u: 11.2, en: 'Make a loop: bring the end around and OVER the standing part.', es: 'Haz una gaza: pasa el chicote POR ENCIMA del firme.' },
        { u: 14.8, en: 'Take the end around BEHIND the standing part.', es: 'Lleva el chicote POR DETRÁS del firme.' },
        { u: 20, en: 'Push the end down THROUGH the first loop. You made an 8!', es: 'Pasa el chicote POR DENTRO de la gaza. ¡Ya tienes un 8!' }
      ]
    },
    {
      id: 'reef', en: 'Reef knot', es: 'Nudo llano (rizo)', tier: 'all',
      scene: 'deck', W: 40,
      ropes: [
        { color: 'manila', start: 'none', end: 'whip', pts: [
          [-90, 300], [150, 305], [300, 316], [400, 322], [500, 292], [600, 262], [690, 290], [722, 350],
          [690, 410], [600, 438], [500, 408], [400, 378], [300, 384], [200, 394]
        ] },
        { color: 'red', start: 'none', end: 'whip', pts: [
          [1090, 325], [850, 322], [700, 322], [600, 320], [500, 292], [400, 262], [320, 280], [285, 350],
          [320, 420], [400, 438], [500, 408], [600, 380], [700, 378], [810, 372]
        ] }
      ],
      ou: 'UUOOOU', travel: 1, u0: 1.2,
      steps: [
        { u: 3.6, en: 'Bring the red end in UNDER the tan bend.', es: 'Mete el chicote rojo POR DEBAJO del seno café.' },
        { u: 9.4, en: 'Around the outside and back OVER both tan parts.', es: 'Rodea y vuelve POR ENCIMA de los dos cabos cafés.' },
        { u: 13, en: 'Out beside itself, UNDER the tan bend. Flat and square!', es: 'Sale junto a sí mismo, POR DEBAJO del seno. ¡Plano y cuadrado!' }
      ]
    },
    {
      id: 'bowline', en: 'Bowline', es: 'As de guía', tier: 'all',
      scene: 'deck', W: 40,
      ropes: [{ color: 'navy', start: 'none', end: 'whip', pts: [
        [500, -90], [497, 60], [494, 128], [490, 212], [480, 300], [440, 355], [360, 385], [280, 345],
        [270, 265], [320, 205], [400, 215], [480, 300], [530, 360], [600, 450], [610, 570], [530, 665],
        [420, 680], [320, 640], [285, 550], [305, 470], [330, 420], [335, 300], [350, 180], [390, 140],
        [492, 128], [565, 135], [575, 185], [488, 212], [430, 250], [398, 300], [400, 380], [405, 460], [410, 540]
      ] }],
      ou: 'OUOUOOU', travel: 0, u0: 2.2,
      steps: [
        { u: 11.3, en: 'Make a small loop — the rabbit hole. The working side lies ON TOP.', es: 'Haz una gaza chica: la madriguera. El lado del chicote queda ENCIMA.' },
        { u: 20.2, en: 'Leave a big loop below. That is the loop you keep.', es: 'Deja una gaza grande abajo. Esa es la que queda.' },
        { u: 22.6, en: 'The rabbit comes UP out of the hole…', es: 'El conejo SALE de la madriguera…' },
        { u: 26.6, en: '…runs around BEHIND the tree (the standing part)…', es: '…da la vuelta POR DETRÁS del árbol (el firme)…' },
        { u: 32, en: '…and goes back DOWN the hole.', es: '…y vuelve a ENTRAR en la madriguera.' }
      ]
    },
    {
      id: 'sheet', en: 'Sheet bend', es: 'Vuelta de escota', tier: 'all',
      scene: 'deck', W: 40,
      ropes: [
        { color: 'navy', start: 'none', end: 'whip', pts: [
          [-90, 450], [150, 445], [400, 440], [560, 432], [650, 400], [682, 335], [650, 270], [560, 242],
          [420, 240], [300, 246], [215, 252]
        ] },
        { color: 'red', start: 'none', end: 'whip', pts: [
          [1090, 372], [860, 372], [720, 372], [600, 370], [540, 345], [490, 280], [455, 210], [420, 172],
          [360, 182], [330, 245], [324, 350], [330, 445], [352, 505], [420, 512], [455, 445], [480, 380],
          [530, 330], [598, 305]
        ] }
      ],
      ou: 'UOUUOU', travel: 1, u0: 1.2,
      steps: [
        { u: 4.6, en: 'Make a bend in the thick rope. Bring the thin end UP through it.', es: 'Haz un seno en el cabo grueso. Pasa el chicote delgado HACIA ARRIBA por dentro.' },
        { u: 14.6, en: 'Go around BEHIND both parts of the bend.', es: 'Rodea POR DETRÁS los dos cabos del seno.' },
        { u: 17, en: 'Tuck the end UNDER itself — not under the bend.', es: 'Mete el chicote POR DEBAJO de sí mismo, no del seno.' }
      ]
    },
    {
      id: 'clove', en: 'Clove hitch', es: 'Ballestrinque', tier: 'all',
      scene: 'post', W: 36, view: [140, 70, 720], post: { x: 500, r: 62, top: 70 },
      ropes: [{ color: 'white', start: 'none', end: 'whip', pts: [
        [-90, 268, 1], [200, 278, 1], [380, 290, 1], [440, 302, 1], [500, 336, 1], [560, 370, 1], [581, 380, 0.3],
        [560, 388, -1], [500, 392, -1], [440, 396, -1], [419, 400, 0.3], [440, 396, 1], [500, 352, 1], [560, 312, 1],
        [600, 298, 1], [700, 290, 1], [790, 288, 1]
      ] }],
      ou: 'O', travel: 0, u0: 1.5,
      steps: [
        { u: 6.6, en: 'Take the rope across the front and around the post.', es: 'Pasa el cabo por delante y alrededor del poste.' },
        { u: 10.5, en: 'Around the back again…', es: 'Otra vuelta por detrás…' },
        { u: 16, en: '…and cross OVER the first turn. An X on the front!', es: '…y cruza POR ENCIMA de la primera vuelta. ¡Una X por delante!' }
      ]
    },
    {
      id: 'roundturn', en: 'Round turn & two half hitches', es: 'Vuelta redonda y dos medios cotes', tier: 'all',
      scene: 'post', W: 36, bump: 0.01, view: [140, 70, 720], post: { x: 500, r: 62, top: 70 },
      ropes: [{ color: 'manila', start: 'none', end: 'whip', pts: [
        [-90, 250, 1], [200, 250, 1], [380, 252, 1], [440, 258, 1], [500, 270, 1], [560, 284, 1], [581, 292, 0.3],
        [560, 300, -1], [500, 306, -1], [440, 312, -1], [419, 318, 0.3], [440, 326, 1], [500, 338, 1], [560, 352, 1],
        [581, 360, 0.3], [560, 368, -1], [500, 374, -1], [440, 380, -1], [419, 386, 0.3], [385, 390, 0.5], [345, 376, 1.5],
        [312, 330, 2], [298, 250, 2], [300, 214, 2], [322, 202, 0.6], [344, 214, -1], [350, 250, -1], [352, 288, -1],
        [338, 312, 0.3], [310, 334, 0.3], [262, 340, 1.5],
        [214, 320, 2], [196, 250, 2], [198, 214, 2], [220, 202, 0.6], [242, 214, -1], [248, 250, -1], [250, 288, -1],
        [236, 312, 0.3], [208, 336, 0.3], [150, 346, 0.4], [95, 350, 0.4]
      ] }],
      ou: 'OUUOUU', travel: 0, u0: 1.5,
      steps: [
        { u: 10.5, en: 'Take one turn around the post…', es: 'Da una vuelta al poste…' },
        { u: 18.5, en: '…and a second turn: that is the ROUND TURN. It takes the strain.', es: '…y una segunda: esa es la VUELTA REDONDA. Aguanta la fuerza.' },
        { u: 26.3, en: 'Half hitch #1: over and around the standing part.', es: 'Medio cote 1: por encima y alrededor del firme.' },
        { u: 33, en: 'Half hitch #2: the same way again, and pull snug.', es: 'Medio cote 2: igual otra vez, y ajusta.' }
      ]
    },
    {
      id: 'rolling', en: 'Rolling hitch', es: 'Ballestrinque con vuelta extra', tier: 'older',
      scene: 'post', W: 36, view: [140, 70, 720], post: { x: 500, r: 62, top: 70 },
      ropes: [{ color: 'red', start: 'none', end: 'whip', pts: [
        [-90, 600, 1], [150, 500, 1], [330, 380, 1], [400, 342, 1], [440, 330, 1], [500, 352, 1], [560, 384, 1],
        [581, 396, 0.3], [560, 402, -1], [500, 396, -1], [440, 388, -1], [419, 384, 0.3], [440, 390, 1], [500, 414, 1],
        [560, 446, 1], [581, 458, 0.3], [560, 464, -1], [500, 462, -1], [440, 460, -1], [419, 458, 0.3], [440, 452, 1],
        [500, 400, 1], [560, 336, 1], [585, 322, 1], [680, 312, 1], [790, 310, 1]
      ] }],
      ou: 'OOO', travel: 0, u0: 1.5,
      steps: [
        { u: 11.5, en: 'Take a turn around the post, on the side the pull comes from.', es: 'Da una vuelta al poste, por el lado de donde tiran.' },
        { u: 19.5, en: 'A second turn right beside it — these two grip.', es: 'Otra vuelta al lado — estas dos agarran.' },
        { u: 25, en: 'Cross OVER both turns and finish with a hitch on the other side.', es: 'Cruza POR ENCIMA de las dos y termina con un cote al otro lado.' }
      ]
    },
    {
      id: 'cleat', en: 'Cleat hitch', es: 'Vuelta de cornamusa', tier: 'all',
      scene: 'cleat', W: 30, view: [170, 110, 700], cleat: { x: 520, y: 330, len: 480, wid: 88 },
      ropes: [{ color: 'white', start: 'none', end: 'whip', pts: [        [-90, 690, 0], [150, 590, 0], [380, 488, 0], [560, 446, 0], [622, 424, 0], [640, 330, -1], [622, 236, 0],
        [540, 222, 0], [460, 226, 0], [418, 246, 0], [400, 330, -1], [415, 416, 0], [470, 386, 0.6], [520, 330, 1],
        [600, 268, 0.6], [680, 246, 0], [716, 330, -1], [690, 420, 0], [600, 388, 0.6], [520, 330, 1], [440, 270, 0.6],
        [360, 244, 0], [324, 330, -1], [346, 420, 0], [395, 395, 0.5], [445, 350, 1], [505, 298, 1], [546, 264, 0.6]
      ] }],
      ou: 'OOOOOU', travel: 0, u0: 1.6,
      steps: [
        { u: 10.5, en: 'Lead the line to the FAR horn and take a full turn around the base.', es: 'Lleva el cabo al cuerno MÁS LEJANO y da una vuelta completa a la base.' },
        { u: 17.5, en: 'Cross OVER the top and around the other horn…', es: 'Cruza POR ENCIMA y rodea el otro cuerno…' },
        { u: 23.5, en: '…and back over the top: a figure eight.', es: '…y vuelve por encima: un ocho.' },
        { u: 27, en: 'Lock it: the end goes UNDER the last turn.', es: 'Asegura: el chicote pasa POR DEBAJO de la última vuelta.' }
      ]
    }
  ];

  /* What each knot is for, common mistakes and a quick check question. */
  var KNOT_INFO = {
    fig8: {
      use: 'A stopper knot. Tie it in the end of a sheet or halyard so the rope cannot run out through a block or fairlead.',
      useEs: 'Nudo de tope: en el chicote, para que el cabo no se escape por un motón o una guía.',
      mistakes: ['Tying a plain overhand knot instead — it is smaller and jams tight.',
        'Leaving the tail too short. Leave about a thumb’s length.',
        'Not dressing it: pull it snug so the 8 shape is neat.'],
      q: 'What is the figure-eight knot for on a boat?',
      opts: ['Stopping a rope from running out through a block', 'Tying the boat to a post', 'Joining two ropes together', 'Making a loop to throw'] },
    reef: {
      use: 'Ties two ends of the same rope together — sailors use it to tie in a reef (to bundle part of a sail). Not for joining two ropes that will take a big pull.',
      useEs: 'Une dos chicotes del mismo cabo; se usa para tomar rizos en las velas.',
      rhyme: 'Right over left and under, then left over right and under.',
      mistakes: ['The granny knot: crossing the same way twice. The parts come out on opposite sides and it slips or jams.',
        'Using it to join two different ropes under strain — use a sheet bend for that.'],
      q: 'How can you tell a reef knot from a granny knot?',
      opts: ['Each rope’s two parts lie side by side, on the same side of the other loop', 'A reef knot has three loops', 'Both ends point upwards', 'A reef knot uses only one end'] },
    bowline: {
      use: 'Makes a fixed loop that will not slip or tighten — for a mooring line over a bollard, or to tie a halyard to a sail.',
      useEs: 'Forma una gaza fija que no se corre; por ejemplo, para afirmar la driza al puño de la vela.',
      mistakes: ['Making the small loop with the working side underneath — then the knot just pulls out.',
        'The rabbit going around the tree the wrong way: the knot falls apart.',
        'Leaving too short a tail. Leave a good hand’s width.'],
      q: 'What does a bowline give you?',
      opts: ['A fixed loop that does not slip', 'A way to join two ropes', 'A stopper at the end of a rope', 'A hitch that grips along a pole'] },
    sheet: {
      use: 'Joins two ropes, even of different thickness. Make the bend (U) in the thicker rope.',
      useEs: 'Une dos cabos, incluso de distinto grosor (el seno se hace en el más grueso).',
      mistakes: ['Tucking the end under the bend instead of under itself — it slips.',
        'Making the bend in the thinner rope. Use the thicker one.',
        'Both short ends should finish on the same side of the knot.'],
      q: 'When do you use a sheet bend?',
      opts: ['To join two ropes of different thickness', 'To stop a rope running through a block', 'To make a fixed loop', 'To grip a pole lengthways'] },
    clove: {
      use: 'A quick hitch around a post or rail — for example to hang a fender, or to start a lashing.',
      useEs: 'Sujeta un cabo a un poste o barandilla; sirve para colgar una defensa o empezar un amarre.',
      mistakes: ['It can work loose if the pull keeps changing direction — add a half hitch for safety.',
        'Taking the second turn without crossing over the first: then it is just two turns and it slides off.'],
      q: 'What does a clove hitch look like from the front?',
      opts: ['An X crossing over the post', 'A figure 8', 'A fixed loop', 'Two ropes lying side by side'] },
    roundturn: {
      use: 'Ties a mooring line to a ring, post or rail. The round turn takes the strain and the two half hitches lock it. You can untie it even while it is pulling.',
      useEs: 'Amarra un cabo a una argolla, bita o poste. La vuelta redonda aguanta y los dos medios cotes aseguran.',
      mistakes: ['Only one turn: a round turn goes all the way around twice.',
        'Making the two half hitches in opposite directions. Make both the same way.'],
      q: 'Which part takes most of the strain?',
      opts: ['The round turn around the post', 'The two half hitches', 'The tail end', 'Nothing, it is decoration'] },
    rolling: {
      use: 'Grips a pole or another rope and holds against a pull ALONG it — for example to take the strain off a jammed sheet.',
      useEs: 'Agarra un palo u otro cabo y aguanta un tirón A LO LARGO de él.',
      mistakes: ['Putting the two gripping turns on the wrong side — they go on the side the pull comes from.',
        'Leaving it loose: it only grips once it is pulled tight.'],
      q: 'What is special about the rolling hitch?',
      opts: ['It holds against a pull along the pole or rope', 'It makes a fixed loop', 'It joins two ropes', 'It is a stopper knot'] },
    cleat: {
      use: 'Makes a dock line fast to a horn cleat — quick to tie and quick to let go.',
      useEs: 'Hace firme un cabo en una cornamusa: rápido de hacer y de largar.',
      mistakes: ['Starting on the near horn — lead to the far horn first.',
        'Piling on extra turns and hitches. One figure eight and one locking hitch is enough.',
        'The locking hitch must lie neatly beside the turn under it.'],
      q: 'Where does the line go first on a cleat?',
      opts: ['Around the far horn', 'Around the near horn', 'Straight across the middle', 'Through a hole in the deck'] }
  };

  /* ---------------- COMPASS ---------------- */
  var POINT_ES = {
    N: 'Norte', NNE: 'Nornoreste', NE: 'Noreste', ENE: 'Estenoreste', E: 'Este', ESE: 'Estesureste',
    SE: 'Sureste', SSE: 'Sursureste', S: 'Sur', SSW: 'Sursuroeste', SW: 'Suroeste', WSW: 'Oestesuroeste',
    W: 'Oeste', WNW: 'Oestenoroeste', NW: 'Noroeste', NNW: 'Nornoroeste'
  };
  var POINT_EN = {
    N: 'North', NNE: 'North-northeast', NE: 'Northeast', ENE: 'East-northeast', E: 'East', ESE: 'East-southeast',
    SE: 'Southeast', SSE: 'South-southeast', S: 'South', SSW: 'South-southwest', SW: 'Southwest', WSW: 'West-southwest',
    W: 'West', WNW: 'West-northwest', NW: 'Northwest', NNW: 'North-northwest'
  };
  // The 32 points of the mariner's compass, every 11.25°.
  var POINTS32 = ['N', 'N by E', 'NNE', 'NE by N', 'NE', 'NE by E', 'ENE', 'E by N', 'E', 'E by S', 'ESE', 'SE by E',
    'SE', 'SE by S', 'SSE', 'S by E', 'S', 'S by W', 'SSW', 'SW by S', 'SW', 'SW by W', 'WSW', 'W by S',
    'W', 'W by N', 'WNW', 'NW by W', 'NW', 'NW by N', 'NNW', 'N by W'];

  /* ---------------- BUOYS (IALA Region B — Chile) ---------------- */
  var BUOYS = [
    { id: 'stbd', en: 'Starboard-hand mark', es: 'Marca lateral de estribor', shape: 'Red · cone shape · red cone on top',
      pass: 'Entering port: keep it on your STARBOARD side (right). “Red to starboard coming in.”',
      light: 'Red light (if lit).', tier: 1 },
    { id: 'port', en: 'Port-hand mark', es: 'Marca lateral de babor', shape: 'Green · can (cylinder) shape · green can on top',
      pass: 'Entering port: keep it on your PORT side (left).',
      light: 'Green light (if lit).', tier: 1 },
    { id: 'north', en: 'North cardinal', es: 'Cardinal norte', shape: 'Black over yellow · both cones point UP',
      pass: 'The safe water is to the NORTH of it — pass on its north side.',
      light: 'White, quick flashes without stopping.', tier: 3 },
    { id: 'east', en: 'East cardinal', es: 'Cardinal este', shape: 'Black-yellow-black · cones base to base',
      pass: 'Pass on its EAST side.',
      light: 'White, 3 quick flashes — like 3 o’clock.', tier: 3 },
    { id: 'south', en: 'South cardinal', es: 'Cardinal sur', shape: 'Yellow over black · both cones point DOWN',
      pass: 'Pass on its SOUTH side.',
      light: 'White, 6 quick flashes and a long one — like 6 o’clock.', tier: 3 },
    { id: 'west', en: 'West cardinal', es: 'Cardinal oeste', shape: 'Yellow-black-yellow · cones point to point',
      pass: 'Pass on its WEST side.',
      light: 'White, 9 quick flashes — like 9 o’clock.', tier: 3 },
    { id: 'danger', en: 'Isolated danger', es: 'Peligro aislado', shape: 'Black with a red band · two black balls on top',
      pass: 'A rock or wreck RIGHT HERE, with safe water all around it. Keep well clear.',
      light: 'White, flashes in groups of 2.', tier: 2 },
    { id: 'safe', en: 'Safe water', es: 'Aguas seguras', shape: 'Red and white stripes (up and down) · one red ball on top',
      pass: 'Safe water all around — it often marks the way in to a channel (a landfall buoy, “boya de recalada”).',
      light: 'White: a long flash every 10 seconds (or other slow rhythms).', tier: 2 },
    { id: 'special', en: 'Special mark', es: 'Marca especial', shape: 'Yellow · a yellow X on top',
      pass: 'Marks a special area or thing — for example a cable, a pipeline or a racing area. Check the chart.',
      light: 'Yellow light.', tier: 2 }
  ];

  /* ---------------- SIGNAL FLAGS (International Code of Signals) ----------------
     Single-flag meanings as given in the International Code of Signals.
     R has no single-flag meaning in the current code. */
  var FLAGS = [
    ['A', 'Alfa', 'I have a diver down; keep well clear at slow speed.'],
    ['B', 'Bravo', 'I am taking in, unloading or carrying dangerous goods.'],
    ['C', 'Charlie', 'Yes (affirmative).'],
    ['D', 'Delta', 'Keep clear of me; I am manoeuvring with difficulty.'],
    ['E', 'Echo', 'I am altering my course to starboard.'],
    ['F', 'Foxtrot', 'I am disabled; communicate with me.'],
    ['G', 'Golf', 'I require a pilot.'],
    ['H', 'Hotel', 'I have a pilot on board.'],
    ['I', 'India', 'I am altering my course to port.'],
    ['J', 'Juliett', 'I am on fire and have dangerous cargo on board; keep well clear of me.'],
    ['K', 'Kilo', 'I wish to communicate with you.'],
    ['L', 'Lima', 'You should stop your vessel instantly.'],
    ['M', 'Mike', 'My vessel is stopped and making no way through the water.'],
    ['N', 'November', 'No (negative).'],
    ['O', 'Oscar', 'Man overboard!'],
    ['P', 'Papa', 'In harbour: everyone report on board — the vessel is about to sail.'],
    ['Q', 'Quebec', 'My vessel is healthy and I request free pratique (permission to come ashore).'],
    ['R', 'Romeo', ''],
    ['S', 'Sierra', 'I am operating astern propulsion (going backwards).'],
    ['T', 'Tango', 'Keep clear of me; I am engaged in pair trawling.'],
    ['U', 'Uniform', 'You are running into danger.'],
    ['V', 'Victor', 'I require assistance.'],
    ['W', 'Whiskey', 'I require medical assistance.'],
    ['X', 'X-ray', 'Stop carrying out your intentions and watch for my signals.'],
    ['Y', 'Yankee', 'I am dragging my anchor.'],
    ['Z', 'Zulu', 'I require a tug.']
  ].map(function(f) { return { L: f[0], name: f[1], meaning: f[2] }; });

  /* ---------------- CHART (fictional practice bay) ----------------
     Coordinates in nautical miles from the chart's top-left corner:
     x east, y south. 1' of latitude = 1 NM. */
  var CHART = {
    wNM: 16, hNM: 12,
    latDeg: 36, lat0: 48, latMid: 36.9, lonDeg: 73, lon0: 4,
    titleText: 'BAHÍA DEL CÓNDOR', subText: 'Practice chart · Carta de práctica (bahía ficticia)',
    subText2: 'Soundings in metres · Not for navigation', title: [0.5, 10.6],
    rose: [3.6, 3.4, 2.2],
    land: [[16, -0.5], [11.2, -0.5], [10.4, 0.7], [9.4, 1.3], [9.7, 2.3], [11.0, 3.0], [12.6, 3.7], [13.5, 4.9],
      [13.3, 6.1], [12.6, 6.9], [12.1, 7.9], [11.4, 9.1], [10.1, 10.1], [8.7, 11.0], [8.0, 12.5], [16, 12.5]],
    islands: [[[5.4, 6.1], [6.2, 5.8], [6.6, 6.3], [6.3, 7.0], [5.6, 7.1], [5.2, 6.6]]],
    rocks: [[7.4, 9.1], [10.4, 1.9]],
    places: [
      { id: 'muelle', name: 'Muelle Caleta Cóndor', short: 'the pier', x: 12.45, y: 6.7, sym: 'pier', lx: -0.5, ly: 0.45 },
      { id: 'faro', name: 'Faro Punta Piedra', short: 'the lighthouse', x: 9.45, y: 1.55, sym: 'light', lx: -0.45, ly: -0.45 },
      { id: 'isla', name: 'Isla Pájaros', short: 'Isla Pájaros', x: 5.9, y: 6.45, sym: 'dot', lx: 0.9, ly: -0.95 },
      { id: 'roja', name: 'Boya roja', short: 'the red buoy', x: 10.9, y: 5.0, sym: 'buoyR', lx: 0.45 },
      { id: 'verde', name: 'Boya verde', short: 'the green buoy', x: 11.6, y: 7.6, sym: 'buoyG', lx: -0.45, ly: 0.4 },
      { id: 'fondeo', name: 'Fondeadero', short: 'the anchorage', x: 9.2, y: 7.6, sym: 'anchor', lx: -0.45, ly: 0.5 },
      { id: 'boca', name: 'Boya de recalada', short: 'the safe-water buoy', x: 2.6, y: 7.8, sym: 'buoyS', lx: 0.45, ly: 0.35 },
      { id: 'lobera', name: 'Roca Lobera', short: 'Roca Lobera', x: 7.4, y: 9.1, sym: 'buoyD', lx: 0.5, ly: 0.2 }
    ]
  };

  return { KNOTS: KNOTS, KNOT_INFO: KNOT_INFO, POINT_ES: POINT_ES, POINT_EN: POINT_EN, POINTS32: POINTS32, BUOYS: BUOYS, FLAGS: FLAGS, CHART: CHART };
})();
