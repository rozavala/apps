/* ================================================================
   QUEST ADVENTURE — quest-adventure-data.js
   Static data: the app catalog the quests point to, the region
   extras (map position, art), and the per-region quests.

   A quest is met when one app's star count (getAppStars in auth.js,
   the same rule the Trophy Room and Explorer Rank use) reaches `n`.
   Quest ids are stored in the kid's save (zs_quest_<name>.quests),
   so never rename one — add new ids instead.
   ================================================================ */

var QA_DATA = (function() {
  'use strict';

  // id = the APP_STAR_CONFIGS id in auth.js.
  var APPS = {
    math:       { name: 'Math Galaxy',        icon: '🧮', href: 'math-galaxy.html' },
    chile:      { name: 'Descubre Chile',     icon: '🇨🇱', href: 'descubre-chile.html' },
    chess:      { name: 'Chess Quest',        icon: '♟️', href: 'chess-quest.html' },
    piano:      { name: 'Little Maestro',     icon: '🎹', href: 'little-maestro.html' },
    faith:      { name: 'Fe Explorador',      icon: '⛪', href: 'fe-explorador.html' },
    guitar:     { name: 'Guitar Jam',         icon: '🎸', href: 'guitar-jam.html' },
    art:        { name: 'Art Studio',         icon: '🎨', href: 'art-studio.html' },
    sports:     { name: 'Sports Arena',       icon: '🏓', href: 'sports-arena.html' },
    move:       { name: 'Move Quest',         icon: '💪', href: 'move-quest.html' },
    guess:      { name: 'Guess Quest',        icon: '🎯', href: 'guess-quest.html' },
    lab:        { name: 'Lab Explorer',       icon: '🔬', href: 'lab-explorer.html' },
    world:      { name: 'World Explorer',     icon: '🌍', href: 'world-explorer.html' },
    atlas:      { name: 'World Atlas',        icon: '🗺️', href: 'world-atlas.html' },
    story:      { name: 'Story Explorer',     icon: '📚', href: 'story-explorer.html' },
    money:      { name: 'Money Master',       icon: '💰', href: 'money-master.html' },
    invest:     { name: 'Invest Quest',       icon: '📈', href: 'invest-quest.html' },
    bible:      { name: 'Bible Explorer',     icon: '📖', href: 'bible-explorer.html' },
    civics:     { name: 'Civics Lab',         icon: '🏛️', href: 'civics-lab.html' },
    codecadet:  { name: 'Code Cadet',         icon: '🤖', href: 'code-cadet.html' },
    vocab:      { name: 'Vocabulario Vivo',   icon: '🔤', href: 'vocabulario-vivo.html' },
    circuit:    { name: 'Circuit Lab',        icon: '⚡', href: 'circuit-lab.html' },
    engineer:   { name: 'Little Engineer',    icon: '🌉', href: 'little-engineer.html' },
    negocio:    { name: 'Mi Negocio',         icon: '🥟', href: 'mi-negocio.html' },
    euclid:     { name: "Euclid's Workshop",  icon: '📐', href: 'euclid-workshop.html' },
    cocina:     { name: 'Cocina Lab',         icon: '🍳', href: 'cocina-lab.html' },
    marinero:   { name: 'Marinero',           icon: '🪢', href: 'marinero.html' },
    naturaleza: { name: 'Explorador de Naturaleza', icon: '🦅', href: 'naturaleza.html' },
    secretos:   { name: 'Mensajes Secretos',  icon: '🔐', href: 'mensajes-secretos.html' },
    clock:      { name: '¿Qué Hora Es?',      icon: '🕰️', href: 'que-hora-es.html' },
    worldcup:   { name: 'World Cup 2026',     icon: '🏆', href: 'world-cup.html' },
    bmcheck:    { name: 'Book & Movie Check', icon: '🔍', href: 'book-movie-check.html' }
  };

  // Seasonal tour goal id → the app it is played in (for the Go link).
  var TOUR_GOAL_APP = {
    chile: 'chile', sports: 'sports', lab: 'lab', math: 'math', story: 'story',
    chess: 'chess', piano: 'piano', guitar: 'guitar', art: 'art', faith: 'faith'
  };

  // Map positions are in the 1000 × 1500 world drawn by
  // quest-adventure-art.js (south / Base Camp at the bottom).
  var POS = {
    basecamp:    { x: 480, y: 1395 },
    forest:      { x: 262, y: 1272 },
    river:       { x: 560, y: 1112 },
    mountain:    { x: 806, y: 975 },
    volcano:     { x: 150, y: 905 },
    ocean:       { x: 205, y: 690 },
    sky_temple:  { x: 575, y: 640 },
    legend_peak: { x: 826, y: 512 },
    observatory: { x: 738, y: 214 },
    glacier:     { x: 498, y: 300 },
    rapanui:     { x: 140, y: 175 }
  };

  // The walking trail, south to north. A point with a region id (4th
  // item) is where that region's landmark stands. Stretches over water
  // are found from the coastline and drawn as a boat route.
  var TRAIL = [
    [480, 1395, null, 'basecamp'],
    [418, 1384], [352, 1350], [300, 1310],
    [262, 1272, null, 'forest'],
    [318, 1222], [410, 1182], [488, 1140],
    [560, 1112, null, 'river'],
    [636, 1090], [712, 1052], [770, 1010],
    [806, 975, null, 'mountain'],
    [740, 930], [640, 908], [540, 902], [440, 895], [362, 890],
    [290, 900, 'sea'], [214, 906, 'sea'],
    [150, 905, 'sea', 'volcano'],
    [128, 830, 'sea'], [150, 752, 'sea'],
    [205, 690, 'sea', 'ocean'],
    [284, 668, 'sea'], [372, 660, 'sea'],
    [450, 652], [520, 646],
    [575, 640, null, 'sky_temple'],
    [652, 622], [724, 590], [784, 552],
    [826, 512, null, 'legend_peak'],
    [790, 452], [756, 384], [740, 300],
    [738, 214, null, 'observatory'],
    [676, 228], [612, 248], [552, 276],
    [498, 300, null, 'glacier'],
    [440, 296], [378, 274], [310, 250], [240, 222],
    [140, 175, null, 'rapanui']
  ];

  // Quests. tier: 'all' or 'older' (advanced + expert, age 9+).
  // app '*' means "any app".
  var QUESTS = [
    // Base Camp
    { id: 'bc_any',    region: 'basecamp', app: '*',        n: 1,  tier: 'all',   why: 'to light the campfire' },
    { id: 'bc_clock',  region: 'basecamp', app: 'clock',    n: 3,  tier: 'all',   why: 'to set the camp clock' },
    { id: 'bc_math',   region: 'basecamp', app: 'math',     n: 3,  tier: 'all',   why: 'to count the supplies' },
    { id: 'bc_faith',  region: 'basecamp', app: 'faith',    n: 3,  tier: 'all',   why: 'before the journey begins' },
    // Enchanted Forest
    { id: 'fo_nat',    region: 'forest',   app: 'naturaleza', n: 3, tier: 'all',  why: 'to name the forest birds' },
    { id: 'fo_art',    region: 'forest',   app: 'art',      n: 3,  tier: 'all',   why: 'to sketch the giant trees' },
    { id: 'fo_story',  region: 'forest',   app: 'story',    n: 3,  tier: 'all',   why: 'to read by the campfire' },
    { id: 'fo_nat2',   region: 'forest',   app: 'naturaleza', n: 12, tier: 'older', why: 'to fill your field notebook' },
    // Crystal River
    { id: 'ri_eng',    region: 'river',    app: 'engineer', n: 3,  tier: 'all',   why: 'to build a bridge over the river' },
    { id: 'ri_lab',    region: 'river',    app: 'lab',      n: 3,  tier: 'all',   why: 'to test the river water' },
    { id: 'ri_move',   region: 'river',    app: 'move',     n: 3,  tier: 'all',   why: 'to hop the stepping stones' },
    { id: 'ri_eng2',   region: 'river',    app: 'engineer', n: 15, tier: 'older', why: 'to build a bridge that holds a truck' },
    // Thunder Peak
    { id: 'mo_circ',   region: 'mountain', app: 'circuit',  n: 3,  tier: 'all',   why: 'to light the storm lantern' },
    { id: 'mo_sports', region: 'mountain', app: 'sports',   n: 3,  tier: 'all',   why: 'to train for the climb' },
    { id: 'mo_math',   region: 'mountain', app: 'math',     n: 15, tier: 'all',   why: 'to plan the route up' },
    { id: 'mo_circ2',  region: 'mountain', app: 'circuit',  n: 18, tier: 'older', why: 'to wire the mountain hut' },
    // Fire Island
    { id: 'vo_mar',    region: 'volcano',  app: 'marinero', n: 3,  tier: 'all',   why: 'to sail across the bay' },
    { id: 'vo_chile',  region: 'volcano',  app: 'chile',    n: 5,  tier: 'all',   why: "to learn about Chile's volcanoes" },
    { id: 'vo_cocina', region: 'volcano',  app: 'cocina',   n: 3,  tier: 'all',   why: 'to cook a meal for the crew' },
    { id: 'vo_mar2',   region: 'volcano',  app: 'marinero', n: 15, tier: 'older', why: 'to earn your sea legs' },
    // Deep Ocean
    { id: 'oc_sec',    region: 'ocean',    app: 'secretos', n: 3,  tier: 'all',   why: 'to decode the message in a bottle' },
    { id: 'oc_world',  region: 'ocean',    app: 'world',    n: 3,  tier: 'all',   why: 'to chart the seas' },
    { id: 'oc_guitar', region: 'ocean',    app: 'guitar',   n: 3,  tier: 'all',   why: 'to play a sea shanty on deck' },
    { id: 'oc_sec2',   region: 'ocean',    app: 'secretos', n: 18, tier: 'older', why: 'to crack the captain’s cipher' },
    // Sky Temple
    { id: 'sk_piano',  region: 'sky_temple', app: 'piano',  n: 5,  tier: 'all',   why: 'to play the temple bells' },
    { id: 'sk_bible',  region: 'sky_temple', app: 'bible',  n: 3,  tier: 'all',   why: 'to read the old scrolls' },
    { id: 'sk_clock',  region: 'sky_temple', app: 'clock',  n: 12, tier: 'all',   why: 'to wind the great sundial clock' },
    { id: 'sk_euclid', region: 'sky_temple', app: 'euclid', n: 3,  tier: 'older', why: 'to measure the temple columns' },
    // Legend's Peak
    { id: 'lp_chess',  region: 'legend_peak', app: 'chess', n: 20, tier: 'all',   why: 'to plan every move to the summit' },
    { id: 'lp_code',   region: 'legend_peak', app: 'codecadet', n: 5, tier: 'all', why: 'to program the summit beacon' },
    { id: 'lp_vocab',  region: 'legend_peak', app: 'vocab', n: 3,  tier: 'older', why: 'to write in the summit logbook' },
    { id: 'lp_euclid', region: 'legend_peak', app: 'euclid', n: 18, tier: 'older', why: 'to map the summit with compass and ruler' },
    // Atacama Observatory
    { id: 'ob_lab',    region: 'observatory', app: 'lab',   n: 10, tier: 'all',   why: 'to set up the telescope' },
    { id: 'ob_atlas',  region: 'observatory', app: 'atlas', n: 5,  tier: 'all',   why: 'to find your way by the stars' },
    { id: 'ob_guess',  region: 'observatory', app: 'guess', n: 5,  tier: 'all',   why: 'to spot the comet' },
    { id: 'ob_invest', region: 'observatory', app: 'invest', n: 3, tier: 'older', why: 'to fund a new telescope' },
    // Glacier Fjord
    { id: 'gl_clock',  region: 'glacier',  app: 'clock',    n: 30, tier: 'all',   why: 'to keep time through the long nights' },
    { id: 'gl_money',  region: 'glacier',  app: 'money',    n: 3,  tier: 'all',   why: 'to buy warm gear' },
    { id: 'gl_cocina', region: 'glacier',  app: 'cocina',   n: 9,  tier: 'all',   why: 'to make hot soup for the team' },
    { id: 'gl_civics', region: 'glacier',  app: 'civics',   n: 3,  tier: 'older', why: 'to set up the base camp council' },
    // Rapa Nui
    { id: 'rn_chile',  region: 'rapanui',  app: 'chile',    n: 20, tier: 'all',   why: "to learn the island's history" },
    { id: 'rn_negocio',region: 'rapanui',  app: 'negocio',  n: 3,  tier: 'all',   why: 'to run a stall at the harbor market' },
    { id: 'rn_mar',    region: 'rapanui',  app: 'marinero', n: 24, tier: 'all',   why: 'to steer across the Pacific' },
    { id: 'rn_negocio2', region: 'rapanui', app: 'negocio', n: 10, tier: 'older', why: 'to grow the market stall' }
  ];

  var REGION_ORDER = ['basecamp', 'forest', 'river', 'mountain', 'volcano', 'ocean',
    'sky_temple', 'legend_peak', 'observatory', 'glacier', 'rapanui'];

  return { REGION_ORDER: REGION_ORDER, APPS: APPS, TOUR_GOAL_APP: TOUR_GOAL_APP, POS: POS, TRAIL: TRAIL, QUESTS: QUESTS };
})();
