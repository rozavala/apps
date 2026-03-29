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
          vocab: []
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
            { word: 'huaso', wordEs: 'huaso', def: 'A Chilean countryman and skilled horseman.', defEs: 'Un hombre de campo chileno y hábil jinete.' },
            { word: 'farm', wordEs: 'granja', def: 'An area of land used for growing crops or keeping animals.', defEs: 'Un área de tierra utilizada para cultivar plantas o criar animales.' }
          ]
        },
        {
          en: 'Rayo wore a shiny saddle and carried his huaso across the fields every morning.',
          es: 'Rayo usaba una montura brillante y llevaba a su huaso por los campos cada mañana.',
          vocab: [
            { word: 'saddle', wordEs: 'montura', def: 'A seat for a rider on a horse.', defEs: 'Un asiento para un jinete en un caballo.' },
            { word: 'shiny', wordEs: 'brillante', def: 'Reflecting light, bright and clean.', defEs: 'Que refleja la luz, brillante y limpio.' },
            { word: 'fields', wordEs: 'campos', def: 'Open areas of land without trees or buildings.', defEs: 'Áreas abiertas de tierra sin árboles ni edificios.' }
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
            { word: 'lakes', wordEs: 'lagos', def: 'Large bodies of water surrounded by land.', defEs: 'Grandes cuerpos de agua rodeados de tierra.' },
            { word: 'giant', wordEs: 'gigante', def: 'Very large and powerful.', defEs: 'Muy grande y poderoso.' }
          ]
        },
        {
          en: 'People said that if you listened closely, the mountain would whisper secrets of the earth.',
          es: 'La gente decía que si escuchabas atentamente, la montaña susurraría secretos de la tierra.',
          vocab: [
            { word: 'whisper', wordEs: 'susurraría', def: 'To speak very softly or quietly.', defEs: 'Hablar muy suave o en voz baja.' },
            { word: 'secrets', wordEs: 'secretos', def: 'Things that are kept hidden from others.', defEs: 'Cosas que se mantienen ocultas a los demás.' }
          ]
        }
      ],
      quiz: [
        { q: 'Where was the volcano located?', qEs: '¿Dónde estaba el volcán?', options: ['The desert', 'Near blue lakes', 'In the city', 'On an island'], optionsEs: ['El desierto', 'Cerca de lagos azules', 'En la ciudad', 'En una isla'], answer: 1 }
      ]
    },
    {
      id: 'lost_compass',
      title: 'The Lost Compass',
      titleEs: 'La Brújula Perdida',
      tier: 'explorer', ageMin: 7, region: 'north', icon: '🧭',
      pages: [
        {
          en: 'An explorer named Leo walked across the dry, sandy desert searching for a hidden oasis.',
          es: 'Un explorador llamado Leo caminó a través del desierto seco y arenoso buscando un oasis escondido.',
          vocab: [
            { word: 'explorer', wordEs: 'explorador', def: 'A person who travels in search of new things.', defEs: 'Una persona que viaja en busca de cosas nuevas.' },
            { word: 'desert', wordEs: 'desierto', def: 'A very dry area of land with little water.', defEs: 'Un área de tierra muy seca con poca agua.' }
          ]
        },
        {
          en: 'Suddenly, he noticed his compass was missing. He could not find his way back without it.',
          es: 'De repente, se dio cuenta de que faltaba su brújula. No podía encontrar el camino de regreso sin ella.',
          vocab: [
            { word: 'compass', wordEs: 'brújula', def: 'A tool used to find directions like North or South.', defEs: 'Una herramienta utilizada para encontrar direcciones como el Norte o el Sur.' },
            { word: 'missing', wordEs: 'faltaba', def: 'Lost or not in its usual place.', defEs: 'Perdido o no en su lugar habitual.' }
          ]
        },
        {
          en: 'He looked under a rock and found it resting next to a small lizard. "Thank you, friend!" he said.',
          es: 'Miró debajo de una roca y la encontró descansando junto a un pequeño lagarto. "¡Gracias, amigo!" dijo.',
          vocab: [
            { word: 'lizard', wordEs: 'lagarto', def: 'A reptile with rough skin and a long tail.', defEs: 'Un reptil de piel áspera y cola larga.' }
          ]
        }
      ],
      quiz: [
        { q: 'What did Leo lose?', qEs: '¿Qué perdió Leo?', options: ['His map', 'His compass', 'His water', 'His hat'], optionsEs: ['Su mapa', 'Su brújula', 'Su agua', 'Su sombrero'], answer: 1 },
        { q: 'Where was the missing item?', qEs: '¿Dónde estaba el objeto perdido?', options: ['In a tree', 'Under a rock', 'In his bag', 'On a mountain'], optionsEs: ['En un árbol', 'Debajo de una roca', 'En su bolso', 'En una montaña'], answer: 1 }
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
