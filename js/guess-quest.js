/* ================================================================
   GUESS QUEST — guess-quest.js
   20 Questions game for car trips.
   Requires: auth.js, sounds.js, timer.js, activity-log.js
   ================================================================ */

const GuessQuest = (() => {
  'use strict';

  // ── State ──
  let secret = null;
  let questionCount = 0;
  let maxQuestions = 20;
  let askedAttrs = new Set();
  let confirmedTrue = {};
  let confirmedFalse = {};
  let lang = 'en';
  let selectedCategory = 'all';
  let stars = 0;

  // ── Storage key ──
  const STORE_PREFIX = 'zs_guess_';

  function _storageKey() {
    return typeof getUserAppKey === 'function'
      ? getUserAppKey(STORE_PREFIX)
      : STORE_PREFIX + 'default';
  }
  function _load() {
    try { return JSON.parse(localStorage.getItem(_storageKey())) || {}; }
    catch { return {}; }
  }
  function _save(data) {
    localStorage.setItem(_storageKey(), JSON.stringify(data));
    if (typeof CloudSync !== 'undefined' && CloudSync.online) CloudSync.push(_storageKey());
  }

  // ── Items Database (~200 items) ──
  const ITEMS = [
    // --- ANIMALS ---
    { id: 'lion', emoji: '🦁', category: 'animal', name: { en: 'Lion', es: 'León' }, attrs: { isAlive: true, isReal: true, isAnimal: true, isMammal: true, hasFur: true, isBig: true, isDangerous: true, livesOnLand: true, hasTail: true, hasLegs: true, isYellow: true, makesSounds: true, livesInAfrica: true } },
    { id: 'elephant', emoji: '🐘', category: 'animal', name: { en: 'Elephant', es: 'Elefante' }, attrs: { isAlive: true, isReal: true, isAnimal: true, isMammal: true, isBig: true, livesOnLand: true, hasTail: true, hasLegs: true, isGrey: true, makesSounds: true, livesInAfrica: true } },
    { id: 'giraffe', emoji: '🦒', category: 'animal', name: { en: 'Giraffe', es: 'Jirafa' }, attrs: { isAlive: true, isReal: true, isAnimal: true, isMammal: true, hasFur: true, isBig: true, livesOnLand: true, hasTail: true, hasLegs: true, isYellow: true, livesInAfrica: true } },
    { id: 'penguin', emoji: '🐧', category: 'animal', name: { en: 'Penguin', es: 'Pingüino' }, attrs: { isAlive: true, isReal: true, isAnimal: true, canFly: false, livesInWater: true, livesOnLand: true, hasLegs: true, isBlack: true, isWhite: true, makesSounds: true, hasWings: true } },
    { id: 'dolphin', emoji: '🐬', category: 'animal', name: { en: 'Dolphin', es: 'Delfín' }, attrs: { isAlive: true, isReal: true, isAnimal: true, isMammal: true, livesInWater: true, hasTail: true, isBlue: true, makesSounds: true } },
    { id: 'eagle', emoji: '🦅', category: 'animal', name: { en: 'Eagle', es: 'Águila' }, attrs: { isAlive: true, isReal: true, isAnimal: true, canFly: true, livesOnLand: true, hasLegs: true, makesSounds: true, hasWings: true } },
    { id: 'snake', emoji: '🐍', category: 'animal', name: { en: 'Snake', es: 'Serpiente' }, attrs: { isAlive: true, isReal: true, isAnimal: true, isDangerous: true, livesOnLand: true, hasTail: true, makesSounds: true, isGreen: true } },
    { id: 'dog', emoji: '🐶', category: 'animal', name: { en: 'Dog', es: 'Perro' }, attrs: { isAlive: true, isReal: true, isAnimal: true, isMammal: true, hasFur: true, isPet: true, livesOnLand: true, hasTail: true, hasLegs: true, makesSounds: true, foundInHouse: true } },
    { id: 'cat', emoji: '🐱', category: 'animal', name: { en: 'Cat', es: 'Gato' }, attrs: { isAlive: true, isReal: true, isAnimal: true, isMammal: true, hasFur: true, isPet: true, livesOnLand: true, hasTail: true, hasLegs: true, makesSounds: true, foundInHouse: true } },
    { id: 'shark', emoji: '🦈', category: 'animal', name: { en: 'Shark', es: 'Tiburón' }, attrs: { isAlive: true, isReal: true, isAnimal: true, livesInWater: true, isBig: true, isDangerous: true, hasTail: true } },
    { id: 'condor', emoji: '🦅', category: 'animal', name: { en: 'Condor', es: 'Cóndor' }, attrs: { isAlive: true, isReal: true, isAnimal: true, canFly: true, livesOnLand: true, isBig: true, hasLegs: true, isBlack: true, hasWings: true, foundInChile: true } },
    { id: 'huemul', emoji: '🦌', category: 'animal', name: { en: 'Huemul', es: 'Huemul' }, attrs: { isAlive: true, isReal: true, isAnimal: true, isMammal: true, hasFur: true, livesOnLand: true, hasTail: true, hasLegs: true, foundInChile: true } },
    { id: 'pudu', emoji: '🦌', category: 'animal', name: { en: 'Pudu', es: 'Pudú' }, attrs: { isAlive: true, isReal: true, isAnimal: true, isMammal: true, hasFur: true, isSmall: true, livesOnLand: true, hasTail: true, hasLegs: true, foundInChile: true } },
    { id: 'turtle', emoji: '🐢', category: 'animal', name: { en: 'Turtle', es: 'Tortuga' }, attrs: { isAlive: true, isReal: true, isAnimal: true, livesInWater: true, livesOnLand: true, isSmall: true, hasLegs: true, isGreen: true } },
    { id: 'butterfly', emoji: '🦋', category: 'animal', name: { en: 'Butterfly', es: 'Mariposa' }, attrs: { isAlive: true, isReal: true, isAnimal: true, canFly: true, isSmall: true, hasWings: true, isColorful: true } },
    { id: 'bee', emoji: '🐝', category: 'animal', name: { en: 'Bee', es: 'Abeja' }, attrs: { isAlive: true, isReal: true, isAnimal: true, canFly: true, isSmall: true, isDangerous: true, hasWings: true, isYellow: true, isBlack: true } },
    { id: 'spider', emoji: '🕷️', category: 'animal', name: { en: 'Spider', es: 'Araña' }, attrs: { isAlive: true, isReal: true, isAnimal: true, isSmall: true, hasLegs: true, makesWebs: true } },
    { id: 'monkey', emoji: '🐒', category: 'animal', name: { en: 'Monkey', es: 'Mono' }, attrs: { isAlive: true, isReal: true, isAnimal: true, isMammal: true, hasFur: true, livesInJungle: true, livesOnLand: true, hasTail: true, hasLegs: true, makesSounds: true } },
    { id: 'panda', emoji: '🐼', category: 'animal', name: { en: 'Panda', es: 'Panda' }, attrs: { isAlive: true, isReal: true, isAnimal: true, isMammal: true, hasFur: true, isBig: true, livesOnLand: true, isBlack: true, isWhite: true, hasLegs: true } },
    { id: 'whale', emoji: '🐋', category: 'animal', name: { en: 'Whale', es: 'Ballena' }, attrs: { isAlive: true, isReal: true, isAnimal: true, isMammal: true, livesInWater: true, isBig: true, hasTail: true, makesSounds: true } },

    // --- FOODS ---
    { id: 'pizza', emoji: '🍕', category: 'food', name: { en: 'Pizza', es: 'Pizza' }, attrs: { isFood: true, isSweet: false, isRound: true, foundInKitchen: true, hasCheese: true } },
    { id: 'ice_cream', emoji: '🍦', category: 'food', name: { en: 'Ice Cream', es: 'Helado' }, attrs: { isFood: true, isSweet: true, isCold: true, foundInKitchen: true } },
    { id: 'banana', emoji: '🍌', category: 'food', name: { en: 'Banana', es: 'Plátano' }, attrs: { isFood: true, isSweet: true, isYellow: true, isFruit: true } },
    { id: 'apple', emoji: '🍎', category: 'food', name: { en: 'Apple', es: 'Manzana' }, attrs: { isFood: true, isSweet: true, isRed: true, isRound: true, isFruit: true } },
    { id: 'watermelon', emoji: '🍉', category: 'food', name: { en: 'Watermelon', es: 'Sandía' }, attrs: { isFood: true, isSweet: true, isGreen: true, isRed: true, isFruit: true, isBig: true } },
    { id: 'broccoli', emoji: '🥦', category: 'food', name: { en: 'Broccoli', es: 'Brócoli' }, attrs: { isFood: true, isSweet: false, isGreen: true, isVegetable: true } },
    { id: 'chocolate', emoji: '🍫', category: 'food', name: { en: 'Chocolate', es: 'Chocolate' }, attrs: { isFood: true, isSweet: true, isBrown: true } },
    { id: 'empanada', emoji: '🥟', category: 'food', name: { en: 'Empanada', es: 'Empanada' }, attrs: { isFood: true, isSweet: false, foundInChile: true, foundInKitchen: true } },
    { id: 'sopaipilla', emoji: '🍘', category: 'food', name: { en: 'Sopaipilla', es: 'Sopaipilla' }, attrs: { isFood: true, isSweet: false, foundInChile: true, isYellow: true, isRound: true } },
    { id: 'manjar', emoji: '🍯', category: 'food', name: { en: 'Manjar', es: 'Manjar' }, attrs: { isFood: true, isSweet: true, foundInChile: true, isBrown: true } },

    // --- PLANTS ---
    { id: 'sunflower', emoji: '🌻', category: 'plant', name: { en: 'Sunflower', es: 'Girasol' }, attrs: { isAlive: true, isReal: true, isPlant: true, isYellow: true, isBig: true } },
    { id: 'rose', emoji: '🌹', category: 'plant', name: { en: 'Rose', es: 'Rosa' }, attrs: { isAlive: true, isReal: true, isPlant: true, isRed: true, hasThorns: true } },
    { id: 'cactus', emoji: '🌵', category: 'plant', name: { en: 'Cactus', es: 'Cactus' }, attrs: { isAlive: true, isReal: true, isPlant: true, isGreen: true, livesInDesert: true, hasThorns: true } },
    { id: 'tree', emoji: '🌳', category: 'plant', name: { en: 'Tree', es: 'Árbol' }, attrs: { isAlive: true, isReal: true, isPlant: true, isBig: true, hasLeaves: true, isGreen: true, isBrown: true } },
    { id: 'copihue', emoji: '🌺', category: 'plant', name: { en: 'Copihue', es: 'Copihue' }, attrs: { isAlive: true, isReal: true, isPlant: true, isRed: true, foundInChile: true } },

    // --- VEHICLES ---
    { id: 'car', emoji: '🚗', category: 'vehicle', name: { en: 'Car', es: 'Auto' }, attrs: { isVehicle: true, hasWheels: true, livesOnLand: true, makesSounds: true, foundInHouse: true } },
    { id: 'airplane', emoji: '✈️', category: 'vehicle', name: { en: 'Airplane', es: 'Avión' }, attrs: { isVehicle: true, canFly: true, makesSounds: true, isBig: true, hasWings: true } },
    { id: 'bicycle', emoji: '🚲', category: 'vehicle', name: { en: 'Bicycle', es: 'Bicicleta' }, attrs: { isVehicle: true, hasWheels: true, livesOnLand: true, isSmall: true } },
    { id: 'boat', emoji: '🚢', category: 'vehicle', name: { en: 'Boat', es: 'Barco' }, attrs: { isVehicle: true, livesInWater: true, makesSounds: true, isBig: true } },
    { id: 'rocket', emoji: '🚀', category: 'vehicle', name: { en: 'Rocket', es: 'Cohete' }, attrs: { isVehicle: true, canFly: true, makesSounds: true, isBig: true, goesToSpace: true } },

    // --- CHARACTERS ---
    { id: 'pirate', emoji: '🏴‍☠️', category: 'character', name: { en: 'Pirate', es: 'Pirata' }, attrs: { isCharacter: true, isHuman: true, isFictional: true, livesInWater: true } },
    { id: 'superhero', emoji: '🦸', category: 'character', name: { en: 'Superhero', es: 'Superhéroe' }, attrs: { isCharacter: true, isHuman: true, isFictional: true, canFly: true } },
    { id: 'robot', emoji: '🤖', category: 'character', name: { en: 'Robot', es: 'Robot' }, attrs: { isCharacter: true, isReal: true, makesSounds: true } },
    { id: 'dragon', emoji: '🐉', category: 'character', name: { en: 'Dragon', es: 'Dragón' }, attrs: { isCharacter: true, isFictional: true, canFly: true, isBig: true, makesSounds: true, isDangerous: true, hasWings: true, hasTail: true } },
    { id: 'unicorn', emoji: '🦄', category: 'character', name: { en: 'Unicorn', es: 'Unicornio' }, attrs: { isCharacter: true, isFictional: true, isMammal: true, hasFur: true, livesOnLand: true, hasTail: true, hasLegs: true, isWhite: true } },

    // --- PLACES ---
    { id: 'beach', emoji: '🏖️', category: 'place', name: { en: 'Beach', es: 'Playa' }, attrs: { isPlace: true, isReal: true, livesInWater: true, livesOnLand: true } },
    { id: 'mountain', emoji: '⛰️', category: 'place', name: { en: 'Mountain', es: 'Montaña' }, attrs: { isPlace: true, isReal: true, isBig: true, livesOnLand: true, foundInChile: true } },
    { id: 'moon', emoji: '🌙', category: 'place', name: { en: 'Moon', es: 'Luna' }, attrs: { isPlace: true, isReal: true, isBig: true, goesToSpace: true, isWhite: true, isRound: true } },

    // --- OBJECTS ---
    { id: 'guitar', emoji: '🎸', category: 'object', name: { en: 'Guitar', es: 'Guitarra' }, attrs: { isObject: true, isReal: true, makesSounds: true, foundInHouse: true } },
    { id: 'book', emoji: '📚', category: 'object', name: { en: 'Book', es: 'Libro' }, attrs: { isObject: true, isReal: true, foundInHouse: true } },
    { id: 'clock', emoji: '⏰', category: 'object', name: { en: 'Clock', es: 'Reloj' }, attrs: { isObject: true, isReal: true, makesSounds: true, foundInHouse: true, isRound: true } }
  ];

  // (Adding more items to reach ~200+ would go here, but starting with these core sets)

  // ── Question definitions ──
  const QUESTION_CATEGORIES = [
    {
      label: { en: '🌍 What is it?', es: '🌍 ¿Qué es?' },
      questions: [
        { attr: 'isAnimal',    text: { en: 'Is it an animal?', es: '¿Es un animal?' } },
        { attr: 'isPlant',     text: { en: 'Is it a plant?', es: '¿Es una planta?' } },
        { attr: 'isFood',      text: { en: 'Is it food?', es: '¿Es comida?' } },
        { attr: 'isVehicle',   text: { en: 'Is it a vehicle?', es: '¿Es un vehículo?' } },
        { attr: 'isCharacter', text: { en: 'Is it a character?', es: '¿Es un personaje?' } },
        { attr: 'isPlace',     text: { en: 'Is it a place?', es: '¿Es un lugar?' } },
        { attr: 'isObject',    text: { en: 'Is it an object?', es: '¿Es un objeto?' } },
      ]
    },
    {
      label: { en: '🔎 Properties', es: '🔎 Propiedades' },
      questions: [
        { attr: 'isBig',       text: { en: 'Is it big?', es: '¿Es grande?' } },
        { attr: 'isSmall',     text: { en: 'Is it small?', es: '¿Es pequeño?' } },
        { attr: 'isDangerous', text: { en: 'Is it dangerous?', es: '¿Es peligroso?' } },
        { attr: 'isReal',      text: { en: 'Is it real?', es: '¿Es real?' } },
        { attr: 'isFictional', text: { en: 'Is it fictional?', es: '¿Es ficticio?' } },
        { attr: 'isRound',     text: { en: 'Is it round?', es: '¿Es redondo?' } },
        { attr: 'makesSounds', text: { en: 'Does it make sounds?', es: '¿Hace sonidos?' } },
      ]
    },
    {
      label: { en: '🎨 Colors', es: '🎨 Colores' },
      questions: [
        { attr: 'isYellow', text: { en: 'Is it yellow?', es: '¿Es amarillo?' } },
        { attr: 'isGreen',  text: { en: 'Is it green?', es: '¿Es verde?' } },
        { attr: 'isRed',    text: { en: 'Is it red?', es: '¿Es rojo?' } },
        { attr: 'isBlue',   text: { en: 'Is it blue?', es: '¿Es azul?' } },
        { attr: 'isWhite',  text: { en: 'Is it white?', es: '¿Es blanco?' } },
        { attr: 'isBlack',  text: { en: 'Is it black?', es: '¿Es negro?' } },
      ]
    },
    {
      label: { en: '🐾 Animal Details', es: '🐾 Detalles Animal' },
      showIf: 'isAnimal',
      questions: [
        { attr: 'isMammal',      text: { en: 'Is it a mammal?', es: '¿Es un mamífero?' } },
        { attr: 'canFly',        text: { en: 'Can it fly?', es: '¿Puede volar?' } },
        { attr: 'livesInWater',  text: { en: 'Does it live in water?', es: '¿Vive en el agua?' } },
        { attr: 'hasFur',        text: { en: 'Does it have fur?', es: '¿Tiene pelaje?' } },
        { attr: 'isPet',         text: { en: 'Is it a pet?', es: '¿Es una mascota?' } },
        { attr: 'hasTail',       text: { en: 'Does it have a tail?', es: '¿Tiene cola?' } },
        { attr: 'hasWings',      text: { en: 'Does it have wings?', es: '¿Tiene alas?' } },
      ]
    },
    {
      label: { en: '🍽️ Food Details', es: '🍽️ Detalles Comida' },
      showIf: 'isFood',
      questions: [
        { attr: 'isSweet',       text: { en: 'Is it sweet?', es: '¿Es dulce?' } },
        { attr: 'isFruit',       text: { en: 'Is it a fruit?', es: '¿Es una fruta?' } },
        { attr: 'foundInKitchen',text: { en: 'Found in the kitchen?', es: '¿Está en la cocina?' } },
      ]
    },
    {
      label: { en: '📍 Where?', es: '📍 ¿Dónde?' },
      questions: [
        { attr: 'livesInAfrica', text: { en: 'Found in Africa?', es: '¿Se encuentra en África?' } },
        { attr: 'livesInJungle', text: { en: 'Found in the jungle?', es: '¿Está en la selva?' } },
        { attr: 'foundInChile',  text: { en: 'Found in Chile?', es: '¿Se encuentra en Chile?' } },
        { attr: 'foundInHouse',  text: { en: 'Found in a house?', es: '¿Está en una casa?' } },
      ]
    }
  ];

  // ── Category packs ──
  const CATEGORY_PACKS = [
    { id: 'all',       emoji: '🌟', name: { en: 'Everything', es: 'Todo' } },
    { id: 'animal',    emoji: '🐾', name: { en: 'Animals', es: 'Animales' } },
    { id: 'food',      emoji: '🍕', name: { en: 'Food', es: 'Comida' } },
    { id: 'vehicle',   emoji: '🚗', name: { en: 'Vehicles', es: 'Vehículos' } },
    { id: 'character', emoji: '🦸', name: { en: 'Characters', es: 'Personajes' } },
    { id: 'place',     emoji: '🏔️', name: { en: 'Places', es: 'Lugares' } },
    { id: 'object',    emoji: '🔧', name: { en: 'Objects', es: 'Objetos' } },
  ];

  // ── Init ──
  function init() {
    const user = getActiveUser();
    if (!user) return;

    if (typeof CloudSync !== 'undefined' && CloudSync.online) {
      CloudSync.pull(_storageKey());
    }

    _renderCategorySelect();
    _updateHubStats();
  }

  function _renderCategorySelect() {
    const grid = document.getElementById('category-grid');
    grid.innerHTML = CATEGORY_PACKS.map(p => `
      <div class="category-card" onclick="GuessQuest.startRound('${p.id}')">
        <span class="cat-emoji">${p.emoji}</span>
        <div class="cat-name">${p.name[lang]}</div>
      </div>
    `).join('');
  }

  // ── Start a round ──
  function startRound(category) {
    selectedCategory = category;
    const pool = category === 'all'
      ? ITEMS
      : ITEMS.filter(item => item.category === category);

    const tier = typeof getAgeTier === 'function' ? getAgeTier() : 'intermediate';
    maxQuestions = tier === 'beginner' ? 15 : 20;

    secret = pool[Math.floor(Math.random() * pool.length)];
    questionCount = 0;
    askedAttrs = new Set();
    confirmedTrue = {};
    confirmedFalse = {};
    stars = 0;

    _updateQuestionCounter();
    _renderGame();
    _showScreen('game');
    
    document.getElementById('answer-display').classList.remove('active');
  }

  function _renderGame() {
    const container = document.getElementById('question-categories');
    container.innerHTML = QUESTION_CATEGORIES.map(cat => {
      // Logic for showIf
      if (cat.showIf && !confirmedTrue[cat.showIf]) return '';

      return `
        <div class="cat-group">
          <div class="cat-label">${cat.label[lang]}</div>
          <div class="q-grid">
            ${cat.questions.map(q => {
              const isAsked = askedAttrs.has(q.attr);
              return `
                <button class="q-btn ${isAsked ? 'asked' : ''}" 
                        onclick="GuessQuest.askQuestion('${q.attr}')"
                        ${isAsked ? 'disabled' : ''}>
                  ${q.text[lang]}
                </button>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  function askQuestion(attr) {
    if (askedAttrs.has(attr) || questionCount >= maxQuestions) return;

    askedAttrs.add(attr);
    questionCount++;

    const value = secret.attrs[attr];
    let answerText, emoji, cssClass, spokenText;

    if (value === true) {
      answerText = lang === 'es' ? '¡SÍ!' : 'YES!';
      emoji = '✅';
      cssClass = 'answer-yes';
      spokenText = lang === 'es' ? 'Sí' : 'Yes';
      confirmedTrue[attr] = true;
    } else if (value === false) {
      answerText = lang === 'es' ? '¡NO!' : 'NO!';
      emoji = '❌';
      cssClass = 'answer-no';
      spokenText = lang === 'es' ? 'No' : 'No';
      confirmedFalse[attr] = true;
    } else {
      answerText = lang === 'es' ? 'QUIZÁS...' : 'MAYBE...';
      emoji = '🤷';
      cssClass = 'answer-maybe';
      spokenText = lang === 'es' ? 'No estoy seguro' : "I'm not sure";
    }

    _showAnswer(emoji, answerText, cssClass);
    _speakAnswer(spokenText);
    _updateQuestionCounter();
    _renderGame(); // Refresh buttons

    if (questionCount >= maxQuestions) {
      setTimeout(() => _revealSecret(false), 2000);
    }
  }

  function _showAnswer(emoji, text, cssClass) {
    const display = document.getElementById('answer-display');
    display.className = 'answer-display active ' + cssClass;
    document.getElementById('answer-emoji').textContent = emoji;
    document.getElementById('answer-text').textContent = text;

    setTimeout(() => {
      display.classList.remove('active');
    }, 2000);
  }

  function showGuessScreen() {
    const candidates = _getCandidates();
    _renderGuessGrid(candidates);
    _showScreen('guess');
  }

  function _getCandidates() {
    const pool = selectedCategory === 'all'
      ? ITEMS
      : ITEMS.filter(item => item.category === selectedCategory);

    let filtered = pool.filter(item => {
      for (const attr in confirmedTrue) {
        if (item.attrs[attr] !== true) return false;
      }
      for (const attr in confirmedFalse) {
        if (item.attrs[attr] !== false) return false;
      }
      return true;
    });

    const tier = typeof getAgeTier === 'function' ? getAgeTier() : 'intermediate';
    const numCandidates = tier === 'beginner' ? 3 : tier === 'advanced' ? 6 : 4;

    if (!filtered.find(i => i.id === secret.id)) {
      filtered.push(secret);
    }

    const shuffled = filtered.sort(() => Math.random() - 0.5);
    let picked = shuffled.slice(0, numCandidates);
    if (!picked.find(i => i.id === secret.id)) {
      picked[Math.floor(Math.random() * picked.length)] = secret;
    }

    return picked.sort(() => Math.random() - 0.5);
  }

  function _renderGuessGrid(candidates) {
    const grid = document.getElementById('guess-grid');
    grid.innerHTML = candidates.map(c => `
      <div class="guess-card" onclick="GuessQuest.makeGuess('${c.id}')">
        <span class="guess-emoji">${c.emoji}</span>
        <div class="guess-name">${c.name[lang]}</div>
      </div>
    `).join('') + `
      <div class="guess-card" onclick="GuessQuest._revealSecret(false)">
        <span class="guess-emoji">❓</span>
        <div class="guess-name">${lang === 'es' ? 'Ninguno de estos' : 'None of these'}</div>
      </div>
    `;
  }

  function makeGuess(itemId) {
    if (itemId === secret.id) {
      stars = questionCount <= 8 ? 3 : questionCount <= 14 ? 2 : 1;
      if (typeof SFX !== 'undefined') SFX.cheer();
      _speakAnswer(lang === 'es'
        ? '¡Correcto! ¡Era ' + secret.name[lang] + '!'
        : 'Correct! It was ' + secret.name[lang] + '!');
      _showResults(true);
    } else {
      if (typeof SFX !== 'undefined') SFX.wrong();
      _revealSecret(false);
    }
  }

  function _revealSecret(won) {
    if (!won) {
      _speakAnswer(lang === 'es'
        ? '¡Era ' + secret.name[lang] + '!'
        : 'It was ' + secret.name[lang] + '!');
    }
    _showResults(won);
  }

  function _showResults(won) {
    const wrap = document.getElementById('results-wrap');
    const emoji = won ? (stars === 3 ? '🏆' : '🌟') : '💪';
    const title = won ? (lang === 'es' ? '¡Lo lograste!' : 'You Got It!') : (lang === 'es' ? '¡Casi!' : 'So Close!');
    
    wrap.innerHTML = `
      <span class="results-emoji">${emoji}</span>
      <div class="results-title">${title}</div>
      <div class="results-subtitle">${lang === 'es' ? 'Era un ' : 'It was a '}${secret.emoji} ${secret.name[lang]}</div>
      <div class="results-stats">
        <div>⭐ ${stars} stars earned</div>
        <div>❓ ${questionCount} questions asked</div>
      </div>
      <div>
        <button class="action-btn btn-primary" onclick="GuessQuest.startRound('${selectedCategory}')">
          ${lang === 'es' ? 'Jugar de nuevo' : 'Play Again'} 🔁
        </button>
        <button class="action-btn btn-secondary" onclick="GuessQuest.backToSelect()">
          ${lang === 'es' ? 'Menú Principal' : 'Main Menu'} 🏠
        </button>
      </div>
    `;
    _showScreen('results');
    _saveProgress(won);
  }

  function _saveProgress(won) {
    const data = _load();
    data.roundsPlayed = (data.roundsPlayed || 0) + 1;
    if (won) data.roundsWon = (data.roundsWon || 0) + 1;
    data.totalStars = (data.totalStars || 0) + stars;
    _save(data);

    if (typeof ActivityLog !== 'undefined') {
      ActivityLog.log('Guess Quest', '🎯',
        `${won ? 'Guessed' : 'Missed'} ${secret.name.en} — ${stars} star${stars !== 1 ? 's' : ''}`);
    }
  }

  function _speakAnswer(text) {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang === 'es' ? 'es-CL' : 'en-US';
      u.rate = 1.0;
      u.pitch = 1.2;
      speechSynthesis.speak(u);
    }
  }

  function _updateQuestionCounter() {
    document.getElementById('question-counter').textContent = `❓ ${questionCount} / ${maxQuestions}`;
    document.getElementById('gq-stars').textContent = `⭐ ${stars}`;
  }

  function _updateHubStats() {
    const data = _load();
    // Update any hub elements if needed
  }

  function _showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById('screen-' + name);
    if (el) el.classList.add('active');
  }

  function backToSelect() { _showScreen('select'); }
  function backToGame() { _showScreen('game'); }

  function toggleLanguage() {
    lang = lang === 'en' ? 'es' : 'en';
    const label = document.getElementById('lang-label');
    if (label) label.textContent = lang === 'en' ? 'ES / EN' : 'EN / ES';
    
    const active = document.querySelector('.screen.active');
    if (active.id === 'screen-select') _renderCategorySelect();
    else if (active.id === 'screen-game') _renderGame();
  }

  function getStats() {
    const data = _load();
    return {
      totalStars: data.totalStars || 0,
      roundsPlayed: data.roundsPlayed || 0,
      roundsWon: data.roundsWon || 0
    };
  }

  document.addEventListener('DOMContentLoaded', init);

  return {
    init, startRound, askQuestion, showGuessScreen, makeGuess,
    backToSelect, backToGame, toggleLanguage, getStats, _revealSecret
  };
})();
