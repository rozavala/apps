/* ================================================================
   MATH GALAXY — Game Engine with User Progress
   Fixed: null-safe DOM access, DOMContentLoaded init
   ================================================================ */

const TOTAL_QUESTIONS = 10;
let currentLevel = '';
let questions = [];
let currentQ = 0;
let score = 0;
let startTime = 0;

/* ---- Shared User System ---- */
function getUserProgressKey() {
  return typeof getUserAppKey === 'function' ? getUserAppKey('zs_mathgalaxy_') : null;
}
function getUserProgress() {
  const key = getUserProgressKey();
  if (!key) return {};
  try { return JSON.parse(localStorage.getItem(key)) || {}; }
  catch { return {}; }
}
function saveUserProgress(level, stars, scorePct) {
  const key = getUserProgressKey();
  if (!key) return;
  const prog = getUserProgress();
  const prev = prog[level] || { bestStars: 0, bestPct: 0, plays: 0 };
  prog[level] = {
    bestStars: Math.max(prev.bestStars, stars),
    bestPct: Math.max(prev.bestPct, scorePct),
    plays: prev.plays + 1,
    lastPlayed: new Date().toISOString()
  };
  localStorage.setItem(key, JSON.stringify(prog));
  if (typeof CloudSync !== 'undefined' && CloudSync.online) CloudSync.push(key);
}

function initUserUI() {
  const user = getActiveUser();
  if (user) {
    // Auto-pull sync
    if (typeof CloudSync !== 'undefined' && CloudSync.online) {
      CloudSync.pull(getUserProgressKey());
    }

    // nav.js handles the badge — we only set the greeting and recommend level
    const greetEl = document.getElementById('greeting');
    if (greetEl) greetEl.textContent = `Let's go, ${user.name}!`;

    // Auto-recommend level based on age
    if (user.age) {
      const recLevel = user.age <= 5 ? 'cadet' : user.age <= 7 ? 'explorer' : user.age <= 9 ? 'pilot' : 'commander';
      const levelMap = { cadet: 0, explorer: 1, pilot: 2, commander: 3 };
      const cards = document.querySelectorAll('.level-card');
      cards.forEach(c => c.classList.remove('recommended'));
      if (cards[levelMap[recLevel]]) {
        cards[levelMap[recLevel]].classList.add('recommended');
        const card = cards[levelMap[recLevel]];
        if (!card.querySelector('.rec-badge')) {
          const badge = document.createElement('div');
          badge.className = 'rec-badge';
          badge.textContent = `👈 Recommended for age ${user.age}`;
          card.appendChild(badge);
        }
      }
    }
  }
  renderBestScores();
}

function renderBestScores() {
  const prog = getUserProgress();
  ['cadet','explorer','pilot','commander'].forEach(level => {
    const el = document.getElementById('best-' + level);
    if (!el) return;
    const data = prog[level];
    if (data && data.bestStars > 0) {
      const stars = '⭐'.repeat(data.bestStars);
      el.className = 'best-badge';
      el.textContent = `${stars} ${data.bestPct}%`;
    } else {
      el.className = 'best-badge empty';
      el.textContent = 'No missions yet';
    }
  });
}

/* ---- Level color themes ---- */
const THEMES = {
  cadet:    { color: '#22D3EE', light: '#67E8F9', glow: 'rgba(34,211,238,0.35)', subtle: 'rgba(34,211,238,0.12)', name: '🛸 Cadet' },
  explorer: { color: '#34D399', light: '#6EE7B7', glow: 'rgba(52,211,153,0.35)', subtle: 'rgba(52,211,153,0.12)', name: '🚀 Explorer' },
  pilot:    { color: '#FBBF24', light: '#FDE68A', glow: 'rgba(251,191,36,0.35)', subtle: 'rgba(251,191,36,0.12)', name: '🌟 Pilot' },
  commander:{ color: '#A78BFA', light: '#C4B5FD', glow: 'rgba(167,139,250,0.35)',subtle: 'rgba(167,139,250,0.12)', name: '👨‍🚀 Commander' },
};

function setTheme(level) {
  const t = THEMES[level];
  const root = document.documentElement.style;
  root.setProperty('--level-color', t.color);
  root.setProperty('--level-color-light', t.light);
  root.setProperty('--level-color-glow', t.glow);
  root.setProperty('--level-color-subtle', t.subtle);
}

/* ---- Screen management ---- */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById('screen-' + id);
  if (target) target.classList.add('active');
}

/* ---- Feedback ---- */
function showFeedback(emoji) {
  const el = document.getElementById('feedback');
  if (!el) return;
  const inner = el.querySelector('span') || el;
  inner.textContent = emoji;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 900);
}

/* ---- Random helpers ---- */
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = rand(0, i); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

function generateDistractors(correct, count, min, max) {
  const set = new Set([correct]);
  let attempts = 0;
  while (set.size < count + 1 && attempts < 100) {
    let d = correct + rand(-Math.max(3, Math.abs(correct) || 3), Math.max(3, Math.abs(correct) || 3));
    if (d < min) d = min + rand(0, 3);
    if (d > max) d = max - rand(0, 3);
    if (d !== correct) set.add(d);
    attempts++;
  }
  while (set.size < count + 1) set.add(rand(min, max));
  return shuffle(Array.from(set));
}

/* ================================================================
   QUESTION GENERATORS PER LEVEL
   ================================================================ */

function genCadet() {
  // PRUNED [2026-04-14]: Removed 'shape', 'bigger' to make room for 'moon_count', 'star_sub' and stay within MAX 25 limit.
  // PRUNED [2026-04-22]: Removed 'alien_shape', 'moon_shape' to make room for 'satellite_count', 'planet_sub'
  // PRUNED [2026-05-18]: Removed 'robot_add', 'alien_sub' to make room for 'sun_sub', 'meteor_pattern' and stay within MAX 25 limit.
  // PRUNED [2026-06-15]: Removed 'shape_pattern', 'star_shape' to make room for 'sun_count_2', 'planet_compare' and stay within MAX 25 limit.
  const types = ['count', 'add', 'moon_count', 'star_sub', 'planet_count', 'rocket_sub', 'astronaut_count', 'star_add', 'galaxy_count', 'alien_count', 'satellite_add', 'meteor_add', 'meteor_count', 'ufo_count', 'telescope_add', 'sun_count', 'sun_add', 'rocket_count', 'satellite_count', 'asteroid_add', 'planet_sub', 'sun_sub', 'meteor_pattern', 'sun_count_2', 'planet_compare'];
  const type = types[rand(0, types.length - 1)];
  if (type === 'sun_count_2') { const n = rand(1, 10); return { label: 'Suns', text: '☀️'.repeat(n), hint: 'How many suns?', answer: n, options: generateDistractors(n, 3, 1, 15), mode: 'choice' }; }
  if (type === 'planet_compare') { const a = rand(1, 10), b = rand(1, 10); if (a === b) return genCadet(); return { label: 'Comparing', text: `${a} 🪐 or ${b} 🪐`, hint: 'Which is bigger?', answer: Math.max(a, b), options: shuffle([a, b]), mode: 'choice' }; }
  if (type === 'galaxy_count') { return { label: 'Counting', text: '🌌🌌🌌', hint: 'Count the galaxies!', answer: 3, options: generateDistractors(3, 3, 1, 10), mode: 'choice' }; }
  if (type === 'satellite_count') { return { label: 'Counting', text: '🛰️🛰️', hint: 'Count the satellites!', answer: 2, options: generateDistractors(2, 3, 1, 10), mode: 'choice' }; }
  if (type === 'planet_sub') { const a = rand(3,5), b = rand(1,2); return { label: 'Subtraction', text: `${a} 🪐 - ${b} 🪐 = ?`, hint: '', answer: a-b, options: generateDistractors(a-b, 3, 1, 10), mode: 'choice' }; }
  if (type === 'meteor_add') { const a = rand(1,5), b = rand(1,5); return { label: 'Addition', text: `${a} ☄️ + ${b} ☄️ = ?`, hint: '', answer: a+b, options: generateDistractors(a+b, 3, 2, 10), mode: 'choice' }; }
  if (type === 'moon_count') {
    const n = rand(1, 10);
    return { label: 'Moons', text: '🌕'.repeat(n), hint: 'How many moons?', answer: n, options: generateDistractors(n, 3, 1, 10), mode: 'choice' };
  }
  if (type === 'star_sub') {
    const a = rand(2, 5), b = rand(1, a - 1);
    return { label: 'Star Subtraction', text: `${a} ⭐ - ${b} ⭐ = ?`, hint: 'How many stars left?', answer: a - b, options: generateDistractors(a - b, 3, 1, 10), mode: 'choice' };
  }
  if (type === 'alien_shape') {
    return { label: 'Alien Shape', text: '👽', hint: 'What shape is an alien head?', answer: 'Oval', options: shuffle(['Oval', 'Square', 'Triangle', 'Star']), mode: 'choice' };
  }
  if (type === 'asteroid_add') {
    const a = rand(1, 5), b = rand(1, 4);
    return { label: 'Asteroid Addition', text: `${a} 🪨 + ${b} 🪨 = ?`, hint: 'Add the asteroids!', answer: a + b, options: generateDistractors(a + b, 3, 1, 10), mode: 'choice' };
  }
  if (type === 'sun_count') {
    const n = rand(1, 10);
    return { label: 'Suns', text: '☀️'.repeat(n), hint: 'How many suns?', answer: n, options: generateDistractors(n, 3, 1, 10), mode: 'choice' };
  }
  if (type === 'meteor_pattern') {
    return { label: 'Pattern', text: '☄️ 🌠 ☄️ 🌠 ?', hint: 'What is next?', answer: '☄️', options: shuffle(['☄️', '🌠', '🚀', '⭐']), mode: 'choice' };
  }
  if (type === 'sun_add') {
    const a = rand(1, 5), b = rand(1, 4);
    return { label: 'Sun Addition', text: `${a} ☀️ + ${b} ☀️ = ?`, hint: 'Add them!', answer: a + b, options: generateDistractors(a + b, 3, 1, 10), mode: 'choice' };
  }
  if (type === 'rocket_count') {
    const n = rand(1, 10);
    return { label: 'Rocket Count', text: '🚀'.repeat(n), hint: 'How many rockets?', answer: n, options: generateDistractors(n, 3, 1, 10), mode: 'choice' };
  }
  if (type === 'ufo_count') {
    const n = rand(1, 10);
    return { label: 'UFO Watch', text: '🛸'.repeat(n), hint: 'How many UFOs?', answer: n, options: generateDistractors(n, 3, 1, 10), mode: 'choice' };
  }
  if (type === 'telescope_add') {
    const a = rand(1, 5), b = rand(1, 5);
    return { label: 'Telescopes', text: `${a} 🔭 + ${b} 🔭 = ?`, hint: 'Add the telescopes!', answer: a + b, options: generateDistractors(a + b, 3, 1, 10), mode: 'choice' };
  }
  if (type === 'star_shape') {
    return { label: 'Star Shapes', text: '⭐', hint: 'What shape is this star?', answer: 'Star', options: shuffle(['Star', 'Circle', 'Triangle', 'Square']), mode: 'choice' };
  }
  if (type === 'sun_sub') {
    const a = rand(3, 8), b = rand(1, 2);
    return { label: 'Subtraction', text: `${a} ☀️ - ${b} ☀️ = ?`, hint: '', answer: a - b, options: generateDistractors(a - b, 3, 1, 10), mode: 'choice' };
  }
  if (type === 'meteor_count') {
    const n = rand(2, 9);
    return { label: 'Counting Meteors', text: '☄️'.repeat(n), hint: 'How many meteors?', answer: n, options: generateDistractors(n, 3, 1, 10), mode: 'choice' };
  }
  if (type === 'earth_shape') {
    return { label: 'Planet Shapes', text: '🌍', hint: 'What shape is the Earth?', answer: 'Sphere', options: shuffle(['Sphere', 'Cube', 'Pyramid', 'Star']), mode: 'choice' };
  }
  if (type === 'alien_count') {
    const n = rand(1, 10);
    return { label: 'Aliens', text: '👽'.repeat(n), hint: 'How many aliens?', answer: n, options: generateDistractors(n, 3, 1, 10), mode: 'choice' };
  }
  if (type === 'satellite_add') {
    const a = rand(1, 5), b = rand(1, 5);
    return { label: 'Satellite Math', text: `${a} 🛰️ + ${b} 🛰️ = ?`, hint: 'Add the satellites!', answer: a + b, options: generateDistractors(a + b, 3, 1, 10), mode: 'choice' };
  }
  if (type === 'sun_shape') {
    return { label: 'Space Shapes', text: '☀️', hint: 'What shape is the sun?', answer: 'Circle', options: shuffle(['Circle', 'Square', 'Triangle', 'Star']), mode: 'choice' };
  }
  if (type === 'astronaut_count') {
    const n = rand(1, 10);
    return { label: 'Astronauts', text: '👨‍🚀'.repeat(n), hint: 'How many astronauts?', answer: n, options: generateDistractors(n, 3, 1, 10), mode: 'choice' };
  }
  if (type === 'star_add') {
    const a = rand(1, 5), b = rand(1, 5);
    return { label: 'Star Math', text: `${a} ⭐ + ${b} ⭐ = ?`, hint: 'Add the stars!', answer: a + b, options: generateDistractors(a + b, 3, 1, 10), mode: 'choice' };
  }
  if (type === 'moon_shape') {
    return { label: 'Space Shapes', text: '🌙', hint: 'What shape is the moon here?', answer: 'Crescent', options: shuffle(['Crescent', 'Circle', 'Square', 'Triangle']), mode: 'choice' };
  }
  if (type === 'count') {
    const n = rand(1, 10);
    const emoji = ['🍎','🌟','🚀','🐟','🦋','🎈','🍕','🐶'][rand(0, 7)];
    return { label: 'Counting', text: emoji.repeat(n), hint: 'How many do you see?', answer: n, options: generateDistractors(n, 3, 1, 10), mode: 'choice' };
  }
  if (type === 'planet_count') {
    const n = rand(1, 10);
    const emoji = ['🪐','🌍','🌕'][rand(0, 2)];
    return { label: 'Counting Planets', text: emoji.repeat(n), hint: 'How many planets do you see?', answer: n, options: generateDistractors(n, 3, 1, 10), mode: 'choice' };
  }
  if (type === 'rocket_sub') {
    const a = rand(2, 5), b = rand(1, a - 1);
    return { label: 'Subtraction', text: `${a} 🚀 - ${b} 🚀 = ?`, hint: 'How many rockets are left?', answer: a - b, options: generateDistractors(a - b, 3, 1, 10), mode: 'choice' };
  }
  if (type === 'shape_pattern') {
    return { label: 'Patterns', text: '⭐ 🌕 ⭐ 🌕 ?', hint: 'What comes next?', answer: '⭐', options: shuffle(['⭐', '🌕', '🪐', '🚀']), mode: 'choice' };
  }
  if (type === 'add') {
    const a = rand(1, 5), b = rand(1, 5);
    return { label: 'Addition', text: `${a} + ${b} = ?`, hint: '', answer: a + b, options: generateDistractors(a + b, 3, 1, 10), mode: 'choice' };
  }
  if (type === 'shape') {
    const shapes = [ { name: 'Circle', emoji: '⚪' }, { name: 'Triangle', emoji: '🔺' }, { name: 'Square', emoji: '🟧' } ];
    const s = shapes[rand(0, shapes.length - 1)];
    return { label: 'Shapes', text: s.emoji, hint: 'What shape is this?', answer: s.name, options: shuffle(shapes.map(function(x){return x.name;}).concat(['Star']).slice(0, 4)), mode: 'choice' };
  }
  const a = rand(1, 10), b = rand(1, 10);
  if (a === b) return genCadet();
  return { label: 'Comparing', text: `${a}  or  ${b}`, hint: 'Which number is bigger?', answer: Math.max(a, b), options: shuffle([a, b]), mode: 'choice' };
}

function genExplorer() {
  // PRUNED [2026-04-12]: Removed 'comet_compare' to make room for 'telescope_sub' and stay within MAX 25 limit.
  // PRUNED [2026-04-14]: Removed 'missing', 'compare' to make room for 'planet_add', 'comet_compare2' and stay within MAX 25 limit.
  // PRUNED [2026-04-22]: Removed 'satellite_mult', 'comet_diff' to make room for 'asteroid_sub', 'meteor_add_2'
  // PRUNED [2026-05-18]: Removed 'alien_add', 'rocket_add' to make room for 'spaceship_add', 'satellite_add2' and stay within MAX 25 limit.
  // PRUNED [2026-06-15]: Removed 'planet_pattern', 'moon_pattern' to make room for 'alien_diff', 'asteroid_add_2' and stay within MAX 25 limit.
  const types = ['add', 'sub', 'planet_add', 'comet_compare2', 'double', 'space_compare', 'star_fraction', 'ufo_sub', 'meteor_sub', 'rocket_compare', 'astronaut_sub', 'robot_pattern', 'satellite_compare', 'comet_sub', 'alien_pattern', 'planet_compare', 'star_sub', 'planet_sub', 'comet_add', 'asteroid_sub', 'meteor_add_2', 'spaceship_add', 'satellite_add2', 'alien_diff', 'asteroid_add_2'];
  const type = types[rand(0, types.length - 1)];
  if (type === 'alien_diff') { const a = rand(15,30), b = rand(5,14); return { label: 'Alien Subtraction', text: `${a} 👽 - ${b} 👽 = ?`, hint: 'Subtract the aliens', answer: a-b, options: generateDistractors(a-b, 3, 1, 30), mode: 'choice' }; }
  if (type === 'asteroid_add_2') { const a = rand(10, 25), b = rand(10, 25); return { label: 'Asteroid Addition', text: `${a} 🪨 + ${b} 🪨 = ?`, hint: 'Add the numbers', answer: a+b, options: generateDistractors(a+b, 3, 10, 60), mode: 'choice' }; }
  if (type === 'asteroid_sub') { const a = rand(10,20), b = rand(1,9); return { label: 'Subtraction', text: `${a} ☄️ - ${b} ☄️ = ?`, hint: '', answer: a-b, options: generateDistractors(a-b, 3, 1, 25), mode: 'choice' }; }
  if (type === 'meteor_add_2') { const a = rand(10,20), b = rand(5,15); return { label: 'Addition', text: `${a} ☄️ + ${b} ☄️ = ?`, hint: '', answer: a+b, options: generateDistractors(a+b, 3, 10, 40), mode: 'choice' }; }
  if (type === 'satellite_mult') { const a = rand(2,5), b = rand(2,5); return { label: 'Multiplication', text: `${a} 🛰️ × ${b} = ?`, hint: '', answer: a*b, options: generateDistractors(a*b, 3, 4, 30), mode: 'choice' }; }
  if (type === 'comet_diff') { const a = rand(15,30), b = rand(5,14); return { label: 'Subtraction', text: `${a} ☄️ - ${b} ☄️ = ?`, hint: '', answer: a-b, options: generateDistractors(a-b, 3, 5, 25), mode: 'choice' }; }
  if (type === 'planet_add') {
    const a = rand(5, 15), b = rand(5, 15);
    return { label: 'Planet Addition', text: `${a} 🪐 + ${b} 🪐 = ?`, hint: 'Add the planets', answer: a + b, options: generateDistractors(a + b, 3, 10, 35), mode: 'choice' };
  }
  if (type === 'comet_compare2') {
    const a = rand(10, 35), b = rand(10, 35);
    return { label: 'Comparing Comets', text: `${a} ☄️ or ${b} ☄️`, hint: 'Which is bigger?', answer: Math.max(a, b), options: shuffle([a, b]), mode: 'choice' };
  }
  if (type === 'telescope_sub') {
    const a = rand(8, 15), b = rand(1, a - 1);
    return { label: 'Telescope Subtraction', text: `${a} 🔭 - ${b} 🔭 = ?`, hint: 'Subtract the telescopes', answer: a - b, options: generateDistractors(a - b, 3, 1, 15), mode: 'choice' };
  }
  if (type === 'ufo_add') {
    const a = rand(4, 9), b = rand(4, 9);
    return { label: 'UFO Addition', text: `${a} 🛸 + ${b} 🛸 = ?`, hint: 'Add the UFOs', answer: a + b, options: generateDistractors(a + b, 3, 5, 20), mode: 'choice' };
  }
  if (type === 'star_sub') {
    const a = rand(6, 15), b = rand(1, a - 1);
    return { label: 'Star Subtraction', text: `${a} ⭐ - ${b} ⭐ = ?`, hint: 'Subtract the stars', answer: a - b, options: generateDistractors(a - b, 3, 1, 15), mode: 'choice' };
  }
  if (type === 'satellite_add2') {
    const a = rand(10, 20), b = rand(5, 10);
    return { label: 'Addition', text: `${a} 🛰️ + ${b} 🛰️ = ?`, hint: '', answer: a + b, options: generateDistractors(a + b, 3, 10, 40), mode: 'choice' };
  }
  if (type === 'planet_sub') {
    const a = rand(5, 10), b = rand(1, a - 1);
    return { label: 'Planet Subtraction', text: `${a} 🪐 - ${b} 🪐 = ?`, hint: 'Subtract planets', answer: a - b, options: generateDistractors(a - b, 3, 1, 10), mode: 'choice' };
  }
  if (type === 'comet_add') {
    const a = rand(4, 8), b = rand(2, 6);
    return { label: 'Comet Addition', text: `${a} ☄️ + ${b} ☄️ = ?`, hint: 'Add comets', answer: a + b, options: generateDistractors(a + b, 3, 1, 15), mode: 'choice' };
  }
  if (type === 'comet_sub') {
    const a = rand(6, 15), b = rand(1, a - 1);
    return { label: 'Comet Subtraction', text: `${a} ☄️ - ${b} ☄️ = ?`, hint: 'Subtract the comets', answer: a - b, options: generateDistractors(a - b, 3, 1, 15), mode: 'choice' };
  }
  if (type === 'alien_pattern') {
    return { label: 'Alien Pattern', text: '👽 👾 👽 👾 ?', hint: 'Who is next?', answer: '👽', options: shuffle(['👽', '👾', '🤖', '👨‍🚀']), mode: 'choice' };
  }
  if (type === 'planet_compare') {
    const a = rand(15, 35); let b = rand(15, 35);
    if (a === b) b = a < 35 ? a + 1 : a - 1;
    const sym = a > b ? '>' : '<';
    return { label: 'Planet Orbits', text: `${a} 🪐  ◻  ${b} 🪐`, hint: 'Which is greater?', answer: sym, options: shuffle(['>', '<', '=']), mode: 'choice' };
  }
  if (type === 'astronaut_sub') {
    const a = rand(6, 15), b = rand(1, a - 1);
    return { label: 'Spacewalk', text: `${a} 👨‍🚀 - ${b} 👨‍🚀 = ?`, hint: 'Subtract the astronauts', answer: a - b, options: generateDistractors(a - b, 3, 1, 15), mode: 'choice' };
  }
  if (type === 'robot_pattern') {
    return { label: 'Robot Pattern', text: '🤖 👾 🤖 👾 ?', hint: 'Who is next?', answer: '🤖', options: shuffle(['🤖', '👾', '👽', '👨‍🚀']), mode: 'choice' };
  }
  if (type === 'satellite_compare') {
    const a = rand(15, 35), b = rand(15, 35);
    if (a === b) return genExplorer();
    const sym = a > b ? '>' : '<';
    return { label: 'Satellite Orbit', text: `${a} 🛰️  ◻  ${b} 🛰️`, hint: 'Which is greater?', answer: sym, options: shuffle(['>', '<', '=']), mode: 'choice' };
  }
  if (type === 'meteor_sub') {
    const a = rand(6, 15), b = rand(1, a - 1);
    return { label: 'Meteor Dash', text: `${a} ☄️ - ${b} ☄️ = ?`, hint: 'Subtract the meteors', answer: a - b, options: generateDistractors(a - b, 3, 1, 15), mode: 'choice' };
  }
  if (type === 'moon_pattern') {
    return { label: 'Moon Pattern', text: '🌕 🌑 🌕 🌑 ?', hint: 'Which moon is next?', answer: '🌕', options: shuffle(['🌕', '🌑', '🌗', '🌙']), mode: 'choice' };
  }
  if (type === 'rocket_compare') {
    const a = rand(10, 40), b = rand(10, 40);
    if (a === b) return genExplorer();
    const sym = a > b ? '>' : '<';
    return { label: 'Rocket Fleet', text: `${a} 🚀  ◻  ${b} 🚀`, hint: 'Which is greater?', answer: sym, options: shuffle(['>', '<', '=']), mode: 'choice' };
  }
  if (type === 'ufo_sub') {
    const a = rand(5, 12), b = rand(1, a - 1);
    return { label: 'UFO Escape', text: `${a} 🛸 - ${b} 🛸 = ?`, hint: 'Subtract the flying UFOs', answer: a - b, options: generateDistractors(a - b, 3, 1, 15), mode: 'choice' };
  }
  if (type === 'planet_pattern') {
    return { label: 'Space Pattern', text: '🌍 🪐 🌍 🪐 ?', hint: 'Which planet is next?', answer: '🌍', options: shuffle(['🌍', '🪐', '🌕', '☄️']), mode: 'choice' };
  }
  if (type === 'spaceship_add') {
    const a = rand(10, 20), b = rand(5, 10);
    return { label: 'Addition', text: `${a} 🛸 + ${b} 🛸 = ?`, hint: 'Add spaceships!', answer: a + b, options: generateDistractors(a + b, 3, 15, 35), mode: 'choice' };
  }
  if (type === 'space_compare') {
    const a = rand(5, 20), b = rand(5, 20);
    if (a === b) return genExplorer();
    const sym = a > b ? '>' : '<';
    return { label: 'Comparing', text: `${a} 🚀  ◻  ${b} 🚀`, hint: 'Which fleet is bigger?', answer: sym, options: shuffle(['>', '<', '=']), mode: 'choice' };
  }
  if (type === 'star_fraction') {
    return { label: 'Fractions', text: '⭐ ⭐ 🌑', hint: 'What fraction of stars are glowing?', answer: '2/3', options: shuffle(['2/3', '1/3', '1/2', '3/2']), mode: 'choice' };
  }
  if (type === 'add') { const a = rand(5, 12), b = rand(3, 8); return { label: 'Addition', text: `${a} + ${b} = ?`, hint: '', answer: a + b, options: generateDistractors(a + b, 3, 5, 25), mode: 'choice' }; }
  if (type === 'sub') { const a = rand(8, 20), b = rand(1, a - 1); return { label: 'Subtraction', text: `${a} − ${b} = ?`, hint: '', answer: a - b, options: generateDistractors(a - b, 3, 0, 20), mode: 'choice' }; }
  if (type === 'missing') { const a = rand(3, 10), b = rand(3, 10); return { label: 'Missing Number', text: `${a} + ? = ${a + b}`, hint: 'What goes in place of ?', answer: b, options: generateDistractors(b, 3, 1, 15), mode: 'choice' }; }
  if (type === 'compare') { const a = rand(5, 20), b = rand(5, 20); if (a === b) return genExplorer(); const sym = a > b ? '>' : '<'; return { label: 'Comparing', text: `${a}  ◻  ${b}`, hint: 'What goes in the box?', answer: sym, options: shuffle(['>', '<', '=']), mode: 'choice' }; }
  const a = rand(2, 10); return { label: 'Doubles', text: `${a} + ${a} = ?`, hint: '', answer: a * 2, options: generateDistractors(a * 2, 3, 2, 24), mode: 'choice' };
}

function genPilot() {
  // PRUNED [2026-04-12]: Removed 'alien_word' to make room for 'comet_frac' and stay within MAX 25 limit.
  // PRUNED [2026-04-14]: Removed 'word', 'missing_mult' to make room for 'ufo_mult', 'satellite_frac' and stay within MAX 25 limit.
  // PRUNED [2026-04-22]: Removed 'rocket_alg', 'planet_div' to make room for 'blackhole_mult', 'galaxy_div'
  // PRUNED [2026-05-18]: Removed 'alien_mult', 'rocket_word' to make room for 'nebula_frac', 'star_div' and stay within MAX 25 limit.
  // PRUNED [2026-06-15]: Removed 'robot_mult', 'meteor_div' to make room for 'moon_div', 'comet_mult_2' and stay within MAX 25 limit.
  const types = ['mult', 'div', 'frac_visual', 'ufo_mult', 'satellite_frac', 'comet_mult', 'asteroid_div', 'star_word', 'satellite_div', 'telescope_frac', 'planet_mult', 'ufo_div', 'astronaut_mult', 'rocket_div', 'moon_frac', 'alien_pct', 'asteroid_mult', 'alien_div', 'blackhole_mult', 'comet_frac', 'galaxy_div', 'nebula_frac', 'star_div', 'moon_div', 'comet_mult_2'];
  const type = types[rand(0, types.length - 1)];
  if (type === 'moon_div') { const b = rand(2, 8), ans = rand(2, 9); return { label: 'Moon Division', text: `${b * ans} 🌕 ÷ ${b} = ?`, hint: 'Divide', answer: ans, options: generateDistractors(ans, 3, 1, 10), mode: 'choice' }; }
  if (type === 'comet_mult_2') { const a = rand(5, 12), b = rand(5, 12); return { label: 'Comet Multiplication', text: `${a} ☄️ × ${b} = ?`, hint: 'Multiply', answer: a*b, options: generateDistractors(a*b, 3, 20, 150), mode: 'choice' }; }
  if (type === 'blackhole_mult') { const a = rand(6,12), b = rand(6,12); return { label: 'Multiplication', text: `${a} 🕳️ × ${b} = ?`, hint: '', answer: a*b, options: generateDistractors(a*b, 3, 30, 150), mode: 'choice' }; }
  if (type === 'galaxy_div') { const b = rand(3,9), a = b * rand(3,12); return { label: 'Division', text: `${a} 🌌 ÷ ${b} = ?`, hint: '', answer: a/b, options: generateDistractors(a/b, 3, 2, 15), mode: 'choice' }; }
  if (type === 'alien_pct') { const val = rand(10,50)*2; return { label: 'Percentages', text: `50% of ${val} 👽 = ?`, hint: 'Half!', answer: val/2, options: generateDistractors(val/2, 3, 5, val), mode: 'choice' }; }
  if (type === 'rocket_alg') { const x = rand(2,10), a = rand(2,5); const ans = x*a; return { label: 'Algebra', text: `${a}x = ${ans}. x = ?`, hint: 'Divide', answer: x, options: generateDistractors(x, 3, 1, 15), mode: 'choice' }; }
  if (type === 'ufo_mult') {
    const a = rand(3, 9), b = rand(3, 9);
    return { label: 'UFO Multiplication', text: `${a} 🛸 × ${b} = ?`, hint: 'Total UFOs?', answer: a * b, options: generateDistractors(a * b, 3, 9, 81), mode: 'choice' };
  }
  if (type === 'satellite_frac') {
    return { label: 'Satellite Fractions', text: '🛰️ 🛰️ 🛸 🛸', hint: 'Fraction of satellites?', answer: '1/2', options: shuffle(['1/2', '1/4', '1/3', '2/3']), mode: 'choice' };
  }
  if (type === 'comet_frac') {
    return { label: 'Comet Fractions', text: '☄️ ☄️ ☄️ 🪨', hint: 'Fraction of comets?', answer: '3/4', options: shuffle(['3/4', '1/4', '1/2', '4/3']), mode: 'choice' };
  }
  if (type === 'planet_div') {
    const b = rand(2, 9), ans = rand(2, 9);
    return { label: 'Planet Division', text: `${b * ans} 🪐 ÷ ${b} = ?`, hint: 'Divide the planets', answer: ans, options: generateDistractors(ans, 3, 1, 10), mode: 'choice' };
  }
  if (type === 'comet_div') {
    const b = rand(2, 8), ans = rand(2, 8);
    return { label: 'Comet Division', text: `${b * ans} ☄️ ÷ ${b} = ?`, hint: 'Divide the comets', answer: ans, options: generateDistractors(ans, 3, 1, 10), mode: 'choice' };
  }
  if (type === 'meteor_mult') {
    const a = rand(4, 9), b = rand(2, 6);
    return { label: 'Meteor Multiply', text: `${a} ☄️ × ${b} = ?`, hint: 'Total meteors?', answer: a * b, options: generateDistractors(a * b, 3, 5, 60), mode: 'choice' };
  }
  if (type === 'astronaut_mult') {
    const a = rand(4, 9), b = rand(3, 8);
    return { label: 'Crew Multiplication', text: `${a} 👨‍🚀 × ${b} = ?`, hint: 'Total astronauts?', answer: a * b, options: generateDistractors(a * b, 3, 10, 80), mode: 'choice' };
  }
  if (type === 'asteroid_mult') {
    const a = rand(6, 12), b = rand(3, 7);
    return { label: 'Asteroid Math', text: `${a} 🪨 × ${b} = ?`, hint: 'Multiply!', answer: a * b, options: generateDistractors(a * b, 3, 10, 100), mode: 'choice' };
  }
  if (type === 'alien_div') {
    const b = rand(2, 6), ans = rand(3, 9);
    return { label: 'Alien Division', text: `${b * ans} 👽 ÷ ${b} = ?`, hint: 'Divide!', answer: ans, options: generateDistractors(ans, 3, 1, 10), mode: 'choice' };
  }
  if (type === 'rocket_div') {
    const b = rand(2, 7), ans = rand(3, 9);
    return { label: 'Rocket Division', text: `${b * ans} 🚀 ÷ ${b} = ?`, hint: 'Divide the rockets', answer: ans, options: generateDistractors(ans, 3, 1, 12), mode: 'choice' };
  }
  if (type === 'moon_frac') {
    return { label: 'Moon Phases', text: '🌕 🌕 🌕 🌑', hint: 'Fraction of full moons?', answer: '3/4', options: shuffle(['3/4', '1/4', '1/2', '4/3']), mode: 'choice' };
  }
  if (type === 'robot_mult') {
    const a = rand(4, 8), b = rand(3, 7);
    return { label: 'Robot Factory', text: `${a} 🤖 × ${b} = ?`, hint: 'Total robots built?', answer: a * b, options: generateDistractors(a * b, 3, 10, 60), mode: 'choice' };
  }
  if (type === 'meteor_div') {
    const b = rand(2, 6), ans = rand(3, 9);
    return { label: 'Meteor Shower', text: `${b * ans} ☄️ ÷ ${b} = ?`, hint: 'Divide the meteors', answer: ans, options: generateDistractors(ans, 3, 1, 12), mode: 'choice' };
  }
  if (type === 'planet_mult') {
    const a = rand(3, 9), b = rand(3, 9);
    return { label: 'Planet Math', text: `${a} 🪐 × ${b} = ?`, hint: 'Total planets?', answer: a * b, options: generateDistractors(a * b, 3, 5, 90), mode: 'choice' };
  }
  if (type === 'ufo_div') {
    const b = rand(2, 8), ans = rand(2, 8);
    return { label: 'UFO Landing', text: `${b * ans} 🛸 ÷ ${b} = ?`, hint: 'Divide the UFOs', answer: ans, options: generateDistractors(ans, 3, 1, 10), mode: 'choice' };
  }
  if (type === 'nebula_frac') {
    return { label: 'Nebula Fractions', text: '🌌 🌌 🌌 🌑', hint: 'Fraction of nebulas?', answer: '3/4', options: shuffle(['3/4', '1/4', '1/3', '2/3']), mode: 'choice' };
  }
  if (type === 'star_div') {
    const b = rand(2, 5), ans = rand(3, 8);
    return { label: 'Star Division', text: `${b * ans} ⭐ ÷ ${b} = ?`, hint: 'Divide the stars', answer: ans, options: generateDistractors(ans, 3, 1, 15), mode: 'choice' };
  }
  if (type === 'satellite_div') {
    const b = rand(2, 7), ans = rand(2, 7);
    return { label: 'Satellite Sync', text: `${b * ans} 🛰️ ÷ ${b} = ?`, hint: 'Divide the satellites', answer: ans, options: generateDistractors(ans, 3, 1, 10), mode: 'choice' };
  }
  if (type === 'telescope_frac') {
    return { label: 'Lens Fraction', text: '🔭 🔭 🌑 🌑', hint: 'Fraction of active telescopes?', answer: '1/2', options: shuffle(['1/2', '1/3', '1/4', '2/3']), mode: 'choice' };
  }
  if (type === 'comet_mult') {
    const a = rand(3, 8), b = rand(3, 8);
    return { label: 'Comet Multiplier', text: `${a} ☄️ × ${b} = ?`, hint: 'Total comets?', answer: a * b, options: generateDistractors(a * b, 3, 9, 70), mode: 'choice' };
  }
  if (type === 'asteroid_div') {
    const b = rand(3, 8), ans = rand(3, 8);
    return { label: 'Asteroid Field', text: `${b * ans} 🪨 ÷ ${b} = ?`, hint: 'Asteroids per group?', answer: ans, options: generateDistractors(ans, 3, 1, 15), mode: 'choice' };
  }
  if (type === 'star_word') {
    const fuel = rand(5, 12), perStar = rand(2, 5);
    return { label: 'Space Mission', text: `A ship needs ${perStar} fuel units per star. For ${fuel} stars?`, hint: 'Multiply to find total fuel.', answer: fuel * perStar, options: generateDistractors(fuel * perStar, 3, 10, 60), mode: 'choice' };
  }
  if (type === 'mult') { const a = rand(2, 9), b = rand(2, 9); return { label: 'Multiplication', text: `${a} × ${b} = ?`, hint: '', answer: a * b, options: generateDistractors(a * b, 3, 4, 90), mode: 'choice' }; }
  if (type === 'div') { const b = rand(2, 9), ans = rand(2, 9); return { label: 'Division', text: `${b * ans} ÷ ${b} = ?`, hint: '', answer: ans, options: generateDistractors(ans, 3, 1, 15), mode: 'choice' }; }
  if (type === 'frac_visual') { const denom = [2, 3, 4][rand(0, 2)]; const num = rand(1, denom - 1); return { label: 'Fractions', text: '🟦'.repeat(num) + '⬜'.repeat(denom - num), hint: 'What fraction is filled?', answer: `${num}/${denom}`, options: shuffle([`${num}/${denom}`, `${denom - num}/${denom}`, `${num}/${denom + 1}`, `${denom}/${num}`]), mode: 'choice' }; }
  if (type === 'word') { const price = rand(3, 9), qty = rand(2, 5); return { label: 'Word Problem', text: `${qty} toys cost $${price} each`, hint: 'What is the total?', answer: `$${price * qty}`, options: shuffle([`$${price * qty}`, `$${price * qty + rand(1,5)}`, `$${price * qty - rand(1,3)}`, `$${price + qty}`]), mode: 'choice' }; }
  const a = rand(2, 9), b = rand(2, 9);
  return { label: 'Missing Factor', text: `${a} × ? = ${a * b}`, hint: '', answer: b, options: generateDistractors(b, 3, 1, 12), mode: 'choice' };
}

function genCommander() {
  // PRUNED [2026-04-03]: Removed 'nebula_pct' and 'pulsar_ops' to make room for 'sci_not' and 'dec_add' and stay within MAX 25 limit.
  // PRUNED [2026-04-12]: Removed duplicates of 'sci_not' and 'dec_add' to make room for 'speed_ops' and 'planet_pct' and stay within MAX 25 limit.
  // PRUNED [2026-04-14]: Removed 'fraction_add', 'decimal' to make room for 'blackhole_div', 'galaxy_frac' and stay within MAX 25 limit.
  // PRUNED [2026-04-22]: Removed 'speed_ops', 'planet_pct' to make room for 'quasar_ops', 'pulsar_dec'
  // PRUNED [2026-05-18]: Removed 'rocket_pct', 'asteroid_decimal' to make room for 'pulsar_add', 'galaxy_pct' and stay within MAX 25 limit.
  // PRUNED [2026-06-15]: Removed 'robot_ops', 'ufo_decimal' to make room for 'blackhole_sub', 'galaxy_pct_2' and stay within MAX 25 limit.
  // ADDED [2026-06-24]: Harder content for ages 10-12 — 'void_neg' (negatives), 'star_power' (exponents), 'cosmic_pemdas' (parentheses), 'orbit_ratio' (ratios), 'warp_algebra' (one/two-step algebra), 'prime_scan' (primes), 'station_geo' (area/perimeter). Array grown intentionally.
  // ADDED [2026-06-24]: More breadth at the harder end — 'data_mean' (average), 'data_median' (median), 'data_mode' (mode), 'frac_to_dec' (fraction→decimal), 'pct_of_num' (N% of a number), 'dec_to_pct' (decimal→percent).
  const types = ['big_add', 'big_mult', 'blackhole_div', 'galaxy_frac', 'percent', 'order_ops', 'galaxy_decimal', 'lightyear_percent', 'blackhole_ops', 'nebula_dec', 'blackhole_pct', 'galaxy_ops', 'comet_ops', 'star_decimal', 'asteroid_pct', 'blackhole_add', 'supernova_pct', 'gravity_ops', 'orbit_dec', 'quasar_ops', 'pulsar_dec', 'pulsar_add', 'galaxy_pct', 'blackhole_sub', 'galaxy_pct_2', 'void_neg', 'star_power', 'cosmic_pemdas', 'orbit_ratio', 'warp_algebra', 'prime_scan', 'station_geo', 'data_mean', 'data_median', 'data_mode', 'frac_to_dec', 'pct_of_num', 'dec_to_pct'];
  const type = types[rand(0, types.length - 1)];
  if (type === 'void_neg') {
    // Negative-number arithmetic: subtracting a larger number, or adding a negative.
    if (rand(0, 1) === 0) {
      const a = rand(1, 20), b = rand(a + 1, 40);
      const ans = a - b;
      return { label: 'Deep Void', text: `${a} - ${b} = ?`, hint: 'The answer drops below zero.', answer: ans, options: generateDistractors(ans, 3, ans - 10, 10), mode: 'choice' };
    }
    const a = rand(-30, -1), b = rand(1, 30);
    const ans = a + b;
    return { label: 'Deep Void', text: `(${a}) + ${b} = ?`, hint: 'Adding to a negative number.', answer: ans, options: generateDistractors(ans, 3, ans - 10, ans + 10), mode: 'choice' };
  }
  if (type === 'star_power') {
    // Exponents / powers.
    const base = rand(2, 9), exp = [2, 3][rand(0, 1)];
    const ans = Math.pow(base, exp);
    return { label: 'Star Power', text: `${base}^${exp} = ?`, hint: exp === 2 ? 'Multiply the base by itself.' : 'Multiply the base three times.', answer: ans, options: generateDistractors(ans, 3, 1, ans + 30), mode: 'choice' };
  }
  if (type === 'cosmic_pemdas') {
    // Order of operations with parentheses and division.
    const a = rand(2, 9), b = rand(2, 9), c = rand(2, 6);
    const ans = (a + b) * c;
    return { label: 'Cosmic PEMDAS', text: `(${a} + ${b}) × ${c} = ?`, hint: 'Solve inside the parentheses first.', answer: ans, options: generateDistractors(ans, 3, 5, ans + 30), mode: 'choice' };
  }
  if (type === 'orbit_ratio') {
    // Ratios / proportions: scale a known ratio up.
    const unit = rand(2, 6), factor = rand(2, 6);
    const known = rand(2, 8);
    const ans = known * factor;
    return { label: 'Orbit Ratio', text: `If ${unit} moons orbit per ${known} planets, how many moons orbit ${known * factor} planets?`, hint: 'The ratio stays the same — scale it up.', answer: unit * factor, options: generateDistractors(unit * factor, 3, 1, unit * factor + 20), mode: 'choice' };
  }
  if (type === 'warp_algebra') {
    // Simple one-step / two-step algebra: solve ax + b = c.
    const x = rand(2, 9), a = rand(2, 5), b = rand(1, 10);
    const c = a * x + b;
    return { label: 'Warp Algebra', text: `Solve for x:  ${a}x + ${b} = ${c}`, hint: 'Subtract, then divide.', answer: x, options: generateDistractors(x, 3, 1, x + 12), mode: 'choice' };
  }
  if (type === 'prime_scan') {
    // Prime numbers: identify the prime among the options.
    const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29];
    const composites = [4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 22, 24, 25];
    const prime = primes[rand(0, primes.length - 1)];
    const opts = new Set([prime]);
    let attempts = 0;
    while (opts.size < 4 && attempts < 50) {
      opts.add(composites[rand(0, composites.length - 1)]);
      attempts++;
    }
    return { label: 'Prime Scan', text: 'Which of these numbers is PRIME?', hint: 'A prime has exactly two factors: 1 and itself.', answer: prime, options: shuffle(Array.from(opts)), mode: 'choice' };
  }
  if (type === 'station_geo') {
    // Simple geometry: area or perimeter of a rectangle.
    const w = rand(3, 12), h = rand(3, 12);
    if (rand(0, 1) === 0) {
      const ans = w * h;
      return { label: 'Station Geometry', text: `Area of a ${w} × ${h} module?`, hint: 'Area = width × height.', answer: ans, options: generateDistractors(ans, 3, 5, ans + 40), mode: 'choice' };
    }
    const ans = 2 * (w + h);
    return { label: 'Station Geometry', text: `Perimeter of a ${w} × ${h} module?`, hint: 'Perimeter = 2 × (width + height).', answer: ans, options: generateDistractors(ans, 3, 5, ans + 30), mode: 'choice' };
  }
  if (type === 'data_mean') {
    // Mean (average) of 3-4 small integers chosen to divide evenly.
    const count = rand(3, 4);
    const mean = rand(3, 15);
    const nums = [];
    let remaining = mean * count;
    for (let i = 0; i < count - 1; i++) {
      const lo = Math.max(1, remaining - (mean * 2) * (count - 1 - i));
      const hi = Math.min(remaining - (count - 1 - i), mean * 2);
      const v = rand(lo, Math.max(lo, hi));
      nums.push(v);
      remaining -= v;
    }
    nums.push(remaining);
    return { label: 'Star Data Mean', text: `Mean (average) of ${shuffle(nums).join(', ')}?`, hint: 'Add them all, then divide by how many.', answer: mean, options: generateDistractors(mean, 3, 1, mean + 12), mode: 'choice' };
  }
  if (type === 'data_median') {
    // Median of 5 integers: sort then pick the middle.
    const nums = [];
    while (nums.length < 5) {
      const v = rand(1, 40);
      if (!nums.includes(v)) nums.push(v);
    }
    const sorted = [...nums].sort((a, b) => a - b);
    const ans = sorted[2];
    return { label: 'Nebula Median', text: `Median of ${nums.join(', ')}?`, hint: 'Sort the numbers, then take the middle one.', answer: ans, options: generateDistractors(ans, 3, 1, 40), mode: 'choice' };
  }
  if (type === 'data_mode') {
    // Mode of a small list: the value that appears most often.
    const ans = rand(2, 9);
    const others = [];
    while (others.length < 2) {
      const v = rand(2, 9);
      if (v !== ans && !others.includes(v)) others.push(v);
    }
    const list = [ans, ans, ans, others[0], others[1]];
    return { label: 'Comet Mode', text: `Mode of ${shuffle(list).join(', ')}?`, hint: 'The mode is the value that appears most often.', answer: ans, options: generateDistractors(ans, 3, 2, 12), mode: 'choice' };
  }
  if (type === 'frac_to_dec') {
    // Convert a simple fraction to a decimal.
    const pairs = [[1, 2, '0.5'], [1, 4, '0.25'], [3, 4, '0.75'], [1, 5, '0.2'], [2, 5, '0.4'], [3, 5, '0.6'], [4, 5, '0.8'], [1, 10, '0.1'], [3, 10, '0.3'], [7, 10, '0.7'], [1, 8, '0.125'], [3, 8, '0.375']];
    const [n, d, ans] = pairs[rand(0, pairs.length - 1)];
    const opts = new Set([ans]);
    let attempts = 0;
    while (opts.size < 4 && attempts < 30) {
      attempts++;
      const fake = pairs[rand(0, pairs.length - 1)][2];
      if (fake !== ans) opts.add(fake);
    }
    return { label: 'Fraction to Decimal', text: `${n}/${d} = ? (as a decimal)`, hint: 'Divide the top by the bottom.', answer: ans, options: shuffle(Array.from(opts)), mode: 'choice' };
  }
  if (type === 'pct_of_num') {
    // Find N% of a number with clean results.
    const p = [10, 20, 25, 50][rand(0, 3)];
    const base = rand(2, 12) * (100 / p);
    const ans = base * p / 100;
    return { label: 'Quasar Percent', text: `${p}% of ${base} = ?`, hint: `Multiply ${base} by ${p}/100.`, answer: ans, options: generateDistractors(ans, 3, 1, base), mode: 'choice' };
  }
  if (type === 'dec_to_pct') {
    // Convert a decimal to a percent.
    const decimals = ['0.1', '0.2', '0.25', '0.3', '0.4', '0.5', '0.6', '0.7', '0.75', '0.8', '0.9'];
    const d = decimals[rand(0, decimals.length - 1)];
    const ans = `${parseFloat(d) * 100}%`;
    const opts = new Set([ans]);
    let attempts = 0;
    while (opts.size < 4 && attempts < 30) {
      attempts++;
      const fake = `${parseFloat(decimals[rand(0, decimals.length - 1)]) * 100}%`;
      if (fake !== ans) opts.add(fake);
    }
    return { label: 'Pulsar Percent', text: `${d} = ? (as a percent)`, hint: 'Multiply the decimal by 100.', answer: ans, options: shuffle(Array.from(opts)), mode: 'choice' };
  }
  if (type === 'blackhole_sub') { const a = rand(100, 500), b = rand(50, a - 1); return { label: 'Big Subtraction', text: `${a} 🕳️ - ${b} 🕳️ = ?`, hint: 'Subtract', answer: a - b, options: generateDistractors(a - b, 3, 10, 450), mode: 'choice' }; }
  if (type === 'galaxy_pct_2') { const p = [10, 20, 25, 50][rand(0, 3)]; const base = rand(10, 50) * (100/p); const ans = base * p/100; return { label: 'Percentages', text: `${p}% of ${base} 🌌`, hint: 'Calculate', answer: ans, options: generateDistractors(ans, 3, 5, 200), mode: 'choice' }; }
  if (type === 'gravity_ops') { const a=rand(5,10), b=rand(2,5); const ans=a+(b*b); return { label: 'Gravity Math', text: `${a} + ${b}² = ?`, hint: 'Square first!', answer: ans, options: generateDistractors(ans, 3, 5, 50), mode: 'choice' }; }
  if (type === 'orbit_dec') { const a=(rand(10,50)/10).toFixed(1); const b=(rand(10,50)/10).toFixed(1); const ans=(parseFloat(a)-parseFloat(b)).toFixed(1); return { label: 'Decimals', text: `${a} - ${b} = ?`, hint: '', answer: ans, options: generateDistractors(parseFloat(ans), 3, -5, 5).map(x=>x.toFixed(1)), mode: 'choice' }; }
  if (type === 'blackhole_div') {
    const b = rand(10, 20), ans = rand(5, 15);
    return { label: 'Black Hole Division', text: `${b * ans} 🕳️ ÷ ${b} = ?`, hint: 'Divide the black holes', answer: ans, options: generateDistractors(ans, 3, 2, 25), mode: 'choice' };
  }
  if (type === 'galaxy_frac') {
    const d = [4, 6, 8][rand(0, 2)]; const a = rand(1, d - 1), b = rand(1, d - 1);
    const sum = a + b;
    return { label: 'Galaxy Fraction Addition', text: `${a}/${d} 🌌 + ${b}/${d} 🌌 = ?`, hint: 'Same denominator!', answer: `${sum}/${d}`, options: shuffle([`${sum}/${d}`, `${sum}/${d * 2}`, `${a + b + 1}/${d}`, `${a}/${d + b}`]), mode: 'choice' };
  }
  if (type === 'nebula_pct') {
    const pcts = [10, 20, 25, 50, 75];
    const p = pcts[rand(0, pcts.length - 1)];
    const mass = rand(10, 100) * 10;
    const ans = mass * (p / 100);
    return { label: 'Nebula Mass', text: `${p}% of ${mass} tons`, hint: 'Find the percentage.', answer: ans, options: generateDistractors(ans, 3, 5, mass), mode: 'choice' };
  }
  if (type === 'pulsar_ops') {
    const a = rand(20, 60), b = rand(4, 12), c = rand(2, 5);
    const ans = a + (b * c);
    return { label: 'Pulsar Spin', text: `${a} 💫 + ${b} 💫 × ${c} = ?`, hint: 'Multiply first!', answer: ans, options: generateDistractors(ans, 3, 20, 150), mode: 'choice' };
  }
  if (type === 'speed_ops') {
    const a = rand(100, 300), b = rand(5, 15), c = rand(2, 6);
    const ans = a + (b * c);
    return { label: 'Warp Speed', text: `${a} + ${b} × ${c} Mach = ?`, hint: 'Multiply first!', answer: ans, options: generateDistractors(ans, 3, 100, 400), mode: 'choice' };
  }
  if (type === 'planet_pct') {
    const pcts = [5, 10, 20, 50];
    const p = pcts[rand(0, pcts.length - 1)];
    const mass = rand(100, 500) * 10;
    const ans = mass * (p / 100);
    return { label: 'Planet Mass', text: `${p}% of ${mass} tons`, hint: 'Find the percentage.', answer: ans, options: generateDistractors(ans, 3, 10, mass), mode: 'choice' };
  }
  if (type === 'sci_not') {
    const base = rand(2, 9), exp = rand(3, 6);
    const ans = base * Math.pow(10, exp);
    return { label: 'Scientific Notation', text: `${base} × 10^${exp} = ?`, hint: 'Add zeros.', answer: ans, options: generateDistractors(ans, 3, 100, 10000000), mode: 'choice' };
  }
  if (type === 'dec_add') {
    const a = (rand(10, 99) / 10).toFixed(1), b = (rand(10, 99) / 10).toFixed(1);
    const ans = (parseFloat(a) + parseFloat(b)).toFixed(1);
    return { label: 'Decimal Addition', text: `${a} + ${b} = ?`, hint: 'Line up decimals.', answer: ans, options: generateDistractors(parseFloat(ans), 3, 1, 20).map(x=>x.toFixed(1)), mode: 'choice' };
  }
  if (type === 'blackhole_add') {
    const a = rand(100, 999), b = rand(100, 999);
    return { label: 'Mass Addition', text: `${a} + ${b} = ?`, hint: 'Add the large numbers.', answer: a + b, options: generateDistractors(a + b, 3, 200, 2000), mode: 'choice' };
  }
  if (type === 'pulsar_add') {
    const a = rand(150, 450), b = rand(150, 450);
    return { label: 'Pulsar Math', text: `${a} 💫 + ${b} 💫 = ?`, hint: 'Add the large numbers.', answer: a + b, options: generateDistractors(a + b, 3, 300, 900), mode: 'choice' };
  }
  if (type === 'supernova_pct') {
    const pcts = [10, 20, 25, 50, 75];
    const p = pcts[rand(0, pcts.length - 1)];
    const energy = rand(10, 100) * 10;
    const ans = energy * (p / 100);
    return { label: 'Supernova Energy', text: `${p}% of ${energy} units`, hint: 'Find the percentage.', answer: ans, options: generateDistractors(ans, 3, 5, energy), mode: 'choice' };
  }
  if (type === 'robot_ops') {
    const a = rand(25, 60), b = rand(5, 12), c = rand(2, 4);
    const ans = a + (b * c);
    return { label: 'Droid Code', text: `${a} 🤖 + ${b} 🤖 × ${c} = ?`, hint: 'Multiply first!', answer: ans, options: generateDistractors(ans, 3, 20, 120), mode: 'choice' };
  }
  if (type === 'ufo_decimal') {
    const a = (rand(25, 95) / 10).toFixed(1);
    const b = (rand(25, 95) / 10).toFixed(1);
    const ans = (parseFloat(a) + parseFloat(b)).toFixed(1);
    const opts = [ans];
    let attempts = 0;
    while (opts.length < 4 && attempts < 15) {
      attempts++;
      const fake = (parseFloat(ans) + (rand(-30, 30) / 10)).toFixed(1);
      if (!opts.includes(fake) && parseFloat(fake) > 0 && fake !== ans) opts.push(fake);
    }
    while (opts.length < 4) {
      let fallback = (parseFloat(ans) + (opts.length + 1) * 1.1).toFixed(1);
      if (!opts.includes(fallback)) opts.push(fallback);
    }
    return { label: 'UFO Speed', text: `${a} Mach + ${b} Mach = ?`, hint: 'Add the speeds.', answer: ans, options: shuffle(opts), mode: 'choice' };
  }
  if (type === 'galaxy_pct') {
    const pcts = [20, 25, 50, 75];
    const p = pcts[rand(0, pcts.length - 1)];
    const stars = rand(10, 50) * 100;
    const ans = stars * (p / 100);
    return { label: 'Galaxy Stars', text: `${p}% of ${stars} 🌌`, hint: 'Find the percentage.', answer: ans, options: generateDistractors(ans, 3, 100, stars), mode: 'choice' };
  }
  if (type === 'comet_ops') {
    const a = rand(20, 50), b = rand(4, 9), c = rand(2, 6);
    const ans = a + (b * c);
    return { label: 'Comet Path', text: `${a} ☄️ + ${b} ☄️ × ${c} = ?`, hint: 'Multiply first!', answer: ans, options: generateDistractors(ans, 3, 20, 100), mode: 'choice' };
  }
  if (type === 'star_decimal') {
    const a = (rand(20, 99) / 10).toFixed(1);
    const b = (rand(20, 99) / 10).toFixed(1);
    const ans = (parseFloat(a) + parseFloat(b)).toFixed(1);
    const opts = [ans];
    let attempts = 0;
    while (opts.length < 4 && attempts < 15) {
      attempts++;
      const fake = (parseFloat(ans) + (rand(-40, 40) / 10)).toFixed(1);
      if (!opts.includes(fake) && parseFloat(fake) > 0 && fake !== ans) opts.push(fake);
    }
    while (opts.length < 4) {
      let fallback = (parseFloat(ans) + (opts.length + 1) * 1.1).toFixed(1);
      if (!opts.includes(fallback)) opts.push(fallback);
    }
    return { label: 'Star Mass', text: `${a} ⭐ + ${b} ⭐ = ?`, hint: 'Add the decimals.', answer: ans, options: shuffle(opts), mode: 'choice' };
  }
  if (type === 'quasar_ops') { const a = rand(5,15), b = rand(2,5), c = rand(2,10); return { label: 'Order of Ops', text: `${a} + ${b} × ${c} = ?`, hint: 'Multiply first!', answer: a + (b*c), options: generateDistractors(a + (b*c), 3, 10, 100), mode: 'choice' }; }
  if (type === 'pulsar_dec') { const a = rand(10,99)/10, b = rand(10,99)/10; return { label: 'Decimals', text: `${a} + ${b} = ?`, hint: 'Line up decimals', answer: parseFloat((a+b).toFixed(1)), options: [parseFloat((a+b).toFixed(1)), parseFloat((a+b+1).toFixed(1)), parseFloat((a+b-1).toFixed(1)), parseFloat((a+b+0.5).toFixed(1))], mode: 'choice' }; }
  if (type === 'asteroid_pct') {
    const pcts = [10, 20, 25, 50];
    const p = pcts[rand(0, pcts.length - 1)];
    const mass = rand(50, 200) * 2;
    const ans = mass * (p / 100);
    return { label: 'Asteroid Ore', text: `${p}% of ${mass} tons`, hint: 'Find the percentage.', answer: ans, options: generateDistractors(ans, 3, 10, mass), mode: 'choice' };
  }
  if (type === 'nebula_dec') {
    const a = (rand(10, 50) / 10).toFixed(1);
    const b = (rand(10, 50) / 10).toFixed(1);
    const ans = (parseFloat(a) + parseFloat(b)).toFixed(1);
    const opts = [ans];
    let attempts = 0;
    while (opts.length < 4 && attempts < 15) {
      attempts++;
      const fake = (parseFloat(ans) + (rand(-15, 15) / 10)).toFixed(1);
      if (!opts.includes(fake) && parseFloat(fake) > 0 && fake !== ans) opts.push(fake);
    }
    while (opts.length < 4) {
      let fallback = (parseFloat(ans) + (opts.length + 1) * 1.1).toFixed(1);
      if (!opts.includes(fallback)) opts.push(fallback);
    }
    return { label: 'Nebula Gas', text: `${a} mg + ${b} mg = ?`, hint: 'Add the decimals.', answer: ans, options: shuffle(opts), mode: 'choice' };
  }
  if (type === 'blackhole_pct') {
    const pcts = [10, 20, 50];
    const p = pcts[rand(0, pcts.length - 1)];
    const mass = rand(10, 50) * 10;
    const ans = mass * (p / 100);
    return { label: 'Event Horizon', text: `${p}% of ${mass} mass`, hint: 'Find the percentage.', answer: ans, options: generateDistractors(ans, 3, 5, mass), mode: 'choice' };
  }
  if (type === 'galaxy_ops') {
    const a = rand(10, 30), b = rand(2, 6), c = rand(2, 5);
    const ans = a + (b * c);
    return { label: 'Cosmic Order', text: `${a} 🌟 + ${b} 🌟 × ${c} = ?`, hint: 'Multiply first!', answer: ans, options: generateDistractors(ans, 3, 10, 80), mode: 'choice' };
  }
  if (type === 'galaxy_decimal') {
    const a = (rand(15, 80) / 10).toFixed(1);
    const b = (rand(15, 80) / 10).toFixed(1);
    const ans = (parseFloat(a) + parseFloat(b)).toFixed(1);
    const opts = [ans];
    let attempts = 0;
    while (opts.length < 4 && attempts < 15) {
      attempts++;
      const fake = (parseFloat(ans) + (rand(-30, 30) / 10)).toFixed(1);
      if (!opts.includes(fake) && parseFloat(fake) > 0 && fake !== ans) opts.push(fake);
    }
    while (opts.length < 4) {
      let fallback = (parseFloat(ans) + (opts.length + 1) * 1.1).toFixed(1);
      if (!opts.includes(fallback)) opts.push(fallback);
    }
    return { label: 'Galaxy Decimals', text: `${a} 🌌 + ${b} 🌌 = ?`, hint: 'Add the decimals.', answer: ans, options: shuffle(opts), mode: 'choice' };
  }
  if (type === 'lightyear_percent') {
    const pcts = [25, 50, 75];
    const p = pcts[rand(0, pcts.length - 1)];
    const dist = rand(20, 100) * 4;
    const ans = dist * (p / 100);
    return { label: 'Hyperdrive %', text: `${p}% of ${dist} lightyears`, hint: 'Calculate the percentage.', answer: ans, options: generateDistractors(ans, 3, 10, dist), mode: 'choice' };
  }
  if (type === 'blackhole_ops') {
    const a = rand(10, 25), b = rand(3, 7), c = rand(2, 5);
    const ans = a - (b * c);
    return { label: 'Gravity Math', text: `${a} - ${b} × ${c} = ?`, hint: 'Multiply before subtracting!', answer: ans, options: generateDistractors(ans, 3, -10, 30), mode: 'choice' };
  }
  if (type === 'big_add') { const a = rand(100, 500), b = rand(100, 500); return { label: 'Big Addition', text: `${a} + ${b} = ?`, hint: '', answer: a + b, options: generateDistractors(a + b, 3, 200, 1100), mode: 'choice' }; }
  if (type === 'big_mult') { const a = rand(12, 25), b = rand(3, 9); return { label: 'Multiplication', text: `${a} × ${b} = ?`, hint: '', answer: a * b, options: generateDistractors(a * b, 3, 20, 250), mode: 'choice' }; }
  if (type === 'fraction_add') { const d = [4, 6, 8][rand(0, 2)]; const a = rand(1, d / 2), b = rand(1, d / 2); const sum = a + b; return { label: 'Fraction Addition', text: `${a}/${d} + ${b}/${d} = ?`, hint: 'Same denominator!', answer: `${sum}/${d}`, options: shuffle([`${sum}/${d}`, `${sum}/${d * 2}`, `${a + b + 1}/${d}`, `${a}/${d + b}`]), mode: 'choice' }; }
  if (type === 'decimal') {
    const a = (rand(11, 95) / 10).toFixed(1);
    const b = (rand(11, 95) / 10).toFixed(1);
    const ans = (parseFloat(a) + parseFloat(b)).toFixed(1);
    const opts = [ans];
    let attempts = 0;
    while (opts.length < 4 && attempts < 15) {
      attempts++;
      const fake = (parseFloat(ans) + (rand(-20, 20) / 10)).toFixed(1);
      if (!opts.includes(fake) && parseFloat(fake) > 0 && fake !== ans) opts.push(fake);
    }
    while (opts.length < 4) {
      let fallback = (parseFloat(ans) + (opts.length + 1) * 1.1).toFixed(1);
      if (!opts.includes(fallback)) opts.push(fallback);
    }
    return { label: 'Decimals', text: `${a} + ${b} = ?`, hint: '', answer: ans, options: shuffle(opts), mode: 'choice' };
  }
  if (type === 'percent') { const pcts = [10, 20, 25, 50]; const p = pcts[rand(0, pcts.length - 1)]; const base = rand(2, 10) * (100 / p); const ans = base * p / 100; return { label: 'Percentages', text: `${p}% of ${base} = ?`, hint: '', answer: ans, options: generateDistractors(ans, 3, 1, Math.max(ans * 2, 20)), mode: 'choice' }; }
  const a = rand(2, 8), b = rand(2, 5), c = rand(1, 6); const ans = a + b * c;
  return { label: 'Order of Operations', text: `${a} + ${b} × ${c} = ?`, hint: 'Multiply first!', answer: ans, options: generateDistractors(ans, 3, 5, 60), mode: 'choice' };
}

const GENERATORS = { cadet: genCadet, explorer: genExplorer, pilot: genPilot, commander: genCommander };

/* ================================================================
   GAME FLOW
   ================================================================ */

function startGame(level) {
  currentLevel = level;
  score = 0; currentQ = 0;
  startTime = Date.now();
  setTheme(level);
  questions = [];
  for (let i = 0; i < TOTAL_QUESTIONS; i++) questions.push(GENERATORS[level]());
  const badgeEl = document.getElementById('gameBadge');
  if (badgeEl) badgeEl.textContent = THEMES[level].name;
  updateScore();
  showScreen('game');
  showQuestion();
}

function updateScore() {
  const el = document.getElementById('gameScore');
  if (el) el.textContent = `⭐ ${score}`;
}

function showQuestion() {
  const q = questions[currentQ];
  const card = document.getElementById('questionCard');
  if (card) card.className = 'question-card';
  const lbl = document.getElementById('qLabel');
  const txt = document.getElementById('qText');
  const hnt = document.getElementById('qHint');
  const pf = document.getElementById('progressFill');
  if (lbl) lbl.textContent = q.label;
  if (txt) txt.textContent = q.text;
  if (hnt) hnt.textContent = q.hint || '';
  if (pf) pf.style.width = `${(currentQ / TOTAL_QUESTIONS) * 100}%`;
  const wrap = document.getElementById('answersWrap');
  if (!wrap) return;
  wrap.innerHTML = '';
  if (q.mode === 'choice') {
    q.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'answer-btn';
      btn.textContent = opt;
      btn.onclick = () => handleAnswer(btn, opt, q);
      wrap.appendChild(btn);
    });
  }
}

function handleAnswer(btn, selected, q) {
  const correct = String(selected) === String(q.answer);
  const card = document.getElementById('questionCard');
  const allBtns = document.querySelectorAll('.answer-btn');
  allBtns.forEach(b => {
    b.classList.add('disabled');
    if (String(b.textContent) === String(q.answer)) b.classList.add('reveal-correct');
  });
  if (correct) {
    score++;
    updateScore();
    btn.classList.add('selected-correct');
    if (card) card.classList.add('correct');
    showFeedback(['🎉','🌟','✨','💫','🚀','👏'][rand(0, 5)]);
    if (typeof SFX !== 'undefined') SFX.correct();
  } else {
    btn.classList.add('selected-wrong');
    if (card) card.classList.add('wrong');
    showFeedback(['😬','🤔','💪','🔄'][rand(0, 3)]);
    if (typeof SFX !== 'undefined') SFX.wrong();
  }
  setTimeout(() => { currentQ++; currentQ >= TOTAL_QUESTIONS ? finishGame() : showQuestion(); }, 1200);
}

function finishGame() {
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const pct = Math.round((score / TOTAL_QUESTIONS) * 100);
  const pf = document.getElementById('progressFill');
  if (pf) pf.style.width = '100%';

  const stars = pct >= 90 ? 3 : pct >= 60 ? 2 : 1;
  if (typeof SFX !== 'undefined' && pct >= 60) SFX.cheer();

  const prevProg = getUserProgress();
  const prevBest = prevProg[currentLevel] ? prevProg[currentLevel].bestPct : 0;
  const isNewRecord = pct > prevBest;
  saveUserProgress(currentLevel, stars, pct);

  if (typeof ActivityLog !== 'undefined') {
    ActivityLog.log('Math Galaxy', '🧮', `Completed ${currentLevel} — ${stars} star${stars !== 1 ? 's' : ''}`);
  }

  let emoji, title, sub;
  if (pct >= 90) { emoji = '🏆'; title = 'Mission Complete!'; sub = `Amazing! ${score} out of ${TOTAL_QUESTIONS} correct!`; }
  else if (pct >= 70) { emoji = '🌟'; title = 'Great Flying!'; sub = `${score} out of ${TOTAL_QUESTIONS} — almost perfect!`; }
  else if (pct >= 50) { emoji = '🚀'; title = 'Good Effort!'; sub = `${score} out of ${TOTAL_QUESTIONS} — keep practicing!`; }
  else { emoji = '💪'; title = 'Keep Going!'; sub = `${score} out of ${TOTAL_QUESTIONS} — you'll get better!`; }

  const reEl = document.getElementById('resultsEmoji');
  const rtEl = document.getElementById('resultsTitle');
  const rsEl = document.getElementById('resultsSub');
  if (reEl) reEl.textContent = emoji;
  if (rtEl) rtEl.textContent = title;
  if (rsEl) rsEl.textContent = sub;

  const starsRow = document.getElementById('starsRow');
  if (starsRow) {
    starsRow.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const span = document.createElement('span');
      span.className = 'star';
      span.textContent = i < stars ? '⭐' : '☆';
      starsRow.appendChild(span);
    }
  }

  const nrEl = document.getElementById('newRecordWrap');
  if (nrEl) nrEl.innerHTML = isNewRecord && prevBest > 0 ? '<div class="new-record">🎯 New Personal Best!</div>' : '';

  const statsEl = document.getElementById('resultsStats');
  if (statsEl) statsEl.innerHTML = `
    <div class="stat-box"><div class="stat-value" style="color:var(--green)">${pct}%</div><div class="stat-label">Score</div></div>
    <div class="stat-box"><div class="stat-value" style="color:var(--gold)">${score}/${TOTAL_QUESTIONS}</div><div class="stat-label">Correct</div></div>
    <div class="stat-box"><div class="stat-value" style="color:var(--cyan)">${mins}:${String(secs).padStart(2,'0')}</div><div class="stat-label">Time</div></div>
  `;

  if (typeof LearningCheck !== 'undefined') {
    LearningCheck.maybePrompt('math', () => showScreen('results'));
  } else {
    showScreen('results');
  }
}

function playAgain() { startGame(currentLevel); }
function goHome() { renderBestScores(); showScreen('select'); }

// ── Boot safely after DOM is ready ──
document.addEventListener('DOMContentLoaded', initUserUI);

// === NEW CONTENT ADDED 2026-03-23 by Content Guardian Agent ===
// Math Galaxy – 12 new problems added to generators
// Descubre Chile – 1 new topic + 10 new quiz questions
