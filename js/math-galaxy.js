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
  const user = getActiveUser();
  if (!user) return null;
  return `zs_mathgalaxy_${user.name.toLowerCase().replace(/\s+/g,'_')}`;
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
  return shuffle([...set]);
}

/* ================================================================
   QUESTION GENERATORS PER LEVEL
   ================================================================ */

function genCadet() {
  const types = ['count', 'add', 'shape', 'bigger', 'planet_count', 'rocket_sub', 'shape_pattern', 'astronaut_count', 'star_add', 'moon_shape', 'alien_count', 'satellite_add', 'sun_shape', 'robot_add', 'meteor_count', 'earth_shape'];
  const type = types[rand(0, types.length - 1)];
  if (type === 'robot_add') {
    const a = rand(1, 4), b = rand(1, 5);
    return { label: 'Robot Assembly', text: `${a} 🤖 + ${b} 🤖 = ?`, hint: 'Add the robots!', answer: a + b, options: generateDistractors(a + b, 3, 1, 10), mode: 'choice' };
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
    return { label: 'Shapes', text: s.emoji, hint: 'What shape is this?', answer: s.name, options: shuffle([...shapes.map(x => x.name), 'Star'].slice(0, 4)), mode: 'choice' };
  }
  const a = rand(1, 10), b = rand(1, 10);
  if (a === b) return genCadet();
  return { label: 'Comparing', text: `${a}  or  ${b}`, hint: 'Which number is bigger?', answer: Math.max(a, b), options: shuffle([a, b]), mode: 'choice' };
}

function genExplorer() {
  const types = ['add', 'sub', 'missing', 'compare', 'double', 'alien_add', 'space_compare', 'star_fraction', 'ufo_sub', 'planet_pattern', 'comet_compare', 'meteor_sub', 'moon_pattern', 'rocket_compare', 'astronaut_sub', 'robot_pattern', 'satellite_compare'];
  const type = types[rand(0, types.length - 1)];
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
  if (type === 'comet_compare') {
    const a = rand(10, 30), b = rand(10, 30);
    if (a === b) return genExplorer();
    const sym = a > b ? '>' : '<';
    return { label: 'Comet Fleet', text: `${a} ☄️  ◻  ${b} ☄️`, hint: 'Which is greater?', answer: sym, options: shuffle(['>', '<', '=']), mode: 'choice' };
  }
  if (type === 'alien_add') {
    const a = rand(3, 9), b = rand(3, 9);
    return { label: 'Alien Math', text: `${a} 👽 + ${b} 👽 = ?`, hint: 'How many aliens total?', answer: a + b, options: generateDistractors(a + b, 3, 5, 20), mode: 'choice' };
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
  const types = ['mult', 'div', 'frac_visual', 'word', 'missing_mult', 'comet_mult', 'asteroid_div', 'star_word', 'alien_mult', 'satellite_div', 'telescope_frac', 'planet_mult', 'ufo_div', 'rocket_word', 'robot_mult', 'meteor_div', 'alien_word'];
  const type = types[rand(0, types.length - 1)];
  if (type === 'robot_mult') {
    const a = rand(4, 8), b = rand(3, 7);
    return { label: 'Robot Factory', text: `${a} 🤖 × ${b} = ?`, hint: 'Total robots built?', answer: a * b, options: generateDistractors(a * b, 3, 10, 60), mode: 'choice' };
  }
  if (type === 'meteor_div') {
    const b = rand(2, 6), ans = rand(3, 9);
    return { label: 'Meteor Shower', text: `${b * ans} ☄️ ÷ ${b} = ?`, hint: 'Divide the meteors', answer: ans, options: generateDistractors(ans, 3, 1, 12), mode: 'choice' };
  }
  if (type === 'alien_word') {
    const ships = rand(3, 7), aliensPerShip = rand(4, 9);
    return { label: 'Alien Fleet', text: `There are ${ships} ships. Each holds ${aliensPerShip} aliens.`, hint: 'Multiply for total aliens.', answer: ships * aliensPerShip, options: generateDistractors(ships * aliensPerShip, 3, 10, 70), mode: 'choice' };
  }
  if (type === 'planet_mult') {
    const a = rand(3, 9), b = rand(3, 9);
    return { label: 'Planet Math', text: `${a} 🪐 × ${b} = ?`, hint: 'Total planets?', answer: a * b, options: generateDistractors(a * b, 3, 5, 90), mode: 'choice' };
  }
  if (type === 'ufo_div') {
    const b = rand(2, 8), ans = rand(2, 8);
    return { label: 'UFO Landing', text: `${b * ans} 🛸 ÷ ${b} = ?`, hint: 'Divide the UFOs', answer: ans, options: generateDistractors(ans, 3, 1, 10), mode: 'choice' };
  }
  if (type === 'rocket_word') {
    const fuel = rand(6, 15), perShip = rand(2, 4);
    return { label: 'Fleet Supply', text: `A fleet needs ${perShip} fuel units per ship. For ${fuel} ships?`, hint: 'Multiply to find total fuel.', answer: fuel * perShip, options: generateDistractors(fuel * perShip, 3, 10, 60), mode: 'choice' };
  }
  if (type === 'alien_mult') {
    const a = rand(4, 9), b = rand(2, 6);
    return { label: 'Alien Multiply', text: `${a} 👾 × ${b} = ?`, hint: 'Total aliens?', answer: a * b, options: generateDistractors(a * b, 3, 5, 60), mode: 'choice' };
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
  const types = ['big_add', 'big_mult', 'fraction_add', 'decimal', 'percent', 'order_ops', 'galaxy_decimal', 'lightyear_percent', 'blackhole_ops', 'nebula_dec', 'blackhole_pct', 'galaxy_ops', 'comet_ops', 'star_decimal', 'asteroid_pct', 'robot_ops', 'ufo_decimal', 'rocket_pct'];
  const type = types[rand(0, types.length - 1)];
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
    while (opts.length < 4) {
      const fake = (parseFloat(ans) + (rand(-30, 30) / 10)).toFixed(1);
      if (!opts.includes(fake) && parseFloat(fake) > 0 && fake !== ans) opts.push(fake);
    }
    return { label: 'UFO Speed', text: `${a} Mach + ${b} Mach = ?`, hint: 'Add the speeds.', answer: ans, options: shuffle(opts), mode: 'choice' };
  }
  if (type === 'rocket_pct') {
    const pcts = [20, 25, 50, 75];
    const p = pcts[rand(0, pcts.length - 1)];
    const fuel = rand(20, 80) * 10;
    const ans = fuel * (p / 100);
    return { label: 'Rocket Fuel', text: `${p}% of ${fuel} gallons`, hint: 'Find the percentage.', answer: ans, options: generateDistractors(ans, 3, 10, fuel), mode: 'choice' };
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
    while (opts.length < 4) {
      const fake = (parseFloat(ans) + (rand(-40, 40) / 10)).toFixed(1);
      if (!opts.includes(fake) && parseFloat(fake) > 0 && fake !== ans) opts.push(fake);
    }
    return { label: 'Star Mass', text: `${a} ⭐ + ${b} ⭐ = ?`, hint: 'Add the decimals.', answer: ans, options: shuffle(opts), mode: 'choice' };
  }
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
    while (opts.length < 4) {
      const fake = (parseFloat(ans) + (rand(-15, 15) / 10)).toFixed(1);
      if (!opts.includes(fake) && parseFloat(fake) > 0 && fake !== ans) opts.push(fake);
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
    while (opts.length < 4) {
      const fake = (parseFloat(ans) + (rand(-30, 30) / 10)).toFixed(1);
      if (!opts.includes(fake) && parseFloat(fake) > 0 && fake !== ans) opts.push(fake);
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
  if (type === 'decimal') { const a = (rand(11, 95) / 10).toFixed(1); const b = (rand(11, 95) / 10).toFixed(1); const ans = (parseFloat(a) + parseFloat(b)).toFixed(1); const opts = [ans]; while (opts.length < 4) { const fake = (parseFloat(ans) + (rand(-20, 20) / 10)).toFixed(1); if (!opts.includes(fake) && parseFloat(fake) > 0) opts.push(fake); } return { label: 'Decimals', text: `${a} + ${b} = ?`, hint: '', answer: ans, options: shuffle(opts), mode: 'choice' }; }
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

  showScreen('results');
}

function playAgain() { startGame(currentLevel); }
function goHome() { renderBestScores(); showScreen('select'); }

// ── Boot safely after DOM is ready ──
document.addEventListener('DOMContentLoaded', initUserUI);

// === NEW CONTENT ADDED 2026-03-23 by Content Guardian Agent ===
// Math Galaxy – 12 new problems added to generators
// Descubre Chile – 1 new topic + 10 new quiz questions
// === NEW CONTENT ADDED 2026-03-23 by Content Guardian Agent ===
// Math Galaxy – 12 new problems added to generators
// Descubre Chile – 1 new topic + 10 new quiz questions
