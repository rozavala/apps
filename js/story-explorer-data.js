/* ================================================================
   STORY EXPLORER — challenge data (js/story-explorer-data.js)

   Extra comprehension challenges for each story in STORIES
   (js/story-explorer.js). The stories' own quiz questions stay where
   they are; this file only adds:

     cap    — a short caption per page, for the picture-card
              "put the story in order" challenge
     who    — "Who said it? / Who did it?" picked from character cards
     infer  — inference questions for older readers (with the clue)
     choice — a "What would you do?" moment. Every option is a good
              one; the reply just tells the reader something useful.

   STORY_CAST names the characters that appear on the cards (their
   pictures are in js/story-explorer-art.js, StoryArt.portrait).
   Pure data; two globals: STORY_EXTRAS, STORY_CAST.
   ================================================================ */

var STORY_CAST = {
  leo:        { en: 'Leo', es: 'Leo' },
  tomas:      { en: 'Tomás', es: 'Tomás' },
  explorer:   { en: 'The explorer', es: 'La exploradora' },
  darwin:     { en: 'Charles Darwin', es: 'Charles Darwin' },
  huaso:      { en: 'The huaso', es: 'El huaso' },
  astronaut:  { en: 'An astronaut', es: 'Un astronauta' },
  engineer:   { en: 'Engineers', es: 'Los ingenieros' },
  miner:      { en: 'The miners', es: 'Los mineros' },
  san_martin: { en: 'José de San Martín', es: 'José de San Martín' },
  ohiggins:   { en: 'Bernardo O\'Higgins', es: 'Bernardo O\'Higgins' },
  astronomer: { en: 'Astronomers', es: 'Los astrónomos' },
  sofia:      { en: 'Sofía', es: 'Sofía' },
  abuela:     { en: 'Grandma', es: 'La abuela' },
  navigator:  { en: 'Polynesian navigators', es: 'Navegantes polinesios' },
  rescuer:    { en: 'The rescue team', es: 'El equipo de rescate' },
  climber:    { en: 'The climber', es: 'El escalador' },
  pilot:      { en: 'The pilot', es: 'El piloto' },
  divers:     { en: 'The divers', es: 'Los buzos' },
  turtle:     { en: 'The sea turtle', es: 'La tortuga marina' },
  ciro:       { en: 'Ciro', es: 'Ciro' },
  condor_mom: { en: 'Ciro\'s mother', es: 'La mamá de Ciro' },
  rayo:       { en: 'Rayo', es: 'Rayo' },
  pablito:    { en: 'Pablito', es: 'Pablito' },
  volcano:    { en: 'The volcano', es: 'El volcán' },
  guanaco:    { en: 'A guanaco', es: 'Un guanaco' },
  pipo:       { en: 'Pipo', es: 'Pipo' }
};

var STORY_EXTRAS = {
  ocean_dive: {
    cap: [['The divers jump in', 'Los buzos saltan al agua'], ['Fish and a sea turtle', 'Peces y una tortuga marina'], ['Exploring the coral reef', 'Explorando el arrecife de coral']],
    who: [{ q: 'Which animal has a hard shell?', qEs: '¿Qué animal tiene un caparazón duro?', opts: ['turtle', 'divers', 'pablito'], a: 0 }],
    infer: [{
      q: 'How do you think the divers felt during their dive?', qEs: '¿Cómo crees que se sintieron los buzos durante el buceo?',
      options: ['Happy and amazed', 'Bored', 'Angry', 'Sleepy'], optionsEs: ['Felices y asombrados', 'Aburridos', 'Enojados', 'Con sueño'], answer: 0,
      why: 'The story calls it "a beautiful day exploring" — that sounds happy and amazed.', whyEs: 'La historia dice que fue "un hermoso día explorando": eso suena feliz y asombroso.'
    }],
    choice: {
      q: 'On a dive you swim up to a beautiful coral reef. What would you do?', qEs: 'Buceando, llegas a un hermoso arrecife de coral. ¿Qué harías?',
      opts: [
        { en: 'Look closely without touching it', es: 'Mirarlo de cerca sin tocarlo', re: 'Good idea. Coral is alive, and the tiny animals that build it are delicate.', reEs: 'Buena idea. El coral está vivo y los pequeños animales que lo construyen son delicados.' },
        { en: 'Point it out to my dive buddy', es: 'Mostrárselo a mi compañero de buceo', re: 'Divers always stay close to a buddy. Sharing the discovery is smart and safe.', reEs: 'Los buzos siempre se mantienen cerca de un compañero. Compartir lo que ves es inteligente y seguro.' },
        { en: 'Count the different fish', es: 'Contar los distintos peces', re: 'That is what marine scientists do to learn how healthy a reef is.', reEs: 'Eso hacen los científicos marinos para saber qué tan sano está un arrecife.' }
      ]
    }
  },

  andes_rescue: {
    cap: [['Flying over snowy peaks', 'Volando sobre picos nevados'], ['A very strong wind', 'Un viento muy fuerte'], ['A red tent on the snow', 'Una carpa roja en la nieve'], ['A rope to help him', 'Una cuerda para ayudarlo']],
    who: [{ q: 'Who had to be careful in the strong wind?', qEs: '¿Quién tenía que ser cuidadoso con el viento fuerte?', opts: ['pilot', 'climber', 'condor_mom'], a: 0 },
          { q: 'Who was lost on the mountain?', qEs: '¿Quién estaba perdido en la montaña?', opts: ['climber', 'pilot', 'tomas'], a: 0 }],
    infer: [{
      q: 'How did the team find the climber?', qEs: '¿Cómo encontró el equipo al escalador?',
      options: ['They spotted his red tent on the white snow', 'He called them on the phone', 'A dog led them to him', 'He lit a big fire'],
      optionsEs: ['Vieron su carpa roja sobre la nieve blanca', 'Él los llamó por teléfono', 'Un perro los guió', 'Él encendió una gran fogata'], answer: 0,
      why: 'Page 3: a red tent is easy to see on white snow.', whyEs: 'Página 3: una carpa roja se ve fácilmente sobre la nieve blanca.'
    }],
    choice: {
      q: 'You are hiking and the weather turns windy and cold. What would you do?', qEs: 'Estás de excursión y el tiempo se pone ventoso y frío. ¿Qué harías?',
      opts: [
        { en: 'Turn back toward shelter', es: 'Volver hacia un refugio', re: 'Mountaineers say the summit can wait. Getting home safe comes first.', reEs: 'Los montañistas dicen que la cumbre puede esperar. Volver a salvo es lo primero.' },
        { en: 'Put on warm layers and stay with my group', es: 'Abrigarme y quedarme con mi grupo', re: 'Staying warm and together keeps everyone safe.', reEs: 'Estar abrigados y juntos mantiene a todos a salvo.' },
        { en: 'Tell a grown-up how I feel', es: 'Contarle a un adulto cómo me siento', re: 'Always a good idea. Grown-ups can decide the safest plan.', reEs: 'Siempre es buena idea. Los adultos pueden decidir el plan más seguro.' }
      ]
    }
  },

  lost_compass: {
    cap: [['Leo\'s compass is gone', 'La brújula de Leo desapareció'], ['Leo retraces his steps', 'Leo rehace sus pasos'], ['Something shiny under a rock', 'Algo brillante bajo una roca'], ['The path home before dark', 'El camino a casa antes de oscurecer']],
    who: [{ q: 'Who found something shiny under a big rock?', qEs: '¿Quién encontró algo brillante bajo una gran roca?', opts: ['leo', 'tomas', 'explorer'], a: 0 }],
    infer: [{
      q: 'Why did Leo want to find the path home before dark?', qEs: '¿Por qué Leo quería encontrar el camino a casa antes de oscurecer?',
      options: ['A trail is hard to follow without light', 'He wanted to see the stars', 'His compass only works at night', 'He was not tired yet'],
      optionsEs: ['Un sendero es difícil de seguir sin luz', 'Quería ver las estrellas', 'Su brújula solo funciona de noche', 'Todavía no estaba cansado'], answer: 0,
      why: 'Dark means "without light", and it is hard to see a trail at night.', whyEs: 'Oscuro significa "sin luz", y de noche cuesta ver el sendero.'
    }],
    choice: {
      q: 'You notice you lost something on a hike. What would you do first?', qEs: 'Te das cuenta de que perdiste algo en una caminata. ¿Qué harías primero?',
      opts: [
        { en: 'Stop and think where I last had it', es: 'Detenerme y pensar dónde lo tuve por última vez', re: 'Great thinking. That is what Leo did when he retraced his steps.', reEs: 'Muy bien pensado. Eso hizo Leo cuando rehízo sus pasos.' },
        { en: 'Ask my group to help me look', es: 'Pedirle a mi grupo que me ayude a buscar', re: 'More eyes find things faster. Teamwork!', reEs: 'Más ojos encuentran las cosas más rápido. ¡Trabajo en equipo!' },
        { en: 'Stay on the trail and look carefully', es: 'Quedarme en el sendero y mirar con cuidado', re: 'Wise. Staying on the trail keeps you from getting lost too.', reEs: 'Muy sabio. Quedarse en el sendero evita que también te pierdas tú.' }
      ]
    }
  },

  inca_trail: {
    cap: [['An old map of a secret trail', 'Un viejo mapa de un sendero secreto'], ['Packing for the adventure', 'Empacando para la aventura'], ['High up in the Andes', 'En lo alto de los Andes'], ['An ancient stone fortress', 'Una antigua fortaleza de piedra']],
    who: [{ q: 'Who packed a compass, water and snacks?', qEs: '¿Quién empacó una brújula, agua y bocadillos?', opts: ['leo', 'darwin', 'astronaut'], a: 0 }],
    infer: [{
      q: 'Why was it hard to breathe high on the trail?', qEs: '¿Por qué era difícil respirar en lo alto del sendero?',
      options: ['The air is thin up high', 'It was raining', 'Leo ran too fast', 'The trail was underground'],
      optionsEs: ['El aire es fino en la altura', 'Estaba lloviendo', 'Leo corrió muy rápido', 'El sendero era subterráneo'], answer: 0,
      why: 'Page 3 says the air was thin. High in the mountains there is less air in each breath.', whyEs: 'La página 3 dice que el aire era fino. En lo alto de las montañas cada respiro trae menos aire.'
    }],
    choice: {
      q: 'Before a long desert hike, what would you pack first?', qEs: 'Antes de una larga caminata por el desierto, ¿qué empacarías primero?',
      opts: [
        { en: 'Water', es: 'Agua', re: 'Yes. In a dry desert like the Atacama, water is the most important thing to carry.', reEs: 'Sí. En un desierto seco como el de Atacama, el agua es lo más importante que llevar.' },
        { en: 'A map and a compass', es: 'Un mapa y una brújula', re: 'Good. They help you find the way, just like Leo.', reEs: 'Bien. Te ayudan a encontrar el camino, igual que a Leo.' },
        { en: 'A hat for the sun', es: 'Un gorro para el sol', re: 'Smart. The desert sun is very strong, especially up high.', reEs: 'Inteligente. El sol del desierto es muy fuerte, sobre todo en la altura.' }
      ]
    }
  },

  condor_flight: {
    cap: [['Ciro on a rocky ledge', 'Ciro en una cornisa'], ['"It\'s so far!"', '"¡Está tan lejos!"'], ['His mother glides', 'Su mamá planea'], ['Ciro is flying!', '¡Ciro está volando!']],
    who: [{ q: 'Who said "It\'s so far!"?', qEs: '¿Quién dijo "¡Está tan lejos!"?', opts: ['ciro', 'condor_mom', 'pablito'], a: 0 },
          { q: 'Who said "Watch me"?', qEs: '¿Quién dijo "Mírame"?', opts: ['condor_mom', 'ciro', 'leo'], a: 0 }],
    infer: [{
      q: 'Why did Ciro\'s mother say "Watch me"?', qEs: '¿Por qué la mamá de Ciro dijo "Mírame"?',
      options: ['To show Ciro how to fly', 'Because she was going to sleep', 'To find food', 'Because she was leaving'],
      optionsEs: ['Para mostrarle a Ciro cómo volar', 'Porque se iba a dormir', 'Para buscar comida', 'Porque se iba'], answer: 0,
      why: 'Right after, she spread her wings and glided. She was showing him how.', whyEs: 'Justo después abrió las alas y planeó. Le estaba mostrando cómo hacerlo.'
    }],
    choice: {
      q: 'You are about to try something new and a little scary. What would you do?', qEs: 'Vas a intentar algo nuevo y un poco difícil. ¿Qué harías?',
      opts: [
        { en: 'Watch someone who knows how', es: 'Mirar a alguien que sabe hacerlo', re: 'Just like Ciro watched his mother!', reEs: '¡Igual que Ciro miró a su mamá!' },
        { en: 'Take a deep breath and try', es: 'Respirar profundo e intentarlo', re: 'That is what Ciro did, and he flew!', reEs: 'Eso hizo Ciro, ¡y voló!' },
        { en: 'Ask for help', es: 'Pedir ayuda', re: 'Asking for help is a smart and brave thing to do.', reEs: 'Pedir ayuda es algo inteligente y valiente.' }
      ]
    }
  },

  huaso_horse: {
    cap: [['Rayo on the farm', 'Rayo en la granja'], ['Across the fields every morning', 'Por los campos cada mañana']],
    who: [{ q: 'Who carried the huaso across the fields?', qEs: '¿Quién llevaba al huaso por los campos?', opts: ['rayo', 'pablito', 'turtle'], a: 0 },
          { q: 'Who is a Chilean countryman and skilled horseman?', qEs: '¿Quién es un hombre de campo chileno y hábil jinete?', opts: ['huaso', 'darwin', 'astronaut'], a: 0 }],
    choice: {
      q: 'If you helped on a farm like Rayo\'s, which job would you choose?', qEs: 'Si ayudaras en una granja como la de Rayo, ¿qué trabajo elegirías?',
      opts: [
        { en: 'Brushing the horses', es: 'Cepillar a los caballos', re: 'Brushing keeps a horse\'s coat clean and shiny.', reEs: 'Cepillar mantiene el pelaje del caballo limpio y brillante.' },
        { en: 'Feeding the animals', es: 'Alimentar a los animales', re: 'Farm animals need food and fresh water every day.', reEs: 'Los animales de granja necesitan comida y agua fresca todos los días.' },
        { en: 'Picking fruit', es: 'Recoger fruta', re: 'Chile\'s central valley grows grapes, peaches, cherries and much more.', reEs: 'El valle central de Chile produce uvas, duraznos, cerezas y mucho más.' }
      ]
    }
  },

  volcano_legend: {
    cap: [['A giant volcano by blue lakes', 'Un volcán gigante junto a lagos azules'], ['Whispering secrets to the wind', 'Susurrando secretos al viento']],
    who: [{ q: 'Who could whisper secrets to the wind?', qEs: '¿Quién podía susurrar secretos al viento?', opts: ['volcano', 'condor_mom', 'rayo'], a: 0 }],
    infer: [{
      q: 'Is a volcano that whispers a fact or a legend?', qEs: 'Un volcán que susurra, ¿es un hecho o una leyenda?',
      options: ['A legend, a story people told', 'A fact, volcanoes can talk'], optionsEs: ['Una leyenda, una historia que contaba la gente', 'Un hecho, los volcanes pueden hablar'], answer: 0,
      why: 'The story says "People said…". Real volcanoes do not talk, but legends make them feel alive.', whyEs: 'La historia dice "La gente decía…". Los volcanes no hablan, pero las leyendas los hacen parecer vivos.'
    }],
    choice: {
      q: 'What would you most like to learn about volcanoes?', qEs: '¿Qué te gustaría más aprender sobre los volcanes?',
      opts: [
        { en: 'Where lava comes from', es: 'De dónde viene la lava', re: 'Lava is melted rock from deep inside the Earth. Underground it is called magma.', reEs: 'La lava es roca derretida del interior de la Tierra. Bajo tierra se llama magma.' },
        { en: 'Why some have snow on top', es: 'Por qué algunos tienen nieve en la cima', re: 'Tall volcanoes like Osorno reach high, cold air, so snow stays on top.', reEs: 'Volcanes altos como el Osorno llegan al aire frío de la altura, y por eso conservan nieve.' },
        { en: 'How scientists watch them', es: 'Cómo los vigilan los científicos', re: 'They use instruments that feel tiny shakes in the ground.', reEs: 'Usan instrumentos que detectan pequeños temblores en el suelo.' }
      ]
    }
  },

  pudu_journey: {
    cap: [['Pablito wakes up early', 'Pablito despierta temprano'], ['Looking for sweet leaves', 'Buscando hojas dulces']],
    who: [{ q: 'Who is a pudu, the smallest deer in the world?', qEs: '¿Quién es un pudú, el ciervo más pequeño del mundo?', opts: ['pablito', 'rayo', 'guanaco'], a: 0 }],
    infer: [{
      q: 'How might being tiny help a pudu in a thick forest?', qEs: '¿Cómo puede ayudarle a un pudú ser tan pequeño en un bosque espeso?',
      options: ['It can slip under bushes and hide', 'It can fly over the trees', 'It can swim in the sea', 'It is taller than the trees'],
      optionsEs: ['Puede pasar bajo los arbustos y esconderse', 'Puede volar sobre los árboles', 'Puede nadar en el mar', 'Es más alto que los árboles'], answer: 0,
      why: 'Pudús live in dense southern forests, where a small body can move through the plants.', whyEs: 'Los pudúes viven en bosques densos del sur, donde un cuerpo pequeño se mueve bien entre las plantas.'
    }],
    choice: {
      q: 'If you met Pablito in the forest, what would you do?', qEs: 'Si te encontraras con Pablito en el bosque, ¿qué harías?',
      opts: [
        { en: 'Watch quietly from far away', es: 'Mirarlo en silencio desde lejos', re: 'Perfect. Wild animals stay calm when people are quiet and keep their distance.', reEs: 'Perfecto. Los animales silvestres se quedan tranquilos si la gente guarda silencio y distancia.' },
        { en: 'Draw a picture of him', es: 'Hacerle un dibujo', re: 'Nature drawing is a great way to remember what you saw.', reEs: 'Dibujar la naturaleza es una gran forma de recordar lo que viste.' },
        { en: 'Tell my family about it', es: 'Contárselo a mi familia', re: 'Sharing discoveries is part of the fun of exploring.', reEs: 'Compartir lo que descubres es parte de la diversión de explorar.' }
      ]
    }
  },

  glacier_explorer: {
    cap: [['Tomás sets out to study glaciers', 'Tomás sale a estudiar glaciares'], ['Ice sparkling like diamonds', 'Hielo que brilla como diamantes']],
    who: [{ q: 'Who set out to study the ancient glaciers?', qEs: '¿Quién salió a estudiar los antiguos glaciares?', opts: ['tomas', 'leo', 'darwin'], a: 0 }],
    infer: [{
      q: 'Why does the ice "sparkle like diamonds"?', qEs: '¿Por qué el hielo "brilla como diamantes"?',
      options: ['Sunlight reflects off the ice', 'The ice is full of real diamonds', 'It is night time', 'The ice is turning into lava'],
      optionsEs: ['La luz del sol se refleja en el hielo', 'El hielo está lleno de diamantes de verdad', 'Es de noche', 'El hielo se está volviendo lava'], answer: 0,
      why: 'It is a comparison: ice flashes in the sun the way a diamond does.', whyEs: 'Es una comparación: el hielo destella al sol como lo hace un diamante.'
    }],
    choice: {
      q: 'What would you bring to explore a freezing glacier?', qEs: '¿Qué llevarías para explorar un glaciar helado?',
      opts: [
        { en: 'Warm gloves and a hat', es: 'Guantes y gorro abrigados', re: 'Hands and heads lose heat fast in a freezing wind.', reEs: 'Las manos y la cabeza pierden calor rápido con viento helado.' },
        { en: 'Sunglasses', es: 'Lentes de sol', re: 'Snow and ice reflect so much sunlight that explorers protect their eyes.', reEs: 'La nieve y el hielo reflejan tanta luz que los exploradores protegen sus ojos.' },
        { en: 'Crampons for my boots', es: 'Crampones para mis botas', re: 'Crampons are spiky grips that help boots hold on to ice.', reEs: 'Los crampones son puntas que ayudan a las botas a agarrarse al hielo.' }
      ]
    }
  },

  lost_map: {
    cap: [['A strange map in a cave', 'Un mapa extraño en una cueva'], ['The path to a hidden waterfall', 'El camino a una cascada oculta']],
    who: [{ q: 'Who found the strange old map?', qEs: '¿Quién encontró el extraño mapa antiguo?', opts: ['explorer', 'pablito', 'astronaut'], a: 0 }],
    infer: [{
      q: 'Why might the waterfall be called "hidden"?', qEs: '¿Por qué la cascada estaría "oculta"?',
      options: ['The forest trees cover it', 'It is invisible', 'It is up in the sky', 'It only appears at night'],
      optionsEs: ['Los árboles del bosque la tapan', 'Es invisible', 'Está en el cielo', 'Solo aparece de noche'], answer: 0,
      why: 'In a thick forest, trees can hide a waterfall until you are close.', whyEs: 'En un bosque espeso, los árboles pueden tapar una cascada hasta que estás cerca.'
    }],
    choice: {
      q: 'You find an old map. What would you do?', qEs: 'Encuentras un mapa antiguo. ¿Qué harías?',
      opts: [
        { en: 'Show it to a grown-up first', es: 'Mostrárselo primero a un adulto', re: 'Smart. A grown-up can help you plan a safe trip.', reEs: 'Inteligente. Un adulto puede ayudarte a planear un viaje seguro.' },
        { en: 'Study its symbols carefully', es: 'Estudiar sus símbolos con cuidado', re: 'Maps use symbols for rivers, paths and mountains. Reading them is a real skill.', reEs: 'Los mapas usan símbolos para ríos, caminos y montañas. Leerlos es una verdadera habilidad.' },
        { en: 'Plan the route with water and snacks', es: 'Planear la ruta con agua y colación', re: 'Every good explorer prepares before setting out.', reEs: 'Todo buen explorador se prepara antes de partir.' }
      ]
    }
  },

  atacama_desert: {
    cap: [['A very dry desert', 'Un desierto muy seco'], ['A sky full of stars', 'Un cielo lleno de estrellas']],
    infer: [{
      q: 'Why can you see so many stars in the desert at night?', qEs: '¿Por qué se ven tantas estrellas en el desierto de noche?',
      options: ['The air is dry and clear, with few city lights', 'The desert is closer to the stars', 'The Moon makes more stars', 'Because it is daytime'],
      optionsEs: ['El aire es seco y claro, con pocas luces de ciudad', 'El desierto está más cerca de las estrellas', 'La Luna hace más estrellas', 'Porque es de día'], answer: 0,
      why: 'Clouds and city lights hide stars. The desert has very few of both.', whyEs: 'Las nubes y las luces de la ciudad tapan las estrellas. El desierto tiene muy pocas de ambas.'
    }],
    choice: {
      q: 'On a clear night in the desert, what would you like to do?', qEs: 'En una noche despejada en el desierto, ¿qué te gustaría hacer?',
      opts: [
        { en: 'Find the Southern Cross', es: 'Buscar la Cruz del Sur', re: 'The Southern Cross is a famous star pattern you can see from Chile.', reEs: 'La Cruz del Sur es una famosa figura de estrellas que se ve desde Chile.' },
        { en: 'Look at the Moon with binoculars', es: 'Mirar la Luna con binoculares', re: 'Even binoculars show craters on the Moon.', reEs: 'Incluso con binoculares se ven cráteres en la Luna.' },
        { en: 'Count shooting stars', es: 'Contar estrellas fugaces', re: 'Shooting stars are tiny bits of space dust burning up high in the sky.', reEs: 'Las estrellas fugaces son pedacitos de polvo espacial que se queman muy alto en el cielo.' }
      ]
    }
  },

  moon_landing: {
    cap: [['The rocket lifts off', 'El cohete despega'], ['Earth like a blue marble', 'La Tierra como una canica azul'], ['Walking on the dusty surface', 'Caminando sobre la superficie polvorienta']],
    who: [{ q: 'Who looked out the small window at Earth?', qEs: '¿Quiénes miraron la Tierra por la pequeña ventana?', opts: ['astronaut', 'divers', 'pilot'], a: 0 }],
    infer: [{
      q: 'Why did Earth look blue from space?', qEs: '¿Por qué la Tierra se veía azul desde el espacio?',
      options: ['Most of Earth is covered by oceans', 'Earth is painted blue', 'The window glass was blue', 'Space is blue'],
      optionsEs: ['La mayor parte de la Tierra está cubierta por océanos', 'La Tierra está pintada de azul', 'El vidrio de la ventana era azul', 'El espacio es azul'], answer: 0,
      why: 'About seven tenths of Earth\'s surface is ocean water.', whyEs: 'Cerca de siete décimas partes de la superficie de la Tierra son océano.'
    }, {
      q: 'Why did the astronauts step out "carefully"?', qEs: '¿Por qué los astronautas salieron "con cuidado"?',
      options: ['The Moon was a new, unknown place for them', 'They were sleepy', 'It was raining', 'They were late'],
      optionsEs: ['La Luna era un lugar nuevo y desconocido para ellos', 'Tenían sueño', 'Estaba lloviendo', 'Iban atrasados'], answer: 0,
      why: 'On a place no one knows well, every step needs care.', whyEs: 'En un lugar que nadie conoce bien, cada paso necesita cuidado.'
    }],
    choice: {
      q: 'If you could take one thing to the Moon, what would it be?', qEs: 'Si pudieras llevar una sola cosa a la Luna, ¿qué sería?',
      opts: [
        { en: 'A camera', es: 'Una cámara', re: 'The Apollo astronauts took thousands of photos for scientists to study.', reEs: 'Los astronautas del Apolo tomaron miles de fotos para que los científicos las estudiaran.' },
        { en: 'A bag for moon rocks', es: 'Una bolsa para rocas lunares', re: 'Apollo astronauts brought moon rocks back to Earth for study.', reEs: 'Los astronautas del Apolo trajeron rocas lunares a la Tierra para estudiarlas.' },
        { en: 'A notebook', es: 'Un cuaderno', re: 'Writing down what you observe is what real explorers do.', reEs: 'Anotar lo que observas es lo que hacen los verdaderos exploradores.' }
      ]
    }
  },

  darwin_patagonia: {
    cap: [['Darwin sails on the Beagle', 'Darwin navega en el Beagle'], ['Fossils in the cliffs', 'Fósiles en los acantilados'], ['Notes in his journal', 'Notas en su diario'], ['Small differences', 'Pequeñas diferencias'], ['Cold, stormy channels', 'Canales fríos y tormentosos'], ['Ideas for science', 'Ideas para la ciencia']],
    who: [{ q: 'Who wrote detailed notes in a journal?', qEs: '¿Quién escribió notas detalladas en un diario?', opts: ['darwin', 'tomas', 'astronaut'], a: 0 },
          { q: 'Which animal did Darwin compare with ancient bones?', qEs: '¿Qué animal comparó Darwin con huesos antiguos?', opts: ['guanaco', 'turtle', 'pipo'], a: 0 }],
    infer: [{
      q: 'Why did Darwin compare living guanacos and rheas with ancient bones?', qEs: '¿Por qué Darwin comparó guanacos y ñandúes vivos con huesos antiguos?',
      options: ['To see how old and living animals were alike or different', 'To cook a meal', 'To build a ship', 'To sell them'],
      optionsEs: ['Para ver en qué se parecían o diferenciaban los animales antiguos y los vivos', 'Para cocinar', 'Para construir un barco', 'Para venderlos'], answer: 0,
      why: 'Page 3: comparing means looking at how things are alike or different.', whyEs: 'Página 3: comparar es ver en qué se parecen o diferencian las cosas.'
    }, {
      q: 'Why was the voyage near Tierra del Fuego dangerous?', qEs: '¿Por qué el viaje cerca de Tierra del Fuego era peligroso?',
      options: ['The waters were cold and stormy', 'There was no water', 'It was too hot', 'The ship had no sails'],
      optionsEs: ['Las aguas eran frías y tormentosas', 'No había agua', 'Hacía demasiado calor', 'El barco no tenía velas'], answer: 0,
      why: 'Page 5 says the cold, stormy waters made the voyage difficult.', whyEs: 'La página 5 dice que las aguas frías y tormentosas hicieron difícil el viaje.'
    }],
    choice: {
      q: 'If you were a naturalist on the Beagle, what would you study first?', qEs: 'Si fueras naturalista en el Beagle, ¿qué estudiarías primero?',
      opts: [
        { en: 'The fossils in the cliffs', es: 'Los fósiles de los acantilados', re: 'Darwin found bones of giant ground sloths, animals that no longer exist.', reEs: 'Darwin encontró huesos de perezosos gigantes, animales que ya no existen.' },
        { en: 'The living animals', es: 'Los animales vivos', re: 'Guanacos and rheas still live in Patagonia today.', reEs: 'Los guanacos y los ñandúes todavía viven hoy en la Patagonia.' },
        { en: 'The rocks and mountains', es: 'Las rocas y las montañas', re: 'Darwin also studied rocks and saw signs that the land had risen over time.', reEs: 'Darwin también estudió las rocas y vio señales de que el terreno se había levantado con el tiempo.' }
      ]
    }
  },

  valdivia_1960: {
    cap: [['The ground shakes', 'El suelo tiembla'], ['Tectonic plates slip', 'Las placas tectónicas se deslizan'], ['A tsunami reaches the coast', 'Un tsunami llega a la costa'], ['Waves cross the Pacific', 'Las olas cruzan el Pacífico'], ['Stronger buildings, warning signs', 'Edificios más fuertes y señales de alerta'], ['Rebuilding together', 'Reconstruyendo juntos']],
    who: [{ q: 'Who designed stronger buildings after the disaster?', qEs: '¿Quiénes diseñaron edificios más fuertes después del desastre?', opts: ['engineer', 'astronaut', 'huaso'], a: 0 }],
    infer: [{
      q: 'Why are warning systems useful for people near the coast?', qEs: '¿Por qué los sistemas de alerta son útiles para la gente de la costa?',
      options: ['They give people time to reach high ground', 'They stop the waves', 'They make earthquakes smaller', 'They tell the time'],
      optionsEs: ['Dan tiempo para llegar a un lugar alto', 'Detienen las olas', 'Hacen más pequeños los terremotos', 'Dan la hora'], answer: 0,
      why: 'A warning gives people time to reach safe, high places before a wave arrives.', whyEs: 'Una alerta da tiempo para llegar a lugares altos y seguros antes de que llegue una ola.'
    }, {
      q: 'How do we know the tsunami was extremely powerful?', qEs: '¿Cómo sabemos que el tsunami fue muy poderoso?',
      options: ['It crossed the whole Pacific to Hawaii and Japan', 'It happened in May', 'The water was blue', 'It was very quiet'],
      optionsEs: ['Cruzó todo el Pacífico hasta Hawái y Japón', 'Ocurrió en mayo', 'El agua era azul', 'Fue muy silencioso'], answer: 0,
      why: 'Page 4: it traveled across the ocean and reached Hawaii and Japan many hours later.', whyEs: 'Página 4: viajó por el océano y llegó a Hawái y Japón muchas horas después.'
    }],
    choice: {
      q: 'At the beach you see a blue tsunami evacuation route sign. What would you do?', qEs: 'En la playa ves una señal azul de ruta de evacuación de tsunami. ¿Qué harías?',
      opts: [
        { en: 'Learn where the route goes with my family', es: 'Aprender con mi familia hacia dónde va la ruta', re: 'Knowing the way to high ground ahead of time is exactly what the signs are for.', reEs: 'Conocer de antemano el camino a la zona alta es justo para lo que sirven las señales.' },
        { en: 'Ask a grown-up what it means', es: 'Preguntarle a un adulto qué significa', re: 'Good. In Chile those signs point the way to safe, high places.', reEs: 'Bien. En Chile esas señales indican el camino a lugares altos y seguros.' },
        { en: 'Remember: a strong quake by the sea means go uphill', es: 'Recordar: un terremoto fuerte junto al mar significa subir a lo alto', re: 'Correct. Chilean schools practice this in drills.', reEs: 'Correcto. Los colegios de Chile lo practican en simulacros.' }
      ]
    }
  },

  crossing_andes: {
    cap: [['The army sets out', 'El ejército parte'], ['Freezing mountain passes', 'Pasos de montaña helados'], ['Several routes at once', 'Varias rutas a la vez'], ['An exhausting march', 'Una marcha agotadora'], ['Victory at Chacabuco', 'Victoria en Chacabuco'], ['Toward independence', 'Hacia la independencia']],
    who: [{ q: 'Who planned the routes to confuse the Spanish forces?', qEs: '¿Quién planificó las rutas para confundir a las fuerzas españolas?', opts: ['san_martin', 'darwin', 'huaso'], a: 0 },
          { q: 'Who was the Chilean patriot who led the army with San Martín?', qEs: '¿Quién fue el patriota chileno que lideró el ejército con San Martín?', opts: ['ohiggins', 'darwin', 'tomas'], a: 0 }],
    infer: [{
      q: 'Why would several routes at once confuse the Spanish forces?', qEs: '¿Por qué varias rutas a la vez confundirían a las fuerzas españolas?',
      options: ['They could not tell where the main army would appear', 'The soldiers were invisible', 'The routes were secret tunnels', 'The army stayed home'],
      optionsEs: ['No podían saber por dónde aparecería el ejército principal', 'Los soldados eran invisibles', 'Las rutas eran túneles secretos', 'El ejército se quedó en casa'], answer: 0,
      why: 'With groups on many paths, the defenders could not know which pass to guard.', whyEs: 'Con grupos en muchos caminos, los defensores no sabían qué paso vigilar.'
    }],
    choice: {
      q: 'Imagine a long trip across high mountains. What would you prepare first?', qEs: 'Imagina un largo viaje por altas montañas. ¿Qué prepararías primero?',
      opts: [
        { en: 'Warm clothes', es: 'Ropa abrigada', re: 'High passes are freezing at night, even in summer.', reEs: 'Los pasos altos son helados de noche, incluso en verano.' },
        { en: 'Enough food and water', es: 'Suficiente comida y agua', re: 'A long journey needs careful planning of supplies, just as San Martín planned.', reEs: 'Un viaje largo necesita planificar bien las provisiones, como lo hizo San Martín.' },
        { en: 'Strong animals to carry loads', es: 'Animales fuertes para la carga', re: 'The army used thousands of mules and horses to carry food and equipment.', reEs: 'El ejército usó miles de mulas y caballos para cargar comida y equipo.' }
      ]
    }
  },

  atacama_stars: {
    cap: [['One of the driest places on Earth', 'Uno de los lugares más secos de la Tierra'], ['Clear night skies', 'Cielos nocturnos despejados'], ['ALMA on the high plateau', 'ALMA en la meseta alta'], ['Invisible radio waves', 'Ondas de radio invisibles'], ['Where stars and planets are born', 'Donde nacen estrellas y planetas'], ['An even bigger telescope', 'Un telescopio aún más grande']],
    who: [{ q: 'Who studies how stars and planets are born?', qEs: '¿Quiénes estudian cómo nacen las estrellas y los planetas?', opts: ['astronomer', 'divers', 'huaso'], a: 0 }],
    infer: [{
      q: 'Why build telescopes on high desert mountains instead of in cities?', qEs: '¿Por qué construir telescopios en montañas del desierto y no en ciudades?',
      options: ['Less air, clouds and light get in the way', 'Mountains are closer to the Moon', 'Cities are too quiet', 'Telescopes need sand'],
      optionsEs: ['Hay menos aire, nubes y luz que estorben', 'Las montañas están más cerca de la Luna', 'Las ciudades son muy silenciosas', 'Los telescopios necesitan arena'], answer: 0,
      why: 'High, dry and dark places give the clearest view of the sky.', whyEs: 'Los lugares altos, secos y oscuros dan la vista más clara del cielo.'
    }, {
      q: 'Why do astronomers need radio telescopes too?', qEs: '¿Por qué los astrónomos también necesitan radiotelescopios?',
      options: ['Some things in space send out radio waves our eyes cannot see', 'Radio telescopes play music', 'Regular telescopes do not work at night', 'To talk to astronauts'],
      optionsEs: ['Algunas cosas del espacio emiten ondas de radio que no vemos', 'Los radiotelescopios tocan música', 'Los telescopios normales no funcionan de noche', 'Para hablar con astronautas'], answer: 0,
      why: 'Page 4: clouds of gas and dust send out invisible radio waves.', whyEs: 'Página 4: las nubes de gas y polvo emiten ondas de radio invisibles.'
    }],
    choice: {
      q: 'If you visited an observatory in the Atacama, what would you ask?', qEs: 'Si visitaras un observatorio en Atacama, ¿qué preguntarías?',
      opts: [
        { en: 'How far away is the farthest galaxy?', es: '¿Qué tan lejos está la galaxia más lejana?', re: 'Telescopes have seen galaxies whose light traveled more than 13 billion years to reach us.', reEs: 'Los telescopios han visto galaxias cuya luz viajó más de 13 mil millones de años hasta nosotros.' },
        { en: 'How do the big dishes move?', es: '¿Cómo se mueven las grandes antenas?', re: 'ALMA\'s antennas can be carried to new spots on the plateau by giant special trucks.', reEs: 'Las antenas de ALMA pueden trasladarse por la meseta en enormes camiones especiales.' },
        { en: 'What does the sky look like up there?', es: '¿Cómo se ve el cielo allá arriba?', re: 'So dark and clear that thousands of stars are visible with your own eyes.', reEs: 'Tan oscuro y claro que se ven miles de estrellas a simple vista.' }
      ]
    }
  },

  penguin_coast: {
    cap: [['Pipo on the rocky coast', 'Pipo en la costa rocosa'], ['A black band on his chest', 'Una franja negra en el pecho'], ['Swimming after little fish', 'Nadando tras pececitos'], ['Home to the cozy burrow', 'De vuelta a su cueva']],
    who: [{ q: 'Who has a black band across a white chest?', qEs: '¿Quién tiene una franja negra en el pecho blanco?', opts: ['pipo', 'ciro', 'pablito'], a: 0 }],
    infer: [{
      q: 'Why does Pipo go home to a burrow?', qEs: '¿Por qué Pipo vuelve a una cueva?',
      options: ['It is a safe, sheltered place for his family', 'He is looking for fish there', 'Penguins sleep in trees', 'To get away from the water forever'],
      optionsEs: ['Es un lugar seguro y protegido para su familia', 'Busca peces ahí', 'Los pingüinos duermen en árboles', 'Para alejarse del agua para siempre'], answer: 0,
      why: 'Page 4: his family waits in the cozy burrow, a sheltered nest.', whyEs: 'Página 4: su familia lo espera en la cueva, un nido protegido.'
    }],
    choice: {
      q: 'If you visited Pipo\'s beach, what would you do?', qEs: 'Si visitaras la playa de Pipo, ¿qué harías?',
      opts: [
        { en: 'Watch from a distance', es: 'Mirar desde lejos', re: 'Penguins stay calm when visitors keep back and stay quiet.', reEs: 'Los pingüinos se mantienen tranquilos si los visitantes guardan distancia y silencio.' },
        { en: 'Count the penguins', es: 'Contar los pingüinos', re: 'Scientists count penguins to learn how their colonies are doing.', reEs: 'Los científicos cuentan pingüinos para saber cómo están sus colonias.' },
        { en: 'Look for the black chest band', es: 'Buscar la franja negra del pecho', re: 'That band is how you can tell it is a Humboldt penguin!', reEs: '¡Esa franja es la que te dice que es un pingüino de Humboldt!' }
      ]
    }
  },

  empanadas: {
    cap: [['Getting ready for the Fiestas Patrias', 'Preparándose para las Fiestas Patrias'], ['Filling the empanadas with pino', 'Rellenando las empanadas con pino'], ['Into the hot oven', 'Al horno caliente'], ['The whole family eats together', 'Toda la familia come junta']],
    who: [{ q: 'Who rolls out the dough?', qEs: '¿Quién estira la masa?', opts: ['abuela', 'sofia', 'huaso'], a: 0 },
          { q: 'Who helps fill each empanada?', qEs: '¿Quién ayuda a rellenar cada empanada?', opts: ['sofia', 'abuela', 'pipo'], a: 0 }],
    infer: [{
      q: 'Why does the kitchen smell wonderful?', qEs: '¿Por qué la cocina huele tan rico?',
      options: ['The empanadas are baking in the oven', 'Someone opened a window to the sea', 'They are painting the walls', 'It just rained'],
      optionsEs: ['Las empanadas se están horneando', 'Alguien abrió una ventana al mar', 'Están pintando las paredes', 'Acaba de llover'], answer: 0,
      why: 'Page 3 puts the empanadas in the hot oven, and page 4 says the kitchen smells wonderful.', whyEs: 'En la página 3 las empanadas entran al horno, y en la 4 la cocina huele muy rico.'
    }],
    choice: {
      q: 'How would you help in the kitchen?', qEs: '¿Cómo ayudarías en la cocina?',
      opts: [
        { en: 'Wash my hands and help fill', es: 'Lavarme las manos y ayudar a rellenar', re: 'Clean hands first. Every good cook knows that!', reEs: 'Primero las manos limpias. ¡Todo buen cocinero lo sabe!' },
        { en: 'Set the table for the family', es: 'Poner la mesa para la familia', re: 'A set table makes the meal feel like a celebration.', reEs: 'Una mesa bien puesta hace que la comida parezca una fiesta.' },
        { en: 'Help clean up afterwards', es: 'Ayudar a ordenar después', re: 'Cleaning up together is part of cooking as a family.', reEs: 'Ordenar juntos es parte de cocinar en familia.' }
      ]
    }
  },

  miners_33: {
    cap: [['Trapped deep underground', 'Atrapados bajo tierra'], ['Sharing food in the shelter', 'Compartiendo comida en el refugio'], ['A note on the drill', 'Una nota en el taladro'], ['Supplies through a small hole', 'Provisiones por un pequeño agujero'], ['The Fénix capsule', 'La cápsula Fénix'], ['Remembered around the world', 'Recordado en todo el mundo']],
    who: [{ q: 'Who drilled holes to search for the miners?', qEs: '¿Quiénes perforaron agujeros para buscar a los mineros?', opts: ['engineer', 'miner', 'astronaut'], a: 0 },
          { q: 'Who wrote "Estamos bien en el refugio los 33"?', qEs: '¿Quiénes escribieron "Estamos bien en el refugio los 33"?', opts: ['miner', 'engineer', 'astronomer'], a: 0 }],
    infer: [{
      q: 'Why did the miners eat only tiny amounts of food?', qEs: '¿Por qué los mineros comían porciones muy pequeñas?',
      options: ['So it would last until help came', 'They were not hungry', 'The food tasted bad', 'They were saving it for a party'],
      optionsEs: ['Para que durara hasta que llegara ayuda', 'No tenían hambre', 'La comida tenía mal sabor', 'La guardaban para una fiesta'], answer: 0,
      why: 'Page 2: they shared it carefully so it would last as long as possible.', whyEs: 'Página 2: la compartieron con cuidado para que durara lo más posible.'
    }, {
      q: 'Why did the note on the drill matter so much?', qEs: '¿Por qué fue tan importante la nota en el taladro?',
      options: ['It told everyone the 33 miners were alive', 'It was a map of the mine', 'It asked for a new drill', 'It was a birthday card'],
      optionsEs: ['Avisó a todos que los 33 mineros estaban vivos', 'Era un mapa de la mina', 'Pedía un taladro nuevo', 'Era una tarjeta de cumpleaños'], answer: 0,
      why: '"We are fine in the shelter, the 33" meant all of them were alive and together.', whyEs: '"Estamos bien en el refugio los 33" significaba que todos estaban vivos y juntos.'
    }],
    choice: {
      q: 'If you were part of a team in a hard situation, how would you help?', qEs: 'Si fueras parte de un equipo en una situación difícil, ¿cómo ayudarías?',
      opts: [
        { en: 'Share what I have', es: 'Compartir lo que tengo', re: 'The 33 miners shared their food so everyone could last.', reEs: 'Los 33 mineros compartieron su comida para que todos resistieran.' },
        { en: 'Keep everyone\'s spirits up', es: 'Mantener el ánimo de todos', re: 'The miners kept a daily routine and encouraged one another.', reEs: 'Los mineros mantuvieron una rutina diaria y se dieron ánimo unos a otros.' },
        { en: 'Follow the team\'s plan calmly', es: 'Seguir con calma el plan del equipo', re: 'A clear plan, followed calmly, helps a team through hard times.', reEs: 'Un plan claro, seguido con calma, ayuda a un equipo en momentos difíciles.' }
      ]
    }
  },

  rapa_nui: {
    cap: [['An island in the middle of the Pacific', 'Una isla en medio del Pacífico'], ['Navigating by the stars', 'Navegando por las estrellas'], ['Carving moai at Rano Raraku', 'Tallando moai en Rano Raraku'], ['Moai on an ahu, facing inland', 'Moai sobre un ahu, mirando tierra adentro'], ['"Walking" a moai with ropes', '"Caminando" un moai con cuerdas'], ['Sunrise behind the moai', 'Amanecer tras los moai']],
    who: [{ q: 'Who found their way across the ocean by the stars?', qEs: '¿Quiénes cruzaron el océano guiándose por las estrellas?', opts: ['navigator', 'astronaut', 'darwin'], a: 0 }],
    infer: [{
      q: 'How could seabirds help navigators find an island?', qEs: '¿Cómo podían las aves marinas ayudar a encontrar una isla?',
      options: ['Many seabirds fly back to land to rest, so they point the way', 'Seabirds carry maps', 'Seabirds pull the canoes', 'Seabirds only live far from land'],
      optionsEs: ['Muchas aves marinas vuelven a tierra a descansar, así que indican el camino', 'Las aves llevan mapas', 'Las aves tiran de las canoas', 'Las aves solo viven lejos de la tierra'], answer: 0,
      why: 'Many seabirds fish at sea and return to land, so following them can lead to an island.', whyEs: 'Muchas aves marinas pescan en el mar y vuelven a tierra; seguirlas puede llevar a una isla.'
    }, {
      q: 'Why do scientists still test ideas about how the moai were moved?', qEs: '¿Por qué los científicos todavía prueban ideas sobre cómo se movieron los moai?',
      options: ['The statues are huge and the work was done long ago', 'The moai move by themselves today', 'No one has ever seen a moai', 'The island is underwater'],
      optionsEs: ['Las estatuas son enormes y el trabajo se hizo hace mucho', 'Los moai se mueven solos hoy', 'Nadie ha visto nunca un moai', 'La isla está bajo el agua'], answer: 0,
      why: 'Page 5: scientists still study this question, and test ideas like "walking" a moai with ropes.', whyEs: 'Página 5: los científicos aún estudian esta pregunta y prueban ideas como "caminar" un moai con cuerdas.'
    }],
    choice: {
      q: 'If you visited Rapa Nui, what would you do first?', qEs: 'Si visitaras Rapa Nui, ¿qué harías primero?',
      opts: [
        { en: 'Watch the sunrise at Ahu Tongariki', es: 'Ver el amanecer en Ahu Tongariki', re: 'Fifteen moai stand there in a row, and the sun rises behind them.', reEs: 'Allí hay quince moai en fila, y el sol sale detrás de ellos.' },
        { en: 'Visit the quarry at Rano Raraku', es: 'Visitar la cantera de Rano Raraku', re: 'Hundreds of moai are still there, some only half carved.', reEs: 'Allí todavía hay cientos de moai, algunos tallados solo a medias.' },
        { en: 'Learn a word in the Rapa Nui language', es: 'Aprender una palabra en idioma rapanui', re: '"Iorana" is a greeting in Rapa Nui.', reEs: '"Iorana" es un saludo en rapanui.' }
      ]
    }
  }
};
