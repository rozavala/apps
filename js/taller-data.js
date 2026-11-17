/* ================================================================
   TALLER DE MÁQUINAS — data (js/taller-data.js)
   The six simple machines, the gear and bicycle labs, the challenges
   and the chain-reaction levels. Text is [Spanish, English].

   Challenge goals are plain data, checked in js/taller.js:
     maxEffort  the machine must go with at most this many kg of force
     gears      { dir: 'same'|'opp'|null, speed: n (output ÷ input),
                  count: exact number of gears }
     bike       { easiest | fastest | turns: n }
   Chain-reaction levels: scene is a 3 m × 1.8 m wall (metres, y up).
   `answer` is a placement that works; tests/unit/taller.spec.js runs
   every level with it (must succeed) and with nothing placed (must
   fail), so each level is checked to be solvable.
   ================================================================ */

var TallerData = (function() {
  'use strict';

  // A kid's pull, in kilograms of force (about what an 8-year-old can
  // pull on a rope for a few seconds).
  var STRENGTH = 25;

  var MACHINES = [
    { id: 'lever', icon: '⚖️', name: ['La palanca', 'The lever'],
      short: ['Una barra que gira sobre un punto de apoyo.', 'A bar that turns on a pivot (the fulcrum).'],
      rule: ['Fuerza × su distancia al apoyo = carga × su distancia al apoyo.', 'Effort × its distance to the fulcrum = load × its distance to the fulcrum.'],
      fact: ['Arquímedes, en Siracusa (hace unos 2.200 años), explicó la ley de la palanca. Se le atribuye la frase: «Dadme un punto de apoyo y moveré el mundo».', 'Archimedes of Syracuse (about 2,200 years ago) explained the law of the lever. He is credited with saying: "Give me a place to stand and I will move the Earth."'],
      examples: ['Balancín, chuzo, carretilla, cascanueces, pinzas, caña de pescar, tu antebrazo.', 'Seesaw, crowbar, wheelbarrow, nutcracker, tweezers, fishing rod, your forearm.'] },
    { id: 'pulley', icon: '🪢', name: ['La polea', 'The pulley'],
      short: ['Una rueda con una cuerda. Con varias, levantas mucho con poca fuerza.', 'A wheel with a rope. With several, you lift a lot with a little force.'],
      rule: ['Fuerza = carga ÷ número de cuerdas que sostienen la carga.', 'Effort = load ÷ number of rope segments holding the load.'],
      fact: ['Los veleros usan aparejos (varias poleas juntas) para cazar las velas. Las grúas de la antigua Roma levantaban piedras con aparejos y una rueda que movían personas caminando dentro.', 'Sailing boats use blocks and tackle to trim their sails. Ancient Roman cranes lifted stones with tackle and a big wheel turned by people walking inside it.'],
      examples: ['Asta de bandera, grúa, velero, pozo, persianas, ascensor.', 'Flagpole, crane, sailing boat, well, blinds, lift.'] },
    { id: 'incline', icon: '📐', name: ['El plano inclinado', 'The ramp'],
      short: ['Una rampa: más largo el camino, menos fuerza.', 'A ramp: a longer path, less force.'],
      rule: ['Fuerza = carga × altura ÷ largo de la rampa.', 'Effort = load × height ÷ length of the ramp.'],
      fact: ['El camino de Los Caracoles, subiendo al Paso Los Libertadores hacia Argentina, tiene 29 curvas: es una rampa larga que zigzaguea para que los camiones puedan subir la montaña.', 'The Los Caracoles road up to the Los Libertadores pass into Argentina has 29 hairpin bends: a long zig-zag ramp so trucks can climb the mountain.'],
      examples: ['Rampa de silla de ruedas, tobogán, camino de montaña, escalera.', 'Wheelchair ramp, slide, mountain road, stairs.'] },
    { id: 'wedge', icon: '🪓', name: ['La cuña', 'The wedge'],
      short: ['Dos rampas juntas: convierte un empujón en una fuerza que separa.', 'Two ramps back to back: turns a push into a force that splits.'],
      rule: ['Fuerza que separa = empuje × largo ÷ grosor.', 'Splitting force = push × length ÷ thickness.'],
      fact: ['El hacha, el cuchillo, el clavo y tus dientes de adelante son cuñas. Una cuña más delgada y larga parte con menos fuerza, pero hay que meterla más.', 'Axes, knives, nails and your front teeth are wedges. A long, thin wedge splits with less force, but has to go in further.'],
      examples: ['Hacha, cuchillo, clavo, tope de puerta, proa de un barco.', 'Axe, knife, nail, doorstop, the bow of a ship.'] },
    { id: 'wheel', icon: '🛞', name: ['La rueda y el eje', 'Wheel and axle'],
      short: ['Una rueda grande unida a un eje chico: giran juntos.', 'A big wheel fixed to a small axle: they turn together.'],
      rule: ['Fuerza = carga × radio del eje ÷ radio de la rueda.', 'Effort = load × axle radius ÷ wheel radius.'],
      fact: ['El torno de un pozo, el volante de un auto, una manilla de puerta y un destornillador son ruedas con eje: la mano recorre el círculo grande.', 'A well winch, a steering wheel, a door knob and a screwdriver are wheels and axles: your hand goes round the big circle.'],
      examples: ['Pozo, volante, manilla, destornillador, molinillo.', 'Well, steering wheel, door knob, screwdriver, pepper mill.'] },
    { id: 'screw', icon: '🔩', name: ['El tornillo', 'The screw'],
      short: ['Una rampa enrollada alrededor de un cilindro.', 'A ramp wrapped around a rod.'],
      rule: ['Fuerza = carga × paso ÷ (2 × π × radio de la manilla).', 'Effort = load × pitch ÷ (2 × π × handle radius).'],
      fact: ['El «tornillo de Arquímedes», un tornillo grande dentro de un tubo, sube agua desde hace más de 2.000 años. Todavía se usa en plantas de agua.', 'The Archimedes screw, a big screw inside a tube, has lifted water for over 2,000 years. It is still used in water plants.'],
      examples: ['Gata de auto, tapa de frasco, tornillos y pernos, sacacorchos.', 'Car jack, jar lid, screws and bolts, corkscrew.'] }
  ];

  // Lever set-ups. Positions are metres along the bar from its left end.
  var LEVERS = [
    { id: 'seesaw', cls: 1, name: ['Balancín', 'Seesaw'], len: 4, mat: 'wood',
      load: { pos: 0.25, mass: 60, min: 10, max: 200, what: ['caja', 'crate'] },
      fulcrum: { pos: 1.2, min: 0.6, max: 3.4, move: true }, effort: { pos: 3.9, dir: 'down' } },
    { id: 'crowbar', cls: 1, name: ['Chuzo', 'Crowbar'], len: 1.6, mat: 'steel',
      load: { pos: 0.05, mass: 200, min: 50, max: 400, what: ['roca', 'rock'] },
      fulcrum: { pos: 0.2, min: 0.12, max: 0.8, move: true }, effort: { pos: 1.55, dir: 'down' } },
    { id: 'barrow', cls: 2, name: ['Carretilla', 'Wheelbarrow'], len: 1.6, mat: 'steel',
      load: { pos: 0.45, mass: 80, min: 20, max: 150, move: true, lo: 0.2, hi: 1.3, what: ['tierra', 'soil'] },
      fulcrum: { pos: 0 }, effort: { pos: 1.55, dir: 'up' } },
    { id: 'rod', cls: 3, name: ['Caña de pescar', 'Fishing rod'], len: 2.4, mat: 'rod',
      load: { pos: 2.35, mass: 3, min: 1, max: 6, what: ['pez', 'fish'] },
      fulcrum: { pos: 0.05 }, effort: { pos: 0.6, dir: 'up', move: true, lo: 0.25, hi: 1.6 } }
  ];

  // Teeth on offer in the gear lab, and the bicycle's sprockets.
  var GEAR_SIZES = [8, 12, 16, 24, 32, 40, 48];
  var BIKE = { fronts: [28, 38, 48], rears: [12, 14, 16, 20, 24, 28, 32], wheel: 0.66 };

  var CHALLENGES = [
    { id: 'c-pulley', machine: 'pulley', minAge: 4,
      title: ['La caja de 100 kg', 'The 100 kg crate'],
      goal: ['Levanta la caja de 100 kg tirando con solo 25 kg de fuerza.', 'Lift the 100 kg crate pulling with only 25 kg of force.'],
      setup: { mass: 100, n: 1 }, maxEffort: 25 },
    { id: 'c-crowbar', machine: 'lever', lever: 'crowbar', minAge: 5,
      title: ['La roca del jardín', 'The garden rock'],
      goal: ['Mueve la roca de 200 kg con el chuzo. Tu fuerza: 25 kg.', 'Shift the 200 kg rock with the crowbar. Your strength: 25 kg.'],
      setup: { mass: 200, fulcrum: 0.8 }, maxEffort: 25 },
    { id: 'c-ramp', machine: 'incline', minAge: 5,
      title: ['Al camión', 'Onto the truck'],
      goal: ['Sube el barril de 60 kg al camión (1 m de alto) empujando con 20 kg.', 'Get the 60 kg barrel onto the truck (1 m up) pushing with 20 kg.'],
      setup: { mass: 60, height: 1, length: 1.2, fixHeight: true }, maxEffort: 20 },
    { id: 'c-well', machine: 'wheel', minAge: 6,
      title: ['Agua del pozo', 'Water from the well'],
      goal: ['Saca el balde de 12 kg del pozo girando la manivela con solo 3 kg.', 'Raise the 12 kg bucket from the well turning the crank with only 3 kg.'],
      setup: { mass: 12, wheelR: 0.1, axleR: 0.05, fixAxle: true }, maxEffort: 3 },
    { id: 'c-barrow', machine: 'lever', lever: 'barrow', minAge: 6,
      title: ['La carretilla', 'The wheelbarrow'],
      goal: ['Lleva 80 kg de tierra levantando las manillas con solo 20 kg.', 'Carry 80 kg of soil lifting the handles with only 20 kg.'],
      setup: { mass: 80, load: 1.2 }, maxEffort: 20 },
    { id: 'c-wedge', machine: 'wedge', minAge: 7,
      title: ['Leña para la estufa', 'Firewood'],
      goal: ['El tronco aguanta 400 kg antes de partirse. Pártelo empujando la cuña con 50 kg.', 'The log holds out until 400 kg. Split it pushing the wedge with 50 kg.'],
      setup: { resist: 400, length: 0.12, thickness: 0.06 }, maxEffort: 50 },
    { id: 'c-jack', machine: 'screw', minAge: 8,
      title: ['Cambiar la rueda', 'Changing a tyre'],
      goal: ['Levanta el auto (1.000 kg en la gata) con solo 10 kg en la manilla.', 'Lift the car (1,000 kg on the jack) with only 10 kg on the handle.'],
      setup: { mass: 1000, pitch: 0.01, handleR: 0.05 }, maxEffort: 10 },
    { id: 'g-double', machine: 'gears', minAge: 5,
      title: ['Doble de rápido', 'Twice as fast'],
      goal: ['Haz que la última rueda gire en el mismo sentido que el motor y al doble de rápido.', 'Make the last gear turn the same way as the motor, and twice as fast.'],
      setup: { gears: [24] }, gears: { dir: 'same', speed: 2 } },
    { id: 'g-slow', machine: 'gears', minAge: 6,
      title: ['Tres veces más lento', 'Three times slower'],
      goal: ['Haz que la última rueda gire tres veces más lento que el motor.', 'Make the last gear turn three times slower than the motor.'],
      setup: { gears: [16] }, gears: { dir: null, speed: 1 / 3 } },
    { id: 'g-idler', machine: 'gears', minAge: 7,
      title: ['La rueda loca', 'The idler'],
      goal: ['Con exactamente 3 ruedas: la última gira en el mismo sentido y a la misma velocidad que el motor.', 'With exactly 3 gears: the last turns the same way and at the same speed as the motor.'],
      setup: { gears: [24] }, gears: { dir: 'same', speed: 1, count: 3 } },
    { id: 'g-six', machine: 'gears', minAge: 9, compound: true,
      title: ['Seis veces más rápido', 'Six times faster'],
      goal: ['Haz que la última rueda gire 6 veces más rápido. Pista: pega dos ruedas en el mismo eje.', 'Make the last gear turn 6 times faster. Hint: put two gears on one axle.'],
      setup: { gears: [36] }, gears: { dir: null, speed: 6 } },
    { id: 'b-hill', machine: 'bike', minAge: 6,
      title: ['La subida', 'The hill'],
      goal: ['Viene una subida fuerte: elige el cambio más liviano para pedalear.', 'A steep hill is coming: pick the easiest gear to pedal.'],
      setup: { front: 48, rear: 16 }, bike: { easiest: true } },
    { id: 'b-two', machine: 'bike', minAge: 8,
      title: ['Dos vueltas', 'Two turns'],
      goal: ['Elige un cambio en que una pedalada haga girar la rueda exactamente 2 veces.', 'Pick a gear where one pedal turn turns the wheel exactly 2 times.'],
      setup: { front: 28, rear: 28 }, bike: { turns: 2 } }
  ];

  // Chain-reaction levels (Reacción en cadena).
  //  statics: fixed shelves and ramps {x,y,w,h,a(deg)}
  //  fixed:   parts already in place, locked
  //  parts:   what the kid may place {type: count}
  var LEVELS = [
    { id: 'r1', name: ['El puente', 'The bridge'], minAge: 4,
      goal: { type: 'cup', x: 2.8, y: 0, w: 0.36, h: 0.22 },
      say: ['Ayuda a la bolita a cruzar hasta el balde. Pon una tabla.', 'Help the ball across to the bucket. Put down a plank.'],
      w: 3, h: 1.8,
      statics: [{ x: 0.6, y: 1.0, w: 1.0, h: 0.04, a: -6 }, { x: 2.15, y: 0.75, w: 0.8, h: 0.04, a: -6 }],
      fixed: [{ type: 'ball', x: 0.18, y: 1.1 }],
      parts: { plank: 2 }, par: 1,
      answer: [{ type: 'plank', x: 1.4, y: 0.85, a: -5 }] },
    { id: 'r2', name: ['Dominós', 'Dominoes'], minAge: 4,
      goal: { type: 'bell', x: 2.4, y: 0.17 },
      say: ['Pon dominós en fila, uno cerca del otro, hasta la campana.', 'Stand dominoes in a row, close together, all the way to the bell.'],
      w: 3, h: 1.8,
      statics: [{ x: 0.32, y: 0.46, w: 0.62, h: 0.04, a: -25 }, { x: 0.72, y: 0.1, w: 0.36, h: 0.04 }, { x: 0.72, y: 0.04, w: 0.06, h: 0.08 }],
      fixed: [{ type: 'ball', x: 0.1, y: 0.66 }, { type: 'domino', x: 0.96, y: 0.1 }, { type: 'domino', x: 1.08, y: 0.1 }],
      parts: { domino: 10 }, par: 8,
      answer: [1.23, 1.38, 1.53, 1.68, 1.83, 1.98, 2.13, 2.28].map(function(x) { return { type: 'domino', x: x, y: 0.1 }; }) },
    { id: 'r3', name: ['El balancín', 'The seesaw'], minAge: 6,
      goal: { type: 'bell', x: 2.1, y: 0.5 },
      say: ['La bolita cae sobre el balancín; el otro lado sube. ¿Dónde lo pones para que toque la campana?', 'The ball lands on the seesaw and the other end goes up. Where do you put it so it rings the bell?'],
      w: 3, h: 1.8,
      statics: [{ x: 0.42, y: 1.1, w: 0.7, h: 0.04, a: -20 }],
      fixed: [{ type: 'ball', x: 0.14, y: 1.28 }],
      parts: { seesaw: 1, plank: 1 }, par: 1,
      answer: [{ type: 'seesaw', x: 1.5, y: 0.18, a: -18 }] },
    { id: 'r4', name: ['Sobre el cajón', 'Over the bin'], minAge: 6,
      goal: { type: 'bell', x: 2.86, y: 0.17 },
      say: ['Que la bolita no caiga al cajón: hazle un camino y pon dominós hasta la campana.', 'Keep the ball out of the bin: give it a path, then dominoes to the bell.'],
      w: 3, h: 1.8,
      statics: [{ x: 0.55, y: 1.0, w: 0.9, h: 0.04, a: -6 },
        { x: 1.55, y: 0.015, w: 0.5, h: 0.03, tag: 'bin' }, { x: 1.315, y: 0.2, w: 0.03, h: 0.4, tag: 'bin' }, { x: 1.785, y: 0.2, w: 0.03, h: 0.4, tag: 'bin' },
        { x: 2.06, y: 0.1, w: 0.36, h: 0.04 }, { x: 2.06, y: 0.04, w: 0.06, h: 0.08 }],
      fixed: [{ type: 'ball', x: 0.14, y: 1.1 }, { type: 'domino', x: 2.3, y: 0.1 }],
      parts: { plank: 2, domino: 5 }, par: 4,
      answer: [{ type: 'plank', x: 1.15, y: 0.75, a: -15 }, { type: 'domino', x: 2.43, y: 0.1 }, { type: 'domino', x: 2.56, y: 0.1 }, { type: 'domino', x: 2.69, y: 0.1 }] },
    { id: 'r5', name: ['El muro', 'The wall'], minAge: 7,
      goal: { type: 'cup', x: 2.72, y: 0, w: 0.4, h: 0.2 },
      say: ['Hay un muro. Haz un salto con una tabla para que la bolita pase por encima.', 'There is a wall. Make a ski jump with a plank so the ball flies over it.'],
      w: 3, h: 1.8,
      statics: [{ x: 0.45, y: 1.35, w: 0.8, h: 0.04, a: -8 }, { x: 1.95, y: 0.3, w: 0.16, h: 0.6, tag: 'wall' }],
      fixed: [{ type: 'ball', x: 0.12, y: 1.46 }],
      parts: { plank: 2 }, par: 1,
      answer: [{ type: 'plank', x: 1.1, y: 1.15, a: -20 }] }
  ];

  // Free build: every part, no goal.
  var SANDBOX = { id: 'free', name: ['Taller libre', 'Free build'], w: 3, h: 1.8, statics: [], fixed: [],
    parts: { plank: 6, long: 2, domino: 16, ball: 4, rubber: 2, crate: 3, seesaw: 2 } };

  var PART_NAMES = {
    plank: ['Tabla', 'Plank'], long: ['Tabla larga', 'Long plank'], domino: ['Dominó', 'Domino'],
    ball: ['Bolita de acero', 'Steel ball'], rubber: ['Pelota', 'Rubber ball'], crate: ['Caja', 'Crate'], seesaw: ['Balancín', 'Seesaw']
  };

  var FACTS = {
    gears: ['El mecanismo de Anticitera, encontrado en un naufragio griego, tiene más de 30 engranajes de bronce y unos 2.100 años: es la máquina con engranajes más antigua que se conoce.', 'The Antikythera mechanism, found in a Greek shipwreck, has over 30 bronze gears and is about 2,100 years old: the oldest geared machine known.'],
    bike: ['En la bicicleta, la cadena hace girar los dos piñones en el mismo sentido. Plato grande y piñón chico: más metros por pedalada, pero cuesta más.', 'On a bicycle the chain turns both sprockets the same way. Big chainring and small cog: more metres per pedal turn, but harder to push.'],
    chain: ['Una máquina de reacción en cadena usa muchas máquinas simples, una detrás de otra: rampas, palancas y dominós.', 'A chain-reaction machine uses lots of simple machines one after another: ramps, levers and dominoes.']
  };

  return {
    STRENGTH: STRENGTH, MACHINES: MACHINES, LEVERS: LEVERS, GEAR_SIZES: GEAR_SIZES, BIKE: BIKE,
    CHALLENGES: CHALLENGES, LEVELS: LEVELS, SANDBOX: SANDBOX, PART_NAMES: PART_NAMES, FACTS: FACTS
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = TallerData;
