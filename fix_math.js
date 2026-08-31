const fs = require('fs');
let c = fs.readFileSync('js/math-galaxy.js', 'utf8');

// I am just going to do standard exact text replacements
// Cadet
let repCadet1 = `// PRUNED [2026-10-24]: Removed 'sun_count_2', 'planet_compare'
  const types = ['count', 'add', 'moon_count', 'star_sub', 'planet_count', 'rocket_sub', 'astronaut_count', 'star_add', 'galaxy_count', 'alien_count', 'satellite_add', 'meteor_add', 'meteor_count', 'ufo_count', 'telescope_add', 'sun_count', 'sun_add', 'rocket_count', 'satellite_count', 'asteroid_add', 'planet_sub', 'sun_sub', 'meteor_pattern', 'satellite_count_2', 'alien_sub_2'];`;
c = c.replace(/const types = \['count', 'add', 'moon_count', 'star_sub', 'planet_count', 'rocket_sub', 'astronaut_count', 'star_add', 'galaxy_count', 'alien_count', 'satellite_add', 'meteor_add', 'meteor_count', 'ufo_count', 'telescope_add', 'sun_count', 'sun_add', 'rocket_count', 'satellite_count', 'asteroid_add', 'planet_sub', 'sun_sub', 'meteor_pattern', 'sun_count_2', 'planet_compare'\];/, repCadet1);

let repCadet2 = `  if (type === 'satellite_count_2') { const n = rand(1, 10); return { label: 'Satellites', text: '🛰️'.repeat(n), hint: 'How many satellites?', answer: n, options: generateDistractors(n, 3, 1, 15), mode: 'choice' }; }
  if (type === 'alien_sub_2') { const a = rand(3, 5), b = rand(1, a-1); return { label: 'Subtraction', text: \`\${a} 👽 - \${b} 👽 = ?\`, hint: '', answer: a-b, options: generateDistractors(a-b, 3, 1, 10), mode: 'choice' }; }`;
c = c.replace(/  if \(type === 'sun_count_2'\) \{ const n = rand\(1, 10\); return \{ label: 'Suns', text: '☀️'\.repeat\(n\), hint: 'How many suns\?', answer: n, options: generateDistractors\(n, 3, 1, 15\), mode: 'choice' \}; \}\n  if \(type === 'planet_compare'\) \{ const a = rand\(1, 10\), b = rand\(1, 10\); if \(a === b\) return genCadet\(\); return \{ label: 'Comparing', text: \`\${a} 🪐 or \${b} 🪐\`, hint: 'Which is bigger\?', answer: Math.max\(a, b\), options: shuffle\(\[a, b\]\), mode: 'choice' \}; \}/, repCadet2);

// Explorer
let repExp1 = `// PRUNED [2026-10-24]: Removed 'alien_diff', 'asteroid_add_2'
  const types = ['add', 'sub', 'planet_add', 'comet_compare2', 'double', 'space_compare', 'star_fraction', 'ufo_sub', 'meteor_sub', 'rocket_compare', 'astronaut_sub', 'robot_pattern', 'satellite_compare', 'comet_sub', 'alien_pattern', 'planet_compare', 'star_sub', 'planet_sub', 'comet_add', 'asteroid_sub', 'meteor_add_2', 'spaceship_add', 'satellite_add2', 'moon_add', 'rocket_double'];`;
c = c.replace(/const types = \['add', 'sub', 'planet_add', 'comet_compare2', 'double', 'space_compare', 'star_fraction', 'ufo_sub', 'meteor_sub', 'rocket_compare', 'astronaut_sub', 'robot_pattern', 'satellite_compare', 'comet_sub', 'alien_pattern', 'planet_compare', 'star_sub', 'planet_sub', 'comet_add', 'asteroid_sub', 'meteor_add_2', 'spaceship_add', 'satellite_add2', 'alien_diff', 'asteroid_add_2'\];/, repExp1);

let repExp2 = `  if (type === 'moon_add') { const a = rand(10, 20), b = rand(1, 9); return { label: 'Addition', text: \`\${a} 🌕 + \${b} 🌕 = ?\`, hint: 'Add them!', answer: a + b, options: generateDistractors(a + b, 3, 11, 35), mode: 'choice' }; }
  if (type === 'rocket_double') { const a = rand(5, 12); return { label: 'Doubles', text: \`Double of \${a} 🚀\`, hint: 'Multiply by 2', answer: a * 2, options: generateDistractors(a * 2, 3, 10, 30), mode: 'choice' }; }`;
c = c.replace(/  if \(type === 'alien_diff'\) \{ const a = rand\(15,30\), b = rand\(5,14\); return \{ label: 'Alien Subtraction', text: \`\${a} 👽 - \${b} 👽 = \?\`, hint: 'Subtract the aliens', answer: a-b, options: generateDistractors\(a-b, 3, 1, 30\), mode: 'choice' \}; \}\n  if \(type === 'asteroid_add_2'\) \{ const a = rand\(10,20\), b = rand\(5,10\); return \{ label: 'Addition', text: \`\${a} 🪨 \+ \${b} 🪨 = \?\`, hint: 'Add them up', answer: a\+b, options: generateDistractors\(a\+b, 3, 15, 30\), mode: 'choice' \}; \}/, repExp2);


// Pilot
let repPil1 = `// PRUNED [2026-10-24]: Removed 'moon_div', 'comet_mult_2'
  const types = ['mult', 'div', 'frac_visual', 'ufo_mult', 'satellite_frac', 'comet_mult', 'asteroid_div', 'star_word', 'satellite_div', 'telescope_frac', 'planet_mult', 'ufo_div', 'astronaut_mult', 'rocket_div', 'moon_frac', 'alien_pct', 'asteroid_mult', 'alien_div', 'blackhole_mult', 'comet_frac', 'galaxy_div', 'nebula_frac', 'star_div', 'planet_div', 'star_mult'];`;
c = c.replace(/const types = \['mult', 'div', 'frac_visual', 'ufo_mult', 'satellite_frac', 'comet_mult', 'asteroid_div', 'star_word', 'satellite_div', 'telescope_frac', 'planet_mult', 'ufo_div', 'astronaut_mult', 'rocket_div', 'moon_frac', 'alien_pct', 'asteroid_mult', 'alien_div', 'blackhole_mult', 'comet_frac', 'galaxy_div', 'nebula_frac', 'star_div', 'moon_div', 'comet_mult_2'\];/, repPil1);

let repPil2 = `  if (type === 'planet_div') { const b = rand(2, 9), ans = rand(2, 9), a = b * ans; return { label: 'Division', text: \`\${a} 🪐 ÷ \${b} = ?\`, hint: 'Divide it', answer: ans, options: generateDistractors(ans, 3, 1, 10), mode: 'choice' }; }
  if (type === 'star_mult') { const a = rand(2, 9), b = rand(2, 9); return { label: 'Multiplication', text: \`\${a} ⭐ × \${b} = ?\`, hint: 'Times tables', answer: a * b, options: generateDistractors(a * b, 3, 4, 85), mode: 'choice' }; }`;
c = c.replace(/  if \(type === 'moon_div'\) \{ const b = rand\(2, 8\), ans = rand\(2, 9\); return \{ label: 'Moon Division', text: \`\${b \* ans} 🌕 ÷ \${b} = \?\`, hint: 'Divide', answer: ans, options: generateDistractors\(ans, 3, 1, 10\), mode: 'choice' \}; \}\n  if \(type === 'comet_mult_2'\) \{ const a = rand\(3, 9\), b = rand\(4, 9\); return \{ label: 'Comet Mult', text: \`\${a} ☄️ × \${b} = \?\`, hint: 'Times tables', answer: a\*b, options: generateDistractors\(a\*b, 3, 10, 81\), mode: 'choice' \}; \}/, repPil2);


// Commander
let repCom1 = `// PRUNED [2026-10-24]: Removed 15 items
  const types = ['big_add', 'big_mult', 'blackhole_div', 'galaxy_frac', 'percent', 'order_ops', 'galaxy_decimal', 'lightyear_percent', 'blackhole_ops', 'nebula_dec', 'blackhole_pct', 'galaxy_ops', 'comet_ops', 'star_decimal', 'asteroid_pct', 'blackhole_add', 'supernova_pct', 'gravity_ops', 'orbit_dec', 'quasar_ops', 'pulsar_dec', 'pulsar_add', 'galaxy_pct', 'comet_pct', 'void_ops'];`;
c = c.replace(/const types = \['big_add', 'big_mult', 'blackhole_div', 'galaxy_frac', 'percent', 'order_ops', 'galaxy_decimal', 'lightyear_percent', 'blackhole_ops', 'nebula_dec', 'blackhole_pct', 'galaxy_ops', 'comet_ops', 'star_decimal', 'asteroid_pct', 'blackhole_add', 'supernova_pct', 'gravity_ops', 'orbit_dec', 'quasar_ops', 'pulsar_dec', 'pulsar_add', 'galaxy_pct', 'blackhole_sub', 'galaxy_pct_2', 'void_neg', 'star_power', 'cosmic_pemdas', 'orbit_ratio', 'warp_algebra', 'prime_scan', 'station_geo', 'data_mean', 'data_median', 'data_mode', 'frac_to_dec', 'pct_of_num', 'dec_to_pct'\];/, repCom1);

let idxStart = c.indexOf(`  if (type === 'blackhole_sub')`);
let idxEnd = c.indexOf(`  const a = rand(100, 999), b = rand(10, 99);`); // End of Commander ifs
if (idxStart !== -1 && idxEnd !== -1) {
    let repCom2 = `  if (type === 'comet_pct') { const ans = rand(2, 9) * 10; return { label: 'Percentage', text: \`10% of \${ans * 10} ☄️ = ?\`, hint: 'Divide by 10', answer: ans, options: generateDistractors(ans, 3, 10, 100), mode: 'choice' }; }
  if (type === 'void_ops') { const a = rand(2, 5), b = rand(2, 5), c = rand(1, 10); return { label: 'Order of Ops', text: \`\${a} + \${b} × \${c} = ?\`, hint: 'Multiply first', answer: a + (b * c), options: generateDistractors(a + (b * c), 3, 5, 50), mode: 'choice' }; }
`;
    c = c.substring(0, idxStart) + repCom2 + c.substring(idxEnd);
}

fs.writeFileSync('js/math-galaxy.js', c);
