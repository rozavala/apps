/* ================================================================
   STORY EXPLORER — story-explorer.js
   Reading library with comprehension and vocabulary.
   Storage key: zs_story_[username] via getUserAppKey('story')
   ================================================================ */

const StoryExplorer = (() => {
  'use strict';

  // ── Story Library ──
  const STORIES = [
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
    }
  ];

  // ── State ──
  let currentStory = null;
  let currentPage = 0;
  let lang = 'en';
  let vocabCollected = [];
  let currentTier = 'cadet';

  // ── Storage ──
  function _key() { return typeof getUserAppKey === 'function' ? getUserAppKey('story') : null; }
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
    const page = currentStory.pages[currentPage];
    document.getElementById('story-title').textContent = lang === 'es' ? currentStory.titleEs : currentStory.title;
    document.getElementById('page-indicator').textContent = `${lang === 'es' ? 'Página' : 'Page'} ${currentPage + 1} / ${currentStory.pages.length}`;
    document.getElementById('page-icon').textContent = currentStory.icon;

    let text = lang === 'es' ? page.es : page.en;
    
    // Highlight vocab words
    if (page.vocab) {
      page.vocab.forEach(v => {
        const word = lang === 'es' ? v.wordEs : v.word;
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        text = text.replace(regex, `<span class="vocab-link" onclick="StoryExplorer.showVocab('${word}', '${lang === 'es' ? v.defEs : v.def}')">${word}</span>`);
      });
    }

    document.getElementById('page-text').innerHTML = text;
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
    const page = currentStory.pages[currentPage];
    const text = lang === 'es' ? page.es : page.en;
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang === 'es' ? 'es-CL' : 'en-US';
      u.rate = 0.9;
      speechSynthesis.speak(u);
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
    speechSynthesis.cancel();
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

  return { init, startStory, nextPage, prevPage, showVocab, answerQuiz, setTier, toggleLanguage, backToLibrary, readAloud, getStats };
})();
