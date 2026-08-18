/* ================================================================
   MOVE QUEST — move-quest-moves.js

   The picture library: every exercise the app can hand a kid, drawn
   as a stick figure so nothing has to be downloaded and nothing can
   go missing offline.

   A pose is a skeleton on a 100 x 124 grid with the floor at y=114:
     h  head centre          n  neck (also the shoulder joint)
     p  pelvis (also the hip joint)
     sc optional spine control point — bends the back (cat/cow)
     a  arms  [[elbow, wrist], [elbow, wrist]]
     l  legs  [[knee, ankle, toe?], [knee, ankle, toe?]]

   Moves reference poses by name; a leading "~" mirrors the pose, so
   left/right variants (marching, heel kicks) cost nothing extra.

   Requires: nothing. Pure data + string building.
   ================================================================ */

var MoveQuestMoves = (function() {
  'use strict';

  // ── Poses ───────────────────────────────────────────────────────
  // Front-view poses stand on the floor at y=114. Side-view poses
  // face right (head on the right) unless noted.

  var POSES = {

    // —— standing, front view ——
    stand: {
      h: [50, 18], n: [50, 32], p: [50, 64],
      a: [[[41, 48], [38, 62]], [[59, 48], [62, 62]]],
      l: [[[45, 88], [45, 112], [38, 114]], [[55, 88], [55, 112], [62, 114]]]
    },
    jackOut: {
      h: [50, 18], n: [50, 32], p: [50, 64],
      a: [[[32, 20], [24, 8]], [[68, 20], [76, 8]]],
      l: [[[38, 86], [26, 112], [18, 114]], [[62, 86], [74, 112], [82, 114]]]
    },
    squat: {
      h: [50, 28], n: [50, 42], p: [50, 70],
      a: [[[34, 54], [22, 50]], [[66, 54], [78, 50]]],
      l: [[[36, 88], [42, 112], [34, 114]], [[64, 88], [58, 112], [66, 114]]]
    },
    tiptoe: {
      h: [50, 14], n: [50, 28], p: [50, 60],
      a: [[[41, 44], [38, 58]], [[59, 44], [62, 58]]],
      l: [[[45, 84], [45, 106], [40, 114]], [[55, 84], [55, 106], [60, 114]]]
    },
    reachUp: {
      h: [50, 18], n: [50, 32], p: [50, 64],
      a: [[[44, 20], [44, 4]], [[56, 20], [56, 4]]],
      l: [[[45, 88], [45, 112], [38, 114]], [[55, 88], [55, 112], [62, 114]]]
    },
    armsUp: {
      h: [50, 18], n: [50, 32], p: [50, 64],
      a: [[[36, 26], [28, 14]], [[64, 26], [72, 14]]],
      l: [[[45, 88], [45, 112], [38, 114]], [[55, 88], [55, 112], [62, 114]]]
    },
    armsDown: {
      h: [50, 18], n: [50, 32], p: [50, 64],
      a: [[[36, 52], [28, 66]], [[64, 52], [72, 66]]],
      l: [[[45, 88], [45, 112], [38, 114]], [[55, 88], [55, 112], [62, 114]]]
    },
    twist: {
      h: [46, 18], n: [48, 32], p: [50, 64],
      a: [[[30, 34], [18, 30]], [[64, 38], [76, 42]]],
      l: [[[45, 88], [45, 112], [38, 114]], [[55, 88], [55, 112], [62, 114]]]
    },
    // marching / high knee — left knee lifted
    kneeUp: {
      h: [50, 18], n: [50, 32], p: [50, 64],
      a: [[[36, 46], [32, 32]], [[64, 50], [66, 64]]],
      l: [[[40, 72], [46, 88], [53, 86]], [[57, 88], [57, 112], [64, 114]]]
    },
    // heel kick — left heel to the bottom
    heelUp: {
      h: [50, 18], n: [50, 32], p: [50, 64],
      a: [[[38, 46], [36, 60]], [[62, 46], [64, 60]]],
      l: [[[45, 88], [42, 66], [34, 64]], [[56, 88], [56, 112], [63, 114]]]
    },
    lunge: {
      h: [50, 26], n: [50, 40], p: [50, 70],
      a: [[[38, 54], [46, 66]], [[62, 54], [54, 66]]],
      l: [[[70, 90], [70, 112], [78, 114]], [[30, 98], [26, 110], [18, 114]]]
    },
    flamingo: {
      h: [50, 18], n: [50, 32], p: [50, 64],
      a: [[[34, 30], [20, 26]], [[66, 30], [80, 26]]],
      l: [[[36, 80], [50, 74], [56, 72]], [[54, 88], [54, 112], [61, 114]]]
    },
    crouchHands: {
      h: [50, 44], n: [50, 56], p: [50, 80],
      a: [[[38, 76], [34, 112]], [[62, 76], [66, 112]]],
      l: [[[34, 92], [42, 112], [34, 114]], [[66, 92], [58, 112], [66, 114]]]
    },
    airTuck: {
      h: [50, 22], n: [50, 36], p: [50, 62],
      a: [[[34, 52], [36, 68]], [[66, 52], [64, 68]]],
      l: [[[36, 70], [34, 86], [26, 88]], [[64, 70], [66, 86], [74, 88]]]
    },

    // —— side view, upright ——
    standSide: {
      h: [52, 18], n: [50, 32], p: [50, 62],
      a: [[[58, 46], [60, 60]], [[44, 46], [42, 60]]],
      l: [[[48, 88], [48, 112], [58, 114]], [[52, 88], [52, 112], [62, 114]]]
    },
    toeTouch: {
      h: [74, 96], n: [62, 88], p: [38, 56],
      a: [[[66, 100], [66, 113]], [[62, 100], [62, 113]]],
      l: [[[38, 84], [38, 112], [48, 114]], [[42, 84], [42, 112], [52, 114]]]
    },
    wallSit: {
      wall: true,
      h: [24, 46], n: [26, 58], p: [28, 84],
      a: [[[42, 64], [56, 68]], [[40, 66], [54, 70]]],
      l: [[[62, 84], [62, 112], [70, 114]], [[58, 86], [58, 112], [66, 114]]]
    },

    // —— side view, on the floor ——
    plankHigh: {
      h: [84, 54], n: [72, 60], p: [44, 78],
      a: [[[72, 86], [72, 112]], [[68, 86], [68, 112]]],
      l: [[[26, 92], [8, 108], [4, 114]], [[24, 94], [6, 110], [2, 114]]]
    },
    plankFore: {
      h: [82, 60], n: [70, 66], p: [42, 82],
      a: [[[62, 110], [78, 112]], [[58, 110], [74, 112]]],
      l: [[[24, 95], [8, 108], [4, 114]], [[22, 97], [6, 110], [2, 114]]]
    },
    mtnKnee: {
      h: [84, 54], n: [72, 60], p: [44, 78],
      a: [[[72, 86], [72, 112]], [[68, 86], [68, 112]]],
      l: [[[46, 92], [60, 98], [66, 96]], [[24, 94], [6, 110], [2, 114]]]
    },
    pushUpDown: {
      h: [84, 80], n: [72, 86], p: [44, 92],
      a: [[[84, 104], [72, 112]], [[80, 104], [68, 112]]],
      l: [[[26, 100], [8, 110], [4, 114]], [[24, 102], [6, 112], [2, 114]]]
    },
    kneePushUp: {
      h: [82, 58], n: [70, 64], p: [46, 80],
      a: [[[70, 88], [70, 112]], [[66, 88], [66, 112]]],
      l: [[[28, 110], [14, 100], [8, 96]], [[26, 112], [12, 102], [6, 98]]]
    },
    kneePushDown: {
      h: [82, 80], n: [70, 86], p: [48, 94],
      a: [[[82, 104], [70, 112]], [[78, 104], [66, 112]]],
      l: [[[30, 110], [16, 100], [10, 96]], [[28, 112], [14, 102], [8, 98]]]
    },
    sitUpDown: {
      h: [14, 96], n: [24, 100], p: [52, 104],
      a: [[[30, 92], [20, 88]], [[32, 94], [22, 90]]],
      l: [[[74, 86], [88, 110], [94, 114]], [[70, 88], [84, 110], [90, 114]]]
    },
    sitUpUp: {
      h: [30, 74], n: [36, 84], p: [52, 104],
      a: [[[42, 80], [34, 70]], [[44, 82], [36, 72]]],
      l: [[[74, 86], [88, 110], [94, 114]], [[70, 88], [84, 110], [90, 114]]]
    },
    bridgeDown: {
      h: [14, 100], n: [24, 104], p: [50, 108],
      a: [[[32, 112], [44, 114]], [[30, 112], [42, 114]]],
      l: [[[72, 88], [86, 112], [92, 114]], [[68, 90], [82, 112], [88, 114]]]
    },
    bridgeUp: {
      h: [14, 100], n: [24, 104], p: [54, 76],
      a: [[[32, 112], [44, 114]], [[30, 112], [42, 114]]],
      l: [[[76, 78], [86, 112], [92, 114]], [[72, 80], [82, 112], [88, 114]]]
    },
    proneFlat: {
      h: [14, 102], n: [24, 106], p: [54, 108],
      a: [[[14, 110], [2, 112]], [[12, 112], [1, 114]]],
      l: [[[76, 110], [94, 112], [99, 114]], [[74, 112], [92, 114], [98, 114]]]
    },
    superman: {
      h: [16, 92], n: [26, 98], p: [54, 106],
      a: [[[14, 90], [2, 82]], [[12, 92], [1, 84]]],
      l: [[[76, 102], [94, 92], [99, 88]], [[74, 104], [92, 94], [98, 90]]]
    },
    sidePlank: {
      h: [80, 50], n: [70, 56], p: [42, 80],
      a: [[[64, 104], [78, 110]], [[72, 38], [74, 22]]],
      l: [[[24, 94], [6, 110], [2, 114]], [[22, 96], [5, 112], [1, 114]]]
    },
    bearHold: {
      h: [80, 64], n: [70, 68], p: [40, 52],
      a: [[[72, 88], [74, 112]], [[68, 88], [70, 112]]],
      l: [[[26, 80], [24, 110], [16, 114]], [[30, 78], [28, 108], [20, 112]]]
    },
    bearStep: {
      h: [82, 64], n: [72, 68], p: [42, 52],
      a: [[[80, 86], [86, 110]], [[66, 88], [64, 112]]],
      l: [[[30, 78], [34, 104], [40, 102]], [[24, 82], [20, 110], [12, 114]]]
    },
    crabHold: {
      h: [84, 80], n: [68, 68], p: [40, 68],
      a: [[[78, 88], [88, 112]], [[74, 90], [84, 112]]],
      l: [[[22, 70], [14, 112], [6, 114]], [[26, 72], [18, 112], [10, 114]]]
    },
    crabStep: {
      h: [84, 78], n: [68, 66], p: [40, 66],
      a: [[[80, 84], [92, 102]], [[74, 88], [84, 112]]],
      l: [[[22, 68], [10, 100], [3, 104]], [[26, 70], [18, 112], [10, 114]]]
    },
    quadNeutral: {
      h: [80, 66], n: [70, 70], sc: [54, 70], p: [38, 68],
      a: [[[70, 90], [70, 112]], [[66, 90], [66, 112]]],
      l: [[[38, 110], [22, 102], [16, 98]], [[34, 112], [18, 104], [12, 100]]]
    },
    catArch: {
      h: [78, 82], n: [70, 72], sc: [54, 44], p: [38, 70],
      a: [[[70, 90], [70, 112]], [[66, 90], [66, 112]]],
      l: [[[38, 110], [22, 102], [16, 98]], [[34, 112], [18, 104], [12, 100]]]
    },
    cowSag: {
      h: [82, 58], n: [70, 68], sc: [54, 92], p: [38, 66],
      a: [[[70, 90], [70, 112]], [[66, 90], [66, 112]]],
      l: [[[38, 110], [22, 102], [16, 98]], [[34, 112], [18, 104], [12, 100]]]
    },
    birdDog: {
      h: [80, 64], n: [70, 70], sc: [54, 70], p: [38, 68],
      a: [[[82, 60], [94, 52]], [[66, 90], [66, 112]]],
      l: [[[24, 82], [8, 72], [2, 68]], [[36, 112], [20, 104], [14, 100]]]
    },
    childPose: {
      h: [70, 104], n: [58, 100], sc: [42, 88], p: [26, 74],
      a: [[[76, 108], [92, 112]], [[74, 110], [90, 114]]],
      l: [[[22, 108], [6, 100], [1, 96]], [[20, 110], [4, 102], [1, 98]]]
    },
    deadBugA: {
      h: [16, 100], n: [26, 102], p: [54, 106],
      a: [[[26, 84], [26, 66]], [[16, 108], [3, 110]]],
      l: [[[64, 82], [78, 80], [85, 78]], [[76, 104], [94, 108], [99, 110]]]
    },
    deadBugB: {
      h: [16, 100], n: [26, 102], p: [54, 106],
      a: [[[18, 106], [4, 108]], [[28, 86], [28, 68]]],
      l: [[[76, 106], [94, 110], [99, 112]], [[62, 84], [76, 82], [83, 80]]]
    }
  };

  // ── Moves ───────────────────────────────────────────────────────
  // tier gate: 1 sprout · 2 explorer · 3 athlete · 4 champion.
  // `minTier` is the youngest group a move is offered to, `minLevel`
  // is where it unlocks inside that group. `hold` moves are timed
  // stillness (plank, wall sit) — the coach says "hold", not "go".

  var MOVES = [
    // —— warm-up ——
    { id: 'march', en: 'Marching in Place', es: 'Marcha en el lugar', icon: '🚶',
      cat: 'warmup', minTier: 1, minLevel: 1, frames: ['kneeUp', '~kneeUp'], tempo: 900,
      cue: 'Lift your knees high and swing your arms.',
      cueEs: 'Levanta bien las rodillas y mueve los brazos.' },
    { id: 'armCircles', en: 'Arm Circles', es: 'Circulos de brazos', icon: '🔄',
      cat: 'warmup', minTier: 1, minLevel: 1, frames: ['armsUp', 'armsDown'], tempo: 1000,
      cue: 'Arms straight out. Draw big slow circles.',
      cueEs: 'Brazos estirados. Dibuja circulos grandes y lentos.' },
    { id: 'twists', en: 'Standing Twists', es: 'Giros de cintura', icon: '🌪️',
      cat: 'warmup', minTier: 1, minLevel: 1, frames: ['twist', '~twist'], tempo: 900,
      cue: 'Arms out. Turn your shoulders left and right, hips still.',
      cueEs: 'Brazos afuera. Gira los hombros a cada lado sin mover las caderas.' },

    // —— cardio ——
    { id: 'jacks', en: 'Jumping Jacks', es: 'Saltos de tijera', icon: '⭐',
      cat: 'cardio', minTier: 1, minLevel: 1, frames: ['stand', 'jackOut'], tempo: 700,
      cue: 'Jump your feet wide and clap your hands over your head.',
      cueEs: 'Salta abriendo los pies y junta las manos arriba.' },
    { id: 'highKnees', en: 'High Knees', es: 'Rodillas arriba', icon: '🏃',
      cat: 'cardio', minTier: 2, minLevel: 2, frames: ['kneeUp', '~kneeUp'], tempo: 450,
      cue: 'Run in place. Drive each knee up to your belly button.',
      cueEs: 'Corre en el lugar. Sube cada rodilla hasta el ombligo.' },
    { id: 'heelKicks', en: 'Heel Kicks', es: 'Talones atras', icon: '🦵',
      cat: 'cardio', minTier: 2, minLevel: 3, frames: ['heelUp', '~heelUp'], tempo: 450,
      cue: 'Run in place and tap your heels on your bottom.',
      cueEs: 'Corre en el lugar y toca tus talones en las pompis.' },
    { id: 'frogJumps', en: 'Frog Jumps', es: 'Saltos de rana', icon: '🐸',
      cat: 'cardio', minTier: 1, minLevel: 1, frames: ['crouchHands', 'airTuck'], tempo: 900,
      cue: 'Squat low, touch the floor, then jump up tall.',
      cueEs: 'Agachate, toca el suelo y salta bien alto.' },
    { id: 'tuckJumps', en: 'Tuck Jumps', es: 'Saltos con rodillas', icon: '🚀',
      cat: 'cardio', minTier: 3, minLevel: 4, frames: ['stand', 'airTuck'], tempo: 800,
      cue: 'Jump and pull both knees up. Land soft with bent knees.',
      cueEs: 'Salta subiendo las dos rodillas. Cae suave con las rodillas dobladas.' },
    { id: 'bearCrawl', en: 'Bear Crawl', es: 'Caminata del oso', icon: '🐻',
      cat: 'cardio', minTier: 1, minLevel: 1, frames: ['bearHold', 'bearStep'], tempo: 800,
      cue: 'Hands and feet down, knees just off the floor. Crawl forward.',
      cueEs: 'Manos y pies en el suelo, rodillas apenas arriba. Avanza gateando.' },
    { id: 'crabWalk', en: 'Crab Walk', es: 'Caminata del cangrejo', icon: '🦀',
      cat: 'cardio', minTier: 1, minLevel: 2, frames: ['crabHold', 'crabStep'], tempo: 850,
      cue: 'Sit down, hands behind you, lift your hips and walk.',
      cueEs: 'Sientate, manos atras, sube las caderas y camina.' },
    { id: 'mountainClimbers', en: 'Mountain Climbers', es: 'Escaladores', icon: '⛰️',
      cat: 'cardio', minTier: 2, minLevel: 3, frames: ['plankHigh', 'mtnKnee'], tempo: 450,
      cue: 'Strong plank. Drive one knee to your chest, then swap fast.',
      cueEs: 'Plancha firme. Lleva una rodilla al pecho y cambia rapido.' },

    // —— strength ——
    { id: 'squats', en: 'Squats', es: 'Sentadillas', icon: '🪑',
      cat: 'strength', minTier: 1, minLevel: 1, frames: ['stand', 'squat'], tempo: 1000,
      cue: 'Feet apart. Sit back like there is a chair behind you, chest tall.',
      cueEs: 'Pies separados. Sientate como si hubiera una silla atras, pecho arriba.' },
    { id: 'wallSit', en: 'Wall Sit', es: 'Silla en la pared', icon: '🧱',
      cat: 'strength', hold: true, minTier: 2, minLevel: 2, frames: ['wallSit'],
      cue: 'Back flat on the wall, knees bent like a chair. Hold still.',
      cueEs: 'Espalda pegada a la pared, rodillas dobladas como silla. Aguanta.' },
    { id: 'lunges', en: 'Lunges', es: 'Zancadas', icon: '🦿',
      cat: 'strength', minTier: 2, minLevel: 2, frames: ['stand', 'lunge'], tempo: 1100,
      cue: 'Step forward, bend both knees, push back up. Swap legs each time.',
      cueEs: 'Da un paso, dobla las dos rodillas y vuelve. Cambia de pierna.' },
    { id: 'kneePushUps', en: 'Knee Push-Ups', es: 'Flexiones con rodillas', icon: '💪',
      cat: 'strength', minTier: 1, minLevel: 1, frames: ['kneePushUp', 'kneePushDown'], tempo: 1000,
      cue: 'Knees down, hands under your shoulders. Lower your chest, then push.',
      cueEs: 'Rodillas abajo, manos bajo los hombros. Baja el pecho y empuja.' },
    { id: 'pushUps', en: 'Push-Ups', es: 'Flexiones', icon: '🔥',
      cat: 'strength', minTier: 3, minLevel: 4, frames: ['plankHigh', 'pushUpDown'], tempo: 1000,
      cue: 'Body straight as a board. Chest to the floor, then push up.',
      cueEs: 'Cuerpo recto como una tabla. Pecho al suelo y empuja.' },
    { id: 'calfRaises', en: 'Calf Raises', es: 'Puntillas', icon: '🦶',
      cat: 'strength', minTier: 1, minLevel: 1, frames: ['stand', 'tiptoe'], tempo: 900,
      cue: 'Push up onto your toes, hold one second, lower slowly.',
      cueEs: 'Sube en puntillas, aguanta un segundo y baja despacio.' },
    { id: 'gluteBridge', en: 'Bridge', es: 'Puente', icon: '🌉',
      cat: 'strength', minTier: 1, minLevel: 1, frames: ['bridgeDown', 'bridgeUp'], tempo: 1100,
      cue: 'On your back, feet flat. Lift your hips into a straight line.',
      cueEs: 'Boca arriba, pies apoyados. Sube las caderas hasta quedar recto.' },
    { id: 'superman', en: 'Superman', es: 'Superman', icon: '🦸',
      cat: 'strength', minTier: 1, minLevel: 1, frames: ['proneFlat', 'superman'], tempo: 1200,
      cue: 'Lie on your tummy. Lift your arms and legs and fly.',
      cueEs: 'Boca abajo. Levanta brazos y piernas y vuela.' },

    // —— core ——
    { id: 'plank', en: 'Plank', es: 'Plancha', icon: '🪵',
      cat: 'core', hold: true, minTier: 1, minLevel: 1, frames: ['plankFore'],
      cue: 'Elbows under your shoulders, body straight as a board. Squeeze your tummy.',
      cueEs: 'Codos bajo los hombros, cuerpo recto como tabla. Aprieta la panza.' },
    { id: 'sidePlank', en: 'Side Plank', es: 'Plancha lateral', icon: '📐',
      cat: 'core', hold: true, minTier: 3, minLevel: 4, frames: ['sidePlank'],
      cue: 'On one elbow, feet stacked, hips lifted. Swap sides halfway.',
      cueEs: 'Sobre un codo, pies juntos, caderas arriba. Cambia de lado a la mitad.' },
    { id: 'crunches', en: 'Crunches', es: 'Abdominales', icon: '🌀',
      cat: 'core', minTier: 2, minLevel: 2, frames: ['sitUpDown', 'sitUpUp'], tempo: 1000,
      cue: 'Knees bent, hands by your ears. Lift your shoulders off the floor.',
      cueEs: 'Rodillas dobladas, manos en las orejas. Despega los hombros del suelo.' },
    { id: 'deadBug', en: 'Dead Bug', es: 'Bicho panza arriba', icon: '🐞',
      cat: 'core', minTier: 1, minLevel: 2, frames: ['deadBugA', 'deadBugB'], tempo: 1200,
      cue: 'On your back. Reach the opposite arm and leg out slowly, then swap.',
      cueEs: 'Boca arriba. Estira brazo y pierna contrarios despacio y cambia.' },
    { id: 'birdDog', en: 'Bird Dog', es: 'Perro pajaro', icon: '🐦',
      cat: 'core', minTier: 1, minLevel: 1, frames: ['quadNeutral', 'birdDog'], tempo: 1200,
      cue: 'Hands and knees. Stretch one arm and the opposite leg, hold, swap.',
      cueEs: 'Manos y rodillas. Estira un brazo y la pierna contraria, aguanta y cambia.' },

    // —— balance ——
    { id: 'flamingo', en: 'Flamingo Stand', es: 'Postura del flamenco', icon: '🦩',
      cat: 'balance', hold: true, minTier: 1, minLevel: 1, frames: ['flamingo'],
      cue: 'Stand on one leg, arms out like wings. Swap legs halfway.',
      cueEs: 'Parate en un pie, brazos como alas. Cambia de pie a la mitad.' },

    // —— cool-down ——
    { id: 'reachSky', en: 'Sky Reach', es: 'Estirarse al cielo', icon: '🌤️',
      cat: 'stretch', minTier: 1, minLevel: 1, frames: ['stand', 'reachUp'], tempo: 1600,
      cue: 'Reach both hands as high as you can and take a big breath.',
      cueEs: 'Estira las manos lo mas alto que puedas y respira hondo.' },
    { id: 'toeTouch', en: 'Toe Touch', es: 'Tocar los pies', icon: '🤸',
      cat: 'stretch', minTier: 1, minLevel: 1, frames: ['standSide', 'toeTouch'], tempo: 1800,
      cue: 'Legs straight. Bend forward slowly and reach for your toes.',
      cueEs: 'Piernas rectas. Baja despacio y alcanza los pies.' },
    { id: 'catCow', en: 'Cat and Cow', es: 'Gato y vaca', icon: '🐈',
      cat: 'stretch', minTier: 1, minLevel: 1, frames: ['catArch', 'cowSag'], tempo: 1800,
      cue: 'Hands and knees. Round your back up, then let it dip down.',
      cueEs: 'Manos y rodillas. Redondea la espalda y luego dejala caer.' },
    { id: 'childPose', en: "Child's Pose", es: 'Postura del nino', icon: '🧘',
      cat: 'stretch', hold: true, minTier: 1, minLevel: 1, frames: ['childPose'],
      cue: 'Sit back on your heels, stretch your arms forward, breathe slowly.',
      cueEs: 'Sientate sobre los talones, estira los brazos y respira lento.' }
  ];

  var _byId = {};
  MOVES.forEach(function(m) { _byId[m.id] = m; });

  function getMove(id) { return _byId[id] || null; }

  // Every move a kid at this tier and level is allowed to see.
  function poolFor(tierRank, level) {
    return MOVES.filter(function(m) {
      return tierRank >= m.minTier && level >= m.minLevel;
    });
  }

  // Moves that appear exactly at this level — used for the
  // "new move unlocked" card after a level-up.
  function unlockedAt(tierRank, level) {
    return MOVES.filter(function(m) {
      return m.minLevel === level && tierRank >= m.minTier;
    });
  }

  // ── Drawing ─────────────────────────────────────────────────────

  function _pts(list) {
    return list.map(function(pt) { return pt[0] + ',' + pt[1]; }).join(' ');
  }

  function _poseMarkup(pose) {
    var out = [];
    if (pose.wall) {
      out.push('<line class="mq-wall" x1="14" y1="18" x2="14" y2="114"/>');
    }
    // Spine: a curve when the move bends the back, a straight line otherwise.
    if (pose.sc) {
      out.push('<path d="M' + pose.n[0] + ' ' + pose.n[1] +
               ' Q' + pose.sc[0] + ' ' + pose.sc[1] +
               ' ' + pose.p[0] + ' ' + pose.p[1] + '"/>');
    } else {
      out.push('<polyline points="' + _pts([pose.n, pose.p]) + '"/>');
    }
    out.push('<polyline points="' + _pts([pose.h, pose.n]) + '"/>');
    pose.a.forEach(function(arm) {
      out.push('<polyline points="' + _pts([pose.n].concat(arm)) + '"/>');
    });
    pose.l.forEach(function(leg) {
      out.push('<polyline points="' + _pts([pose.p].concat(leg)) + '"/>');
    });
    out.push('<circle class="mq-head" cx="' + pose.h[0] + '" cy="' + pose.h[1] +
             '" r="' + (pose.hr || 8) + '"/>');
    return out.join('');
  }

  // name may carry a leading "~" meaning "draw this pose mirrored".
  function poseGroup(name, cls) {
    var mirror = name.charAt(0) === '~';
    var pose = POSES[mirror ? name.slice(1) : name];
    if (!pose) return '';
    var attrs = ' class="' + cls + '"';
    if (mirror) attrs += ' transform="translate(100,0) scale(-1,1)"';
    return '<g' + attrs + '>' + _poseMarkup(pose) + '</g>';
  }

  /* Build the <svg> for a move.
       mode 'anim'   — one figure that alternates between the two frames
       mode 'frames' — both frames side by side, numbered, for the guide
     Returns a string; callers own where it lands in the DOM. Every value
     interpolated here comes from this file, never from user input. */
  function figureSvg(move, mode) {
    if (!move) return '';
    var frames = move.frames || [];
    if (mode === 'frames') {
      // A hold (plank, wall sit) has one frame and no step number — the
      // whole point is that nothing moves.
      var numbered = frames.length > 1;
      return frames.map(function(f, i) {
        return '<svg class="mq-fig" viewBox="0 0 100 124" role="img" aria-hidden="true">' +
               '<line class="mq-ground" x1="2" y1="115" x2="98" y2="115"/>' +
               poseGroup(f, 'mq-pose') +
               (numbered ? '<text class="mq-step" x="6" y="16">' + (i + 1) + '</text>' : '') +
               '</svg>';
      }).join('');
    }
    if (mode === 'single') {
      // One picture per move, for a wall poster. The last frame is the
      // one that names the move — feet apart, chest down, knees bent.
      return '<svg class="mq-fig" viewBox="0 0 100 124" role="img" aria-hidden="true">' +
             '<line class="mq-ground" x1="2" y1="115" x2="98" y2="115"/>' +
             poseGroup(frames[frames.length - 1], 'mq-pose') +
             '</svg>';
    }

    var tempo = (move.tempo || 1000) * 2; // one full there-and-back cycle
    var svg = '<svg class="mq-fig' + (frames.length > 1 ? ' mq-anim' : '') +
              '" viewBox="0 0 100 124" role="img" aria-hidden="true"' +
              (frames.length > 1 ? ' style="--mq-tempo:' + tempo + 'ms"' : '') + '>';
    svg += '<line class="mq-ground" x1="2" y1="115" x2="98" y2="115"/>';
    svg += poseGroup(frames[0], 'mq-pose mq-frame-a');
    if (frames.length > 1) svg += poseGroup(frames[1], 'mq-pose mq-frame-b');
    svg += '</svg>';
    return svg;
  }

  return {
    POSES: POSES,
    MOVES: MOVES,
    getMove: getMove,
    poolFor: poolFor,
    unlockedAt: unlockedAt,
    figureSvg: figureSvg
  };
})();
