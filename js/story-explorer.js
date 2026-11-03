/* ================================================================
   STORY EXPLORER — story-explorer.js
   An illustrated bilingual storybook: pages turn like a real book,
   read-aloud lights up each word (tts.js), tapping a highlighted word
   shows and says its meaning, and each story ends with a round of
   comprehension challenges sized to the reader's age.

   Storage key: zs_story_[username] via getUserAppKey('zs_story_')
     storiesRead  [id]        stories finished (Progress Manager sets it)
     totalStars   number      the star rule in auth.js reads this
     wordsLearned [word]      words collected (English form)
     storyStars   {id: 1-3}   best round per story (added)
     bookmark     {id, page}  where a half-read story was left (added)
     prefs        {lang}      EN / ES (added)

   Art: js/story-explorer-art.js · challenges: js/story-explorer-data.js
   ================================================================ */

const StoryExplorer = (() => {
  'use strict';

  // ── Story Library ──
  const STORIES = [
    {
      id: 'ocean_dive',
      title: 'The Ocean Dive',
      titleEs: 'El Buceo en el Océano',
      tier: 'explorer', ageMin: 7, region: 'ocean', icon: '🤿',
      pages: [
        {
          en: 'The divers jumped into the deep blue water.',
          es: 'Los buzos saltaron al agua azul profunda.',
          vocab: [
            { word: 'divers', wordEs: 'buzos', def: 'People who swim underwater.', defEs: 'Personas que nadan bajo el agua.' },
            { word: 'deep', wordEs: 'profunda', def: 'Going far down.', defEs: 'Que va muy abajo.' }
          ]
        },
        {
          en: 'They saw colorful fish and a large sea turtle.',
          es: 'Vieron peces coloridos y una gran tortuga marina.',
          vocab: [
            { word: 'colorful', wordEs: 'coloridos', def: 'Having many bright colors.', defEs: 'Que tiene muchos colores brillantes.' },
            { word: 'turtle', wordEs: 'tortuga', def: 'An animal with a hard shell.', defEs: 'Un animal con un caparazón duro.' }
          ]
        },
        {
          en: 'It was a beautiful day exploring the coral reef.',
          es: 'Fue un hermoso día explorando el arrecife de coral.',
          vocab: [
            { word: 'reef', wordEs: 'arrecife', def: 'A ridge of coral or rock under the sea.', defEs: 'Una cresta de coral o roca bajo el mar.' },
            { word: 'coral', wordEs: 'coral', def: 'A hard structure built by tiny sea animals.', defEs: 'Una estructura dura construida por pequeños animales marinos.' }
          ]
        }
      ],
      quiz: [
        { q: 'Who jumped into the water?', qEs: '¿Quiénes saltaron al agua?', options: ['Pilots', 'Drivers', 'Divers', 'Runners'], optionsEs: ['Pilotos', 'Conductores', 'Buzos', 'Corredores'], answer: 2 },
        { q: 'What animal did they see?', qEs: '¿Qué animal vieron?', options: ['Shark', 'Turtle', 'Whale', 'Dolphin'], optionsEs: ['Tiburón', 'Tortuga', 'Ballena', 'Delfín'], answer: 1 }
      ]
    },
    {
      id: 'andes_rescue',
      title: 'The Andes Rescue',
      titleEs: 'El Rescate en los Andes',
      tier: 'pilot', ageMin: 8, region: 'south', icon: '🚁',
      pages: [
        {
          en: 'The helicopter flew over the snowy peaks. A climber was lost.',
          es: 'El helicóptero voló sobre los picos nevados. Un escalador estaba perdido.',
          vocab: [
            { word: 'helicopter', wordEs: 'helicóptero', def: 'An aircraft with spinning blades on top.', defEs: 'Una aeronave con aspas que giran en el techo.' },
            { word: 'peaks', wordEs: 'picos', def: 'The pointed tops of mountains.', defEs: 'Las cimas puntiagudas de las montañas.' }
          ]
        },
        {
          en: 'The wind was very strong. The pilot had to be careful.',
          es: 'El viento era muy fuerte. El piloto tenía que ser cuidadoso.',
          vocab: [
            { word: 'wind', wordEs: 'viento', def: 'Moving air.', defEs: 'Aire en movimiento.' },
            { word: 'strong', wordEs: 'fuerte', def: 'Having a lot of power or force.', defEs: 'Que tiene mucha fuerza.' }
          ]
        },
        {
          en: 'Finally, they saw a red tent on the white snow.',
          es: 'Finalmente, vieron una carpa roja sobre la nieve blanca.',
          vocab: [
            { word: 'tent', wordEs: 'carpa', def: 'A cloth shelter held up by poles.', defEs: 'Un refugio de tela sostenido por palos.' },
            { word: 'snow', wordEs: 'nieve', def: 'Frozen water that falls from the sky as white flakes.', defEs: 'Agua congelada que cae del cielo en copos blancos.' }
          ]
        },
        {
          en: 'The rescue team threw down a rope to help him.',
          es: 'El equipo de rescate lanzó una cuerda para ayudarlo.',
          vocab: [
            { word: 'rope', wordEs: 'cuerda', def: 'A thick, strong cord.', defEs: 'Un cordel grueso y fuerte.' },
            { word: 'team', wordEs: 'equipo', def: 'A group of people working together.', defEs: 'Un grupo de personas que trabajan juntas.' }
          ]
        }
      ],
      quiz: [
        { q: 'What was flying over the snowy peaks?', qEs: '¿Qué volaba sobre los picos nevados?', options: ['A helicopter', 'An eagle', 'An airplane', 'A kite'], optionsEs: ['Un helicóptero', 'Un águila', 'Un avión', 'Un volantín'], answer: 0 },
        { q: 'What did the rescue team throw down?', qEs: '¿Qué lanzó el equipo de rescate?', options: ['A rope', 'A map', 'A blanket', 'A flag'], optionsEs: ['Una cuerda', 'Un mapa', 'Una manta', 'Una bandera'], answer: 0 }
      ]
    },
    {
      id: 'lost_compass',
      title: 'The Lost Compass',
      titleEs: 'La Brújula Perdida',
      tier: 'explorer', ageMin: 6, region: 'south', icon: '🧭',
      pages: [
        {
          en: 'Leo was hiking in the mountains. He looked for his compass, but it was gone.',
          es: 'Leo estaba haciendo senderismo en las montañas. Buscó su brújula, pero había desaparecido.',
          vocab: [
            { word: 'hiking', wordEs: 'senderismo', def: 'Walking in nature.', defEs: 'Caminar en la naturaleza.' },
            { word: 'compass', wordEs: 'brújula', def: 'A tool for direction.', defEs: 'Una herramienta para dirección.' }
          ]
        },
        {
          en: 'He retraced his steps carefully. The wind was blowing strong.',
          es: 'Él rehízo sus pasos con cuidado. El viento soplaba fuerte.',
          vocab: [
            { word: 'steps', wordEs: 'pasos', def: 'Foot movements.', defEs: 'Movimientos de los pies.' },
            { word: 'wind', wordEs: 'viento', def: 'Moving air.', defEs: 'Aire en movimiento.' }
          ]
        },
        {
          en: 'Under a big rock, he saw something shiny. It was his compass!',
          es: 'Bajo una gran roca, vio algo brillante. ¡Era su brújula!',
          vocab: [
            { word: 'rock', wordEs: 'roca', def: 'A large stone.', defEs: 'Una piedra grande.' },
            { word: 'shiny', wordEs: 'brillante', def: 'Reflecting light.', defEs: 'Que refleja luz.' }
          ]
        },
        {
          en: 'Happy, Leo used the compass to find the path home before dark.',
          es: 'Feliz, Leo usó la brújula para encontrar el camino a casa antes de oscurecer.',
          vocab: [
            { word: 'path', wordEs: 'camino', def: 'A track to walk on.', defEs: 'Una vía para caminar.' },
            { word: 'dark', wordEs: 'oscuro', def: 'Without light.', defEs: 'Sin luz.' }
          ]
        }
      ],
      quiz: [
        { q: 'What did Leo lose?', qEs: '¿Qué perdió Leo?', options: ['His compass', 'His tent', 'His map', 'His horse'], optionsEs: ['Su brújula', 'Su carpa', 'Su mapa', 'Su caballo'], answer: 0 },
        { q: 'Where did he find it?', qEs: '¿Dónde la encontró?', options: ['Under a big rock', 'In the river', 'On a tree', 'In his pocket'], optionsEs: ['Bajo una gran roca', 'En el río', 'En un árbol', 'En su bolsillo'], answer: 0 }
      ]
    },
    {
      id: 'inca_trail',
      title: 'The Secret Inca Trail',
      titleEs: 'El Sendero Secreto Inca',
      tier: 'explorer', ageMin: 6, region: 'north', icon: '⛰️',
      pages: [
        {
          en: 'Deep in the Atacama desert, Leo found an old map showing a secret Inca trail.',
          es: 'En lo profundo del desierto de Atacama, Leo encontró un viejo mapa mostrando un sendero secreto Inca.',
          vocab: [
            { word: 'trail', wordEs: 'sendero', def: 'A path through a wild place.', defEs: 'Un camino a través de un lugar salvaje.' },
            { word: 'map', wordEs: 'mapa', def: 'A drawing of a place.', defEs: 'Un dibujo de un lugar.' }
          ]
        },
        {
          en: 'He packed his compass, a water bottle, and some snacks for the adventure.',
          es: 'Él empacó su brújula, una botella de agua y algunos bocadillos para la aventura.',
          vocab: [
            { word: 'compass', wordEs: 'brújula', def: 'A tool that shows direction.', defEs: 'Una herramienta que muestra la dirección.' },
            { word: 'adventure', wordEs: 'aventura', def: 'An exciting experience.', defEs: 'Una experiencia emocionante.' }
          ]
        },
        {
          en: 'The trail went high up into the Andes. The air was thin, and the sun was bright.',
          es: 'El sendero subía alto en los Andes. El aire era fino, y el sol brillaba fuerte.',
          vocab: [
            { word: 'thin', wordEs: 'fino', def: 'Not thick. Hard to breathe up high.', defEs: 'No espeso. Difícil de respirar en la altura.' },
            { word: 'bright', wordEs: 'fuerte (brillante)', def: 'Giving out a lot of light.', defEs: 'Que emite mucha luz.' }
          ]
        },
        {
          en: 'At the top, Leo discovered an ancient stone fortress built by the Incas.',
          es: 'En la cima, Leo descubrió una antigua fortaleza de piedra construida por los Incas.',
          vocab: [
            { word: 'ancient', wordEs: 'antigua', def: 'Very old.', defEs: 'Muy viejo.' },
            { word: 'fortress', wordEs: 'fortaleza', def: 'A strong building used for defense.', defEs: 'Un edificio fuerte usado para defensa.' }
          ]
        }
      ],
      quiz: [
        { q: 'Where did Leo find the old map?', qEs: '¿Dónde encontró Leo el mapa viejo?', options: ['The Atacama desert', 'The ocean', 'A city library', 'A glacier'], optionsEs: ['El desierto de Atacama', 'El océano', 'Una biblioteca', 'Un glaciar'], answer: 0 },
        { q: 'What did he discover at the top of the trail?', qEs: '¿Qué descubrió en la cima del sendero?', options: ['An ancient stone fortress', 'A red tent', 'A coral reef', 'A rocket'], optionsEs: ['Una antigua fortaleza de piedra', 'Una carpa roja', 'Un arrecife de coral', 'Un cohete'], answer: 0 }
      ]
    },
    {
      id: 'condor_flight',
      title: 'The Condor\'s First Flight',
      titleEs: 'El Primer Vuelo del Cóndor',
      tier: 'cadet', ageMin: 4, region: 'andes', icon: '🦅',
      pages: [
        {
          en: 'High in the Andes mountains, a baby condor sat on a rocky ledge. His name was Ciro.',
          es: 'En lo alto de los Andes, un bebé cóndor estaba sentado en una roca. Su nombre era Ciro.',
          vocab: [
            { word: 'condor', wordEs: 'cóndor', def: 'A very large bird that lives in the mountains.', defEs: 'Un ave muy grande que vive en las montañas.' },
            { word: 'ledge', wordEs: 'cornisa', def: 'A flat piece of rock sticking out from a cliff.', defEs: 'Una roca plana que sobresale de un acantilado.' },
          ]
        },
        {
          en: 'Ciro looked down at the valley far below. "It\'s so far!" he said. "I\'m not sure I can fly."',
          es: 'Ciro miró hacia el valle muy abajo. "¡Está tan lejos!" dijo. "No estoy seguro de poder volar."',
          vocab: [
            { word: 'valley', wordEs: 'valle', def: 'A low area of land between mountains.', defEs: 'Una zona baja entre montañas.' },
          ]
        },
        {
          en: '"Watch me," said his mother. She spread her enormous wings and glided into the wind.',
          es: '"Mírame," dijo su madre. Abrió sus enormes alas y planeó en el viento.',
          vocab: [
            { word: 'enormous', wordEs: 'enorme', def: 'Very, very big.', defEs: 'Muy, muy grande.' },
            { word: 'glided', wordEs: 'planeó', def: 'Flew smoothly without flapping wings.', defEs: 'Voló suavemente sin mover las alas.' },
          ]
        },
        {
          en: 'Ciro took a deep breath, opened his wings, and jumped. The wind lifted him up! He was flying!',
          es: 'Ciro respiró profundo, abrió sus alas y saltó. ¡El viento lo levantó! ¡Estaba volando!',
          vocab: [
            { word: 'breath', wordEs: 'respiro', def: 'Air taken into the lungs.', defEs: 'Aire que se lleva a los pulmones.' },
            { word: 'jumped', wordEs: 'saltó', def: 'Pushed oneself off the ground.', defEs: 'Se impulsó fuera del suelo.' }
          ]
        },
      ],
      quiz: [
        { q: 'Where did Ciro live?', qEs: '¿Dónde vivía Ciro?', options: ['A beach', 'The Andes mountains', 'A forest', 'A desert'], optionsEs: ['Una playa', 'Las montañas de los Andes', 'Un bosque', 'Un desierto'], answer: 1 },
        { q: 'What was Ciro afraid of?', qEs: '¿De qué tenía miedo Ciro?', options: ['Swimming', 'Flying', 'Running', 'Singing'], optionsEs: ['Nadar', 'Volar', 'Correr', 'Cantar'], answer: 1 },
        { q: 'Who helped Ciro?', qEs: '¿Quién ayudó a Ciro?', options: ['His father', 'His mother', 'A friend', 'A teacher'], optionsEs: ['Su padre', 'Su madre', 'Un amigo', 'Un maestro'], answer: 1 },
      ]
    },
    {
      id: 'huaso_horse',
      title: 'The Brave Huaso Horse',
      titleEs: 'El Valiente Caballo del Huaso',
      tier: 'cadet', ageMin: 4, region: 'central', icon: '🐴',
      pages: [
        {
          en: 'In the central valley of Chile, a horse named Rayo lived on a beautiful farm.',
          es: 'En el valle central de Chile, un caballo llamado Rayo vivía en una hermosa granja.',
          vocab: [
            { word: 'huaso', wordEs: 'huaso', def: 'A Chilean countryman and skilled horseman.', defEs: 'Un hombre de campo chileno y hábil jinete.' }
          ]
        },
        {
          en: 'Rayo wore a shiny saddle and carried his huaso across the fields every morning.',
          es: 'Rayo usaba una montura brillante y llevaba a su huaso por los campos cada mañana.',
          vocab: [
            { word: 'saddle', wordEs: 'montura', def: 'A seat for a rider on a horse.', defEs: 'Un asiento para un jinete en un caballo.' },
            { word: 'shiny', wordEs: 'brillante', def: 'Reflecting light.', defEs: 'Que refleja la luz.' },
            { word: 'fields', wordEs: 'campos', def: 'Open areas of land.', defEs: 'Áreas abiertas de tierra.' },
            { word: 'morning', wordEs: 'mañana', def: 'The early part of the day.', defEs: 'La primera parte del día.' }
          ]
        }
      ],
      quiz: [
        { q: 'What kind of animal is Rayo?', qEs: '¿Qué tipo de animal es Rayo?', options: ['A cow', 'A horse', 'A dog', 'A sheep'], optionsEs: ['Una vaca', 'Un caballo', 'Un perro', 'Una oveja'], answer: 1 },
        { q: 'Where does Rayo live?', qEs: '¿Dónde vive Rayo?', options: ['The central valley of Chile', 'The Atacama Desert', 'Patagonia', 'An island'], optionsEs: ['El valle central de Chile', 'El desierto de Atacama', 'La Patagonia', 'Una isla'], answer: 0 }
      ]
    },
    {
      id: 'volcano_legend',
      title: 'The Whispering Volcano',
      titleEs: 'El Volcán Susurrante',
      tier: 'explorer', ageMin: 6, region: 'south', icon: '🌋',
      pages: [
        {
          en: 'Long ago, near the blue lakes of the south, a giant volcano stood perfectly still.',
          es: 'Hace mucho tiempo, cerca de los lagos azules del sur, un volcán gigante permanecía inmóvil.',
          vocab: [
            { word: 'volcano', wordEs: 'volcán', def: 'A mountain that can erupt with lava and ash.', defEs: 'Una montaña que puede entrar en erupción con lava y ceniza.' },
            { word: 'giant', wordEs: 'gigante', def: 'Extremely large.', defEs: 'Extremadamente grande.' },
            { word: 'perfectly', wordEs: 'perfectamente', def: 'In a complete or flawless way.', defEs: 'De una manera completa o impecable.' }
          ]
        },
        {
          en: 'People said it could whisper secrets to the wind.',
          es: 'La gente decía que podía susurrar secretos al viento.',
          vocab: [
            { word: 'whisper', wordEs: 'susurrar', def: 'To speak very softly.', defEs: 'Hablar muy suavemente.' },
            { word: 'secrets', wordEs: 'secretos', def: 'Things that are kept hidden.', defEs: 'Cosas que se mantienen ocultas.' }
          ]
        }
      ],
      quiz: [
        { q: 'Where was the volcano located?', qEs: '¿Dónde estaba el volcán?', options: ['The desert', 'Near blue lakes', 'In the city', 'On an island'], optionsEs: ['El desierto', 'Cerca de lagos azules', 'En la ciudad', 'En una isla'], answer: 1 },
        { q: 'What could the volcano do?', qEs: '¿Qué podía hacer el volcán?', options: ['Sing songs', 'Whisper secrets', 'Dance', 'Jump'], optionsEs: ['Cantar canciones', 'Susurrar secretos', 'Bailar', 'Saltar'], answer: 1 }
      ]
    },
    {
      id: 'pudu_journey',
      title: 'The Little Pudu\'s Journey',
      titleEs: 'El Viaje del Pequeño Pudú',
      tier: 'explorer', ageMin: 6, region: 'south', icon: '🦌',
      pages: [
        {
          en: 'In the deep southern forests of Chile, a tiny deer named Pablito opened his eyes early.',
          es: 'En los profundos bosques del sur de Chile, un diminuto ciervo llamado Pablito abrió los ojos temprano.',
          vocab: [
            { word: 'deer', wordEs: 'ciervo', def: 'A hoofed animal with antlers.', defEs: 'Un animal con pezuñas y cuernos.' },
            { word: 'forests', wordEs: 'bosques', def: 'Large areas covered with trees.', defEs: 'Grandes áreas cubiertas de árboles.' },
            { word: 'tiny', wordEs: 'diminuto', def: 'Very small.', defEs: 'Muy pequeño.' }
          ]
        },
        {
          en: 'He was a pudu, the smallest deer in the world, and he was looking for sweet leaves.',
          es: 'Era un pudú, el ciervo más pequeño del mundo, y buscaba hojas dulces.',
          vocab: [
            { word: 'smallest', wordEs: 'más pequeño', def: 'The least big.', defEs: 'El menos grande.' },
            { word: 'leaves', wordEs: 'hojas', def: 'The green parts of a tree or plant.', defEs: 'Las partes verdes de un árbol o planta.' }
          ]
        }
      ],
      quiz: [
        { q: 'What animal is Pablito?', qEs: '¿Qué animal es Pablito?', options: ['A horse', 'A dog', 'A deer', 'A bear'], optionsEs: ['Un caballo', 'Un perro', 'Un ciervo', 'Un oso'], answer: 2 },
        { q: 'What was Pablito looking for?', qEs: '¿Qué buscaba Pablito?', options: ['Water', 'Sweet leaves', 'His mother', 'A cave'], optionsEs: ['Agua', 'Hojas dulces', 'A su madre', 'Una cueva'], answer: 1 }
      ]
    },
    {
      id: 'glacier_explorer',
      title: 'The Great Glacier Explorer',
      titleEs: 'El Gran Explorador de Glaciares',
      tier: 'pilot', ageMin: 8, region: 'patagonia', icon: '🧊',
      pages: [
        {
          en: 'Far in the south of Patagonia, a brave explorer named Tomas set out to study the ancient glaciers.',
          es: 'Muy al sur en la Patagonia, un valiente explorador llamado Tomás se dispuso a estudiar los antiguos glaciares.',
          vocab: [
            { word: 'explorer', wordEs: 'explorador', def: 'A person who travels to unknown places.', defEs: 'Una persona que viaja a lugares desconocidos.' },
            { word: 'ancient', wordEs: 'antiguos', def: 'Very old; from a long time ago.', defEs: 'Muy viejos; de hace mucho tiempo.' },
            { word: 'glaciers', wordEs: 'glaciares', def: 'Huge masses of ice that move slowly.', defEs: 'Enormes masas de hielo que se mueven lentamente.' }
          ]
        },
        {
          en: 'The wind was freezing, and the ice sparkled like diamonds in the sun.',
          es: 'El viento era helado, y el hielo brillaba como diamantes al sol.',
          vocab: [
            { word: 'freezing', wordEs: 'helado', def: 'Very cold.', defEs: 'Muy frío.' },
            { word: 'sparkled', wordEs: 'brillaba', def: 'Shone brightly with flashes of light.', defEs: 'Brilló intensamente con destellos de luz.' },
            { word: 'diamonds', wordEs: 'diamantes', def: 'Precious, sparkling stones.', defEs: 'Piedras preciosas y brillantes.' }
          ]
        }
      ],
      quiz: [
        { q: 'What was Tomas studying?', qEs: '¿Qué estaba estudiando Tomás?', options: ['Forests', 'Glaciers', 'Deserts', 'Oceans'], optionsEs: ['Bosques', 'Glaciares', 'Desiertos', 'Océanos'], answer: 1 },
        { q: 'How did the ice look in the sun?', qEs: '¿Cómo se veía el hielo al sol?', options: ['Like rocks', 'Like diamonds', 'Like glass', 'Like water'], optionsEs: ['Como rocas', 'Como diamantes', 'Como cristal', 'Como agua'], answer: 1 }
      ]
    },
    {
      id: 'lost_map',
      title: 'The Lost Map',
      titleEs: 'El Mapa Perdido',
      tier: 'explorer', ageMin: 6, region: 'andes', icon: '🗺️',
      pages: [
        {
          en: 'One day, an explorer found a strange old map in a cave.',
          es: 'Un día, un explorador encontró un extraño mapa antiguo en una cueva.',
          vocab: [
            { word: 'explorer', wordEs: 'explorador', def: 'A person who travels to unknown places.', defEs: 'Una persona que viaja a lugares desconocidos.' },
            { word: 'strange', wordEs: 'extraño', def: 'Unusual or surprising.', defEs: 'Inusual o sorprendente.' },
            { word: 'map', wordEs: 'mapa', def: 'A drawing of a place showing where things are.', defEs: 'Un dibujo de un lugar que muestra dónde están las cosas.' }
          ]
        },
        {
          en: 'It showed a path leading to a hidden waterfall in the forest.',
          es: 'Mostraba un camino que llevaba a una cascada oculta en el bosque.',
          vocab: [
            { word: 'path', wordEs: 'camino', def: 'A track made for walking.', defEs: 'Una pista hecha para caminar.' },
            { word: 'waterfall', wordEs: 'cascada', def: 'Water falling from a height.', defEs: 'Agua cayendo desde una altura.' },
            { word: 'forest', wordEs: 'bosque', def: 'A large area covered with trees.', defEs: 'Una gran área cubierta de árboles.' }
          ]
        }
      ],
      quiz: [
        { q: 'Where did the explorer find the map?', qEs: '¿Dónde encontró el explorador el mapa?', options: ['In a house', 'In a cave', 'In a tree', 'In the river'], optionsEs: ['En una casa', 'En una cueva', 'En un árbol', 'En el río'], answer: 1 },
        { q: 'What did the map show the way to?', qEs: '¿Hacia dónde mostraba el camino el mapa?', options: ['A castle', 'A hidden waterfall', 'A city', 'A treasure chest'], optionsEs: ['A un castillo', 'A una cascada oculta', 'A una ciudad', 'A un cofre del tesoro'], answer: 1 }
      ]
    },
    {
      id: 'atacama_desert',
      title: 'The Atacama Desert',
      titleEs: 'El Desierto de Atacama',
      tier: 'explorer', ageMin: 6, region: 'north', icon: '🏜️',
      pages: [
        {
          en: 'The desert is very dry. It has not rained in years.',
          es: 'El desierto es muy seco. No ha llovido en años.',
          vocab: [
            { word: 'desert', wordEs: 'desierto', def: 'A very dry place with little water.', defEs: 'Un lugar muy seco con poca agua.' },
            { word: 'dry', wordEs: 'seco', def: 'Having no water or rain.', defEs: 'Que no tiene agua ni lluvia.' }
          ]
        },
        {
          en: 'At night, the sky is full of stars and the moon shines bright.',
          es: 'Por la noche, el cielo está lleno de estrellas y la luna brilla.',
          vocab: [
            { word: 'night', wordEs: 'noche', def: 'The time when the sun is down.', defEs: 'El momento en que el sol se oculta.' },
            { word: 'sky', wordEs: 'cielo', def: 'The space over the earth where we see clouds and stars.', defEs: 'El espacio sobre la tierra donde vemos nubes y estrellas.' },
            { word: 'stars', wordEs: 'estrellas', def: 'Bright lights in the night sky.', defEs: 'Luces brillantes en el cielo nocturno.' }
          ]
        }
      ],
      quiz: [
        { q: 'What is the desert like?', qEs: '¿Cómo es el desierto?', options: ['Wet', 'Cold', 'Dry', 'Green'], optionsEs: ['Húmedo', 'Frío', 'Seco', 'Verde'], answer: 2 },
        { q: 'What can you see at night?', qEs: '¿Qué puedes ver de noche?', options: ['Birds', 'Stars', 'Clouds', 'Sun'], optionsEs: ['Pájaros', 'Estrellas', 'Nubes', 'Sol'], answer: 1 }
      ]
    },
    {
      id: 'moon_landing',
      title: 'The Great Moon Landing',
      titleEs: 'El Gran Alunizaje',
      tier: 'commander', ageMin: 10, region: 'space', icon: '🌕',
      pages: [
        {
          en: 'The rocket roared as it lifted off the ground, heading toward the moon.',
          es: 'El cohete rugió mientras despegaba del suelo, dirigiéndose hacia la luna.',
          vocab: [
            { word: 'rocket', wordEs: 'cohete', def: 'A vehicle used for space travel.', defEs: 'Un vehículo usado para viajar al espacio.' },
            { word: 'roared', wordEs: 'rugió', def: 'Made a loud, deep sound.', defEs: 'Hizo un sonido fuerte y profundo.' }
          ]
        },
        {
          en: 'Astronauts looked out the small window. Earth looked like a blue marble.',
          es: 'Los astronautas miraban por la pequeña ventana. La Tierra parecía una canica azul.',
          vocab: [
            { word: 'astronauts', wordEs: 'astronautas', def: 'People who travel in space.', defEs: 'Personas que viajan en el espacio.' },
            { word: 'marble', wordEs: 'canica', def: 'A small glass ball.', defEs: 'Una pequeña bola de cristal.' }
          ]
        },
        {
          en: 'Finally, they landed. They carefully stepped out and walked on the dusty surface.',
          es: 'Finalmente, aterrizaron. Con cuidado salieron y caminaron sobre la superficie polvorienta.',
          vocab: [
            { word: 'dusty', wordEs: 'polvorienta', def: 'Covered with fine dirt.', defEs: 'Cubierta con tierra fina.' },
            { word: 'surface', wordEs: 'superficie', def: 'The outside layer.', defEs: 'La capa exterior.' }
          ]
        }
      ],
      quiz: [
        { q: 'Where was the rocket going?', qEs: '¿A dónde iba el cohete?', options: ['The Sun', 'Mars', 'The Moon', 'Jupiter'], optionsEs: ['Al Sol', 'A Marte', 'A la Luna', 'A Júpiter'], answer: 2 },
        { q: 'What did Earth look like from space?', qEs: '¿Cómo se veía la Tierra desde el espacio?', options: ['A red square', 'A blue marble', 'A white cloud', 'A green leaf'], optionsEs: ['Un cuadrado rojo', 'Una canica azul', 'Una nube blanca', 'Una hoja verde'], answer: 1 }
      ]
    },
    {
      id: 'darwin_patagonia',
      title: 'Darwin in Patagonia',
      titleEs: 'Darwin en la Patagonia',
      tier: 'pilot', ageMin: 8, region: 'patagonia', icon: '🔬',
      pages: [
        {
          en: 'In 1834, a young naturalist named Charles Darwin sailed along the coast of Patagonia aboard the ship HMS Beagle. He had come to observe the plants, animals, and rocks of South America.',
          es: 'En 1834, un joven naturalista llamado Charles Darwin navegó por la costa de la Patagonia a bordo del barco HMS Beagle. Había venido a observar las plantas, los animales y las rocas de Sudamérica.',
          vocab: [
            { word: 'naturalist', wordEs: 'naturalista', def: 'A scientist who studies nature.', defEs: 'Un científico que estudia la naturaleza.' },
            { word: 'observe', wordEs: 'observar', def: 'To watch something carefully.', defEs: 'Mirar algo con atención.' },
            { word: 'coast', wordEs: 'costa', def: 'Land next to the sea.', defEs: 'Tierra junto al mar.' },
            { word: 'aboard', wordEs: 'a bordo', def: 'On or inside a ship.', defEs: 'Sobre o dentro de un barco.' }
          ]
        },
        {
          en: 'Darwin walked across the dry plains and found the bones of giant animals buried in the cliffs. These fossils belonged to creatures that no longer lived on Earth.',
          es: 'Darwin caminó por las llanuras secas y encontró los huesos de animales gigantes enterrados en los acantilados. Estos fósiles pertenecían a criaturas que ya no vivían en la Tierra.',
          vocab: [
            { word: 'plains', wordEs: 'llanuras', def: 'Large flat areas of land.', defEs: 'Grandes zonas planas de tierra.' },
            { word: 'fossils', wordEs: 'fósiles', def: 'Remains of ancient living things preserved in rock.', defEs: 'Restos de seres vivos antiguos conservados en la roca.' },
            { word: 'cliffs', wordEs: 'acantilados', def: 'Steep walls of rock.', defEs: 'Paredes empinadas de roca.' },
            { word: 'creatures', wordEs: 'criaturas', def: 'Living animals.', defEs: 'Animales vivos.' }
          ]
        },
        {
          en: 'He carefully collected specimens and wrote detailed notes in his journal. He compared the living guanacos and rheas with the ancient bones he had dug up.',
          es: 'Recolectó cuidadosamente muestras y escribió notas detalladas en su diario. Comparó los guanacos y ñandúes vivos con los huesos antiguos que había desenterrado.',
          vocab: [
            { word: 'specimens', wordEs: 'muestras', def: 'Examples collected for study.', defEs: 'Ejemplos recogidos para estudiar.' },
            { word: 'journal', wordEs: 'diario', def: 'A book where you write daily notes.', defEs: 'Un libro donde se escriben notas diarias.' },
            { word: 'compared', wordEs: 'comparó', def: 'Looked at how things are alike or different.', defEs: 'Observó en qué se parecen o diferencian las cosas.' },
            { word: 'ancient', wordEs: 'antiguos', def: 'Very old, from long ago.', defEs: 'Muy viejos, de hace mucho tiempo.' }
          ]
        },
        {
          en: 'Darwin noticed that animals in different regions had small differences. He wondered why species seemed so well suited to their surroundings.',
          es: 'Darwin notó que los animales de distintas regiones tenían pequeñas diferencias. Se preguntó por qué las especies parecían tan bien adaptadas a su entorno.',
          vocab: [
            { word: 'species', wordEs: 'especies', def: 'A group of similar living things.', defEs: 'Un grupo de seres vivos similares.' },
            { word: 'differences', wordEs: 'diferencias', def: 'Ways in which things are not the same.', defEs: 'Maneras en que las cosas no son iguales.' },
            { word: 'suited', wordEs: 'adaptadas', def: 'Right or fitting for something.', defEs: 'Apropiadas o adecuadas para algo.' },
            { word: 'surroundings', wordEs: 'entorno', def: 'The area and conditions around you.', defEs: 'El área y las condiciones a tu alrededor.' }
          ]
        },
        {
          en: 'The Beagle continued south toward the channels and islands near Tierra del Fuego. The cold, stormy waters made the voyage difficult and dangerous.',
          es: 'El Beagle siguió hacia el sur, hacia los canales e islas cerca de Tierra del Fuego. Las aguas frías y tormentosas hicieron el viaje difícil y peligroso.',
          vocab: [
            { word: 'channels', wordEs: 'canales', def: 'Narrow stretches of water between lands.', defEs: 'Tramos estrechos de agua entre tierras.' },
            { word: 'voyage', wordEs: 'viaje', def: 'A long journey by sea.', defEs: 'Un viaje largo por mar.' },
            { word: 'stormy', wordEs: 'tormentosas', def: 'With strong wind and rain.', defEs: 'Con viento fuerte y lluvia.' },
            { word: 'dangerous', wordEs: 'peligroso', def: 'Likely to cause harm.', defEs: 'Que puede causar daño.' }
          ]
        },
        {
          en: 'Years later, the things Darwin saw in Patagonia helped him develop his ideas about how living things change slowly over time. His careful observations became part of the history of science.',
          es: 'Años después, las cosas que Darwin vio en la Patagonia lo ayudaron a desarrollar sus ideas sobre cómo los seres vivos cambian lentamente con el tiempo. Sus observaciones cuidadosas se convirtieron en parte de la historia de la ciencia.',
          vocab: [
            { word: 'develop', wordEs: 'desarrollar', def: 'To build up or grow an idea.', defEs: 'Construir o hacer crecer una idea.' },
            { word: 'gradually', wordEs: 'lentamente', def: 'Slowly, little by little.', defEs: 'Despacio, poco a poco.' },
            { word: 'observations', wordEs: 'observaciones', def: 'Things noticed by watching carefully.', defEs: 'Cosas notadas al mirar con atención.' },
            { word: 'science', wordEs: 'ciencia', def: 'The study of the natural world through facts.', defEs: 'El estudio del mundo natural mediante hechos.' }
          ]
        }
      ],
      quiz: [
        { q: 'What was Charles Darwin?', qEs: '¿Qué era Charles Darwin?', options: ['A pirate', 'A naturalist', 'A king', 'A farmer'], optionsEs: ['Un pirata', 'Un naturalista', 'Un rey', 'Un granjero'], answer: 1 },
        { q: 'What did Darwin find buried in the cliffs?', qEs: '¿Qué encontró Darwin enterrado en los acantilados?', options: ['Gold coins', 'Fossils of giant animals', 'A lost ship', 'Fresh fruit'], optionsEs: ['Monedas de oro', 'Fósiles de animales gigantes', 'Un barco perdido', 'Fruta fresca'], answer: 1 },
        { q: 'What ship did Darwin sail on?', qEs: '¿En qué barco navegó Darwin?', options: ['The Santa María', 'The Beagle', 'The Titanic', 'The Esmeralda'], optionsEs: ['El Santa María', 'El Beagle', 'El Titanic', 'La Esmeralda'], answer: 1 }
      ]
    },
    {
      id: 'valdivia_1960',
      title: 'The Great Valdivia Earthquake',
      titleEs: 'El Gran Terremoto de Valdivia',
      tier: 'pilot', ageMin: 8, region: 'south', icon: '🌊',
      pages: [
        {
          en: 'On May 22, 1960, the ground near the city of Valdivia in southern Chile began to shake violently. It was the most powerful earthquake ever recorded, reaching a magnitude of 9.5.',
          es: 'El 22 de mayo de 1960, el suelo cerca de la ciudad de Valdivia, en el sur de Chile, comenzó a temblar violentamente. Fue el terremoto más potente jamás registrado, alcanzando una magnitud de 9,5.',
          vocab: [
            { word: 'earthquake', wordEs: 'terremoto', def: 'A sudden shaking of the ground.', defEs: 'Un temblor repentino del suelo.' },
            { word: 'magnitude', wordEs: 'magnitud', def: 'A number that measures how strong an earthquake is.', defEs: 'Un número que mide cuán fuerte es un terremoto.' },
            { word: 'recorded', wordEs: 'registrado', def: 'Measured and written down.', defEs: 'Medido y anotado.' },
            { word: 'violently', wordEs: 'violentamente', def: 'With great force.', defEs: 'Con mucha fuerza.' }
          ]
        },
        {
          en: 'The earthquake happened because two giant pieces of the Earth\'s crust, called tectonic plates, suddenly slipped past each other deep below the ocean floor.',
          es: 'El terremoto ocurrió porque dos piezas gigantes de la corteza de la Tierra, llamadas placas tectónicas, se deslizaron de repente una sobre otra en lo profundo del fondo del océano.',
          vocab: [
            { word: 'crust', wordEs: 'corteza', def: 'The hard outer layer of the Earth.', defEs: 'La capa exterior dura de la Tierra.' },
            { word: 'tectonic plates', wordEs: 'placas tectónicas', def: 'Huge moving pieces of the Earth\'s surface.', defEs: 'Enormes piezas móviles de la superficie de la Tierra.' },
            { word: 'slipped', wordEs: 'deslizaron', def: 'Moved smoothly and suddenly.', defEs: 'Se movieron suave y repentinamente.' },
            { word: 'beneath', wordEs: 'debajo', def: 'Under something.', defEs: 'Debajo de algo.' }
          ]
        },
        {
          en: 'Minutes after the shaking stopped, the sea pulled back from the shore. Then a huge wave called a tsunami rushed onto the land, flooding towns along the coast.',
          es: 'Minutos después de que el temblor se detuvo, el mar se retiró de la orilla. Luego una ola enorme llamada tsunami se precipitó sobre la tierra, inundando pueblos a lo largo de la costa.',
          vocab: [
            { word: 'tsunami', wordEs: 'tsunami', def: 'A giant ocean wave caused by an earthquake.', defEs: 'Una ola oceánica gigante causada por un terremoto.' },
            { word: 'shore', wordEs: 'orilla', def: 'The land at the edge of the sea.', defEs: 'La tierra al borde del mar.' },
            { word: 'flooding', wordEs: 'inundando', def: 'Covering with water.', defEs: 'Cubriendo con agua.' },
            { word: 'rushed', wordEs: 'se precipitó', def: 'Moved very fast.', defEs: 'Se movió muy rápido.' }
          ]
        },
        {
          en: 'The tsunami was so strong that it traveled all the way across the Pacific Ocean, reaching Hawaii and Japan many hours later. Scientists studied how the waves spread so far.',
          es: 'El tsunami fue tan fuerte que viajó por todo el océano Pacífico, llegando a Hawái y Japón muchas horas después. Los científicos estudiaron cómo las olas se propagaron tan lejos.',
          vocab: [
            { word: 'traveled', wordEs: 'viajó', def: 'Moved from one place to another.', defEs: 'Se movió de un lugar a otro.' },
            { word: 'spread', wordEs: 'propagaron', def: 'Moved out over a wide area.', defEs: 'Se extendieron por una amplia zona.' },
            { word: 'scientists', wordEs: 'científicos', def: 'People who study the natural world.', defEs: 'Personas que estudian el mundo natural.' },
            { word: 'distance', wordEs: 'distancia', def: 'The amount of space between two places.', defEs: 'La cantidad de espacio entre dos lugares.' }
          ]
        },
        {
          en: 'After the disaster, engineers and scientists learned important lessons. They began to design stronger buildings and create warning systems to keep people safe.',
          es: 'Después del desastre, los ingenieros y científicos aprendieron lecciones importantes. Comenzaron a diseñar edificios más fuertes y a crear sistemas de alerta para mantener a salvo a las personas.',
          vocab: [
            { word: 'disaster', wordEs: 'desastre', def: 'A very harmful event.', defEs: 'Un evento muy dañino.' },
            { word: 'engineers', wordEs: 'ingenieros', def: 'People who design and build things.', defEs: 'Personas que diseñan y construyen cosas.' },
            { word: 'warning', wordEs: 'alerta', def: 'A message that danger is coming.', defEs: 'Un mensaje de que viene un peligro.' },
            { word: 'design', wordEs: 'diseñar', def: 'To plan how something will be made.', defEs: 'Planear cómo se hará algo.' }
          ]
        },
        {
          en: 'Today, the 1960 Valdivia earthquake is still studied around the world. It taught people how the Earth works and how communities can recover and rebuild after a great challenge.',
          es: 'Hoy, el terremoto de Valdivia de 1960 todavía se estudia en todo el mundo. Enseñó a las personas cómo funciona la Tierra y cómo las comunidades pueden recuperarse y reconstruir después de un gran desafío.',
          vocab: [
            { word: 'communities', wordEs: 'comunidades', def: 'Groups of people who live together.', defEs: 'Grupos de personas que viven juntas.' },
            { word: 'recover', wordEs: 'recuperarse', def: 'To return to normal after trouble.', defEs: 'Volver a la normalidad después de un problema.' },
            { word: 'rebuild', wordEs: 'reconstruir', def: 'To build again.', defEs: 'Construir de nuevo.' },
            { word: 'challenge', wordEs: 'desafío', def: 'A hard task to overcome.', defEs: 'Una tarea difícil de superar.' }
          ]
        }
      ],
      quiz: [
        { q: 'How strong was the 1960 Valdivia earthquake?', qEs: '¿Qué tan fuerte fue el terremoto de Valdivia de 1960?', options: ['Magnitude 5.0', 'Magnitude 9.5', 'Magnitude 3.2', 'Magnitude 7.0'], optionsEs: ['Magnitud 5,0', 'Magnitud 9,5', 'Magnitud 3,2', 'Magnitud 7,0'], answer: 1 },
        { q: 'What giant wave followed the earthquake?', qEs: '¿Qué ola gigante siguió al terremoto?', options: ['A tsunami', 'A waterfall', 'A whirlpool', 'A rainbow'], optionsEs: ['Un tsunami', 'Una cascada', 'Un remolino', 'Un arcoíris'], answer: 0 },
        { q: 'What did scientists and engineers do after the disaster?', qEs: '¿Qué hicieron los científicos e ingenieros después del desastre?', options: ['Nothing changed', 'They designed stronger buildings and warning systems', 'They moved the ocean', 'They stopped studying earthquakes'], optionsEs: ['Nada cambió', 'Diseñaron edificios más fuertes y sistemas de alerta', 'Movieron el océano', 'Dejaron de estudiar los terremotos'], answer: 1 }
      ]
    },
    {
      id: 'crossing_andes',
      title: 'Crossing the Andes',
      titleEs: 'El Cruce de los Andes',
      tier: 'commander', ageMin: 10, region: 'andes', icon: '⛰️',
      pages: [
        {
          en: 'In 1817, a brave army set out to free Chile from Spanish rule. The soldiers were led by General José de San Martín and the Chilean patriot Bernardo O\'Higgins.',
          es: 'En 1817, un valiente ejército partió para liberar a Chile del dominio español. Los soldados eran liderados por el general José de San Martín y el patriota chileno Bernardo O\'Higgins.',
          vocab: [
            { word: 'army', wordEs: 'ejército', def: 'A large group of soldiers.', defEs: 'Un gran grupo de soldados.' },
            { word: 'liberate', wordEs: 'liberar', def: 'To set free.', defEs: 'Dejar en libertad.' },
            { word: 'patriot', wordEs: 'patriota', def: 'A person who loves and defends their country.', defEs: 'Una persona que ama y defiende su país.' },
            { word: 'general', wordEs: 'general', def: 'A high-ranking military leader.', defEs: 'Un líder militar de alto rango.' }
          ]
        },
        {
          en: 'To reach Chile, the army had to cross the towering Andes mountains. The high passes were freezing, and the thin air made it hard for the men and animals to breathe.',
          es: 'Para llegar a Chile, el ejército tuvo que cruzar las imponentes montañas de los Andes. Los pasos altos eran helados, y el aire enrarecido dificultaba que los hombres y los animales respiraran.',
          vocab: [
            { word: 'towering', wordEs: 'imponentes', def: 'Very tall and impressive.', defEs: 'Muy altas e impresionantes.' },
            { word: 'passes', wordEs: 'pasos', def: 'Routes through mountains.', defEs: 'Rutas a través de las montañas.' },
            { word: 'altitude', wordEs: 'altitud', def: 'Height above sea level.', defEs: 'Altura sobre el nivel del mar.' },
            { word: 'breathe', wordEs: 'respirar', def: 'To take air into the lungs.', defEs: 'Tomar aire en los pulmones.' }
          ]
        },
        {
          en: 'San Martín planned the journey with great care. He sent the army through several different mountain routes at once to confuse the Spanish forces waiting in Chile.',
          es: 'San Martín planificó el viaje con gran cuidado. Envió al ejército por varias rutas de montaña distintas a la vez para confundir a las fuerzas españolas que esperaban en Chile.',
          vocab: [
            { word: 'planned', wordEs: 'planificó', def: 'Decided in advance how to do something.', defEs: 'Decidió de antemano cómo hacer algo.' },
            { word: 'strategy', wordEs: 'estrategia', def: 'A clever plan to reach a goal.', defEs: 'Un plan ingenioso para lograr un objetivo.' },
            { word: 'routes', wordEs: 'rutas', def: 'Paths from one place to another.', defEs: 'Caminos de un lugar a otro.' },
            { word: 'confuse', wordEs: 'confundir', def: 'To make someone unsure of what is true.', defEs: 'Hacer que alguien no esté seguro de lo que es verdad.' }
          ]
        },
        {
          en: 'The march was exhausting. Many mules and horses did not survive the cold and the steep climbs, but the determined soldiers pressed onward toward their goal.',
          es: 'La marcha fue agotadora. Muchas mulas y caballos no sobrevivieron al frío y a las empinadas subidas, pero los soldados decididos siguieron adelante hacia su meta.',
          vocab: [
            { word: 'march', wordEs: 'marcha', def: 'A long walk by an army.', defEs: 'Una larga caminata de un ejército.' },
            { word: 'exhausting', wordEs: 'agotadora', def: 'Making one very tired.', defEs: 'Que cansa mucho.' },
            { word: 'determined', wordEs: 'decididos', def: 'Firmly set on doing something.', defEs: 'Firmemente resueltos a hacer algo.' },
            { word: 'survive', wordEs: 'sobrevivir', def: 'To stay alive through danger.', defEs: 'Permanecer vivo a pesar del peligro.' }
          ]
        },
        {
          en: 'On February 12, 1817, the army surprised the Spanish at the Battle of Chacabuco and won a great victory. The road to the capital, Santiago, was now open.',
          es: 'El 12 de febrero de 1817, el ejército sorprendió a los españoles en la Batalla de Chacabuco y obtuvo una gran victoria. El camino hacia la capital, Santiago, ahora estaba abierto.',
          vocab: [
            { word: 'battle', wordEs: 'batalla', def: 'A fight between armies.', defEs: 'Una lucha entre ejércitos.' },
            { word: 'surprised', wordEs: 'sorprendió', def: 'Attacked unexpectedly.', defEs: 'Atacó de forma inesperada.' },
            { word: 'victory', wordEs: 'victoria', def: 'A win in a contest or battle.', defEs: 'Un triunfo en una competencia o batalla.' },
            { word: 'capital', wordEs: 'capital', def: 'The main city of a country.', defEs: 'La ciudad principal de un país.' }
          ]
        },
        {
          en: 'The crossing of the Andes is remembered as one of the most daring military feats in history. It helped Chile move toward declaring its full independence in 1818.',
          es: 'El cruce de los Andes es recordado como una de las hazañas militares más audaces de la historia. Ayudó a que Chile avanzara hacia la declaración de su independencia total en 1818.',
          vocab: [
            { word: 'daring', wordEs: 'audaz', def: 'Bold and brave.', defEs: 'Atrevido y valiente.' },
            { word: 'feat', wordEs: 'hazaña', def: 'A great achievement.', defEs: 'Un gran logro.' },
            { word: 'independence', wordEs: 'independencia', def: 'Freedom from the control of another country.', defEs: 'Libertad del control de otro país.' },
            { word: 'declare', wordEs: 'declarar', def: 'To say something officially.', defEs: 'Decir algo de manera oficial.' }
          ]
        }
      ],
      quiz: [
        { q: 'Who led the army across the Andes with O\'Higgins?', qEs: '¿Quién lideró el ejército a través de los Andes junto a O\'Higgins?', options: ['Diego de Almagro', 'José de San Martín', 'Pedro de Valdivia', 'Charles Darwin'], optionsEs: ['Diego de Almagro', 'José de San Martín', 'Pedro de Valdivia', 'Charles Darwin'], answer: 1 },
        { q: 'Why was crossing the Andes so difficult?', qEs: '¿Por qué fue tan difícil cruzar los Andes?', options: ['It was too hot and sunny', 'The cold, height, and thin air', 'There were too many roads', 'The mountains were very small'], optionsEs: ['Hacía demasiado calor y sol', 'El frío, la altura y el aire enrarecido', 'Había demasiados caminos', 'Las montañas eran muy pequeñas'], answer: 1 },
        { q: 'What victory opened the road to Santiago in 1817?', qEs: '¿Qué victoria abrió el camino a Santiago en 1817?', options: ['The Battle of Maipú', 'The Battle of Chacabuco', 'The Naval Combat of Iquique', 'The Battle of Rancagua'], optionsEs: ['La Batalla de Maipú', 'La Batalla de Chacabuco', 'El Combate Naval de Iquique', 'La Batalla de Rancagua'], answer: 1 }
      ]
    },
    {
      id: 'atacama_stars',
      title: 'Stargazing in the Atacama',
      titleEs: 'Observando las Estrellas en Atacama',
      tier: 'commander', ageMin: 10, region: 'north', icon: '🔭',
      pages: [
        {
          en: 'High in the north of Chile lies the Atacama Desert, one of the driest places on Earth. Some parts of it can go years without a single drop of rain.',
          es: 'En lo alto del norte de Chile se encuentra el desierto de Atacama, uno de los lugares más secos de la Tierra. Algunas partes pueden pasar años sin una sola gota de lluvia.',
          vocab: [
            { word: 'desert', wordEs: 'desierto', def: 'A very dry region with little rain.', defEs: 'Una región muy seca con poca lluvia.' },
            { word: 'driest', wordEs: 'más seco', def: 'Having the least water.', defEs: 'Que tiene la menor cantidad de agua.' },
            { word: 'region', wordEs: 'región', def: 'A particular area of land.', defEs: 'Una zona particular de tierra.' },
            { word: 'rainfall', wordEs: 'lluvia', def: 'The amount of rain that falls.', defEs: 'La cantidad de lluvia que cae.' }
          ]
        },
        {
          en: 'Because the air is so dry and clear, and there are few city lights, the Atacama has some of the best night skies in the world for studying the stars.',
          es: 'Como el aire es tan seco y claro, y hay pocas luces de ciudad, Atacama tiene algunos de los mejores cielos nocturnos del mundo para estudiar las estrellas.',
          vocab: [
            { word: 'clear', wordEs: 'claro', def: 'Easy to see through.', defEs: 'Fácil de ver a través.' },
            { word: 'transparent', wordEs: 'transparente', def: 'Allowing light to pass through.', defEs: 'Que deja pasar la luz.' },
            { word: 'astronomy', wordEs: 'astronomía', def: 'The study of stars and space.', defEs: 'El estudio de las estrellas y el espacio.' },
            { word: 'observe', wordEs: 'observar', def: 'To watch carefully.', defEs: 'Mirar con atención.' }
          ]
        },
        {
          en: 'Scientists from many countries built large observatories on the desert mountains. One of the most famous is ALMA, a group of giant radio telescopes on a high plateau.',
          es: 'Científicos de muchos países construyeron grandes observatorios en las montañas del desierto. Uno de los más famosos es ALMA, un conjunto de gigantescos radiotelescopios en una meseta alta.',
          vocab: [
            { word: 'observatories', wordEs: 'observatorios', def: 'Buildings for watching the sky.', defEs: 'Edificios para observar el cielo.' },
            { word: 'telescopes', wordEs: 'telescopios', def: 'Tools that make distant objects look closer.', defEs: 'Herramientas que hacen ver más cercanos los objetos lejanos.' },
            { word: 'plateau', wordEs: 'meseta', def: 'A flat area of high land.', defEs: 'Una zona plana de tierra elevada.' },
            { word: 'instrument', wordEs: 'instrumento', def: 'A tool used for a special job.', defEs: 'Una herramienta usada para un trabajo especial.' }
          ]
        },
        {
          en: 'Radio telescopes do not collect light the way our eyes do. Instead, they gather invisible radio waves that come from clouds of gas and dust between the stars.',
          es: 'Los radiotelescopios no captan la luz como lo hacen nuestros ojos. En cambio, recogen ondas de radio invisibles que provienen de nubes de gas y polvo entre las estrellas.',
          vocab: [
            { word: 'radio waves', wordEs: 'ondas de radio', def: 'A kind of invisible energy that travels through space.', defEs: 'Un tipo de energía invisible que viaja por el espacio.' },
            { word: 'invisible', wordEs: 'invisible', def: 'Not able to be seen.', defEs: 'Que no se puede ver.' },
            { word: 'gather', wordEs: 'recoger', def: 'To collect together.', defEs: 'Reunir o juntar.' },
            { word: 'galaxy', wordEs: 'galaxia', def: 'A huge system of stars in space.', defEs: 'Un enorme sistema de estrellas en el espacio.' }
          ]
        },
        {
          en: 'With these telescopes, astronomers can study how stars and planets are born. They have even watched faraway galaxies that formed billions of years ago.',
          es: 'Con estos telescopios, los astrónomos pueden estudiar cómo nacen las estrellas y los planetas. Incluso han observado galaxias lejanas que se formaron hace miles de millones de años.',
          vocab: [
            { word: 'astronomers', wordEs: 'astrónomos', def: 'Scientists who study space.', defEs: 'Científicos que estudian el espacio.' },
            { word: 'planets', wordEs: 'planetas', def: 'Large bodies that orbit a star.', defEs: 'Cuerpos grandes que giran alrededor de una estrella.' },
            { word: 'faraway', wordEs: 'lejanas', def: 'Very distant.', defEs: 'Muy distantes.' },
            { word: 'formed', wordEs: 'se formaron', def: 'Came into being.', defEs: 'Llegaron a existir.' }
          ]
        },
        {
          en: 'Soon an even bigger telescope, called the Extremely Large Telescope, will open in the Atacama. Chile has become one of the most important places on Earth for exploring the universe.',
          es: 'Pronto se inaugurará un telescopio aún más grande, llamado Telescopio Extremadamente Grande, en Atacama. Chile se ha convertido en uno de los lugares más importantes de la Tierra para explorar el universo.',
          vocab: [
            { word: 'extremely', wordEs: 'extremadamente', def: 'To a very high degree.', defEs: 'En un grado muy alto.' },
            { word: 'universe', wordEs: 'universo', def: 'Everything that exists in space.', defEs: 'Todo lo que existe en el espacio.' },
            { word: 'explore', wordEs: 'explorar', def: 'To travel and discover new things.', defEs: 'Viajar y descubrir cosas nuevas.' },
            { word: 'important', wordEs: 'importante', def: 'Having great value or meaning.', defEs: 'Que tiene gran valor o significado.' }
          ]
        }
      ],
      quiz: [
        { q: 'Why is the Atacama Desert good for studying the stars?', qEs: '¿Por qué el desierto de Atacama es bueno para estudiar las estrellas?', options: ['It rains a lot', 'The air is dry and clear with few city lights', 'It is full of forests', 'It is very crowded'], optionsEs: ['Llueve mucho', 'El aire es seco y claro con pocas luces de ciudad', 'Está lleno de bosques', 'Está muy lleno de gente'], answer: 1 },
        { q: 'What is ALMA?', qEs: '¿Qué es ALMA?', options: ['A famous mountain', 'A group of giant radio telescopes', 'A type of star', 'A river in the desert'], optionsEs: ['Una montaña famosa', 'Un conjunto de gigantescos radiotelescopios', 'Un tipo de estrella', 'Un río en el desierto'], answer: 1 },
        { q: 'What do radio telescopes gather?', qEs: '¿Qué recogen los radiotelescopios?', options: ['Sunlight only', 'Invisible radio waves from space', 'Rain water', 'Desert sand'], optionsEs: ['Solo luz solar', 'Ondas de radio invisibles del espacio', 'Agua de lluvia', 'Arena del desierto'], answer: 1 }
      ]
    },
    // ── Added with the illustrated edition (new stories go at the END) ──
    {
      id: 'penguin_coast',
      title: 'Pipo the Penguin',
      titleEs: 'Pipo el Pingüino',
      tier: 'cadet', ageMin: 4, region: 'north', icon: '🐧',
      pages: [
        {
          en: 'On the rocky coast of northern Chile lives a penguin named Pipo. He is a Humboldt penguin.',
          es: 'En la costa rocosa del norte de Chile vive un pingüino llamado Pipo. Es un pingüino de Humboldt.',
          vocab: [
            { word: 'coast', wordEs: 'costa', def: 'The land next to the sea.', defEs: 'La tierra junto al mar.' },
            { word: 'penguin', wordEs: 'pingüino', def: 'A bird that swims very well but cannot fly.', defEs: 'Un ave que nada muy bien pero no puede volar.' },
            { word: 'rocky', wordEs: 'rocosa', def: 'Full of rocks.', defEs: 'Llena de rocas.' }
          ]
        },
        {
          en: 'Pipo has a black band across his white chest. Every Humboldt penguin has one!',
          es: 'Pipo tiene una franja negra sobre su pecho blanco. ¡Todos los pingüinos de Humboldt tienen una!',
          vocab: [
            { word: 'band', wordEs: 'franja', def: 'A long, thin stripe.', defEs: 'Una raya larga y delgada.' },
            { word: 'chest', wordEs: 'pecho', def: 'The front of the body, below the neck.', defEs: 'La parte delantera del cuerpo, bajo el cuello.' }
          ]
        },
        {
          en: 'Pipo cannot fly, but he is a fast swimmer. He uses his wings like flippers to chase little fish.',
          es: 'Pipo no puede volar, pero es un nadador rápido. Usa sus alas como aletas para perseguir pececitos.',
          vocab: [
            { word: 'swimmer', wordEs: 'nadador', def: 'Someone who swims.', defEs: 'Alguien que nada.' },
            { word: 'flippers', wordEs: 'aletas', def: 'Flat body parts used for swimming.', defEs: 'Partes planas del cuerpo que sirven para nadar.' },
            { word: 'chase', wordEs: 'perseguir', def: 'To go quickly after something.', defEs: 'Ir rápido detrás de algo.' }
          ]
        },
        {
          en: 'In the evening, Pipo waddles home to his nest in a cozy burrow, where his family is waiting.',
          es: 'Al atardecer, Pipo camina balanceándose hasta su nido en una acogedora madriguera, donde lo espera su familia.',
          vocab: [
            { word: 'waddles', wordEs: 'balanceándose', def: 'Walks with short steps, rocking from side to side.', defEs: 'Caminando con pasos cortos, meciéndose de lado a lado.' },
            { word: 'burrow', wordEs: 'madriguera', def: 'A hole in the ground where an animal lives.', defEs: 'Un hoyo en la tierra donde vive un animal.' },
            { word: 'nest', wordEs: 'nido', def: 'A home where birds lay eggs and raise their chicks.', defEs: 'Un hogar donde las aves ponen huevos y crían a sus polluelos.' }
          ]
        }
      ],
      quiz: [
        { q: 'Where does Pipo live?', qEs: '¿Dónde vive Pipo?', options: ['On a snowy mountain', 'On the rocky coast of northern Chile', 'In a big city', 'In a jungle'], optionsEs: ['En una montaña nevada', 'En la costa rocosa del norte de Chile', 'En una gran ciudad', 'En una selva'], answer: 1 },
        { q: 'What does Pipo use like flippers?', qEs: '¿Qué usa Pipo como aletas?', options: ['His feet', 'His tail', 'His wings', 'His beak'], optionsEs: ['Sus patas', 'Su cola', 'Sus alas', 'Su pico'], answer: 2 },
        { q: 'Where is Pipo\'s nest?', qEs: '¿Dónde está el nido de Pipo?', options: ['In a tree', 'In a cozy burrow', 'On a boat', 'In a sand castle'], optionsEs: ['En un árbol', 'En una acogedora madriguera', 'En un bote', 'En un castillo de arena'], answer: 1 }
      ]
    },
    {
      id: 'empanadas',
      title: 'Empanadas for the Fiesta',
      titleEs: 'Empanadas para la Fiesta',
      tier: 'cadet', ageMin: 4, region: 'central', icon: '🥟',
      pages: [
        {
          en: 'It is September in Chile, and the Fiestas Patrias are coming. Sofía and her grandma are making empanadas.',
          es: 'Es septiembre en Chile y se acercan las Fiestas Patrias. Sofía y su abuela están haciendo empanadas.',
          vocab: [
            { word: 'September', wordEs: 'septiembre', def: 'The ninth month of the year.', defEs: 'El noveno mes del año.' },
            { word: 'grandma', wordEs: 'abuela', def: 'The mother of your mom or dad.', defEs: 'La mamá de tu mamá o de tu papá.' }
          ]
        },
        {
          en: 'Grandma rolls out the dough. Sofía helps fill each one with pino: beef, onion, an olive and a piece of egg.',
          es: 'La abuela estira la masa. Sofía ayuda a rellenar cada una con pino: carne, cebolla, una aceituna y un trozo de huevo.',
          vocab: [
            { word: 'dough', wordEs: 'masa', def: 'A soft mix of flour and water for baking.', defEs: 'Una mezcla suave de harina y agua para hornear.' },
            { word: 'onion', wordEs: 'cebolla', def: 'A round vegetable with a strong taste.', defEs: 'Una verdura redonda de sabor fuerte.' },
            { word: 'olive', wordEs: 'aceituna', def: 'A small green or black fruit.', defEs: 'Un fruto pequeño, verde o negro.' }
          ]
        },
        {
          en: 'They fold the dough into half-moons and press the edges. Then the empanadas go into the hot oven.',
          es: 'Doblan la masa en forma de media luna y aprietan los bordes. Luego las empanadas van al horno caliente.',
          vocab: [
            { word: 'fold', wordEs: 'doblan', def: 'To bend something over onto itself.', defEs: 'Plegar algo sobre sí mismo.' },
            { word: 'edges', wordEs: 'bordes', def: 'The outside lines of something.', defEs: 'Las orillas de algo.' },
            { word: 'oven', wordEs: 'horno', def: 'A hot box for baking food.', defEs: 'Una caja caliente para hornear comida.' }
          ]
        },
        {
          en: 'Soon the kitchen smells wonderful. The whole family sits together to eat and celebrate on the eighteenth of September.',
          es: 'Pronto la cocina huele delicioso. Toda la familia se sienta junta a comer y celebrar el dieciocho de septiembre.',
          vocab: [
            { word: 'kitchen', wordEs: 'cocina', def: 'The room where food is cooked.', defEs: 'La habitación donde se cocina.' },
            { word: 'celebrate', wordEs: 'celebrar', def: 'To do something happy for a special day.', defEs: 'Hacer algo alegre en un día especial.' },
            { word: 'family', wordEs: 'familia', def: 'Parents, children, grandparents and other relatives.', defEs: 'Padres, hijos, abuelos y otros parientes.' }
          ]
        }
      ],
      quiz: [
        { q: 'What are Sofía and Grandma making?', qEs: '¿Qué están haciendo Sofía y su abuela?', options: ['A cake', 'Empanadas', 'Soup', 'Bread'], optionsEs: ['Un pastel', 'Empanadas', 'Sopa', 'Pan'], answer: 1 },
        { q: 'What goes into the pino filling?', qEs: '¿Qué lleva el relleno de pino?', options: ['Beef, onion, olive and egg', 'Chocolate and candy', 'Apples and honey', 'Rice and beans'], optionsEs: ['Carne, cebolla, aceituna y huevo', 'Chocolate y dulces', 'Manzanas y miel', 'Arroz y porotos'], answer: 0 },
        { q: 'When does the family celebrate?', qEs: '¿Cuándo celebra la familia?', options: ['On Christmas Day', 'On the eighteenth of September', 'On New Year\'s Day', 'On a rainy Monday'], optionsEs: ['En Navidad', 'El dieciocho de septiembre', 'En Año Nuevo', 'Un lunes de lluvia'], answer: 1 }
      ]
    },
    {
      id: 'miners_33',
      title: 'The Rescue of the 33',
      titleEs: 'El Rescate de los 33',
      tier: 'pilot', ageMin: 8, region: 'north', icon: '⛑️',
      pages: [
        {
          en: 'On August 5, 2010, part of the San José mine in the Atacama Desert collapsed. Thirty-three miners were trapped deep underground, about 700 meters below the surface.',
          es: 'El 5 de agosto de 2010, una parte de la mina San José, en el desierto de Atacama, se derrumbó. Treinta y tres mineros quedaron atrapados bajo tierra, a unos 700 metros de profundidad.',
          vocab: [
            { word: 'mine', wordEs: 'mina', def: 'A place dug into the ground to take out rocks and metals.', defEs: 'Un lugar excavado en la tierra para sacar rocas y metales.' },
            { word: 'collapsed', wordEs: 'derrumbó', def: 'Fell down suddenly.', defEs: 'Se cayó de repente.' },
            { word: 'trapped', wordEs: 'atrapados', def: 'Stuck and unable to get out.', defEs: 'Encerrados, sin poder salir.' },
            { word: 'underground', wordEs: 'bajo tierra', def: 'Below the surface of the ground.', defEs: 'Debajo de la superficie del suelo.' }
          ]
        },
        {
          en: 'The miners gathered in a small shelter. They shared their tiny supply of food very carefully, so it would last as long as possible.',
          es: 'Los mineros se reunieron en un pequeño refugio. Compartieron su escasa comida con mucho cuidado, para que durara lo más posible.',
          vocab: [
            { word: 'gathered', wordEs: 'reunieron', def: 'Came together in one place.', defEs: 'Se juntaron en un lugar.' },
            { word: 'shelter', wordEs: 'refugio', def: 'A safe place that protects people.', defEs: 'Un lugar seguro que protege a las personas.' },
            { word: 'shared', wordEs: 'compartieron', def: 'Gave part of something to others.', defEs: 'Dieron parte de algo a los demás.' },
            { word: 'last', wordEs: 'durara', def: 'To keep going for a length of time.', defEs: 'Seguir existiendo por un tiempo.' }
          ]
        },
        {
          en: 'On the surface, engineers drilled narrow holes to search for them. On August 22, a drill came back up with a note tied to it: "Estamos bien en el refugio los 33", which means "We are fine in the shelter, the 33."',
          es: 'En la superficie, los ingenieros perforaron agujeros angostos para buscarlos. El 22 de agosto, una sonda volvió a subir con una nota amarrada: "Estamos bien en el refugio los 33".',
          vocab: [
            { word: 'engineers', wordEs: 'ingenieros', def: 'People who design and build things.', defEs: 'Personas que diseñan y construyen cosas.' },
            { word: 'drilled', wordEs: 'perforaron', def: 'Made holes with a turning tool.', defEs: 'Hicieron agujeros con una herramienta que gira.' },
            { word: 'narrow', wordEs: 'angostos', def: 'Not wide.', defEs: 'Poco anchos.' },
            { word: 'note', wordEs: 'nota', def: 'A short written message.', defEs: 'Un mensaje escrito corto.' }
          ]
        },
        {
          en: 'Through the small hole, rescuers sent down food, water, medicine and letters from the miners\' families, while bigger drills worked on a wider tunnel.',
          es: 'Por el pequeño agujero, los rescatistas enviaron comida, agua, medicinas y cartas de las familias de los mineros, mientras perforadoras más grandes abrían un túnel más ancho.',
          vocab: [
            { word: 'rescuers', wordEs: 'rescatistas', def: 'People who save others from danger.', defEs: 'Personas que salvan a otros del peligro.' },
            { word: 'medicine', wordEs: 'medicinas', def: 'Something that helps sick people get better.', defEs: 'Algo que ayuda a los enfermos a mejorar.' },
            { word: 'tunnel', wordEs: 'túnel', def: 'A long passage under the ground.', defEs: 'Un pasaje largo bajo la tierra.' }
          ]
        },
        {
          en: 'Engineers built a narrow rescue capsule called Fénix. On October 13, 2010, after 69 days underground, all 33 miners were lifted to the surface, one by one.',
          es: 'Los ingenieros construyeron una angosta cápsula de rescate llamada Fénix. El 13 de octubre de 2010, después de 69 días bajo tierra, los 33 mineros fueron subidos a la superficie, uno por uno.',
          vocab: [
            { word: 'capsule', wordEs: 'cápsula', def: 'A small closed container, like a tiny room.', defEs: 'Un recipiente pequeño y cerrado, como una habitación diminuta.' },
            { word: 'lifted', wordEs: 'subidos', def: 'Raised up.', defEs: 'Levantados hacia arriba.' },
            { word: 'surface', wordEs: 'superficie', def: 'The top or outside of something.', defEs: 'La parte de arriba o de afuera de algo.' }
          ]
        },
        {
          en: 'Millions of people around the world watched the rescue on television. It is remembered as an example of teamwork, patience and careful engineering.',
          es: 'Millones de personas en todo el mundo vieron el rescate por televisión. Se recuerda como un ejemplo de trabajo en equipo, paciencia e ingeniería cuidadosa.',
          vocab: [
            { word: 'teamwork', wordEs: 'trabajo en equipo', def: 'People working together toward one goal.', defEs: 'Personas que trabajan juntas por una misma meta.' },
            { word: 'patience', wordEs: 'paciencia', def: 'Waiting calmly without giving up.', defEs: 'Esperar con calma sin rendirse.' },
            { word: 'engineering', wordEs: 'ingeniería', def: 'Using science to design and build things.', defEs: 'Usar la ciencia para diseñar y construir cosas.' }
          ]
        }
      ],
      quiz: [
        { q: 'How many miners were trapped in the San José mine?', qEs: '¿Cuántos mineros quedaron atrapados en la mina San José?', options: ['13', '33', '23', '69'], optionsEs: ['13', '33', '23', '69'], answer: 1 },
        { q: 'What did the note on the drill say?', qEs: '¿Qué decía la nota en la sonda?', options: ['"Estamos bien en el refugio los 33"', '"Send more drills"', '"Happy birthday"', '"We found gold"'], optionsEs: ['"Estamos bien en el refugio los 33"', '"Manden más taladros"', '"Feliz cumpleaños"', '"Encontramos oro"'], answer: 0 },
        { q: 'What was the rescue capsule called?', qEs: '¿Cómo se llamaba la cápsula de rescate?', options: ['Beagle', 'ALMA', 'Fénix', 'Esmeralda'], optionsEs: ['Beagle', 'ALMA', 'Fénix', 'Esmeralda'], answer: 2 }
      ]
    },
    {
      id: 'rapa_nui',
      title: 'The Moai of Rapa Nui',
      titleEs: 'Los Moai de Rapa Nui',
      tier: 'commander', ageMin: 10, region: 'island', icon: '🗿',
      pages: [
        {
          en: 'Rapa Nui, also called Easter Island, is a small volcanic island in the middle of the Pacific Ocean. It is part of Chile and lies more than 3,500 kilometers from the mainland.',
          es: 'Rapa Nui, también llamada Isla de Pascua, es una pequeña isla volcánica en medio del océano Pacífico. Es parte de Chile y está a más de 3.500 kilómetros del continente.',
          vocab: [
            { word: 'volcanic', wordEs: 'volcánica', def: 'Made by volcanoes.', defEs: 'Formada por volcanes.' },
            { word: 'island', wordEs: 'isla', def: 'Land with water all around it.', defEs: 'Tierra rodeada de agua.' },
            { word: 'mainland', wordEs: 'continente', def: 'The main land of a country, apart from its islands.', defEs: 'La tierra principal de un país, sin contar sus islas.' }
          ]
        },
        {
          en: 'Long ago, Polynesian navigators crossed thousands of kilometers of open ocean in large canoes. They found their way by reading the stars, the waves and the flight of seabirds.',
          es: 'Hace mucho tiempo, navegantes polinesios cruzaron miles de kilómetros de océano abierto en grandes canoas. Se orientaban leyendo las estrellas, las olas y el vuelo de las aves marinas.',
          vocab: [
            { word: 'navigators', wordEs: 'navegantes', def: 'People who find the way across the sea.', defEs: 'Personas que encuentran el camino por el mar.' },
            { word: 'canoes', wordEs: 'canoas', def: 'Long, narrow boats.', defEs: 'Botes largos y angostos.' },
            { word: 'seabirds', wordEs: 'aves marinas', def: 'Birds that live near the sea and fish in it.', defEs: 'Aves que viven cerca del mar y pescan en él.' }
          ]
        },
        {
          en: 'The islanders carved giant stone statues called moai. Most of them were carved from soft volcanic rock at a quarry called Rano Raraku.',
          es: 'Los isleños tallaron estatuas gigantes de piedra llamadas moai. La mayoría se talló en roca volcánica blanda en una cantera llamada Rano Raraku.',
          vocab: [
            { word: 'carved', wordEs: 'tallaron', def: 'Shaped something by cutting it.', defEs: 'Dieron forma a algo cortándolo.' },
            { word: 'statues', wordEs: 'estatuas', def: 'Figures made of stone, metal or wood.', defEs: 'Figuras hechas de piedra, metal o madera.' },
            { word: 'quarry', wordEs: 'cantera', def: 'A place where stone is cut out of the ground.', defEs: 'Un lugar donde se saca piedra del suelo.' }
          ]
        },
        {
          en: 'There are nearly 900 moai on the island. Many stand on stone platforms called ahu, and most of those face inland, with their backs to the sea.',
          es: 'Hay casi 900 moai en la isla. Muchos están sobre plataformas de piedra llamadas ahu, y la mayoría de ellos mira hacia el interior de la isla, de espaldas al mar.',
          vocab: [
            { word: 'platforms', wordEs: 'plataformas', def: 'Flat, raised surfaces.', defEs: 'Superficies planas y elevadas.' },
            { word: 'inland', wordEs: 'interior', def: 'Away from the coast.', defEs: 'Lejos de la costa.' }
          ]
        },
        {
          en: 'How did people move statues that weigh many tonnes? Scientists still study this question. One idea, tested with a copy of a moai, is that teams used ropes to "walk" the statue upright, rocking it from side to side.',
          es: '¿Cómo movían estatuas que pesan muchas toneladas? Los científicos todavía estudian esta pregunta. Una idea, probada con una copia de un moai, es que equipos usaban cuerdas para hacer "caminar" la estatua de pie, meciéndola de lado a lado.',
          vocab: [
            { word: 'tonnes', wordEs: 'toneladas', def: 'Units of weight. One tonne is 1,000 kilograms.', defEs: 'Unidades de peso. Una tonelada son 1.000 kilogramos.' },
            { word: 'tested', wordEs: 'probada', def: 'Tried out to see if it works.', defEs: 'Puesta a prueba para ver si funciona.' },
            { word: 'upright', wordEs: 'de pie', def: 'Standing straight up.', defEs: 'Derecho, parado.' }
          ]
        },
        {
          en: 'Rapa Nui became part of Chile in 1888. Today much of the island is a national park and a World Heritage Site, and visitors travel from far away to see the moai at sunrise.',
          es: 'Rapa Nui pasó a formar parte de Chile en 1888. Hoy gran parte de la isla es un parque nacional y Patrimonio de la Humanidad, y viajeros de lugares lejanos llegan a ver los moai al amanecer.',
          vocab: [
            { word: 'national park', wordEs: 'parque nacional', def: 'Land a country protects for everyone to enjoy.', defEs: 'Tierra que un país protege para que todos la disfruten.' },
            { word: 'heritage', wordEs: 'patrimonio', def: 'Valuable things handed down from the past.', defEs: 'Cosas valiosas heredadas del pasado.' },
            { word: 'sunrise', wordEs: 'amanecer', def: 'When the sun comes up in the morning.', defEs: 'Cuando sale el sol en la mañana.' }
          ]
        }
      ],
      quiz: [
        { q: 'Where is Rapa Nui?', qEs: '¿Dónde está Rapa Nui?', options: ['In the middle of the Pacific Ocean', 'In the Atacama Desert', 'In Patagonia', 'High in the Andes'], optionsEs: ['En medio del océano Pacífico', 'En el desierto de Atacama', 'En la Patagonia', 'En lo alto de los Andes'], answer: 0 },
        { q: 'Where were most moai carved?', qEs: '¿Dónde se tallaron la mayoría de los moai?', options: ['At the Rano Raraku quarry', 'On the mainland', 'At the bottom of the sea', 'In Santiago'], optionsEs: ['En la cantera de Rano Raraku', 'En el continente', 'En el fondo del mar', 'En Santiago'], answer: 0 },
        { q: 'Which way do most moai on ahu face?', qEs: '¿Hacia dónde mira la mayoría de los moai sobre los ahu?', options: ['Out to sea', 'Inland, with their backs to the sea', 'Straight up at the sky', 'Toward the mainland'], optionsEs: ['Hacia el mar', 'Hacia el interior, de espaldas al mar', 'Hacia el cielo', 'Hacia el continente'], answer: 1 }
      ]
    }
  ];


  // ================================================================
  //  Everything below drives the illustrated book. STORIES above is
  //  pure data (tools/build-progress-catalog.js lifts it as-is).
  // ================================================================
  const TIERS = ['cadet', 'explorer', 'pilot', 'commander'];
  const TIER_NAME = { cadet: ['Cadet', 'Cadete'], explorer: ['Explorer', 'Explorador'], pilot: ['Pilot', 'Piloto'], commander: ['Commander', 'Comandante'] };
  const EXTRAS = typeof STORY_EXTRAS !== 'undefined' ? STORY_EXTRAS : {};
  const CAST = typeof STORY_CAST !== 'undefined' ? STORY_CAST : {};
  const ART = typeof StoryArt !== 'undefined' ? StoryArt : null;
  const SPREAD_Q = '(min-width: 900px) and (min-height: 560px), (min-width: 700px) and (orientation: landscape) and (min-height: 560px)';

  // Every vocabulary word in the library, keyed by its English form.
  // The first story that teaches a word owns it in the Word Collector.
  const WORDS = {};
  STORIES.forEach(s => s.pages.forEach(p => (p.vocab || []).forEach(v => {
    const k = String(v.word).toLowerCase();
    if (!WORDS[k]) WORDS[k] = { v, story: s };
  })));

  // ── State ──
  let currentStory = null;
  let currentPage = 0;
  let lang = 'en';
  let currentTier = 'cadet';
  let ageTier = 'intermediate';
  let run = null;          // the challenge round in progress
  let turning = false;     // a page is mid-turn
  let autoRead = false;    // "turn the pages for me"
  let _autoNext = false;
  let _vocabOpen = null;

  const $ = id => document.getElementById(id);
  const esc = s => (typeof escHtml === 'function' ? escHtml(String(s == null ? '' : s)) : String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]));
  const tr = (en, es) => (lang === 'es' ? (es || en) : en);
  const titleOf = s => (lang === 'es' ? s.titleEs : s.title);
  const sfx = n => { try { if (typeof SFX !== 'undefined' && SFX[n]) SFX[n](); } catch (e) {} };
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  // ── Storage ──
  function _key() {
    if (typeof getUserAppKey !== 'function') return null;
    // Saves used to land on a bare `story<kid>` key — see
    // adoptLegacyAppKey in auth.js for what that cost.
    if (typeof adoptLegacyAppKey === 'function') adoptLegacyAppKey('story', 'zs_story_');
    return getUserAppKey('zs_story_');
  }
  function _load() {
    try {
      const d = JSON.parse(localStorage.getItem(_key()));
      return d && typeof d === 'object' && !Array.isArray(d) ? d : {};
    } catch (e) { return {}; }
  }
  function _save(data) {
    const k = _key();
    if (k) {
      localStorage.setItem(k, JSON.stringify(data));
      if (typeof CloudSync !== 'undefined' && CloudSync.online) CloudSync.push(k);
    }
  }
  // wordsLearned is a list of English words. Read it tolerantly.
  function _words(data) {
    const out = [];
    (Array.isArray(data.wordsLearned) ? data.wordsLearned : []).forEach(e => {
      const w = typeof e === 'string' ? e : (e && (e.word || e.en));
      if (w) out.push(String(w).toLowerCase());
    });
    return out;
  }
  function _collect(v) {
    const k = String(v.word).toLowerCase();
    const data = _load();
    if (data.wordsLearned != null && !Array.isArray(data.wordsLearned)) return false;
    if (_words(data).indexOf(k) !== -1) return false;
    if (!data.wordsLearned) data.wordsLearned = [];
    data.wordsLearned.push(k);
    _save(data);
    if (run) run.newWords.push(k);
    _updateNotebookBadge();
    return true;
  }
  function _storyStars(data, id) {
    const read = Array.isArray(data.storiesRead) ? data.storiesRead : [];
    if (read.indexOf(id) === -1) return 0;
    const s = data.storyStars && data.storyStars[id];
    return s > 0 ? Math.min(3, s) : 3;   // finished before stars were graded
  }

  // ── Init ──
  function init() {
    const user = typeof getActiveUser === 'function' ? getActiveUser() : null;
    if (!user) return;

    if (typeof CloudSync !== 'undefined' && CloudSync.online) {
      CloudSync.pull(_key());
    }

    const age = Number(user.age) || 8;
    ageTier = typeof getAgeTier === 'function' ? getAgeTier(age) : (age <= 5 ? 'beginner' : age <= 8 ? 'intermediate' : age <= 11 ? 'advanced' : 'expert');
    currentTier = age <= 6 ? 'cadet' : age <= 9 ? 'explorer' : age <= 11 ? 'pilot' : 'commander';
    document.body.dataset.age = ageTier;
    const d = _load();
    if (d.prefs && (d.prefs.lang === 'es' || d.prefs.lang === 'en')) lang = d.prefs.lang;
    _bind();
    _applyLang();
    _renderLibrary();
    _updateGlobalStars();
    window.addEventListener('zs:synced', () => {
      const lib = $('screen-library');
      if (lib && lib.classList.contains('active')) _renderLibrary();
      _updateGlobalStars();
    });
  }

  // ── Event wiring (one delegated listener) ──
  function _bind() {
    document.addEventListener('click', e => {
      const b = e.target.closest('[data-act]');
      if (!b || b.disabled) return;
      const a = b.dataset.act;
      switch (a) {
        case 'story': startStory(b.dataset.id); break;
        case 'tier': setTier(b.dataset.tier); break;
        case 'lang': toggleLanguage(); break;
        case 'notebook': openNotebook(); break;
        case 'back': backToLibrary(); break;
        case 'prev': prevPage(); break;
        case 'next': nextPage(); break;
        case 'read': readAloud(); break;
        case 'vocab': _openVocab(currentStory.pages[currentPage].vocab[+b.dataset.v]); break;
        case 'vclose': _closeVocab(); break;
        case 'vsay': if (_vocabOpen) _sayWord(_vocabOpen, true); break;
        case 'opt': answerQuiz(+b.dataset.i, b); break;
        case 'seq': _seqTap(+b.dataset.p, b); break;
        case 'who': _whoPick(b.dataset.c, b); break;
        case 'mw': _matchWord(+b.dataset.k, b); break;
        case 'mm': _matchMeaning(+b.dataset.k, b); break;
        case 'choice': _choicePick(+b.dataset.i); break;
        case 'continue': _advance(); break;
        case 'listen': _listenStep(); break;
        case 'say': _say(b.dataset.text, b.dataset.lang || lang, { rate: 0.85 }); break;
        case 'nbsay': { const w = WORDS[b.dataset.w]; if (w) _sayWord(w.v, true); break; }
        case 'again': startStory(currentStory.id); break;
        case 'library': backToLibrary(); break;
      }
    });
    const auto = $('se-auto');
    if (auto) auto.addEventListener('change', () => {
      autoRead = auto.checked;
      if (autoRead && !_readActive && _ttsOk(false)) _startRead();
      if (!autoRead) _autoNext = false;
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && _vocabOpen) { _closeVocab(); return; }
      if (_vocabOpen || !$('screen-read').classList.contains('active')) return;
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (e.key === 'ArrowRight') nextPage();
      if (e.key === 'ArrowLeft') prevPage();
    });
    // swipe to turn
    const stage = $('se-stage');
    let sx = null, sy = 0;
    stage.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; });
    stage.addEventListener('pointerup', e => {
      if (sx == null) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      sx = null;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) { if (dx < 0) nextPage(); else prevPage(); }
    });
    stage.addEventListener('pointercancel', () => { sx = null; });
    window.matchMedia(SPREAD_Q).addEventListener && window.matchMedia(SPREAD_Q).addEventListener('change', () => { if (currentStory && $('screen-read').classList.contains('active')) _fillPage(currentPage); });
  }

  // ── Library ──
  function _renderLibrary() {
    const data = _load();
    const read = Array.isArray(data.storiesRead) ? data.storiesRead : [];
    const words = _words(data);
    const sub = $('se-sub');
    if (sub) sub.textContent = tr('Illustrated adventure tales — read, listen and collect new words!', 'Cuentos ilustrados de aventura: ¡lee, escucha y colecciona palabras nuevas!');
    const stats = $('se-lib-stats');
    if (stats) stats.innerHTML =
      '<span class="se-stat"><b>' + (data.totalStars || 0) + '</b> ' + tr('stars', 'estrellas') + '</span>' +
      '<span class="se-stat"><b>' + read.filter(id => STORIES.some(s => s.id === id)).length + '</b>/' + STORIES.length + ' ' + tr('stories', 'historias') + '</span>' +
      '<span class="se-stat"><b>' + words.length + '</b> ' + tr('words', 'palabras') + '</span>';
    _updateNotebookBadge(words.length);
    const hero = $('se-hero-art');
    if (hero && ART && !hero.firstChild) hero.innerHTML = ART.hero();

    // continue reading
    const cont = $('se-continue');
    const bm = data.bookmark;
    const bs = bm && STORIES.find(s => s.id === bm.id);
    if (cont) {
      if (bs && bm.page > 0 && bm.page < bs.pages.length) {
        cont.innerHTML = '<button type="button" class="se-continue" data-act="story" data-id="' + esc(bs.id) + '">' +
          '<span class="se-continue-art">' + (ART ? ART.cover(bs.id) : '') + '</span>' +
          '<span class="se-continue-txt"><small>' + tr('Keep reading', 'Sigue leyendo') + '</small><b>' + esc(titleOf(bs)) + '</b><span>' +
          tr('Page', 'Página') + ' ' + (bm.page + 1) + ' / ' + bs.pages.length + '</span></span><span class="se-continue-go" aria-hidden="true">›</span></button>';
      } else cont.innerHTML = '';
    }

    const tabs = $('tier-select');
    tabs.innerHTML = TIERS.map(t => {
      const inTier = STORIES.filter(s => s.tier === t);
      const done = inTier.filter(s => read.indexOf(s.id) !== -1).length;
      return '<button type="button" role="tab" class="tier-tab' + (currentTier === t ? ' active' : '') + '" aria-selected="' + (currentTier === t) + '" data-act="tier" data-tier="' + t + '">' +
        '<span class="se-tab-name">' + tr(TIER_NAME[t][0], TIER_NAME[t][1]) + '</span><span class="se-tab-count">' + done + '/' + inTier.length + '</span></button>';
    }).join('');

    const grid = $('story-grid');
    const filtered = STORIES.filter(s => s.tier === currentTier);
    grid.innerHTML = filtered.map(s => {
      const stars = _storyStars(data, s.id);
      const isNew = read.indexOf(s.id) === -1;
      const starRow = isNew ? '<span class="se-new">' + tr('New', 'Nuevo') + '</span>'
        : '<span class="se-card-stars" aria-hidden="true">' + [0, 1, 2].map(i => '<i class="' + (i < stars ? 'on' : '') + '">★</i>').join('') + '</span>';
      const label = titleOf(s) + ', ' + s.pages.length + ' ' + tr('pages', 'páginas') + (isNew ? '' : ', ' + stars + ' ' + tr('stars', 'estrellas'));
      return '<button type="button" class="story-card" data-act="story" data-id="' + esc(s.id) + '" aria-label="' + esc(label) + '">' +
        '<span class="se-cover">' + (ART && ART.has(s.id) ? ART.cover(s.id) : '<span class="story-icon">' + esc(s.icon) + '</span>') +
        '<span class="se-cover-band"><span class="story-title">' + esc(titleOf(s)) + '</span></span></span>' +
        '<span class="story-meta"><span>' + s.pages.length + ' ' + tr('pages', 'páginas') + '</span>' + starRow + '</span></button>';
    }).join('');
  }

  function setTier(t) {
    if (TIERS.indexOf(t) === -1) return;
    currentTier = t;
    sfx('click');
    _renderLibrary();
  }

  // ── Reader ──
  function startStory(id) {
    const s = STORIES.find(x => x.id === id);
    if (!s) return;
    stopRead();
    currentStory = s;
    run = null;
    const bm = _load().bookmark;
    currentPage = bm && bm.id === id && bm.page > 0 && bm.page < s.pages.length ? bm.page : 0;
    _showScreen('read');
    _fillPage(currentPage);
    window.scrollTo(0, 0);
  }

  function _isSpread() { try { return window.matchMedia(SPREAD_Q).matches; } catch (e) { return false; } }

  function _artHtml(idx) {
    const svg = ART && ART.has(currentStory.id) ? ART.page(currentStory.id, idx) : '';
    return '<div class="se-art">' + (svg || '<span class="se-art-fallback">' + esc(currentStory.icon) + '</span>') + '</div>';
  }

  // Vocabulary words can be phrases ("tectonic plates", "bajo tierra")
  // and appear mid-sentence. Find each one's character ranges.
  function _vocabRanges(raw, vocab) {
    const lower = raw.toLowerCase(), out = [];
    (vocab || []).forEach((v, vi) => {
      const w = String(lang === 'es' ? v.wordEs : v.word || '').toLowerCase();
      const forms = [w, w.replace(/\s*\(.*\)\s*/g, '').trim()];
      const m = w.match(/\(([^)]+)\)/); if (m) forms.push(m[1].trim());
      forms.filter(Boolean).forEach(f => {
        let from = 0, at;
        while ((at = lower.indexOf(f, from)) !== -1) {
          const before = at === 0 ? '' : lower[at - 1], after = lower[at + f.length] || '';
          const isL = ch => /[a-záéíóúüñ]/i.test(ch);
          if (!isL(before) && !isL(after) && !out.some(r => at < r.e && at + f.length > r.s)) out.push({ s: at, e: at + f.length, vi });
          from = at + f.length;
        }
      });
    });
    return out;
  }

  function _textNode(idx, live) {
    const page = currentStory.pages[idx];
    const raw = lang === 'es' ? page.es : page.en;
    const ranges = _vocabRanges(raw, page.vocab);
    const wrap = document.createElement('div');
    wrap.className = 'se-copy';
    const p = document.createElement('p');
    p.className = 'se-prose page-text';
    if (live) p.id = 'page-text';
    p.dataset.raw = raw;
    // Each word becomes <span class="rw-word" data-start data-end> so the
    // speech boundary events can light it up; vocabulary words are
    // buttons so a tap opens their meaning.
    const re = /(\s+|[.,!?;:"'()¡¿—…]+|[^\s.,!?;:"'()¡¿—…]+)/g;
    let m;
    while ((m = re.exec(raw)) !== null) {
      const chunk = m[0], start = m.index;
      if (/^[^\s.,!?;:"'()¡¿—…]/.test(chunk)) {
        const r = ranges.find(x => start >= x.s && start < x.e);
        const el = document.createElement(r ? 'button' : 'span');
        el.className = 'rw-word' + (r ? ' vocab-link' : '');
        el.dataset.start = String(start);
        el.dataset.end = String(start + chunk.length);
        if (r) {
          el.type = 'button';
          el.dataset.act = 'vocab';
          el.dataset.v = String(r.vi);
          el.setAttribute('aria-label', chunk + ' — ' + tr('tap for meaning', 'toca para ver el significado'));
        }
        el.textContent = chunk;
        p.appendChild(el);
      } else p.appendChild(document.createTextNode(chunk));
    }
    wrap.appendChild(p);
    const vocab = page.vocab || [];
    if (vocab.length) {
      const known = _words(_load());
      const chips = document.createElement('div');
      chips.className = 'se-chips';
      chips.innerHTML = '<span class="se-chips-label">' + tr('Words to collect', 'Palabras para coleccionar') + '</span>' + vocab.map((v, vi) =>
        '<button type="button" class="se-chip' + (known.indexOf(String(v.word).toLowerCase()) !== -1 ? ' got' : '') + '" data-act="vocab" data-v="' + vi + '">' +
        esc(lang === 'es' ? v.wordEs : v.word) + '</button>').join('');
      wrap.appendChild(chips);
    }
    const folio = document.createElement('div');
    folio.className = 'se-folio';
    folio.textContent = String(idx + 1);
    wrap.appendChild(folio);
    return wrap;
  }

  function _fillLeft(el, idx) { el.innerHTML = _artHtml(idx); }
  function _fillRight(el, idx, live) { el.innerHTML = ''; el.appendChild(_textNode(idx, live !== false)); }
  function _fillPage(idx) {
    _fillLeft($('se-left'), idx);
    _fillRight($('se-right'), idx);
    _afterPage();
  }
  function _noIds(node) { node.removeAttribute && node.removeAttribute('id'); node.querySelectorAll && node.querySelectorAll('[id]').forEach(n => n.removeAttribute('id')); return node; }

  function _afterPage() {
    const s = currentStory, n = s.pages.length;
    $('story-title').textContent = titleOf(s);
    $('page-indicator').textContent = tr('Page', 'Página') + ' ' + (currentPage + 1) + ' / ' + n;
    $('se-dots').innerHTML = s.pages.map((_, i) => '<i class="' + (i === currentPage ? 'on' : i < currentPage ? 'seen' : '') + '"></i>').join('');
    const prev = $('se-prev'), next = $('se-next');
    prev.disabled = currentPage === 0;
    const last = currentPage === n - 1;
    next.classList.toggle('se-to-quiz', last);
    next.innerHTML = last ? '<span>' + tr('Challenges', 'Desafíos') + '</span> <b aria-hidden="true">›</b>' : '<b aria-hidden="true">›</b>';
    next.setAttribute('aria-label', last ? tr('Start the challenges', 'Empezar los desafíos') : tr('Next page', 'Página siguiente'));
    _updateReadButton();
    _updateGlobalStars();
    if (_autoNext) { _autoNext = false; setTimeout(() => { if (autoRead && $('screen-read').classList.contains('active')) _startRead(); }, 450); }
  }

  // Turn to page idx. dir > 0 turns forward, < 0 back.
  function _goto(idx, dir) {
    if (turning || !currentStory) return;
    const keepReading = _autoNext;
    stopRead();
    _autoNext = keepReading;
    const book = $('se-book'), left = $('se-left'), right = $('se-right'), stage = $('se-stage');
    const reduce = (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) || !book.animate;
    currentPage = idx;
    if (reduce) { _fillPage(idx); return; }
    turning = true;
    _swish();
    const leaf = document.createElement('div');
    leaf.className = 'se-leaf';
    leaf.innerHTML = '<div class="se-face se-front"></div><div class="se-face se-back"></div><div class="se-leaf-shade"></div>';
    const front = leaf.children[0], back = leaf.children[1], shade = leaf.children[2];
    const done = () => { leaf.remove(); turning = false; };
    const opts = { duration: 720, easing: 'cubic-bezier(.45,.05,.3,1)', fill: 'forwards' };
    if (_isSpread()) {
      leaf.classList.add('se-leaf-half');
      const sheet = cls => { const d = document.createElement('div'); d.className = 'se-sheet ' + cls; return d; };
      if (dir > 0) {
        const f = sheet('se-right'); f.appendChild(_noIds(right.firstChild.cloneNode(true))); front.appendChild(f);
        const b = sheet('se-left'); b.innerHTML = _artHtml(idx); back.appendChild(b);
        _fillRight(right, idx);
        stage.appendChild(leaf);
        const anim = leaf.animate([{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(-180deg)' }], opts);
        shade.animate([{ opacity: 0 }, { opacity: 0.5, offset: 0.5 }, { opacity: 0 }], opts);
        anim.onfinish = () => { _fillLeft(left, idx); done(); _afterPage(); };
      } else {
        const f = sheet('se-right'); f.appendChild(_textNode(idx, false)); front.appendChild(f);
        const b = sheet('se-left'); b.appendChild(_noIds(left.firstChild.cloneNode(true))); back.appendChild(b);
        _fillLeft(left, idx);
        stage.appendChild(leaf);
        const anim = leaf.animate([{ transform: 'rotateY(-180deg)' }, { transform: 'rotateY(0deg)' }], opts);
        shade.animate([{ opacity: 0 }, { opacity: 0.5, offset: 0.5 }, { opacity: 0 }], opts);
        anim.onfinish = () => { _fillRight(right, idx); done(); _afterPage(); };
      }
    } else {
      const clone = _noIds(book.cloneNode(true));
      clone.classList.add('se-book-clone');
      if (dir > 0) {
        front.appendChild(clone);
        _fillLeft(left, idx); _fillRight(right, idx);
        stage.appendChild(leaf);
        const anim = leaf.animate([{ transform: 'rotateY(0deg)', opacity: 1 }, { transform: 'rotateY(-70deg)', opacity: 1, offset: 0.6 }, { transform: 'rotateY(-105deg)', opacity: 0 }], opts);
        shade.animate([{ opacity: 0 }, { opacity: 0.55 }], opts);
        anim.onfinish = () => { done(); _afterPage(); };
      } else {
        clone.querySelector('.se-left').innerHTML = _artHtml(idx);
        const r = clone.querySelector('.se-right'); r.innerHTML = ''; r.appendChild(_textNode(idx, false));
        front.appendChild(clone);
        stage.appendChild(leaf);
        const anim = leaf.animate([{ transform: 'rotateY(-105deg)', opacity: 0 }, { transform: 'rotateY(-70deg)', opacity: 1, offset: 0.4 }, { transform: 'rotateY(0deg)', opacity: 1 }], opts);
        shade.animate([{ opacity: 0.55 }, { opacity: 0 }], opts);
        anim.onfinish = () => { _fillLeft(left, idx); _fillRight(right, idx); done(); _afterPage(); };
      }
    }
  }

  function nextPage() {
    if (!currentStory || turning) return;
    if (currentPage < currentStory.pages.length - 1) _goto(currentPage + 1, 1);
    else _startChallenges();
  }
  function prevPage() {
    if (!currentStory || turning || currentPage === 0) return;
    _goto(currentPage - 1, -1);
  }

  // A short paper "swish" for the page turn (filtered noise).
  let _actx = null;
  function _swish() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!_actx) _actx = new AC();
      const c = _actx, len = Math.floor(c.sampleRate * 0.32);
      const buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) { const t = i / len; d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * t) * (1 - t * 0.6); }
      const src = c.createBufferSource(); src.buffer = buf;
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(900, c.currentTime); f.frequency.linearRampToValueAtTime(2600, c.currentTime + 0.3); f.Q.value = 0.7;
      const g = c.createGain(); g.gain.value = 0.09;
      src.connect(f); f.connect(g); g.connect(c.destination); src.start();
    } catch (e) {}
  }

  // ── Speech (tts.js) ──
  let _readActive = false, _readToken = 0, _hlTimer = null, _gotBoundary = false;
  function _voiceLang(l) {
    const want = l === 'es' ? ['es-cl', 'es-419', 'es-us', 'es-mx', 'es-es', 'es'] : ['en-us', 'en-gb', 'en'];
    let voices = [];
    try { voices = window.speechSynthesis ? window.speechSynthesis.getVoices() || [] : []; } catch (e) {}
    for (const w of want) {
      const v = voices.find(x => x.lang && x.lang.replace('_', '-').toLowerCase().indexOf(w) === 0);
      if (v) return v.lang.replace('_', '-');
    }
    return l === 'es' ? 'es-CL' : 'en-US';
  }
  function _ttsOk(warn) {
    const shared = typeof ZsTTS !== 'undefined';
    const supported = shared ? ZsTTS.supported() : ('speechSynthesis' in window);
    if (!supported) {
      if (warn && typeof ZsDialog !== 'undefined') ZsDialog.alert(tr('This browser does not support read-aloud.', 'Este navegador no soporta lectura en voz alta.'));
      return false;
    }
    if (shared && !ZsTTS.getSettings().enabled) {
      if (warn && typeof ZsDialog !== 'undefined') ZsDialog.alert(tr('Read-aloud is turned off. A grown-up can turn it on in the Dashboard.', 'Lectura en voz alta está desactivada. Un adulto puede activarla en el Dashboard.'));
      return false;
    }
    return true;
  }
  function _say(text, l, opts) {
    if (!text || !_ttsOk(false)) return null;
    opts = opts || {};
    if (typeof ZsTTS !== 'undefined') return ZsTTS.speak(text, Object.assign({ lang: _voiceLang(l || lang) }, opts));
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = _voiceLang(l || lang); u.rate = opts.rate || 0.9;
      if (opts.onBoundary) u.onboundary = ev => { if (!ev.name || ev.name === 'word') opts.onBoundary(ev.charIndex); };
      if (opts.onEnd) u.onend = opts.onEnd;
      if (opts.onError) u.onerror = opts.onError;
      speechSynthesis.speak(u);
      return u;
    } catch (e) { return null; }
  }
  function _clearHighlight() {
    const el = $('page-text');
    if (el) el.querySelectorAll('.rw-word.speaking').forEach(n => n.classList.remove('speaking'));
  }
  function _highlightAtChar(ci) {
    const el = $('page-text');
    if (!el) return;
    const words = el.querySelectorAll('.rw-word');
    for (let i = 0; i < words.length; i++) {
      const s = +words[i].dataset.start, e = +words[i].dataset.end;
      if (ci >= s && ci < e) {
        if (words[i].classList.contains('speaking')) return;
        _clearHighlight();
        words[i].classList.add('speaking');
        const r = words[i].getBoundingClientRect();
        if (r.top < 60 || r.bottom > window.innerHeight - 60) words[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }
  }
  function stopRead() {
    _readActive = false;
    _readToken++;
    _autoNext = false;
    clearTimeout(_hlTimer);
    try { if (typeof ZsTTS !== 'undefined') ZsTTS.stop(); else if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch (e) {}
    _clearHighlight();
    _updateReadButton();
  }
  function _updateReadButton() {
    const btn = $('se-read');
    if (!btn) return;
    btn.classList.toggle('on', _readActive);
    btn.innerHTML = _readActive
      ? '<span aria-hidden="true">⏹</span> ' + tr('Stop', 'Detener')
      : '<span aria-hidden="true">🔊</span> ' + tr('Read to me', 'Léeme');
    btn.setAttribute('aria-pressed', String(_readActive));
  }
  function readAloud() {
    if (_readActive) { stopRead(); return; }
    if (!_ttsOk(true)) return;
    _startRead();
  }
  function _startRead() {
    const el = $('page-text');
    if (!el || !currentStory) return;
    const text = el.dataset.raw || currentStory.pages[currentPage][lang === 'es' ? 'es' : 'en'];
    const token = ++_readToken;
    _readActive = true;
    _gotBoundary = false;
    _updateReadButton();
    const onBoundary = ci => {
      if (token !== _readToken || !_readActive) return;
      _gotBoundary = true;
      clearTimeout(_hlTimer);
      _highlightAtChar(ci);
    };
    const onEnd = () => {
      if (token !== _readToken) return;
      _readActive = false;
      clearTimeout(_hlTimer);
      _clearHighlight();
      _updateReadButton();
      if (autoRead && currentStory && currentPage < currentStory.pages.length - 1 && $('screen-read').classList.contains('active')) {
        setTimeout(() => {
          if (token !== _readToken || !autoRead || _readActive) return;
          _autoNext = true;
          _goto(currentPage + 1, 1);
        }, 900);
      }
    };
    _say(text, lang, { onBoundary, onEnd, onError: onEnd });
    // Some voices never send word boundaries; follow along by timing.
    const rate = (typeof ZsTTS !== 'undefined' && ZsTTS.getSettings().rate) || 0.9;
    const cps = 14 * rate, t0 = Date.now() + 300;
    const tick = () => {
      if (token !== _readToken || !_readActive || _gotBoundary) return;
      const ci = Math.max(0, (Date.now() - t0) / 1000 * cps);
      if (ci < text.length) { _highlightAtChar(Math.floor(ci)); _hlTimer = setTimeout(tick, 90); }
    };
    _hlTimer = setTimeout(tick, 700);
  }
  function _sayWord(v, withDef) {
    const w = lang === 'es' ? v.wordEs : v.word;
    const def = lang === 'es' ? (v.defEs || v.def) : (v.def || v.defEs);
    _say(withDef && def ? w + '. ' + def : w, lang, { rate: 0.8 });
  }

  // ── Vocabulary card ──
  function showVocab(word, def) {   // kept for older callers
    const page = currentStory && currentStory.pages[currentPage];
    const v = page && (page.vocab || []).find(x => [x.word, x.wordEs].some(w => String(w).toLowerCase() === String(word).toLowerCase()));
    _openVocab(v || { word: word, wordEs: word, def: def, defEs: def });
  }
  function _openVocab(v) {
    if (!v) return;
    _vocabOpen = v;
    const fresh = _collect(v);
    const w = lang === 'es' ? v.wordEs : v.word, other = lang === 'es' ? v.word : v.wordEs;
    const def = lang === 'es' ? (v.defEs || v.def) : (v.def || v.defEs);
    $('vocab-word').textContent = w;
    $('vocab-other').textContent = (lang === 'es' ? 'English: ' : 'Español: ') + other;
    $('vocab-def').textContent = def || '';
    $('vocab-new').hidden = !fresh;
    const ov = $('vocab-overlay');
    ov.classList.add('active');
    ov.setAttribute('aria-hidden', 'false');
    sfx(fresh ? 'star' : 'click');
    if (fresh) document.querySelectorAll('.se-chip[data-v]').forEach(ch => { const pv = currentStory.pages[currentPage].vocab[+ch.dataset.v]; if (pv === v) ch.classList.add('got'); });
    setTimeout(() => { const b = ov.querySelector('[data-act="vclose"]'); if (b) b.focus(); }, 30);
    _sayWord(v, false);
  }
  function _closeVocab() {
    const ov = $('vocab-overlay');
    ov.classList.remove('active');
    ov.setAttribute('aria-hidden', 'true');
    _vocabOpen = null;
  }

  // ── Challenges ──
  const STEP = {
    quiz:   { icon: '❓', en: 'Story question', es: 'Pregunta de la historia' },
    seq:    { icon: '🖼️', en: 'Put the story in order', es: 'Ordena la historia' },
    who:    { icon: '🗣️', en: 'Who said it? Who did it?', es: '¿Quién lo dijo? ¿Quién lo hizo?' },
    match:  { icon: '🔤', en: 'Match each word to its meaning', es: 'Une cada palabra con su significado' },
    infer:  { icon: '🔍', en: 'Think deeper', es: 'Piensa más allá' },
    choice: { icon: '💭', en: 'What would you do?', es: '¿Qué harías tú?' }
  };
  function _startChallenges() {
    stopRead();
    const s = currentStory, ex = EXTRAS[s.id] || {}, lv = ageTier;
    // remember the place in case they come back
    const d = _load();
    if (d.bookmark && d.bookmark.id === s.id) { delete d.bookmark; _save(d); }
    const steps = [];
    (s.quiz || []).forEach(q => steps.push({ t: 'quiz', q }));
    const seqN = { beginner: 3, intermediate: 4, advanced: 5, expert: 6 }[lv] || 4;
    if (s.pages.length >= 3) steps.push({ t: 'seq', n: Math.min(seqN, s.pages.length) });
    (ex.who || []).slice(0, lv === 'beginner' ? 1 : 2).forEach(w => steps.push({ t: 'who', w }));
    if (lv !== 'beginner') {
      const seen = {}, pool = [];
      s.pages.forEach(p => (p.vocab || []).forEach(v => { const k = String(v.word).toLowerCase(); if ((v.def || v.defEs) && !seen[k]) { seen[k] = 1; pool.push(v); } }));
      const k = { intermediate: 3, advanced: 4, expert: 5 }[lv] || 3;
      if (pool.length >= 2) steps.push({ t: 'match', words: shuffle(pool).slice(0, Math.min(k, pool.length)) });
    }
    if (lv === 'advanced' || lv === 'expert') {
      (ex.infer || []).slice(0, lv === 'expert' ? 3 : 1).forEach(q => steps.push({ t: 'infer', q }));
      if (ex.choice) steps.push({ t: 'choice', c: ex.choice });
    }
    run = { steps, i: 0, mistakes: 0, newWords: [] };
    _showScreen('quiz');
    _renderStep();
  }

  function _stepper() {
    return '<ol class="se-steps" aria-label="' + tr('Challenges', 'Desafíos') + '">' + run.steps.map((st, i) =>
      '<li class="' + (i < run.i ? 'done' : i === run.i ? 'now' : '') + '" title="' + esc(tr(STEP[st.t].en, STEP[st.t].es)) + '"><span aria-hidden="true">' + (i < run.i ? '✓' : STEP[st.t].icon) + '</span></li>').join('') + '</ol>';
  }
  function _head(st, qText) {
    return '<div class="se-q-head">' + _stepper() +
      '<div class="quiz-counter">' + tr('Challenge', 'Desafío') + ' ' + (run.i + 1) + ' / ' + run.steps.length + ' · ' + esc(tr(STEP[st.t].en, STEP[st.t].es)) + '</div></div>' +
      (qText ? '<div class="se-q-row"><h2 class="quiz-q" id="se-q-text">' + esc(qText) + '</h2>' +
        '<button type="button" class="se-listen" data-act="listen" aria-label="' + tr('Listen to the question', 'Escuchar la pregunta') + '">🔊</button></div>' : '');
  }
  function _renderStep() {
    if (!run) return;
    if (run.i >= run.steps.length) { _finishRun(); return; }
    const st = run.steps[run.i], s = currentStory, wrap = $('quiz-wrap');
    let h = '';
    if (st.t === 'quiz' || st.t === 'infer') {
      const q = st.q, opts = lang === 'es' ? q.optionsEs : q.options;
      if (!st.order) st.order = shuffle(opts.map((_, i) => i));
      h = _head(st, lang === 'es' ? q.qEs : q.q) + '<div class="quiz-options">' + st.order.map(i =>
        '<button type="button" class="quiz-opt" data-act="opt" data-i="' + i + '">' + esc(opts[i]) + '</button>').join('') + '</div>';
    } else if (st.t === 'seq') {
      if (!st.pages) {
        const n = st.n, P = s.pages.length, pick = [];
        for (let i = 0; i < n; i++) pick.push(Math.round(i * (P - 1) / (n - 1)));
        st.pages = pick.filter((v, i, a) => a.indexOf(v) === i);
        let sh; do { sh = shuffle(st.pages); } while (sh.join() === st.pages.join() && st.pages.length > 1);
        st.shuffled = sh; st.next = 0;
      }
      const caps = (EXTRAS[s.id] && EXTRAS[s.id].cap) || [];
      const cap = p => (caps[p] ? tr(caps[p][0], caps[p][1]) : tr('Page', 'Página') + ' ' + (p + 1));
      h = _head(st, tr('Tap the pictures in the order they happened.', 'Toca los dibujos en el orden en que ocurrieron.')) +
        '<div class="se-slots">' + st.pages.map((p, i) => '<span class="se-slot' + (i < st.next ? ' filled' : '') + '">' +
          (i < st.next ? (ART ? ART.page(s.id, st.pages[i]) : '') : '<b>' + (i + 1) + '</b>') + '</span>').join('') + '</div>' +
        '<div class="se-pics">' + st.shuffled.map(p => {
          const placed = st.pages.indexOf(p) < st.next;
          return '<button type="button" class="se-pic' + (placed ? ' placed' : '') + '" data-act="seq" data-p="' + p + '"' + (placed ? ' disabled' : '') + ' aria-label="' + esc(cap(p)) + '">' +
            '<span class="se-pic-art">' + (ART ? ART.page(s.id, p) : '') + '</span><span class="se-pic-cap">' + esc(cap(p)) + '</span>' +
            (placed ? '<span class="se-pic-num">' + (st.pages.indexOf(p) + 1) + '</span>' : '') + '</button>';
        }).join('') + '</div>';
    } else if (st.t === 'who') {
      const w = st.w;
      if (!st.order) st.order = shuffle(w.opts.map((_, i) => i));
      h = _head(st, lang === 'es' ? w.qEs : w.q) + '<div class="se-whos">' + st.order.map(i => {
        const id = w.opts[i], c = CAST[id] || { en: id, es: id };
        return '<button type="button" class="se-who" data-act="who" data-c="' + esc(id) + '"><span class="se-who-art">' + (ART ? ART.portrait(id) : '') + '</span><span class="se-who-name">' + esc(tr(c.en, c.es)) + '</span></button>';
      }).join('') + '</div>';
    } else if (st.t === 'match') {
      if (!st.mOrder) { st.wOrder = shuffle(st.words.map((_, i) => i)); st.mOrder = shuffle(st.words.map((_, i) => i)); st.done = []; st.sel = null; }
      h = _head(st, tr('Tap a word, then tap what it means.', 'Toca una palabra y luego lo que significa.')) +
        '<div class="se-match"><div class="se-mcol">' + st.wOrder.map(k => {
          const v = st.words[k], d = st.done.indexOf(k) !== -1;
          return '<button type="button" class="se-mw' + (d ? ' done c' + (st.done.indexOf(k) % 5) : '') + (st.sel === k ? ' sel' : '') + '" data-act="mw" data-k="' + k + '"' + (d ? ' disabled' : '') + '>' + esc(lang === 'es' ? v.wordEs : v.word) + '</button>';
        }).join('') + '</div><div class="se-mcol">' + st.mOrder.map(k => {
          const v = st.words[k], d = st.done.indexOf(k) !== -1;
          return '<button type="button" class="se-mm' + (d ? ' done c' + (st.done.indexOf(k) % 5) : '') + '" data-act="mm" data-k="' + k + '"' + (d ? ' disabled' : '') + '>' + esc(lang === 'es' ? (v.defEs || v.def) : (v.def || v.defEs)) + '</button>';
        }).join('') + '</div></div>';
    } else if (st.t === 'choice') {
      const c = st.c;
      h = _head(st, lang === 'es' ? c.qEs : c.q) + '<p class="se-choice-note">' + tr('There is no wrong answer here. Pick what you would do!', 'Aquí no hay respuestas incorrectas. ¡Elige lo que harías tú!') + '</p>' +
        '<div class="quiz-options">' + c.opts.map((o, i) => '<button type="button" class="quiz-opt se-choice" data-act="choice" data-i="' + i + '">' + esc(tr(o.en, o.es)) + '</button>').join('') + '</div>';
    }
    h += '<div class="se-feedback" id="se-fb" aria-live="polite"></div>';
    wrap.innerHTML = '<div class="se-qcard se-q-' + st.t + '">' + h + '</div>';
    if (ageTier === 'beginner' && (st.t === 'quiz' || st.t === 'who')) setTimeout(_listenStep, 350);
  }
  function _listenStep() {
    const st = run && run.steps[run.i];
    if (!st) return;
    const q = $('se-q-text');
    let text = q ? q.textContent : '';
    if (st.t === 'quiz' || st.t === 'infer' || st.t === 'choice') {
      const opts = [...document.querySelectorAll('#quiz-wrap .quiz-opt')].map(b => b.textContent);
      if (opts.length) text += ' … ' + opts.join(' … ');
    } else if (st.t === 'who') {
      text += ' … ' + [...document.querySelectorAll('.se-who-name')].map(n => n.textContent).join(' … ');
    }
    _say(text, lang, { rate: 0.85 });
  }
  function _fb(html, kind) {
    const el = $('se-fb');
    if (!el) return;
    el.className = 'se-feedback show ' + (kind || '');
    el.innerHTML = html;
  }
  function _wrong(btn, hint) {
    run.mistakes++;
    sfx('wrong');
    if (btn) { btn.classList.remove('shake'); void btn.offsetWidth; btn.classList.add('shake', 'wrong'); }
    _fb('<span class="se-fb-ic" aria-hidden="true">🤔</span> ' + esc(hint || tr('Not quite. Try again!', 'Casi. ¡Inténtalo otra vez!')), 'no');
  }
  function _right(btn, next) {
    sfx('correct');
    if (btn) btn.classList.add('correct');
    _burst(btn);
    document.querySelectorAll('#quiz-wrap [data-act="opt"], #quiz-wrap [data-act="who"]').forEach(b => { b.disabled = true; });
    if (next === false) return;
    setTimeout(_advance, 850);
  }
  function _advance() {
    if (!run) return;
    run.i++;
    _renderStep();
    const w = $('quiz-wrap'); if (w && w.scrollIntoView) window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function _burst(el) {
    if (!el) return;
    const r = el.getBoundingClientRect(), b = document.createElement('div');
    b.className = 'se-burst';
    b.style.left = (r.left + r.width / 2) + 'px';
    b.style.top = (r.top + r.height / 2) + 'px';
    b.innerHTML = '<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>';
    document.body.appendChild(b);
    setTimeout(() => b.remove(), 900);
  }
  // A page whose text holds the answer — for a gentle "look back" hint.
  function _hintPage(answerText) {
    const words = String(answerText).toLowerCase().split(/[^a-záéíóúüñ0-9]+/i).filter(w => w.length > 3);
    let best = -1, bestN = 0;
    currentStory.pages.forEach((p, i) => {
      const t = (lang === 'es' ? p.es : p.en).toLowerCase();
      const n = words.filter(w => t.indexOf(w) !== -1).length;
      if (n > bestN) { bestN = n; best = i; }
    });
    return best;
  }
  function answerQuiz(selected, btn) {
    const st = run && run.steps[run.i];
    if (!st || (st.t !== 'quiz' && st.t !== 'infer')) return;
    const q = st.q;
    btn = btn || document.querySelector('#quiz-wrap [data-act="opt"][data-i="' + selected + '"]');
    if (selected === q.answer) {
      if (st.t === 'infer') {
        _right(btn, false);
        _fb('<span class="se-fb-ic" aria-hidden="true">🔍</span> <b>' + tr('Clue', 'Pista') + ':</b> ' + esc(tr(q.why, q.whyEs)) +
          '<button type="button" class="se-continue-btn" data-act="continue">' + tr('Continue', 'Continuar') + ' ›</button>', 'yes');
      } else {
        _right(btn);
        _fb('<span class="se-fb-ic" aria-hidden="true">⭐</span> ' + tr('Correct!', '¡Correcto!'), 'yes');
      }
    } else {
      if (btn) btn.disabled = true;
      let hint = null;
      if (st.t === 'quiz') {
        const p = _hintPage((lang === 'es' ? q.optionsEs : q.options)[q.answer]);
        if (p >= 0) hint = tr('Not quite. Look back at page ' + (p + 1) + ' of the story.', 'Casi. Mira otra vez la página ' + (p + 1) + ' de la historia.');
      }
      _wrong(btn, hint);
    }
  }
  function _seqTap(p, btn) {
    const st = run && run.steps[run.i];
    if (!st || st.t !== 'seq') return;
    if (p === st.pages[st.next]) {
      st.next++;
      sfx(st.next === st.pages.length ? 'correct' : 'click');
      _burst(btn);
      if (st.next === st.pages.length) {
        _renderStep();
        document.querySelectorAll('.se-pic').forEach(b => { b.disabled = true; });
        _fb('<span class="se-fb-ic" aria-hidden="true">⭐</span> ' + tr('That is the story, in order!', '¡Así es la historia, en orden!'), 'yes');
        setTimeout(_advance, 1300);
      } else { _renderStep(); }
    } else {
      run.mistakes++;
      sfx('wrong');
      btn.classList.remove('shake'); void btn.offsetWidth; btn.classList.add('shake');
      _fb('<span class="se-fb-ic" aria-hidden="true">🤔</span> ' + (st.next === 0 ? tr('What happened first?', '¿Qué pasó primero?') : tr('What happened next?', '¿Qué pasó después?')), 'no');
    }
  }
  function _whoPick(id, btn) {
    const st = run && run.steps[run.i];
    if (!st || st.t !== 'who') return;
    if (id === st.w.opts[st.w.a]) { _right(btn); _fb('<span class="se-fb-ic" aria-hidden="true">⭐</span> ' + tr('Yes!', '¡Sí!'), 'yes'); }
    else { btn.disabled = true; _wrong(btn); }
  }
  function _matchWord(k, btn) {
    const st = run && run.steps[run.i];
    if (!st || st.t !== 'match') return;
    st.sel = k;
    document.querySelectorAll('.se-mw').forEach(b => b.classList.toggle('sel', +b.dataset.k === k));
    _sayWord(st.words[k], false);
  }
  function _matchMeaning(k, btn) {
    const st = run && run.steps[run.i];
    if (!st || st.t !== 'match') return;
    if (st.sel == null) {
      _fb('<span class="se-fb-ic" aria-hidden="true">👆</span> ' + tr('First tap a word on the left.', 'Primero toca una palabra.'), 'no');
      return;
    }
    if (k === st.sel) {
      st.done.push(k);
      _collect(st.words[k]);
      st.sel = null;
      sfx(st.done.length === st.words.length ? 'correct' : 'star');
      const finished = st.done.length === st.words.length;
      _renderStep();
      if (finished) {
        document.querySelectorAll('.se-mw, .se-mm').forEach(b => { b.disabled = true; });
        _fb('<span class="se-fb-ic" aria-hidden="true">⭐</span> ' + tr('All matched! The words are in your Word Collector.', '¡Todas unidas! Las palabras están en tu Colección.'), 'yes');
        setTimeout(_advance, 1400);
      }
    } else {
      run.mistakes++;
      sfx('wrong');
      btn.classList.remove('shake'); void btn.offsetWidth; btn.classList.add('shake');
      _fb('<span class="se-fb-ic" aria-hidden="true">🤔</span> ' + tr('Not that one. Try another meaning!', 'Esa no. ¡Prueba otro significado!'), 'no');
    }
  }
  function _choicePick(i) {
    const st = run && run.steps[run.i];
    if (!st || st.t !== 'choice') return;
    const o = st.c.opts[i];
    document.querySelectorAll('.se-choice').forEach((b, j) => { b.disabled = true; b.classList.toggle('picked', j === i); });
    sfx('star');
    _fb('<span class="se-fb-ic" aria-hidden="true">💡</span> ' + esc(tr(o.re, o.reEs)) +
      '<button type="button" class="se-continue-btn" data-act="continue">' + tr('Continue', 'Continuar') + ' ›</button>', 'yes');
  }
  function _finishRun() {
    const scored = run.steps.filter(s => s.t !== 'choice').length;
    const lim = ageTier === 'beginner' ? [2, 4] : [1, 3];
    const stars = !scored ? 2 : run.mistakes <= lim[0] ? 3 : run.mistakes <= lim[1] ? 2 : 1;
    _showResults(stars);
  }

  // ── Results ──
  function _showResults(starsEarned) {
    const s = currentStory;
    const before = _storyStars(_load(), s.id);
    const gained = _saveProgress(starsEarned);
    const best = Math.max(before, starsEarned);
    const nw = run ? run.newWords.length : 0;
    const tierList = STORIES.filter(x => x.tier === s.tier);
    const readNow = _load().storiesRead || [];
    const nextS = tierList.find(x => readNow.indexOf(x.id) === -1 && x.id !== s.id) || STORIES.find(x => readNow.indexOf(x.id) === -1 && x.id !== s.id);
    const msg = starsEarned === 3 ? tr('Brilliant reading!', '¡Lectura brillante!') : starsEarned === 2 ? tr('Great job!', '¡Muy bien!') : tr('Well done — you finished!', '¡Bien hecho, terminaste!');
    $('results-wrap').innerHTML =
      '<div class="se-results">' +
      '<div class="se-results-cover">' + (ART ? ART.cover(s.id) : '') + '</div>' +
      '<h2 class="results-title">' + msg + '</h2>' +
      '<div class="se-bigstars" role="img" aria-label="' + starsEarned + ' ' + tr('stars', 'estrellas') + '">' + [0, 1, 2].map(i => '<span class="se-bigstar' + (i < starsEarned ? ' on' : '') + '" style="animation-delay:' + (0.25 + i * 0.22) + 's">★</span>').join('') + '</div>' +
      '<p class="results-subtitle">' + tr('You finished', 'Terminaste') + ' <b>' + esc(titleOf(s)) + '</b></p>' +
      '<ul class="se-results-facts">' +
      '<li><b>+' + gained + '</b> ' + tr('stars added', 'estrellas sumadas') + (gained === 0 && before ? ' · ' + tr('your best is', 'tu mejor marca es') + ' ' + '★'.repeat(best) : '') + '</li>' +
      '<li><b>' + nw + '</b> ' + tr('new words collected', 'palabras nuevas coleccionadas') + '</li>' +
      '<li><b>' + (run ? run.steps.length : 0) + '</b> ' + tr('challenges', 'desafíos') + (run ? ' · ' + run.mistakes + ' ' + tr('tries to fix', 'intentos a corregir') : '') + '</li>' +
      '</ul>' +
      '<div class="se-results-btns">' +
      (nextS ? '<button type="button" class="action-btn btn-primary" data-act="story" data-id="' + esc(nextS.id) + '">' + tr('Next story', 'Siguiente historia') + ': ' + esc(titleOf(nextS)) + '</button>' : '') +
      '<button type="button" class="action-btn btn-secondary" data-act="notebook">📒 ' + tr('Word Collector', 'Colección de palabras') + '</button>' +
      '<button type="button" class="action-btn btn-secondary" data-act="again">↻ ' + tr('Read it again', 'Leer otra vez') + '</button>' +
      '<button type="button" class="action-btn btn-secondary" data-act="library">' + tr('Back to Library', 'Volver a la Biblioteca') + '</button>' +
      '</div></div>';
    _showScreen('results');
    sfx('cheer');
  }

  // Stars: a story's first finish adds its stars to totalStars, as it
  // always has. A later, better round adds only the difference, so a
  // story is still worth at most 3. storyStars keeps each best.
  function _saveProgress(starsEarned) {
    const data = _load();
    if (!Array.isArray(data.storiesRead)) data.storiesRead = [];
    const id = currentStory.id;
    const first = data.storiesRead.indexOf(id) === -1;
    const prevBest = first ? 0 : _storyStars(data, id);
    let gained = 0;
    if (first) { data.storiesRead.push(id); gained = starsEarned; }
    else if (starsEarned > prevBest) gained = starsEarned - prevBest;
    if (!data.storyStars || typeof data.storyStars !== 'object') data.storyStars = {};
    data.storyStars[id] = Math.max(prevBest, starsEarned);
    data.totalStars = (data.totalStars || 0) + gained;
    if (data.bookmark && data.bookmark.id === id) delete data.bookmark;
    _save(data);
    _updateGlobalStars();
    if ((first || gained) && typeof ActivityLog !== 'undefined') {
      ActivityLog.log('Story Explorer', '📚', `Read "${currentStory.title}" — ${starsEarned} star${starsEarned !== 1 ? 's' : ''}`);
    }
    return gained;
  }

  // ── Word Collector notebook ──
  function _updateNotebookBadge(n) {
    if (n == null) n = _words(_load()).length;
    document.querySelectorAll('.se-nb-count').forEach(el => { el.textContent = String(n); });
  }
  function openNotebook() {
    stopRead();
    const known = _words(_load());
    const total = Object.keys(WORDS).length;
    const got = known.filter(k => WORDS[k]).length;
    let h = '<div class="se-nb-head"><div class="se-nb-progress"><div class="se-nb-bar"><i style="width:' + Math.round(got / Math.max(1, total) * 100) + '%"></i></div>' +
      '<span><b>' + got + '</b> / ' + total + ' ' + tr('words collected', 'palabras coleccionadas') + '</span></div>' +
      '<p>' + tr('Tap a highlighted word while you read, or match words in the challenges, to collect it.', 'Toca una palabra destacada mientras lees, o únelas en los desafíos, para coleccionarla.') + '</p></div>';
    const waiting = [];
    STORIES.forEach(s => {
      const mine = Object.keys(WORDS).filter(k => WORDS[k].story === s);
      const have = mine.filter(k => known.indexOf(k) !== -1);
      if (!have.length) { waiting.push({ s, n: mine.length }); return; }
      h += '<section class="se-nb-story"><h3><span class="se-nb-thumb">' + (ART ? ART.cover(s.id) : '') + '</span><span>' + esc(titleOf(s)) + '</span><small>' + have.length + '/' + mine.length + '</small></h3><div class="se-nb-words">' +
        mine.map(k => {
          const v = WORDS[k].v;
          if (known.indexOf(k) === -1) return '<span class="se-nb-word locked" aria-label="' + tr('Not found yet', 'Aún no encontrada') + '">?</span>';
          return '<button type="button" class="se-nb-word" data-act="nbsay" data-w="' + esc(k) + '" aria-label="' + esc(tr('Hear', 'Escuchar') + ' ' + (lang === 'es' ? v.wordEs : v.word)) + '">' +
            '<b>' + esc(lang === 'es' ? v.wordEs : v.word) + '</b><i>' + esc(lang === 'es' ? v.word : v.wordEs) + '</i>' +
            '<span>' + esc(lang === 'es' ? (v.defEs || v.def || '') : (v.def || v.defEs || '')) + '</span><em aria-hidden="true">🔊</em></button>';
        }).join('') + '</div></section>';
    });
    if (waiting.length) {
      h += '<section class="se-nb-waiting"><h3>' + tr('Words still hiding in these stories', 'Palabras que aún se esconden en estas historias') + '</h3><div class="se-nb-chips">' +
        waiting.map(w => '<button type="button" class="se-nb-chip" data-act="story" data-id="' + esc(w.s.id) + '">' + esc(titleOf(w.s)) + ' <b>' + w.n + '</b></button>').join('') + '</div></section>';
    }
    $('se-notebook').innerHTML = h;
    _showScreen('notebook');
    window.scrollTo(0, 0);
  }

  // ── Language ──
  function _applyLang() {
    document.documentElement.lang = lang;
    document.querySelectorAll('.se-lang').forEach(b => {
      b.innerHTML = '<span class="' + (lang === 'en' ? 'on' : '') + '">EN</span><span class="' + (lang === 'es' ? 'on' : '') + '">ES</span>';
      b.setAttribute('aria-label', lang === 'en' ? 'Cambiar a español' : 'Switch to English');
    });
    const st = document.querySelectorAll('[data-i18n]');
    st.forEach(el => { const k = el.dataset.i18n.split('|'); el.textContent = tr(k[0], k[1]); });
    const label = $('lang-label');
    if (label) label.textContent = lang === 'en' ? 'EN / ES' : 'ES / EN';
  }
  function toggleLanguage() {
    lang = lang === 'en' ? 'es' : 'en';
    stopRead();
    const d = _load();
    d.prefs = Object.assign({}, d.prefs && typeof d.prefs === 'object' ? d.prefs : {}, { lang });
    _save(d);
    _applyLang();
    if ($('screen-read').classList.contains('active') && currentStory) _fillPage(currentPage);
    else if ($('screen-quiz').classList.contains('active') && run) _renderStep();
    else if ($('screen-notebook').classList.contains('active')) openNotebook();
    else if ($('screen-results').classList.contains('active')) { /* keep */ }
    else _renderLibrary();
  }

  function backToLibrary() {
    // keep the reader's place in a story they left half-way
    if (currentStory && $('screen-read').classList.contains('active')) {
      const d = _load();
      if (currentPage > 0) d.bookmark = { id: currentStory.id, page: currentPage };
      else if (d.bookmark && d.bookmark.id === currentStory.id) delete d.bookmark;
      _save(d);
    }
    stopRead();
    _closeVocab();
    _showScreen('library');
    _renderLibrary();
    window.scrollTo(0, 0);
  }

  function _showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = $('screen-' + name);
    if (el) el.classList.add('active');
    document.body.dataset.screen = name;
  }

  function _updateGlobalStars() {
    const data = _load();
    const el = $('story-stars');
    if (el) el.textContent = '⭐ ' + (data.totalStars || 0);
  }

  function getStats() {
    const data = _load();
    return {
      totalStars: data.totalStars || 0,
      storiesReadCount: (data.storiesRead || []).length,
      wordsLearnedCount: _words(data).length
    };
  }

  document.addEventListener('DOMContentLoaded', init);

  return { init, startStory, nextPage, prevPage, showVocab, answerQuiz, setTier, toggleLanguage, backToLibrary, readAloud, stopRead, getStats, openNotebook };
})();
