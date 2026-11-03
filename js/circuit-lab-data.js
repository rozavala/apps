/* ================================================================
   CIRCUIT LAB — content (js/circuit-lab-data.js)
   Parts, test materials, fact cards and the challenge ladder.
   Pure data: the solver, goal checks and drawing live in
   js/circuit-lab.js and js/circuit-lab-art.js.

   Board coordinates: grid points (x, y), 0-based. A two-terminal part
   sits on one edge: terminal a = (x, y), terminal b = a + DIR[dir],
   dir 0 = right, 1 = down, 2 = left, 3 = up.
   Battery: a = "+".  LED: a = anode (+, long leg).
   Two-way switch: common at (x, y); throws at a+d+n and a+d-n
   (n = the next direction clockwise).
   ================================================================ */

var CircuitLabData = (function() {
  'use strict';

  var DIR = [[1, 0], [0, 1], [-1, 0], [0, -1]];

  // Physics values are SI (volts, ohms, amperes, watts).
  var PARTS = {
    aa:      { name: 'AA battery',  es: 'Pila AA',          volts: 1.5, rInt: 0.3,
               desc: '1.5 volts. The flat end is −, the end with the bump is +.' },
    nine:    { name: '9 V battery', es: 'Batería 9 V',      volts: 9, rInt: 1.5,
               desc: '9 volts — six times the push of an AA. Too strong for a bare bulb or LED!' },
    bulb:    { name: 'Bulb',        es: 'Ampolleta',        ohms: 8.3, ratedW: 0.75, burnW: 2.3,
               desc: 'A 2.5 V torch bulb. Its thin filament glows when current heats it.' },
    switch:  { name: 'Knife switch', es: 'Interruptor',     ohms: 0.01,
               desc: 'Tap it to open or close the gap in the circuit.' },
    spdt:    { name: 'Two-way switch', es: 'Conmutador',    ohms: 0.01,
               desc: 'One input, two outputs. Tap to flip the blade from one side to the other.' },
    buzzer:  { name: 'Buzzer',      es: 'Zumbador',         ohms: 60,
               desc: 'Turns current into sound. More current = louder and higher.' },
    motor:   { name: 'Motor + fan', es: 'Motor',            ohms: 4,
               desc: 'A small DC motor. Reverse the current and it spins the other way.' },
    resistor:{ name: 'Resistor',    es: 'Resistencia',      ohms: 10,
               desc: 'Slows the current down. Tap it to change its value.' },
    led:     { name: 'LED',         es: 'LED',              vf: 1.8, rOn: 10, ratedA: 0.02, burnA: 0.06,
               desc: 'Lights only one way round: current must go into the long leg (+).' },
    tester:  { name: 'Material tester', es: 'Probador',
               desc: 'Two brass plates with a gap. Drop an object across the gap to test it.' }
  };

  // Resistor values with their 4-band colour code (digit, digit, multiplier, tolerance).
  var RES_VALUES = [
    { ohms: 10,  bands: ['brown', 'black', 'black', 'gold'] },
    { ohms: 22,  bands: ['red', 'red', 'black', 'gold'] },
    { ohms: 47,  bands: ['yellow', 'violet', 'black', 'gold'] },
    { ohms: 100, bands: ['brown', 'black', 'brown', 'gold'] },
    { ohms: 220, bands: ['red', 'red', 'brown', 'gold'] },
    { ohms: 470, bands: ['yellow', 'violet', 'brown', 'gold'] }
  ];

  // ohms: null = insulator (no current at all).
  var MATERIALS = [
    { id: 'coin',   name: '$100 coin',      es: 'Moneda de $100',      ohms: 0.02, kind: 'conductor',
      why: 'Metal (aluminium-bronze ring, cupronickel centre). Metals are full of free electrons.' },
    { id: 'clip',   name: 'Paperclip',      es: 'Clip',                ohms: 0.05, kind: 'conductor',
      why: 'Steel wire — a metal, so current flows through it easily.' },
    { id: 'foil',   name: 'Aluminium foil', es: 'Papel aluminio',      ohms: 0.02, kind: 'conductor',
      why: 'Aluminium is a metal and a very good conductor, even this thin.' },
    { id: 'pencil', name: 'Pencil graphite', es: 'Mina de grafito',    ohms: 12, kind: 'partial',
      why: 'Graphite is carbon. It conducts, but not as well as metal — the bulb glows dimmer.' },
    { id: 'eraser', name: 'Eraser',         es: 'Goma de borrar',      ohms: null, kind: 'insulator',
      why: 'Rubber holds on to its electrons — it is an insulator.' },
    { id: 'stick',  name: 'Wooden stick',   es: 'Palito de madera',    ohms: null, kind: 'insulator',
      why: 'Dry wood is an insulator.' },
    { id: 'spoon',  name: 'Plastic spoon',  es: 'Cuchara de plástico', ohms: null, kind: 'insulator',
      why: 'Plastic is an insulator — that is why wires are coated in it.' },
    { id: 'marble', name: 'Glass marble',   es: 'Bolita de vidrio',    ohms: null, kind: 'insulator',
      why: 'Glass is an insulator. Power lines hang from glass or ceramic insulators.' }
  ];

  var FACTS = {
    safety: { icon: '🏠', title: 'Safety first · Seguridad',
      text: 'The batteries in this lab are small and safe. Wall sockets are NOT: in Chile they carry 220 volts, enough to badly hurt or kill a person. Never push anything into a socket, never touch plugs or switches with wet hands, keep electrical things away from water, and tell an adult if you see a damaged cable.' },
    volta: { icon: '🔋', title: "Volta's battery · 1800",
      text: 'In 1800 the Italian scientist Alessandro Volta stacked discs of zinc and copper with cardboard soaked in salt water between them. His "voltaic pile" was the first battery to give a steady electric current. The volt is named after him.' },
    bulb: { icon: '💡', title: 'The light bulb · 1879–1880',
      text: 'Joseph Swan in England and Thomas Edison in the United States both made working light bulbs around 1879–1880. A very thin filament inside the glass gets so hot that it glows. Edison’s 1880 bulbs used carbonised bamboo and lasted over 1,000 hours. In Chile a bulb is called an "ampolleta".' },
    voltage: { icon: '⚡', title: 'What is voltage?',
      text: 'Voltage is the "push" that drives charge around a circuit, measured in volts (V). One AA battery pushes with 1.5 V. Two AAs end-to-end (in series) push with 3 V, so a bulb glows brighter.' },
    current: { icon: '〰️', title: 'What is current?',
      text: 'Current is how much electric charge flows past a point each second, measured in amperes (A), named after the French scientist André-Marie Ampère. A small torch bulb uses about 0.3 A. The moving dots in the lab go faster when the current is bigger.' },
    resistance: { icon: '🟫', title: 'Resistance and Ohm’s law · 1827',
      text: 'Resistance is how hard it is for current to get through, measured in ohms (Ω). In 1827 the German teacher Georg Ohm showed that current = voltage ÷ resistance. Resistors show their value with coloured bands: red-red-black means 22 Ω.' },
    conductors: { icon: '🪙', title: 'Conductors and insulators',
      text: 'Metals such as copper, aluminium and steel let current flow easily: they are conductors. Rubber, plastic, glass and dry wood are insulators. Pencil "lead" is really graphite (a form of carbon) mixed with clay, and it conducts a little.' },
    series: { icon: '🔗', title: 'Series circuits · En serie',
      text: 'In series, parts sit one after another on a single path. The same current flows through each one and they share the battery’s push, so two bulbs in series glow dimmer than one. Break one bulb and the whole loop goes dark.' },
    parallel: { icon: '🪜', title: 'Parallel circuits · En paralelo',
      text: 'In parallel, each part has its own path to the battery, so each bulb gets the full voltage and shines brightly. Houses are wired in parallel so every lamp works on its own. The battery has to supply more current, so it runs down faster.' },
    short: { icon: '🔥', title: 'Short circuits',
      text: 'A short circuit is a path with almost no resistance, straight from + to −. A big current rushes through it, so the battery drains fast and gets hot, and the parts that should work are skipped. In a house, fuses and circuit breakers cut the power if this happens.' },
    faraday: { icon: '🌀', title: 'Faraday’s motor · 1821',
      text: 'In 1821 the English scientist Michael Faraday made a wire carrying current spin around a magnet. It was the first electric motor. Fans, drills, toy cars and lifts all use the same idea: electricity and magnetism together make things turn.' },
    reverse: { icon: '🔄', title: 'Reversing a motor',
      text: 'A small DC motor turns one way or the other depending on which way the current flows through it. Swap the battery around and the fan spins backwards. Remote-control cars drive in reverse this way.' },
    buzzer: { icon: '🔔', title: 'Buzzers and bells',
      text: 'A buzzer turns electricity into sound. Inside, a thin metal disc is pulled and released hundreds of times every second, shaking the air. In 1831 the American scientist Joseph Henry rang a bell from far away using an electromagnet — an early step towards the electric doorbell.' },
    led: { icon: '🔴', title: 'LEDs · 1962',
      text: 'LED means light-emitting diode. A diode lets current through in only one direction: in at the longer leg (+, anode) and out at the shorter leg (−, cathode). Nick Holonyak made the first visible red LED in 1962. An LED needs a resistor to keep its current small, or it burns out.' },
    electrons: { icon: '🔵', title: 'Which way does current flow?',
      text: 'In the 1700s Benjamin Franklin chose to call one kind of charge "positive", and current was drawn flowing from + to −. That is "conventional current", and engineers still use it. In 1897 J. J. Thomson discovered the electron — and electrons actually drift the other way, from − to +. Both pictures give the same answers.' },
    twoway: { icon: '🪜', title: 'Two-way (stair) switches',
      text: 'A two-way switch, in Spanish a "conmutador" or "interruptor de escalera", lets you switch a stair light on at the bottom and off at the top. Each switch sends the current down one of two wires; the bulb lights only when both switches pick the same wire.' },
    lithium: { icon: '⛰️', title: 'Batteries and Chile',
      text: 'Chile has some of the largest lithium deposits in the world, especially in the Salar de Atacama. Lithium is used to make the rechargeable batteries inside phones, tablets and laptops.' },
    faults: { icon: '🔍', title: 'Finding faults',
      text: 'When a circuit does not work, electricians check one part at a time: is each wire really connected inside? A wire can look fine on the outside but be broken under its plastic coat. Testing step by step always finds the fault.' }
  };
  var FACT_ORDER = ['safety', 'volta', 'bulb', 'voltage', 'current', 'resistance', 'conductors',
    'series', 'parallel', 'short', 'faraday', 'reverse', 'buzzer', 'led', 'electrons',
    'twoway', 'lithium', 'faults'];

  // ---------------------------------------------------------------
  // Challenge ladder. tier 1 = start here (6+), 2 = next, 3 = big kid.
  //   parts: prebuilt parts (fixed = cannot be moved or removed)
  //   wires: prebuilt wires (always removable)
  //   tray:  parts the kid may add, with how many
  //   ideal: most parts + wires the kid should need to ADD for star 2
  //   goal:  checker id in js/circuit-lab.js
  //   ghost: shown by the last hint (dashed guide)
  // ---------------------------------------------------------------
  var LEVELS = [
    { id: 'loop', title: 'Light it up', es: 'Enciende la ampolleta', tier: 1, icon: 'bulb',
      cols: 5, rows: 4, fact: 'bulb', ideal: 2, goal: 'lit',
      text: 'Join the battery to the bulb with two wires so the current can go round a full loop.',
      young: 'Drag from a brass post to another post to lay a wire. Make a loop!',
      parts: [
        { type: 'aa', x: 1, y: 1, dir: 1, fixed: true },
        { type: 'bulb', x: 3, y: 1, dir: 1, fixed: true }
      ],
      wires: [],
      tray: { wire: 4 },
      hints: [
        'Current needs a complete loop: out of the + end, through the bulb, and back to the − end.',
        'Drag a wire from the top of the battery to the top of the bulb. Then do the same at the bottom.'
      ],
      ghost: { wires: [[1, 1, 3, 1], [1, 2, 3, 2]] } },

    { id: 'switch', title: 'Add a switch', es: 'Agrega un interruptor', tier: 1, icon: 'switch',
      cols: 6, rows: 4, fact: 'safety', ideal: 1, goal: 'switchControls',
      text: 'There is a gap in the loop. Put a switch in the gap, then use it to turn the bulb on and off.',
      young: 'Drag the switch from the tray into the gap. Tap it to close it!',
      parts: [
        { type: 'aa', x: 1, y: 1, dir: 1, fixed: true },
        { type: 'bulb', x: 4, y: 1, dir: 1, fixed: true }
      ],
      wires: [[1, 1, 2, 1], [3, 1, 4, 1], [1, 2, 4, 2]],
      tray: { switch: 1, wire: 2 },
      hints: [
        'Look along the top: the wires stop between two posts. That is where the switch goes.',
        'Drop the switch between the two posts at the top, then tap it to close the blade.'
      ],
      ghost: { parts: [{ type: 'switch', x: 2, y: 1, dir: 0 }] } },

    { id: 'buzz', title: 'Make some noise', es: 'Haz sonar el zumbador', tier: 1, icon: 'buzzer',
      cols: 6, rows: 4, fact: 'buzzer', ideal: 3, goal: 'buzz',
      text: 'Two batteries sit in a row. Add the buzzer and wire it up so it buzzes.',
      young: 'Drag the buzzer onto the board, then join it to both ends of the batteries.',
      parts: [
        { type: 'aa', x: 1, y: 2, dir: 0, fixed: true },
        { type: 'aa', x: 2, y: 2, dir: 0, fixed: true }
      ],
      wires: [],
      tray: { buzzer: 1, wire: 3 },
      hints: [
        'The free + end is on the left, the free − end on the right. The buzzer must sit between them.',
        'Put the buzzer on the top row, then run one wire from each end of it to each end of the batteries.'
      ],
      ghost: { parts: [{ type: 'buzzer', x: 2, y: 0, dir: 0 }], wires: [[1, 2, 2, 0], [3, 0, 3, 2]] } },

    { id: 'series', title: 'Two in a row', es: 'Dos en serie', tier: 1, icon: 'bulb',
      cols: 7, rows: 4, fact: 'series', ideal: 3, goal: 'series',
      text: 'Connect both bulbs one after the other (in series) so the current goes through bulb 1 and then bulb 2.',
      young: 'Make ONE big loop that goes through both bulbs.',
      parts: [
        { type: 'aa', x: 1, y: 3, dir: 0, fixed: true },
        { type: 'aa', x: 2, y: 3, dir: 0, fixed: true },
        { type: 'bulb', x: 2, y: 1, dir: 0, fixed: true },
        { type: 'bulb', x: 4, y: 1, dir: 0, fixed: true }
      ],
      wires: [],
      tray: { wire: 5 },
      hints: [
        'In series there is only one path. Battery + → bulb 1 → bulb 2 → battery −.',
        'Join the inner ends of the two bulbs with a short wire, then wire each outer end to the batteries.'
      ],
      ghost: { wires: [[3, 1, 4, 1], [1, 3, 2, 1], [5, 1, 3, 3]] } },

    { id: 'parallel', title: 'Bright twins', es: 'Gemelas brillantes', tier: 1, icon: 'bulb',
      cols: 7, rows: 5, fact: 'parallel', ideal: 4, goal: 'parallel',
      text: 'Wire the two bulbs side by side (in parallel) so BOTH shine at full brightness.',
      young: 'Give each bulb its own path to the battery.',
      parts: [
        { type: 'aa', x: 1, y: 4, dir: 0, fixed: true },
        { type: 'aa', x: 2, y: 4, dir: 0, fixed: true },
        { type: 'bulb', x: 3, y: 1, dir: 1, fixed: true },
        { type: 'bulb', x: 5, y: 1, dir: 1, fixed: true }
      ],
      wires: [],
      tray: { wire: 6 },
      hints: [
        'Both tops of the bulbs go to +. Both bottoms go to −.',
        'Join the two bulb tops together and the two bulb bottoms together, then connect each pair to the batteries.'
      ],
      ghost: { wires: [[1, 4, 3, 1], [3, 1, 5, 1], [3, 2, 5, 2], [3, 2, 3, 4]] } },

    { id: 'materials', title: 'Conductor or insulator?', es: '¿Conductor o aislante?', tier: 1, icon: 'tester',
      cols: 6, rows: 4, fact: 'conductors', ideal: 0, goal: 'materials',
      text: 'Drop each object from the shelf across the gap in the tester. Which ones light the bulb?',
      young: 'Drag each object onto the brass plates. Does the bulb light up?',
      parts: [
        { type: 'aa', x: 1, y: 3, dir: 0, fixed: true },
        { type: 'aa', x: 2, y: 3, dir: 0, fixed: true },
        { type: 'tester', x: 1, y: 1, dir: 0, fixed: true },
        { type: 'bulb', x: 4, y: 1, dir: 1, fixed: true }
      ],
      wires: [[1, 3, 1, 1], [2, 1, 4, 1], [4, 2, 3, 3]],
      tray: {},
      hints: [
        'Test all 8 objects. If the bulb lights, the object is a conductor.',
        'Watch the pencil graphite closely — it lights the bulb, but only dimly.'
      ] },

    { id: 'stack', title: 'Stack the batteries', es: 'Pilas en serie', tier: 2, icon: 'aa',
      cols: 6, rows: 4, fact: 'lithium', ideal: 2, goal: 'bright',
      text: 'The bulb is dim on one battery. Add a second battery in series to make it shine brightly.',
      young: 'Put the new battery next to the old one, pointing the same way.',
      parts: [
        { type: 'aa', x: 1, y: 2, dir: 0, fixed: true },
        { type: 'bulb', x: 4, y: 1, dir: 1, fixed: true }
      ],
      wires: [[1, 2, 4, 1], [2, 2, 4, 2]],
      tray: { aa: 1, wire: 3 },
      hints: [
        'In series, the − end of one battery touches the + end of the next. Their pushes add up: 1.5 V + 1.5 V = 3 V.',
        'Remove the wire on the − end, put the new battery right after the first one (bump end first), then wire its − end to the bulb.'
      ],
      ghost: { parts: [{ type: 'aa', x: 2, y: 2, dir: 0 }], wires: [[3, 2, 4, 2]] } },

    { id: 'broken', title: 'Find the broken wire', es: 'Encuentra el cable cortado', tier: 2, icon: 'wire',
      cols: 6, rows: 4, fact: 'faults', ideal: 1, goal: 'lit',
      text: 'Everything looks connected, but the bulb stays dark. One wire is broken inside its plastic. Find it and replace it.',
      young: 'One wire is broken inside. Swap the wires one at a time until the bulb lights.',
      parts: [
        { type: 'aa', x: 1, y: 1, dir: 1, fixed: true },
        { type: 'switch', x: 2, y: 0, dir: 0, fixed: true, closed: true },
        { type: 'bulb', x: 4, y: 1, dir: 1, fixed: true }
      ],
      wires: [[1, 1, 2, 0], [3, 0, 4, 1], [4, 2, 3, 3], [3, 3, 1, 2]],
      randomBreak: true,
      tray: { wire: 4 },
      hints: [
        'Replace one wire at a time: remove it (long-press or the bin), then draw a new one between the same posts.',
        'Look closely: the broken wire has a small kink in its plastic coat.'
      ] },

    { id: 'motor', title: 'Make the motor spin', es: 'Haz girar el motor', tier: 2, icon: 'motor',
      cols: 6, rows: 4, fact: 'faraday', ideal: 3, goal: 'spin',
      text: 'Add the motor to the board and wire it to the battery to spin the fan.',
      young: 'Drag the motor in, then join it to the battery with two wires.',
      parts: [
        { type: 'aa', x: 1, y: 1, dir: 1, fixed: true }
      ],
      wires: [],
      tray: { motor: 1, wire: 3 },
      hints: [
        'A motor needs a complete loop too, just like a bulb.',
        'Put the motor on the right side, then wire its top to the battery top and its bottom to the battery bottom.'
      ],
      ghost: { parts: [{ type: 'motor', x: 4, y: 1, dir: 1 }], wires: [[1, 1, 4, 1], [1, 2, 4, 2]] } },

    { id: 'reverse', title: 'Reverse the fan', es: 'Gira al revés', tier: 2, icon: 'motor',
      cols: 6, rows: 4, fact: 'reverse', ideal: 0, goal: 'reverse',
      text: 'The fan spins one way. Make it spin the opposite way — without adding any parts.',
      young: 'Tap the battery to select it, then tap it again to flip it around.',
      parts: [
        { type: 'aa', x: 1, y: 1, dir: 1, fixed: true, flip: true },
        { type: 'motor', x: 4, y: 1, dir: 1, fixed: true, flip: true }
      ],
      wires: [[1, 1, 4, 1], [1, 2, 4, 2]],
      tray: { wire: 2 },
      hints: [
        'The motor’s direction depends on which way the current flows through it.',
        'Select the battery and press Flip (or tap it again) so + and − swap places.'
      ] },

    { id: 'short', title: 'Short-circuit detective', es: 'Detective del cortocircuito', tier: 2, icon: 'aa',
      cols: 6, rows: 4, fact: 'short', ideal: 0, goal: 'lit',
      text: 'The battery is getting warm and the bulb is dark. Find the short circuit and remove it.',
      young: 'One wire skips around the bulb. Remove that wire!',
      parts: [
        { type: 'aa', x: 1, y: 1, dir: 1, fixed: true },
        { type: 'bulb', x: 4, y: 1, dir: 1, fixed: true }
      ],
      wires: [[1, 1, 4, 1], [1, 2, 4, 2], [4, 1, 4, 2]],
      tray: { wire: 2 },
      hints: [
        'Current takes the easiest path. A wire straight across the bulb lets it skip the bulb completely.',
        'Long-press the short wire right next to the bulb (or select it and press the bin) to remove it.'
      ] },

    { id: 'led', title: 'LED the right way', es: 'El LED al derecho', tier: 3, icon: 'led',
      cols: 7, rows: 4, fact: 'led', ideal: 0, goal: 'ledOn',
      text: 'The LED is in backwards, so it stays dark. Turn it round so current goes in at its long leg (+).',
      young: 'Tap the LED, then tap it again to flip it.',
      parts: [
        { type: 'aa', x: 1, y: 3, dir: 0, fixed: true },
        { type: 'aa', x: 2, y: 3, dir: 0, fixed: true },
        { type: 'resistor', x: 2, y: 1, dir: 0, fixed: true, ohms: 100 },
        { type: 'led', x: 5, y: 1, dir: 2, fixed: true, flip: true }
      ],
      wires: [[1, 3, 2, 1], [3, 1, 4, 1], [5, 1, 3, 3]],
      tray: { wire: 2 },
      hints: [
        'An LED is a one-way door for current. Its long, bent leg (+) must point towards the battery’s + side.',
        'Select the LED and press Flip.'
      ] },

    { id: 'dimmer', title: 'Dimmer with a resistor', es: 'Atenuador', tier: 3, icon: 'resistor',
      cols: 6, rows: 4, fact: 'resistance', ideal: 1, goal: 'dim',
      text: 'Put a resistor in the gap, then choose a value that makes the bulb glow softly — dim, but still glowing.',
      young: 'Drop the resistor in the gap. Tap it to change how much it slows the current.',
      parts: [
        { type: 'aa', x: 1, y: 3, dir: 0, fixed: true },
        { type: 'aa', x: 2, y: 3, dir: 0, fixed: true },
        { type: 'bulb', x: 4, y: 1, dir: 1, fixed: true }
      ],
      wires: [[1, 3, 2, 1], [3, 1, 4, 1], [4, 2, 3, 3]],
      tray: { resistor: 1, wire: 2 },
      hints: [
        'More ohms = more resistance = less current = a dimmer bulb. Too many ohms and it goes dark.',
        'Try 22 Ω or 47 Ω (red-red-black or yellow-violet-black).'
      ],
      ghost: { parts: [{ type: 'resistor', x: 2, y: 1, dir: 0 }] } },

    { id: 'oneeach', title: 'One switch, one bulb', es: 'Un interruptor por ampolleta', tier: 3, icon: 'switch',
      cols: 7, rows: 5, fact: 'voltage', ideal: 6, goal: 'oneEach',
      text: 'Wire it so that each switch controls only its own bulb, and the other bulb keeps doing what it was doing.',
      young: 'Each bulb gets its own path with its own switch.',
      parts: [
        { type: 'aa', x: 1, y: 4, dir: 0, fixed: true },
        { type: 'aa', x: 2, y: 4, dir: 0, fixed: true },
        { type: 'bulb', x: 3, y: 1, dir: 1, fixed: true },
        { type: 'bulb', x: 5, y: 1, dir: 1, fixed: true }
      ],
      wires: [],
      tray: { switch: 2, wire: 7 },
      hints: [
        'Build the bulbs in parallel first. Then put one switch inside each bulb’s own branch.',
        'Put a switch under each bulb, join the bulb tops to + and join the bottoms of the switches to −.'
      ],
      ghost: { parts: [{ type: 'switch', x: 3, y: 2, dir: 1 }, { type: 'switch', x: 5, y: 2, dir: 1 }],
               wires: [[1, 4, 3, 1], [3, 1, 5, 1], [3, 3, 5, 3], [3, 3, 3, 4]] } },

    { id: 'doorbell', title: 'Doorbell and porch light', es: 'Timbre y luz', tier: 3, icon: 'buzzer',
      cols: 7, rows: 5, fact: 'current', ideal: 5, goal: 'doorbell',
      text: 'Use ONE switch so that pressing it rings the buzzer AND lights the bulb brightly at the same time.',
      young: 'Put the buzzer and bulb side by side, then add one switch for both.',
      parts: [
        { type: 'aa', x: 1, y: 4, dir: 0, fixed: true },
        { type: 'aa', x: 2, y: 4, dir: 0, fixed: true },
        { type: 'buzzer', x: 3, y: 1, dir: 1, fixed: true },
        { type: 'bulb', x: 5, y: 1, dir: 1, fixed: true }
      ],
      wires: [],
      tray: { switch: 1, wire: 6 },
      hints: [
        'In series the bulb would only glow faintly. Put the buzzer and the bulb in parallel.',
        'Join the tops together and the bottoms together. Put the switch on the wire that goes back to the battery.'
      ],
      ghost: { parts: [{ type: 'switch', x: 3, y: 4, dir: 0 }],
               wires: [[1, 4, 3, 1], [3, 1, 5, 1], [3, 2, 5, 2], [5, 2, 4, 4]] } },

    { id: 'stairs', title: 'Two-way stair switch', es: 'Interruptor de escalera', tier: 3, icon: 'spdt',
      cols: 7, rows: 5, fact: 'twoway', ideal: 5, goal: 'twoWay',
      text: 'Wire the two two-way switches so EITHER one can turn the stair light on or off. Finish with the light on.',
      young: 'This is a big-kid puzzle! Join the two switches with two wires, top to top and bottom to bottom.',
      parts: [
        { type: 'aa', x: 1, y: 4, dir: 0, fixed: true },
        { type: 'aa', x: 2, y: 4, dir: 0, fixed: true },
        { type: 'spdt', x: 1, y: 2, dir: 0, fixed: true, state: 0 },
        { type: 'spdt', x: 5, y: 2, dir: 2, fixed: true, state: 1 },
        { type: 'bulb', x: 3, y: 0, dir: 0, fixed: true }
      ],
      wires: [],
      tray: { wire: 7 },
      hints: [
        'The two "traveller" wires join the side contacts of the two switches: top to top, bottom to bottom.',
        'Then wire battery + to the middle of the left switch, the middle of the right switch to the bulb, and the bulb back to battery −.'
      ],
      ghost: { wires: [[2, 1, 4, 1], [2, 3, 4, 3], [1, 4, 1, 2], [5, 2, 4, 0], [3, 0, 3, 4]] } }
  ];

  var FREE = { cols: 9, rows: 6 };
  var FREE_TRAY = ['wire', 'aa', 'nine', 'bulb', 'switch', 'spdt', 'buzzer', 'motor', 'resistor', 'led', 'tester'];

  return {
    DIR: DIR, PARTS: PARTS, RES_VALUES: RES_VALUES, MATERIALS: MATERIALS,
    FACTS: FACTS, FACT_ORDER: FACT_ORDER, LEVELS: LEVELS, FREE: FREE, FREE_TRAY: FREE_TRAY
  };
})();
