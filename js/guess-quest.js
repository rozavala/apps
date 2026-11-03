/* ================================================================
   GUESS QUEST — guess-quest.js
   20 Questions game for car trips: drive closer to the answer with
   every clue. Requires: auth.js, sounds.js, timer.js, activity-log.js,
   guess-quest-art.js (optional; falls back to plain text).
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
    { id: 'cheetah', emoji: '🐆', category: 'animal', name: { en: 'Cheetah', es: 'Guepardo' }, attrs: { isAlive: true, isReal: true, isAnimal: true, isMammal: true, hasFur: true, isDangerous: true, hasTail: true, isYellow: true, makesSounds: true, livesInAfrica: true } },
    { id: 'crocodile', emoji: '🐊', category: 'animal', name: { en: 'Crocodile', es: 'Cocodrilo' }, attrs: { isAlive: true, isReal: true, isAnimal: true, isBig: true, isDangerous: true, livesInWater: true, hasTail: true, isGreen: true, makesSounds: true, livesInAfrica: true } },
    { id: 'octopus', emoji: '🐙', category: 'animal', name: { en: 'Octopus', es: 'Pulpo' }, attrs: { isAlive: true, isReal: true, isAnimal: true, isMammal: false, livesInWater: true, isRed: true } },
    { id: 'flamingo', emoji: '🦩', category: 'animal', name: { en: 'Flamingo', es: 'Flamenco' }, attrs: { isAlive: true, isReal: true, isAnimal: true, canFly: true, livesInWater: true, isRed: true, hasWings: true, makesSounds: true } },
    { id: 'jaguar', emoji: '🐆', category: 'animal', name: { en: 'Jaguar', es: 'Jaguar' }, attrs: { isAlive: true, isReal: true, isAnimal: true, isMammal: true, hasFur: true, isDangerous: true, livesInJungle: true, hasTail: true, isYellow: true, makesSounds: true } },
    { id: 'gorilla', emoji: '🦍', category: 'animal', name: { en: 'Gorilla', es: 'Gorila' }, attrs: { isAlive: true, isReal: true, isAnimal: true, isMammal: true, hasFur: true, isBig: true, livesInJungle: true, isBlack: true, makesSounds: true, livesInAfrica: true } },
    { id: 'wolf', emoji: '🐺', category: 'animal', name: { en: 'Wolf', es: 'Lobo' }, attrs: { isAlive: true, isReal: true, isAnimal: true, isMammal: true, hasFur: true, isDangerous: true, hasTail: true, isGrey: true, makesSounds: true } },
    { id: 'fox', emoji: '🦊', category: 'animal', name: { en: 'Fox', es: 'Zorro' }, attrs: { isAlive: true, isReal: true, isAnimal: true, isMammal: true, hasFur: true, hasTail: true, isRed: true, makesSounds: true } },
    { id: 'owl', emoji: '🦉', category: 'animal', name: { en: 'Owl', es: 'Búho' }, attrs: { isAlive: true, isReal: true, isAnimal: true, canFly: true, hasWings: true, isBrown: true, makesSounds: true } },
    { id: 'hedgehog', emoji: '🦔', category: 'animal', name: { en: 'Hedgehog', es: 'Erizo' }, attrs: { isAlive: true, isReal: true, isAnimal: true, isMammal: true, isSmall: true, isBrown: true } },
    { id: 'seahorse', emoji: '🐠', category: 'animal', name: { en: 'Seahorse', es: 'Caballito de mar' }, attrs: { isAlive: true, isReal: true, isAnimal: true, isMammal: false, isSmall: true, livesInWater: true, hasTail: true, isYellow: true } },
    { id: 'crab', emoji: '🦀', category: 'animal', name: { en: 'Crab', es: 'Cangrejo' }, attrs: { isAlive: true, isReal: true, isAnimal: true, isMammal: false, isSmall: true, livesInWater: true, isRed: true } },
    { id: 'frog', emoji: '🐸', category: 'animal', name: { en: 'Frog', es: 'Rana' }, attrs: { isAlive: true, isReal: true, isAnimal: true, isSmall: true, livesInWater: true, isGreen: true, makesSounds: true } },
    { id: 'kangaroo', emoji: '🦘', category: 'animal', name: { en: 'Kangaroo', es: 'Canguro' }, attrs: { isAlive: true, isReal: true, isAnimal: true, isMammal: true, hasFur: true, hasTail: true, isBrown: true, makesSounds: true } },

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
    { id: 'sushi', emoji: '🍣', category: 'food', name: { en: 'Sushi', es: 'Sushi' }, attrs: { isFood: true, isSweet: false, foundInKitchen: true } },
    { id: 'taco', emoji: '🌮', category: 'food', name: { en: 'Taco', es: 'Taco' }, attrs: { isFood: true, isSweet: false, foundInKitchen: true } },
    { id: 'pasta', emoji: '🍝', category: 'food', name: { en: 'Pasta', es: 'Pasta' }, attrs: { isFood: true, isSweet: false, foundInKitchen: true } },
    { id: 'cheese', emoji: '🧀', category: 'food', name: { en: 'Cheese', es: 'Queso' }, attrs: { isFood: true, isSweet: false, isYellow: true, foundInKitchen: true } },
    { id: 'avocado', emoji: '🥑', category: 'food', name: { en: 'Avocado', es: 'Palta' }, attrs: { isFood: true, isSweet: false, isGreen: true, isFruit: true } },
    { id: 'lemon', emoji: '🍋', category: 'food', name: { en: 'Lemon', es: 'Limón' }, attrs: { isFood: true, isSweet: false, isYellow: true, isRound: true, isFruit: true } },
    { id: 'carrot', emoji: '🥕', category: 'food', name: { en: 'Carrot', es: 'Zanahoria' }, attrs: { isFood: true, isSweet: false, foundInKitchen: true } },
    { id: 'honey', emoji: '🍯', category: 'food', name: { en: 'Honey', es: 'Miel' }, attrs: { isFood: true, isSweet: true, isYellow: true, foundInKitchen: true } },
    { id: 'grapes', emoji: '🍇', category: 'food', name: { en: 'Grapes', es: 'Uvas' }, attrs: { isFood: true, isSweet: true, isRound: true, isFruit: true } },

    // --- PLANTS ---
    { id: 'sunflower', emoji: '🌻', category: 'plant', name: { en: 'Sunflower', es: 'Girasol' }, attrs: { isAlive: true, isReal: true, isPlant: true, isYellow: true, isBig: true } },
    { id: 'rose', emoji: '🌹', category: 'plant', name: { en: 'Rose', es: 'Rosa' }, attrs: { isAlive: true, isReal: true, isPlant: true, isRed: true, hasThorns: true } },
    { id: 'cactus', emoji: '🌵', category: 'plant', name: { en: 'Cactus', es: 'Cactus' }, attrs: { isAlive: true, isReal: true, isPlant: true, isGreen: true, livesInDesert: true, hasThorns: true } },
    { id: 'tree', emoji: '🌳', category: 'plant', name: { en: 'Tree', es: 'Árbol' }, attrs: { isAlive: true, isReal: true, isPlant: true, isBig: true, hasLeaves: true, isGreen: true, isBrown: true } },
    { id: 'copihue', emoji: '🌺', category: 'plant', name: { en: 'Copihue', es: 'Copihue' }, attrs: { isAlive: true, isReal: true, isPlant: true, isRed: true, foundInChile: true } },
    { id: 'fern', emoji: '🌿', category: 'plant', name: { en: 'Fern', es: 'Helecho' }, attrs: { isAlive: true, isReal: true, isPlant: true, isGreen: true, hasLeaves: true } },
    { id: 'bamboo', emoji: '🎋', category: 'plant', name: { en: 'Bamboo', es: 'Bambú' }, attrs: { isAlive: true, isReal: true, isPlant: true, isGreen: true, isBig: true } },
    { id: 'orchid', emoji: '🌸', category: 'plant', name: { en: 'Orchid', es: 'Orquídea' }, attrs: { isAlive: true, isReal: true, isPlant: true, isWhite: true, isSmall: true } },
    { id: 'oak', emoji: '🌳', category: 'plant', name: { en: 'Oak', es: 'Roble' }, attrs: { isAlive: true, isReal: true, isPlant: true, isBig: true, hasLeaves: true, isGreen: true, isBrown: true } },
    { id: 'mushroom', emoji: '🍄', category: 'plant', name: { en: 'Mushroom', es: 'Hongo' }, attrs: { isAlive: true, isReal: true, isPlant: true, isSmall: true, isRed: true } },

    // --- VEHICLES ---
    { id: 'car', emoji: '🚗', category: 'vehicle', name: { en: 'Car', es: 'Auto' }, attrs: { isVehicle: true, hasWheels: true, livesOnLand: true, makesSounds: true, foundInHouse: true } },
    { id: 'airplane', emoji: '✈️', category: 'vehicle', name: { en: 'Airplane', es: 'Avión' }, attrs: { isVehicle: true, canFly: true, makesSounds: true, isBig: true, hasWings: true } },
    { id: 'bicycle', emoji: '🚲', category: 'vehicle', name: { en: 'Bicycle', es: 'Bicicleta' }, attrs: { isVehicle: true, hasWheels: true, livesOnLand: true, isSmall: true } },
    { id: 'boat', emoji: '🚢', category: 'vehicle', name: { en: 'Boat', es: 'Barco' }, attrs: { isVehicle: true, livesInWater: true, makesSounds: true, isBig: true } },
    { id: 'rocket', emoji: '🚀', category: 'vehicle', name: { en: 'Rocket', es: 'Cohete' }, attrs: { isVehicle: true, canFly: true, makesSounds: true, isBig: true, goesToSpace: true } },
    { id: 'helicopter', emoji: '🚁', category: 'vehicle', name: { en: 'Helicopter', es: 'Helicóptero' }, attrs: { isVehicle: true, canFly: true, makesSounds: true } },
    { id: 'submarine', emoji: '🚤', category: 'vehicle', name: { en: 'Submarine', es: 'Submarino' }, attrs: { isVehicle: true, livesInWater: true, isBig: true } },
    { id: 'train', emoji: '🚆', category: 'vehicle', name: { en: 'Train', es: 'Tren' }, attrs: { isVehicle: true, hasWheels: true, makesSounds: true, isBig: true } },
    { id: 'motorcycle', emoji: '🏍️', category: 'vehicle', name: { en: 'Motorcycle', es: 'Motocicleta' }, attrs: { isVehicle: true, hasWheels: true, makesSounds: true } },
    { id: 'hot_air_balloon', emoji: '🎈', category: 'vehicle', name: { en: 'Hot Air Balloon', es: 'Globo aerostático' }, attrs: { isVehicle: true, canFly: true, isBig: true, isRound: true } },
    { id: 'bus', emoji: '🚌', category: 'vehicle', name: { en: 'Bus', es: 'Autobús' }, attrs: { isVehicle: true, hasWheels: true, makesSounds: true, isBig: true } },

    // --- CHARACTERS ---
    { id: 'pirate', emoji: '🏴‍☠️', category: 'character', name: { en: 'Pirate', es: 'Pirata' }, attrs: { isCharacter: true, isHuman: true, isFictional: true, livesInWater: true } },
    { id: 'superhero', emoji: '🦸', category: 'character', name: { en: 'Superhero', es: 'Superhéroe' }, attrs: { isCharacter: true, isHuman: true, isFictional: true, canFly: true } },
    { id: 'robot', emoji: '🤖', category: 'character', name: { en: 'Robot', es: 'Robot' }, attrs: { isCharacter: true, isReal: true, makesSounds: true } },
    { id: 'dragon', emoji: '🐉', category: 'character', name: { en: 'Dragon', es: 'Dragón' }, attrs: { isCharacter: true, isFictional: true, canFly: true, isBig: true, makesSounds: true, isDangerous: true, hasWings: true, hasTail: true } },
    { id: 'unicorn', emoji: '🦄', category: 'character', name: { en: 'Unicorn', es: 'Unicornio' }, attrs: { isCharacter: true, isFictional: true, isMammal: true, hasFur: true, livesOnLand: true, hasTail: true, hasLegs: true, isWhite: true } },
    { id: 'wizard', emoji: '🧙', category: 'character', name: { en: 'Wizard', es: 'Mago' }, attrs: { isCharacter: true, isHuman: true, isFictional: true } },
    { id: 'knight', emoji: '⚔️', category: 'character', name: { en: 'Knight', es: 'Caballero' }, attrs: { isCharacter: true, isHuman: true, isFictional: true } },
    { id: 'vampire', emoji: '🧛', category: 'character', name: { en: 'Vampire', es: 'Vampiro' }, attrs: { isCharacter: true, isHuman: true, isFictional: true, isDangerous: true } },
    { id: 'phoenix', emoji: '🔥', category: 'character', name: { en: 'Phoenix', es: 'Fénix' }, attrs: { isCharacter: true, isFictional: true, canFly: true, hasWings: true, isRed: true, isBig: true } },
    { id: 'mermaid', emoji: '🧜', category: 'character', name: { en: 'Mermaid', es: 'Sirena' }, attrs: { isCharacter: true, isFictional: true, livesInWater: true, hasTail: true } },
    { id: 'ghost', emoji: '👻', category: 'character', name: { en: 'Ghost', es: 'Fantasma' }, attrs: { isCharacter: true, isFictional: true, canFly: true, isWhite: true } },
    { id: 'giant', emoji: '🗿', category: 'character', name: { en: 'Giant', es: 'Gigante' }, attrs: { isCharacter: true, isHuman: true, isFictional: true, isBig: true } },

    // --- PLACES ---
    { id: 'beach', emoji: '🏖️', category: 'place', name: { en: 'Beach', es: 'Playa' }, attrs: { isPlace: true, isReal: true, livesInWater: true, livesOnLand: true } },
    { id: 'mountain', emoji: '⛰️', category: 'place', name: { en: 'Mountain', es: 'Montaña' }, attrs: { isPlace: true, isReal: true, isBig: true, livesOnLand: true, foundInChile: true } },
    { id: 'moon', emoji: '🌙', category: 'place', name: { en: 'Moon', es: 'Luna' }, attrs: { isPlace: true, isReal: true, isBig: true, goesToSpace: true, isWhite: true, isRound: true } },
    { id: 'volcano', emoji: '🌋', category: 'place', name: { en: 'Volcano', es: 'Volcán' }, attrs: { isPlace: true, isReal: true, isBig: true, isDangerous: true, isRed: true, foundInChile: true } },
    { id: 'desert', emoji: '🏜️', category: 'place', name: { en: 'Desert', es: 'Desierto' }, attrs: { isPlace: true, isReal: true, isBig: true, isYellow: true, foundInChile: true } },
    { id: 'castle', emoji: '🏰', category: 'place', name: { en: 'Castle', es: 'Castillo' }, attrs: { isPlace: true, isReal: true, isBig: true } },
    { id: 'lighthouse', emoji: '🗼', category: 'place', name: { en: 'Lighthouse', es: 'Faro' }, attrs: { isPlace: true, isReal: true, isBig: true, livesInWater: true } },
    { id: 'island', emoji: '🏝️', category: 'place', name: { en: 'Island', es: 'Isla' }, attrs: { isPlace: true, isReal: true, isBig: true, livesInWater: true, isGreen: true } },
    { id: 'forest', emoji: '🌲', category: 'place', name: { en: 'Forest', es: 'Bosque' }, attrs: { isPlace: true, isReal: true, isBig: true, isGreen: true, foundInChile: true } },

    // --- OBJECTS ---
    { id: 'guitar', emoji: '🎸', category: 'object', name: { en: 'Guitar', es: 'Guitarra' }, attrs: { isObject: true, isReal: true, makesSounds: true, foundInHouse: true } },
    { id: 'book', emoji: '📚', category: 'object', name: { en: 'Book', es: 'Libro' }, attrs: { isObject: true, isReal: true, foundInHouse: true } },
    { id: 'clock', emoji: '⏰', category: 'object', name: { en: 'Clock', es: 'Reloj' }, attrs: { isObject: true, isReal: true, makesSounds: true, foundInHouse: true, isRound: true } },
    { id: 'telescope', emoji: '🔭', category: 'object', name: { en: 'Telescope', es: 'Telescopio' }, attrs: { isObject: true, isReal: true, foundInHouse: true } },
    { id: 'compass', emoji: '🧭', category: 'object', name: { en: 'Compass', es: 'Brújula' }, attrs: { isObject: true, isReal: true, isSmall: true, isRound: true } },
    { id: 'camera', emoji: '📷', category: 'object', name: { en: 'Camera', es: 'Cámara' }, attrs: { isObject: true, isReal: true, isSmall: true, makesSounds: true, foundInHouse: true, isBlack: true } },
    { id: 'umbrella', emoji: '☂️', category: 'object', name: { en: 'Umbrella', es: 'Paraguas' }, attrs: { isObject: true, isReal: true, foundInHouse: true } },
    { id: 'lantern', emoji: '🏮', category: 'object', name: { en: 'Lantern', es: 'Farol' }, attrs: { isObject: true, isReal: true, isRed: true, foundInHouse: true } },
    { id: 'drum', emoji: '🥁', category: 'object', name: { en: 'Drum', es: 'Tambor' }, attrs: { isObject: true, isReal: true, makesSounds: true, isRound: true, foundInHouse: true } },
    { id: 'key', emoji: '🔑', category: 'object', name: { en: 'Key', es: 'Llave' }, attrs: { isObject: true, isReal: true, isSmall: true, isYellow: true, foundInHouse: true } },
    // True flags only. An omitted flag answers "maybe" and does not filter,
    // which matches the rest of this list. An explicit false would wipe out
    // every older item that simply left that flag off.
    { id: 'llama', emoji: '🦙', category: 'animal', name: { en: 'Llama', es: 'Llama' }, attrs: { isAlive: true, isReal: true, isAnimal: true, isMammal: true, hasFur: true, livesOnLand: true, hasTail: true, hasLegs: true, makesSounds: true, foundInChile: true } },
    { id: 'araucaria', emoji: '🌲', category: 'plant', name: { en: 'Araucaria', es: 'Araucaria' }, attrs: { isAlive: true, isReal: true, isPlant: true, isBig: true, isGreen: true, hasLeaves: true, foundInChile: true } },
    { id: 'glacier', emoji: '🧊', category: 'place', name: { en: 'Glacier', es: 'Glaciar' }, attrs: { isPlace: true, isReal: true, isBig: true, isWhite: true, isDangerous: true, foundInChile: true } },
    { id: 'violin', emoji: '🎻', category: 'object', name: { en: 'Violin', es: 'Violín' }, attrs: { isObject: true, isReal: true, makesSounds: true, foundInHouse: true } }
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
    { id: 'plant',     emoji: '🌿', name: { en: 'Plants', es: 'Plantas' } },
    { id: 'vehicle',   emoji: '🚗', name: { en: 'Vehicles', es: 'Vehículos' } },
    { id: 'character', emoji: '🦸', name: { en: 'Characters', es: 'Personajes' } },
    { id: 'place',     emoji: '🏔️', name: { en: 'Places', es: 'Lugares' } },
    { id: 'object',    emoji: '🔧', name: { en: 'Objects', es: 'Objetos' } },
  ];


  // ── Answer rules ──
  // An item's own true/false flag always wins. Where the list leaves a
  // flag out, these rules fill in the obvious answer so a pizza says
  // "No" to "Is it an animal?" instead of "Maybe". Anything not covered
  // stays "Maybe" and does not narrow the search.
  const TYPE_ATTR = {
    isAnimal: 'animal', isPlant: 'plant', isFood: 'food', isVehicle: 'vehicle',
    isCharacter: 'character', isPlace: 'place', isObject: 'object'
  };
  const COLOR_ATTRS = ['isYellow', 'isGreen', 'isRed', 'isBlue', 'isWhite', 'isBlack', 'isBrown', 'isGrey'];
  const ANIMAL_CLOSED = ['isMammal', 'canFly', 'hasWings', 'isPet', 'livesInWater', 'hasFur'];
  // Honest "maybe" answers for items where yes/no would be misleading.
  const UNSURE = {
    hedgehog: ['hasFur'],          // spines on top, fur on face and belly
    turtle: ['isPet'],             // some families keep small turtles
    pirate: ['isReal', 'isFictional'], // real pirates sailed; storybook ones too
    knight: ['isReal', 'isFictional']  // real medieval knights; storybook ones too
  };
  // Answers that need a short fact next to them.
  const OVERRIDE = {
    mushroom: { isPlant: false }
  };
  const NOTES = {
    mushroom: { isPlant: { en: 'Mushrooms are fungi, not plants.', es: 'Los hongos no son plantas: son hongos.' } },
    pirate: { isReal: { en: 'Real pirates sailed long ago, and there are storybook pirates too.', es: 'Hubo piratas reales hace mucho, y también hay piratas de cuentos.' } },
    knight: { isReal: { en: 'Real knights lived in the Middle Ages, and there are storybook knights too.', es: 'Hubo caballeros reales en la Edad Media, y también hay caballeros de cuentos.' } }
  };

  function answerFor(item, attr) {
    if (UNSURE[item.id] && UNSURE[item.id].indexOf(attr) !== -1) return null;
    if (OVERRIDE[item.id] && attr in OVERRIDE[item.id]) return OVERRIDE[item.id][attr];
    const a = item.attrs;
    if (a[attr] === true || a[attr] === false) return a[attr];
    if (TYPE_ATTR[attr]) return item.category === TYPE_ATTR[attr];
    if (attr === 'isReal') return !a.isFictional;
    if (attr === 'isFictional') return a.isReal === true || item.category !== 'character' ? false : null;
    if (COLOR_ATTRS.indexOf(attr) !== -1) {
      return COLOR_ATTRS.some(c => a[c] === true) ? false : null;
    }
    if (attr === 'isBig' && a.isSmall === true) return false;
    if (attr === 'isSmall' && a.isBig === true) return false;
    if (item.category === 'animal' && ANIMAL_CLOSED.indexOf(attr) !== -1) return false;
    if (attr === 'makesSounds' && (item.category === 'food' || item.category === 'plant' || item.category === 'object')) return false;
    if ((attr === 'isSweet' || attr === 'isFruit' || attr === 'isDangerous') && item.category === 'food') return false;
    return null;
  }

  // Short clue labels for the highway clue board.
  const SHORT = {
    isAnimal: { en: 'animal', es: 'animal' }, isPlant: { en: 'plant', es: 'planta' },
    isFood: { en: 'food', es: 'comida' }, isVehicle: { en: 'vehicle', es: 'vehículo' },
    isCharacter: { en: 'character', es: 'personaje' }, isPlace: { en: 'place', es: 'lugar' },
    isObject: { en: 'object', es: 'objeto' }, isBig: { en: 'big', es: 'grande' },
    isSmall: { en: 'small', es: 'pequeño' }, isDangerous: { en: 'dangerous', es: 'peligroso' },
    isReal: { en: 'real', es: 'real' }, isFictional: { en: 'fictional', es: 'ficticio' },
    isRound: { en: 'round', es: 'redondo' }, makesSounds: { en: 'makes sounds', es: 'hace sonidos' },
    isYellow: { en: 'yellow', es: 'amarillo' }, isGreen: { en: 'green', es: 'verde' },
    isRed: { en: 'red', es: 'rojo' }, isBlue: { en: 'blue', es: 'azul' },
    isWhite: { en: 'white', es: 'blanco' }, isBlack: { en: 'black', es: 'negro' },
    isMammal: { en: 'mammal', es: 'mamífero' }, canFly: { en: 'flies', es: 'vuela' },
    livesInWater: { en: 'lives in water', es: 'vive en el agua' }, hasFur: { en: 'fur', es: 'pelaje' },
    isPet: { en: 'pet', es: 'mascota' }, hasTail: { en: 'tail', es: 'cola' },
    hasWings: { en: 'wings', es: 'alas' }, isSweet: { en: 'sweet', es: 'dulce' },
    isFruit: { en: 'fruit', es: 'fruta' }, foundInKitchen: { en: 'kitchen', es: 'cocina' },
    livesInAfrica: { en: 'Africa', es: 'África' }, livesInJungle: { en: 'jungle', es: 'selva' },
    foundInChile: { en: 'Chile', es: 'Chile' }, foundInHouse: { en: 'in a house', es: 'en una casa' }
  };

  // ── Extra round state (the trip) ──
  let answers = {};          // attr → true / false / null, in the order asked
  let revealed = new Set();  // letter positions bought with a hint
  let tier = 'intermediate';
  let lastProgress = 0;
  let busy = false;

  function _tier() {
    return typeof getAgeTier === 'function' ? getAgeTier() : 'intermediate';
  }
  function _T(en, es) { return lang === 'es' ? es : en; }
  function _esc(s) { return typeof escHtml === 'function' ? escHtml(s) : String(s).replace(/[&<>"']/g, ''); }

  function _pool() {
    return selectedCategory === 'all' ? ITEMS : ITEMS.filter(item => item.category === selectedCategory);
  }
  function _letters(item) {
    return Array.from(item.name[lang].toUpperCase());
  }
  function _isLetter(ch) { return /[A-ZÁÉÍÓÚÜÑ]/.test(ch); }

  function _compatible(item) {
    for (const attr in answers) {
      const s = answers[attr];
      if (s === null) continue;
      const v = answerFor(item, attr);
      if (v !== null && v !== s) return false;
    }
    if (revealed.size) {
      // Only the bought letters narrow the list (the tile count is a
      // visible clue the kid can use on their own).
      const mine = _letters(secret), theirs = _letters(item);
      for (const i of revealed) if (theirs[i] !== mine[i]) return false;
    }
    return true;
  }
  function _remaining() { return _pool().filter(_compatible); }

  function _progress() {
    const n = _pool().length, left = Math.max(1, _remaining().length);
    if (n <= 1) return 1;
    return Math.max(0, Math.min(1, 1 - Math.log(left) / Math.log(n)));
  }
  function _heat(p) {
    if (p >= 0.8) return { cls: 'hot', label: _T('Very hot!', '¡Muy caliente!') };
    if (p >= 0.5) return { cls: 'warm', label: _T('Hot', 'Caliente') };
    if (p >= 0.22) return { cls: 'cool', label: _T('Warmer', 'Tibio') };
    return { cls: 'cold', label: _T('Cold', 'Frío') };
  }

  function _userColor() {
    const u = typeof getActiveUser === 'function' ? getActiveUser() : null;
    return typeof GuessQuestArt !== 'undefined' ? GuessQuestArt.safeColor(u && u.color) : '#C2410C';
  }

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
    const hero = document.getElementById('gq-hero-scene');
    if (hero && typeof GuessQuestArt !== 'undefined') {
      hero.innerHTML = GuessQuestArt.scene({ color: _userColor(), seed: 5, label: _T('The family car on a road trip', 'El auto de la familia de viaje') });
      GuessQuestArt.setProgress(hero, 0.06);
      hero.classList.add('gq-idle');
    }
    const sub = document.getElementById('gq-sub');
    if (sub) sub.textContent = _T("I'm thinking of something... ask questions and drive closer!", 'Estoy pensando en algo... ¡haz preguntas y acércate!');
    const routeT = document.getElementById('gq-route-title');
    if (routeT) routeT.textContent = _T('Pick a route', 'Elige una ruta');
    const dTitle = document.getElementById('gq-daily-title');
    if (dTitle) dTitle.textContent = _T('Daily Word · Palabra del Día', 'Palabra del Día · Daily Word');
    const dSub = document.getElementById('gq-daily-sub');
    if (dSub) dSub.textContent = _T('One puzzle a day. Guess the word in 6 tries.', 'Un desafío al día. Adivina la palabra en 6 intentos.');

    const data = _load();
    const found = (data.found || []).length;
    const log = document.getElementById('gq-trip-log');
    if (log) {
      log.innerHTML = (data.roundsPlayed || 0) > 0
        ? '<span>' + _T('Trips', 'Viajes') + ' <b>' + (data.roundsWon || 0) + '/' + (data.roundsPlayed || 0) + '</b></span>' +
          '<span>⭐ <b>' + (data.totalStars || 0) + '</b></span>' +
          '<span>' + _T('Postcards', 'Postales') + ' <b>' + found + '/' + ITEMS.length + '</b></span>'
        : '<span>' + _T('Your trip log fills up as you play.', 'Tu bitácora de viaje se llena al jugar.') + '</span>';
    }

    const grid = document.getElementById('category-grid');
    grid.innerHTML = CATEGORY_PACKS.map(p => {
      const n = p.id === 'all' ? ITEMS.length : ITEMS.filter(i => i.category === p.id).length;
      return `
      <button type="button" class="category-card route-sign" onclick="GuessQuest.startRound('${p.id}')">
        <span class="route-picto">${typeof GuessQuestArt !== 'undefined' ? GuessQuestArt.picto(p.id) : p.emoji}</span>
        <span class="cat-name">${p.name[lang]}</span>
        <span class="route-km">${n} ${_T('stops', 'paradas')}</span>
        <span class="route-arrow" aria-hidden="true">➜</span>
      </button>`;
    }).join('');
  }

  // ── Start a round ──
  function startRound(category) {
    selectedCategory = category;
    const pool = _pool();

    tier = _tier();
    maxQuestions = tier === 'beginner' ? 15 : 20;

    secret = pool[Math.floor(Math.random() * pool.length)];
    questionCount = 0;
    askedAttrs = new Set();
    confirmedTrue = {};
    confirmedFalse = {};
    answers = {};
    revealed = new Set();
    stars = 0;
    busy = false;
    // Little ones see the first letter for free.
    if (tier === 'beginner') revealed.add(0);

    const sc = document.getElementById('gq-scene');
    if (sc && typeof GuessQuestArt !== 'undefined') {
      sc.innerHTML = GuessQuestArt.scene({ color: _userColor(), seed: 7, label: _T('Your car on the road to the answer', 'Tu auto en el camino a la respuesta') }) +
        '<div class="gq-heat" id="gq-heat"></div>' +
        '<div class="answer-display" id="answer-display" aria-live="polite"><div class="answer-emoji" id="answer-emoji"></div><div class="answer-text" id="answer-text"></div><div class="answer-note" id="answer-note"></div></div>';
      lastProgress = 0;
      GuessQuestArt.setProgress(sc, 0);
    }

    _updateQuestionCounter();
    _renderGame();
    _showScreen('game');
    window.scrollTo(0, 0);
  }

  function _renderHeat(p) {
    const el = document.getElementById('gq-heat');
    if (!el) return;
    const h = _heat(p);
    const left = _remaining().length;
    el.className = 'gq-heat gq-heat-' + h.cls;
    el.innerHTML = (typeof GuessQuestArt !== 'undefined' ? GuessQuestArt.thermometer(p) : '') +
      '<span class="gq-heat-label">' + h.label + '</span>' +
      '<span class="gq-heat-left">' + left + ' ' + _T(left === 1 ? 'possible' : 'possible', left === 1 ? 'posible' : 'posibles') + '</span>';
  }

  function _renderClues() {
    const el = document.getElementById('gq-clues');
    if (!el) return;
    const keys = Object.keys(answers);
    const chips = keys.map(attr => {
      const v = answers[attr];
      const cls = v === true ? 'yes' : v === false ? 'no' : 'maybe';
      const mark = v === true ? '✓' : v === false ? '✗' : '?';
      const label = SHORT[attr] ? SHORT[attr][lang] : attr;
      return '<span class="clue-chip clue-' + cls + '"><b>' + mark + '</b> ' + _esc(label) + '</span>';
    }).reverse().join('');
    el.innerHTML =
      '<div class="gq-sign-head"><span>' + _T('CLUES', 'PISTAS') + '</span><span class="gq-sign-route">' +
        _T('Questions left', 'Preguntas') + ' <b>' + Math.max(0, maxQuestions - questionCount) + '</b></span></div>' +
      '<div class="gq-sign-body">' + (chips || '<span class="clue-empty">' + _T('Ask a question below to get your first clue.', 'Haz una pregunta abajo para tu primera pista.') + '</span>') + '</div>';
  }

  function _renderTiles() {
    const el = document.getElementById('gq-tiles');
    if (!el || !secret) return;
    const letters = _letters(secret);
    const canBuy = questionCount + 2 <= maxQuestions && letters.some((ch, i) => _isLetter(ch) && !revealed.has(i));
    el.innerHTML = '<div class="gq-tile-row" aria-label="' + _T('Hidden word', 'Palabra oculta') + ', ' + letters.filter(_isLetter).length + ' ' + _T('letters', 'letras') + '">' +
      letters.map((ch, i) => {
        if (!_isLetter(ch)) return '<span class="gq-tile gq-gap"></span>';
        const show = revealed.has(i);
        return '<span class="gq-tile' + (show ? ' gq-open' : '') + '"><span>' + (show ? _esc(ch) : '') + '</span></span>';
      }).join('') + '</div>' +
      '<button type="button" class="gq-hint-btn" id="gq-hint-btn" onclick="GuessQuest.buyLetter()"' + (canBuy ? '' : ' disabled') + '>' +
        _T('Show a letter', 'Ver una letra') + ' <small>−2 ' + _T('questions', 'preguntas') + '</small></button>';
  }

  function _renderGame() {
    const p = _progress();
    _renderHeat(p);
    _renderClues();
    _renderTiles();
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
              const v = answers[q.attr];
              const tag = !isAsked ? '' : v === true ? '<span class="q-ans q-yes">' + _T('YES', 'SÍ') + '</span>' : v === false ? '<span class="q-ans q-no">NO</span>' : '<span class="q-ans q-maybe">?</span>';
              return `
                <button type="button" class="q-btn ${isAsked ? 'asked' : ''}"
                        onclick="GuessQuest.askQuestion('${q.attr}')"
                        ${isAsked || questionCount >= maxQuestions ? 'disabled' : ''}>
                  <span>${q.text[lang]}</span>${tag}
                </button>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  function _drive(p) {
    const sc = document.getElementById('gq-scene');
    if (!sc || typeof GuessQuestArt === 'undefined') return;
    const moved = p - lastProgress > 0.001;
    GuessQuestArt.setProgress(sc, p);
    if (moved) {
      sc.classList.remove('gq-driving'); void sc.offsetWidth; sc.classList.add('gq-driving');
      clearTimeout(_drive._t);
      _drive._t = setTimeout(() => sc.classList.remove('gq-driving'), 1700);
    } else {
      sc.classList.remove('gq-idle-shake'); void sc.offsetWidth; sc.classList.add('gq-idle-shake');
    }
    lastProgress = p;
  }

  function askQuestion(attr) {
    if (!secret || askedAttrs.has(attr) || questionCount >= maxQuestions) return;

    askedAttrs.add(attr);
    questionCount++;

    const value = answerFor(secret, attr);
    answers[attr] = value;
    let answerText, cssClass, spokenText;

    if (value === true) {
      answerText = lang === 'es' ? '¡SÍ!' : 'YES!';
      cssClass = 'answer-yes';
      spokenText = lang === 'es' ? 'Sí' : 'Yes';
      confirmedTrue[attr] = true;
    } else if (value === false) {
      answerText = lang === 'es' ? '¡NO!' : 'NO!';
      cssClass = 'answer-no';
      spokenText = lang === 'es' ? 'No' : 'No';
      confirmedFalse[attr] = true;
    } else {
      answerText = lang === 'es' ? 'QUIZÁS...' : 'MAYBE...';
      cssClass = 'answer-maybe';
      spokenText = lang === 'es' ? 'No estoy seguro' : "I'm not sure";
    }
    const note = NOTES[secret.id] && NOTES[secret.id][attr] ? NOTES[secret.id][attr][lang] : '';

    _showAnswer(cssClass, answerText, note);
    _speakAnswer(note ? spokenText + '. ' + note : spokenText);
    if (typeof SFX !== 'undefined' && SFX.click) SFX.click();
    _updateQuestionCounter();
    _renderGame(); // Refresh buttons, clues, heat
    _drive(_progress());

    if (questionCount >= maxQuestions) {
      // Out of questions: one last guess instead of an automatic miss.
      setTimeout(() => showGuessScreen(true), 1600);
    }
  }

  function buyLetter() {
    if (!secret) return;
    const letters = _letters(secret);
    const hidden = letters.map((ch, i) => i).filter(i => _isLetter(letters[i]) && !revealed.has(i));
    if (!hidden.length || questionCount + 2 > maxQuestions) return;
    const i = hidden[Math.floor(Math.random() * hidden.length)];
    revealed.add(i);
    questionCount = Math.min(maxQuestions, questionCount + 2);
    if (typeof SFX !== 'undefined' && SFX.star) SFX.star();
    _updateQuestionCounter();
    _renderGame();
    const tiles = document.querySelectorAll('#gq-tiles .gq-tile');
    if (tiles[i]) tiles[i].classList.add('gq-flip');
    _drive(_progress());
    if (questionCount >= maxQuestions) setTimeout(() => showGuessScreen(true), 1400);
  }

  function _signSVG(kind) {
    if (kind === 'answer-yes') {
      return '<svg viewBox="0 0 60 60" width="64" height="64" aria-hidden="true"><circle cx="30" cy="30" r="27" fill="#0f8a4c" stroke="#fff" stroke-width="4"/><circle cx="30" cy="30" r="29" fill="none" stroke="#0a6236" stroke-width="1.5"/><path d="M17 31l9 9 17-19" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }
    if (kind === 'answer-no') {
      return '<svg viewBox="0 0 60 60" width="64" height="64" aria-hidden="true"><path d="M19 2h22l17 17v22L41 58H19L2 41V19z" fill="#d22f27" stroke="#fff" stroke-width="4" stroke-linejoin="round"/><path d="M20 20l20 20M40 20L20 40" stroke="#fff" stroke-width="6" stroke-linecap="round"/></svg>';
    }
    return '<svg viewBox="0 0 60 60" width="64" height="64" aria-hidden="true"><path d="M30 3l27 27-27 27L3 30z" fill="#f6b916" stroke="#1d1d1d" stroke-width="3" stroke-linejoin="round"/><text x="30" y="40" text-anchor="middle" font-size="28" font-weight="900" fill="#1d1d1d" font-family="Arial, sans-serif">?</text></svg>';
  }

  function _showAnswer(cssClass, text, note) {
    const display = document.getElementById('answer-display');
    if (!display) return;
    display.className = 'answer-display active ' + cssClass;
    document.getElementById('answer-emoji').innerHTML = _signSVG(cssClass);
    document.getElementById('answer-text').textContent = text;
    const n = document.getElementById('answer-note');
    if (n) n.textContent = note || '';

    clearTimeout(_showAnswer._t);
    _showAnswer._t = setTimeout(() => {
      display.classList.remove('active');
    }, note ? 3200 : 1700);
  }

  function showGuessScreen(forced) {
    if (!secret) return;
    const candidates = _getCandidates();
    _renderGuessGrid(candidates, forced === true);
    _showScreen('guess');
    window.scrollTo(0, 0);
  }

  function _getCandidates() {
    let filtered = _remaining();

    const numCandidates = tier === 'beginner' ? 3 : tier === 'expert' ? 8 : tier === 'advanced' ? 6 : 4;

    if (!filtered.find(i => i.id === secret.id)) {
      filtered.push(secret);
    }
    // Pad with look-alikes from the same pack so there is always a choice.
    if (filtered.length < numCandidates) {
      const extra = _shuffle(_pool().filter(i => filtered.indexOf(i) === -1));
      filtered = filtered.concat(extra.slice(0, numCandidates - filtered.length));
    }

    const shuffled = _shuffle(filtered);
    let picked = shuffled.slice(0, numCandidates);
    if (!picked.find(i => i.id === secret.id)) {
      picked[Math.floor(Math.random() * picked.length)] = secret;
    }

    return _shuffle(picked);
  }

  function _shuffle(arr) {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  function _renderGuessGrid(candidates, forced) {
    const head = document.getElementById('gq-guess-title');
    if (head) head.textContent = forced
      ? _T('Out of questions! Make your best guess.', '¡Sin preguntas! Da tu mejor respuesta.')
      : _T('What do you think it is?', '¿Qué crees que es?');
    const left = _remaining().length;
    const sub = document.getElementById('gq-guess-sub');
    if (sub) sub.textContent = _T(left + (left === 1 ? ' thing still fits your clues' : ' things still fit your clues'),
      (left === 1 ? 'Queda 1 cosa' : 'Quedan ' + left + ' cosas') + ' que calzan con tus pistas');
    const back = document.getElementById('gq-guess-back');
    if (back) back.hidden = !!forced;
    const grid = document.getElementById('guess-grid');
    grid.innerHTML = candidates.map((c, i) => `
      <button type="button" class="guess-card postcard" style="--tilt:${(i % 2 ? 1 : -1) * (0.6 + (i % 3) * 0.4)}deg" onclick="GuessQuest.makeGuess('${c.id}')">
        <span class="pc-stamp" aria-hidden="true"></span>
        <span class="guess-emoji">${c.emoji}</span>
        <span class="guess-name">${c.name[lang]}</span>
      </button>
    `).join('') + `
      <button type="button" class="guess-card postcard pc-none" onclick="GuessQuest._revealSecret(false)">
        <span class="guess-emoji">🤔</span>
        <span class="guess-name">${lang === 'es' ? 'Ninguno de estos' : 'None of these'}</span>
      </button>
    `;
  }

  function makeGuess(itemId) {
    if (!secret || busy) return;
    busy = true;
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
    if (!secret) return;
    if (!won) {
      _speakAnswer(lang === 'es'
        ? '¡Era ' + secret.name[lang] + '!'
        : 'It was ' + secret.name[lang] + '!');
    }
    _showResults(won);
  }

  function _showResults(won) {
    const wrap = document.getElementById('results-wrap');
    const title = won ? (lang === 'es' ? '¡Lo lograste!' : 'You Got It!') : (lang === 'es' ? '¡Casi!' : 'So Close!');
    const art = typeof GuessQuestArt !== 'undefined';
    const letters = _letters(secret);
    const data = _load();
    const isNew = won && (data.found || []).indexOf(secret.id) === -1;

    wrap.innerHTML = `
      <div class="gq-scene gq-scene-result ${won ? 'gq-won' : 'gq-lost'}" id="gq-result-scene"></div>
      <div class="results-card">
        <div class="results-title">${title}</div>
        <div class="gq-tile-row gq-reveal" aria-label="${_esc(secret.name[lang])}">
          ${letters.map((ch, i) => _isLetter(ch)
            ? '<span class="gq-tile" style="animation-delay:' + (0.25 + i * 0.12).toFixed(2) + 's"><span>' + _esc(ch) + '</span></span>'
            : '<span class="gq-tile gq-gap"></span>').join('')}
        </div>
        <div class="results-subtitle">${lang === 'es' ? 'Era: ' : 'It was: '}${secret.emoji} ${secret.name[lang]}${lang === 'es' ? '' : ''}
          <small>· ${secret.name[lang === 'es' ? 'en' : 'es']}</small></div>
        <div class="results-stars" aria-label="${stars} ${_T('stars', 'estrellas')}">
          ${art ? [0, 1, 2].map(i => '<span class="rs-star" style="animation-delay:' + (0.6 + i * 0.18) + 's">' + GuessQuestArt.star(i < stars, 46) + '</span>').join('') : '⭐'.repeat(stars)}
        </div>
        <div class="results-stats">
          <div><b>${stars}</b> ${_T(stars === 1 ? 'star earned' : 'stars earned', stars === 1 ? 'estrella ganada' : 'estrellas ganadas')}</div>
          <div><b>${questionCount}</b> ${_T('questions asked', 'preguntas hechas')}</div>
          ${isNew ? '<div class="rs-new">📮 ' + _T('New postcard for your trip log!', '¡Nueva postal para tu bitácora!') + '</div>' : ''}
        </div>
        <div class="results-actions">
          <button type="button" class="action-btn btn-primary" onclick="GuessQuest.startRound('${selectedCategory}')">
            ${lang === 'es' ? 'Jugar de nuevo' : 'Play Again'} 🔁
          </button>
          <button type="button" class="action-btn btn-secondary" onclick="GuessQuest.backToSelect()">
            ${lang === 'es' ? 'Menú Principal' : 'Main Menu'} 🏠
          </button>
        </div>
      </div>
    `;
    const rs = document.getElementById('gq-result-scene');
    if (rs && art) {
      rs.innerHTML = GuessQuestArt.scene({ color: _userColor(), seed: 7, billboard: secret.emoji, label: _T('The car reached the answer', 'El auto llegó a la respuesta') }) +
        (won ? '<div class="gq-confetti" aria-hidden="true">' + Array.from({ length: 26 }, (_, i) =>
          '<i style="left:' + ((i * 37) % 100) + '%;animation-delay:' + ((i % 9) * 0.12).toFixed(2) + 's;background:' + ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#a855f7'][i % 5] + '"></i>').join('') + '</div>' : '');
      GuessQuestArt.setProgress(rs, Math.max(0, lastProgress - 0.05));
      requestAnimationFrame(() => requestAnimationFrame(() => {
        rs.classList.add('gq-driving');
        GuessQuestArt.setProgress(rs, 1);
        setTimeout(() => rs.classList.remove('gq-driving'), 1800);
      }));
    }
    _showScreen('results');
    window.scrollTo(0, 0);
    _saveProgress(won);
  }

  function _saveProgress(won) {
    const data = _load();
    data.roundsPlayed = (data.roundsPlayed || 0) + 1;
    if (won) data.roundsWon = (data.roundsWon || 0) + 1;
    data.totalStars = (data.totalStars || 0) + stars;
    // Added in v2 (trip log). Older saves simply lack these.
    if (won) {
      data.found = Array.isArray(data.found) ? data.found : [];
      if (data.found.indexOf(secret.id) === -1) data.found.push(secret.id);
      data.bestQuestions = data.bestQuestions ? Math.min(data.bestQuestions, questionCount) : questionCount;
    }
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
    const left = Math.max(0, maxQuestions - questionCount);
    const qc = document.getElementById('question-counter');
    if (qc) {
      const pct = Math.round(left / maxQuestions * 100);
      qc.innerHTML = '<span class="fuel-label">' + _T('Fuel', 'Bencina') + '</span>' +
        '<span class="fuel-bar"><span style="width:' + pct + '%"></span></span>' +
        '<span class="fuel-num">' + questionCount + ' / ' + maxQuestions + '</span>';
      qc.setAttribute('aria-label', _T(questionCount + ' of ' + maxQuestions + ' questions asked', questionCount + ' de ' + maxQuestions + ' preguntas hechas'));
    }
    const potential = questionCount <= 8 ? 3 : questionCount <= 14 ? 2 : 1;
    const st = document.getElementById('gq-stars');
    if (st) {
      st.textContent = '⭐ ' + potential;
      st.title = _T('Stars if you guess right now', 'Estrellas si adivinas ahora');
    }
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

  function backToSelect() { _renderCategorySelect(); _showScreen('select'); }
  function backToGame() { _showScreen('game'); }

  function openDaily() {
    if (typeof DailyWord !== 'undefined') DailyWord.open({ lang: lang });
  }

  function toggleLanguage() {
    lang = lang === 'en' ? 'es' : 'en';
    const label = document.getElementById('lang-label');
    if (label) label.textContent = lang === 'en' ? 'ES / EN' : 'EN / ES';
    document.documentElement.lang = lang;

    const active = document.querySelector('.screen.active');
    if (active.id === 'screen-select') _renderCategorySelect();
    else if (active.id === 'screen-game') { _renderGame(); _updateQuestionCounter(); }
    _renderStatic();
  }

  function _renderStatic() {
    const g = document.getElementById('gq-guess-btn-label');
    if (g) g.textContent = _T('I want to guess!', '¡Quiero adivinar!');
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
    init, startRound, askQuestion, showGuessScreen, makeGuess, buyLetter,
    backToSelect, backToGame, toggleLanguage, getStats, openDaily, _revealSecret,
    _answerFor: answerFor, _items: ITEMS
  };
})();
