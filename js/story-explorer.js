/* ================================================================
   STORY EXPLORER — story-explorer.js
   Reading library with comprehension and vocabulary.
   Storage key: zs_story_[username] via getUserAppKey('zs_story_')
   ================================================================ */

const StoryExplorer = (() => {
  'use strict';

  // ── Story Library ──
  const STORIES = [
    {
      id: 'ocean_dive',
      title: 'The Ocean Dive',
      titleEs: 'El Buceo en el Océano',
      tier: 'intermediate', ageMin: 7, region: 'ocean', icon: '🤿',
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
      tier: 'advanced', ageMin: 8, region: 'south', icon: '🚁',
      pages: [
        {
          en: 'The helicopter flew over the snowy peaks. A climber was lost.',
          es: 'El helicóptero voló sobre los picos nevados. Un escalador estaba perdido.',
          vocab: [
            { word: 'helicopter', wordEs: 'helicóptero' },
            { word: 'peaks', wordEs: 'picos' }
          ]
        },
        {
          en: 'The wind was very strong. The pilot had to be careful.',
          es: 'El viento era muy fuerte. El piloto tenía que ser cuidadoso.',
          vocab: [
            { word: 'wind', wordEs: 'viento' },
            { word: 'strong', wordEs: 'fuerte' }
          ]
        },
        {
          en: 'Finally, they saw a red tent on the white snow.',
          es: 'Finalmente, vieron una carpa roja sobre la nieve blanca.',
          vocab: [
            { word: 'tent', wordEs: 'carpa' },
            { word: 'snow', wordEs: 'nieve' }
          ]
        },
        {
          en: 'The rescue team threw down a rope to help him.',
          es: 'El equipo de rescate lanzó una cuerda para ayudarlo.',
          vocab: [
            { word: 'rope', wordEs: 'cuerda' },
            { word: 'team', wordEs: 'equipo' }
          ]
        }
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
        { q: 'What kind of animal is Rayo?', qEs: '¿Qué tipo de animal es Rayo?', options: ['A cow', 'A horse', 'A dog', 'A sheep'], optionsEs: ['Una vaca', 'Un caballo', 'Un perro', 'Una oveja'], answer: 1 }
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
    }
  ];

  // ── State ──
  let currentStory = null;
  let currentPage = 0;
  let lang = 'en';
  let vocabCollected = [];
  let currentTier = 'cadet';

  // ── Storage ──
  function _key() {
    if (typeof getUserAppKey !== 'function') return null;
    // Saves used to land on a bare `story<kid>` key — see
    // adoptLegacyAppKey in auth.js for what that cost.
    if (typeof adoptLegacyAppKey === 'function') adoptLegacyAppKey('story', 'zs_story_');
    return getUserAppKey('zs_story_');
  }
  function _load() { try { return JSON.parse(localStorage.getItem(_key())) || {}; } catch { return {}; } }
  function _save(data) { 
    const k = _key(); 
    if (k) {
      localStorage.setItem(k, JSON.stringify(data)); 
      if (typeof CloudSync !== 'undefined' && CloudSync.online) CloudSync.push(k);
    }
  }

  // ── Init ──
  function init() {
    const user = typeof getActiveUser === 'function' ? getActiveUser() : null;
    if (!user) return;

    if (typeof CloudSync !== 'undefined' && CloudSync.online) {
      CloudSync.pull(_key());
    }

    currentTier = user.age <= 6 ? 'cadet' : user.age <= 9 ? 'explorer' : 'pilot';
    _renderLibrary();
    _updateGlobalStars();
  }

  function _renderLibrary() {
    const grid = document.getElementById('story-grid');
    const tabs = document.getElementById('tier-select');
    const data = _load();
    const readStories = data.storiesRead || [];

    const tiers = ['cadet', 'explorer', 'pilot', 'commander'];
    tabs.innerHTML = tiers.map(t => `
      <div class="tier-tab ${currentTier === t ? 'active' : ''}" onclick="StoryExplorer.setTier('${t}')">
        ${t.charAt(0).toUpperCase() + t.slice(1)}
      </div>
    `).join('');

    const filtered = STORIES.filter(s => s.tier === currentTier);
    grid.innerHTML = filtered.map(s => {
      const isDone = readStories.includes(s.id);
      return `
        <div class="story-card" onclick="StoryExplorer.startStory('${s.id}')">
          <span class="story-icon">${s.icon}</span>
          <div class="story-title">${lang === 'es' ? s.titleEs : s.title}</div>
          <div class="story-meta">${s.pages.length} ${lang === 'es' ? 'páginas' : 'pages'} ${isDone ? '✅' : ''}</div>
        </div>
      `;
    }).join('');
  }

  function setTier(t) {
    currentTier = t;
    _renderLibrary();
  }

  function startStory(id) {
    currentStory = STORIES.find(s => s.id === id);
    if (!currentStory) return;
    currentPage = 0;
    vocabCollected = [];
    _renderPage();
    _showScreen('read');
  }

  function _renderPage() {
    stopRead();
    const page = currentStory.pages[currentPage];
    document.getElementById('story-title').textContent = lang === 'es' ? currentStory.titleEs : currentStory.title;
    document.getElementById('page-indicator').textContent = `${lang === 'es' ? 'Página' : 'Page'} ${currentPage + 1} / ${currentStory.pages.length}`;
    document.getElementById('page-icon').textContent = currentStory.icon;

    const raw = lang === 'es' ? page.es : page.en;

    // Build a vocab lookup for quick per-token enrichment.
    const vocabMap = {};
    if (page.vocab) {
      page.vocab.forEach(v => {
        const w = (lang === 'es' ? v.wordEs : v.word).toLowerCase();
        vocabMap[w] = lang === 'es' ? v.defEs : v.def;
      });
    }

    // Tokenise the text preserving spaces/punctuation. Each word becomes
    // a <span class="rw-word" data-start="N"> so we can highlight during
    // speechSynthesis' boundary events and still let vocab taps work.
    const pageText = document.getElementById('page-text');
    pageText.innerHTML = '';

    const re = /(\s+|[.,!?;:"'()¡¿—…]+|[^\s.,!?;:"'()¡¿—…]+)/g;
    let m;
    while ((m = re.exec(raw)) !== null) {
      const chunk = m[0];
      const start = m.index;
      if (/^[^\s.,!?;:"'()¡¿—…]/.test(chunk)) {
        const span = document.createElement('span');
        span.className = 'rw-word';
        span.dataset.start = String(start);
        span.dataset.end = String(start + chunk.length);
        const key = chunk.toLowerCase().replace(/[.,!?;:"'()¡¿—…]+$/g, '');
        if (vocabMap[key]) {
          span.classList.add('vocab-link');
          span.dataset.vocab = key;
          span.dataset.def = vocabMap[key];
          span.addEventListener('click', () => showVocab(key, vocabMap[key]));
        }
        span.textContent = chunk;
        pageText.appendChild(span);
      } else {
        pageText.appendChild(document.createTextNode(chunk));
      }
    }

    // Cache the raw text for speech + highlighting
    pageText.dataset.raw = raw;
  }

  // ── Read-aloud state ──
  let _readActive = false;
  let _readUtterance = null;

  function _clearHighlight() {
    const el = document.getElementById('page-text');
    if (!el) return;
    el.querySelectorAll('.rw-word.speaking').forEach(n => n.classList.remove('speaking'));
  }

  function _highlightAtChar(charIndex) {
    const el = document.getElementById('page-text');
    if (!el) return;
    _clearHighlight();
    const words = el.querySelectorAll('.rw-word');
    for (let i = 0; i < words.length; i++) {
      const s = Number(words[i].dataset.start);
      const e = Number(words[i].dataset.end);
      if (charIndex >= s && charIndex < e) {
        words[i].classList.add('speaking');
        // Scroll into view if out of viewport
        const r = words[i].getBoundingClientRect();
        if (r.top < 60 || r.bottom > window.innerHeight - 60) {
          words[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }
    }
  }

  function stopRead() {
    _readActive = false;
    try {
      if ('speechSynthesis' in window) speechSynthesis.cancel();
    } catch (e) {}
    _clearHighlight();
    _updateReadButton();
  }

  function _updateReadButton() {
    const btn = document.querySelector('.audio-btn');
    if (!btn) return;
    btn.textContent = _readActive
      ? (lang === 'es' ? '⏹ Detener' : '⏹ Stop')
      : (lang === 'es' ? '🔊 Leer en voz alta' : '🔊 Read Aloud');
  }

  function nextPage() {
    if (currentPage < currentStory.pages.length - 1) {
      currentPage++;
      _renderPage();
    } else {
      _startQuiz();
    }
  }

  function prevPage() {
    if (currentPage > 0) {
      currentPage--;
      _renderPage();
    }
  }

  function showVocab(word, def) {
    document.getElementById('vocab-word').textContent = word;
    document.getElementById('vocab-def').textContent = def;
    document.getElementById('vocab-overlay').classList.add('active');
    if (typeof playSound === 'function') playSound('pop');
  }

  function _startQuiz() {
    // Some stories ship without a quiz block — finish straight to the
    // results screen instead of crashing on `quiz[0]` (#diag).
    if (!currentStory || !Array.isArray(currentStory.quiz) || !currentStory.quiz.length) {
      _showResults(2);
      return;
    }
    const wrap = document.getElementById('quiz-wrap');
    const q = currentStory.quiz[0]; // Simple: one question for now or loop through all

    wrap.innerHTML = `
      <div class="quiz-q">${lang === 'es' ? q.qEs : q.q}</div>
      <div class="quiz-options">
        ${(lang === 'es' ? q.optionsEs : q.options).map((opt, i) => `
          <button class="quiz-opt" onclick="StoryExplorer.answerQuiz(${i}, ${q.answer})">${opt}</button>
        `).join('')}
      </div>
    `;
    _showScreen('quiz');
  }

  function answerQuiz(selected, correct) {
    if (selected === correct) {
      _showFeedback('⭐');
      if (typeof playSound === 'function') playSound('correct');
      _showResults(3);
    } else {
      _showFeedback('❌');
      if (typeof playSound === 'function') playSound('wrong');
      setTimeout(_startQuiz, 1000);
    }
  }

  function _showResults(starsEarned) {
    const wrap = document.getElementById('results-wrap');
    wrap.innerHTML = `
      <span class="results-emoji">🏆</span>
      <div class="results-title">${lang === 'es' ? '¡Excelente!' : 'Great Job!'}</div>
      <div class="results-subtitle">${lang === 'es' ? 'Has terminado la historia' : 'You completed the story'}</div>
      <div class="results-stats">
        <div>⭐ ${starsEarned} ${lang === 'es' ? 'estrellas ganadas' : 'stars earned'}</div>
      </div>
      <div>
        <button class="action-btn btn-primary" onclick="StoryExplorer.backToLibrary()">${lang === 'es' ? 'Volver a la Biblioteca' : 'Back to Library'}</button>
      </div>
    `;
    _showScreen('results');
    _saveProgress(starsEarned);
  }

  function _saveProgress(starsEarned) {
    const data = _load();
    if (!data.storiesRead) data.storiesRead = [];
    if (!data.storiesRead.includes(currentStory.id)) {
      data.storiesRead.push(currentStory.id);
      data.totalStars = (data.totalStars || 0) + starsEarned;
      _save(data);
      _updateGlobalStars();

      if (typeof ActivityLog !== 'undefined') {
        ActivityLog.log('Story Explorer', '📚', `Read "${currentStory.title}" — ${starsEarned} star${starsEarned !== 1 ? 's' : ''}`);
      }
    }
  }

  function readAloud() {
    // Gate on the shared suite-wide TTS module if it's loaded.
    var useShared = typeof ZsTTS !== 'undefined';

    if (useShared) {
      if (!ZsTTS.supported()) {
        alert(lang === 'es'
          ? 'Este navegador no soporta lectura en voz alta.'
          : 'This browser does not support read-aloud.');
        return;
      }
      if (!ZsTTS.getSettings().enabled) {
        alert(lang === 'es'
          ? 'Lectura en voz alta está desactivada. Un adulto puede activarla en el Dashboard.'
          : 'Read-aloud is turned off. A grown-up can turn it on in the Dashboard.');
        return;
      }
    } else if (!('speechSynthesis' in window)) {
      alert(lang === 'es'
        ? 'Este navegador no soporta lectura en voz alta.'
        : 'This browser does not support read-aloud.');
      return;
    }

    if (_readActive) { stopRead(); return; }

    const el = document.getElementById('page-text');
    const text = (el && el.dataset.raw) || (currentStory.pages[currentPage][lang === 'es' ? 'es' : 'en']);

    _readActive = true;
    _updateReadButton();

    var ttsLang = lang === 'es' ? 'es-CL' : 'en-US';
    var onBoundary = function(charIndex) {
      if (!_readActive) return;
      _highlightAtChar(charIndex);
    };
    var onEnd = function() {
      _readActive = false;
      _clearHighlight();
      _updateReadButton();
    };
    var onError = onEnd;

    if (useShared) {
      _readUtterance = ZsTTS.speak(text, {
        lang: ttsLang,
        onBoundary: onBoundary,
        onEnd: onEnd,
        onError: onError
      });
    } else {
      try { speechSynthesis.cancel(); } catch (e) {}
      _readUtterance = new SpeechSynthesisUtterance(text);
      _readUtterance.lang = ttsLang;
      _readUtterance.rate = 0.9;
      _readUtterance.onboundary = function(ev) {
        if (ev.name && ev.name !== 'word') return;
        onBoundary(ev.charIndex);
      };
      _readUtterance.onend = onEnd;
      _readUtterance.onerror = onError;
      speechSynthesis.speak(_readUtterance);
    }
  }

  function toggleLanguage() {
    lang = lang === 'en' ? 'es' : 'en';
    const label = document.getElementById('lang-label');
    if (label) label.textContent = lang === 'en' ? 'ES / EN' : 'EN / ES';
    if (currentStory) _renderPage();
    else _renderLibrary();
  }

  function backToLibrary() {
    stopRead();
    _showScreen('library');
    _renderLibrary();
  }

  function _showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById('screen-' + name);
    if (el) el.classList.add('active');
  }

  function _updateGlobalStars() {
    const data = _load();
    const el = document.getElementById('story-stars');
    if (el) el.textContent = `⭐ ${data.totalStars || 0}`;
  }

  function _showFeedback(emoji) {
    const f = document.getElementById('feedback');
    const fe = document.getElementById('feedbackEmoji');
    if (!f || !fe) return;
    fe.textContent = emoji;
    f.classList.add('active');
    setTimeout(() => f.classList.remove('active'), 800);
  }

  function getStats() {
    const data = _load();
    return {
      totalStars: data.totalStars || 0,
      storiesReadCount: (data.storiesRead || []).length
    };
  }

  document.addEventListener('DOMContentLoaded', init);

  return { init, startStory, nextPage, prevPage, showVocab, answerQuiz, setTier, toggleLanguage, backToLibrary, readAloud, stopRead, getStats };
})();
