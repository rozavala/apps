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
        [-90, 268, 1], [200, 278, 1], [380, 290, 1], [440, 302, 1], [500, 336, 1], [560, 370, 1], [581, 380, 0],
        [560, 388, -1], [500, 392, -1], [440, 396, -1], [419, 400, 0], [440, 396, 1], [500, 352, 1], [560, 312, 1],
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
      scene: 'post', W: 36, view: [140, 70, 720], post: { x: 500, r: 62, top: 70 },
      ropes: [{ color: 'manila', start: 'none', end: 'whip', pts: [        [-90, 250, 1], [200, 250, 1], [380, 252, 1], [440, 258, 1], [500, 270, 1], [560, 284, 1], [581, 292, 0],
        [560, 300, -1], [500, 306, -1], [440, 312, -1], [419, 318, 0], [440, 326, 1], [500, 338, 1], [560, 352, 1],
        [581, 360, 0], [560, 368, -1], [500, 374, -1], [440, 380, -1], [419, 386, 0], [385, 390, 0.5], [345, 376, 0.5],
        [312, 330, 1], [298, 250, 1], [300, 214, 0.5], [322, 202, 0], [344, 214, -0.5], [350, 250, -1], [352, 288, -0.5],
        [338, 312, 0], [310, 332, 0.5], [262, 340, 0.5],
        [214, 320, 1], [196, 250, 1], [198, 214, 0.5], [220, 202, 0], [242, 214, -0.5], [248, 250, -1], [250, 288, -0.5],
        [236, 312, 0], [208, 334, 0.5], [150, 346, 0.5], [95, 350, 0.5]
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
      id: 'rolling', en: 'Rolling hitch', es: 'Vuelta de rezón', tier: 'older',
      scene: 'post', W: 36, view: [140, 70, 720], post: { x: 500, r: 62, top: 70 },
      ropes: [{ color: 'red', start: 'none', end: 'whip', pts: [
        [-90, 600, 1], [150, 500, 1], [330, 380, 1], [400, 342, 1], [440, 330, 1], [500, 352, 1], [560, 384, 1],
        [581, 396, 0], [560, 402, -1], [500, 396, -1], [440, 388, -1], [419, 384, 0], [440, 390, 1], [500, 414, 1],
        [560, 446, 1], [581, 458, 0], [560, 464, -1], [500, 462, -1], [440, 460, -1], [419, 458, 0], [440, 452, 1],
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

  return { KNOTS: KNOTS };
})();
