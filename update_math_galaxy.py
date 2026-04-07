import re

with open('js/math-galaxy.js', 'r') as f:
    content = f.read()

# Cadet: currently 23. Add 2 -> 25.
# New types: 'alien_shape', 'asteroid_add'

cadet_search = """function genCadet() {
  const types = ['count', 'add', 'shape', 'bigger', 'planet_count', 'rocket_sub', 'shape_pattern', 'astronaut_count', 'star_add', 'moon_shape', 'alien_count', 'satellite_add', 'sun_shape', 'robot_add', 'meteor_count', 'earth_shape', 'ufo_count', 'telescope_add', 'star_shape', 'sun_count', 'alien_sub', 'sun_add', 'rocket_count'];"""
cadet_replace = """function genCadet() {
  const types = ['count', 'add', 'shape', 'bigger', 'planet_count', 'rocket_sub', 'shape_pattern', 'astronaut_count', 'star_add', 'moon_shape', 'alien_count', 'satellite_add', 'sun_shape', 'robot_add', 'meteor_count', 'earth_shape', 'ufo_count', 'telescope_add', 'star_shape', 'sun_count', 'alien_sub', 'sun_add', 'rocket_count', 'alien_shape', 'asteroid_add'];"""

content = content.replace(cadet_search, cadet_replace)

cadet_insert_search = """  if (type === 'sun_count') {"""
cadet_insert_replace = """  if (type === 'alien_shape') {
    return { label: 'Alien Shape', text: '👽', hint: 'What shape is an alien head?', answer: 'Oval', options: shuffle(['Oval', 'Square', 'Triangle', 'Star']), mode: 'choice' };
  }
  if (type === 'asteroid_add') {
    const a = rand(1, 5), b = rand(1, 4);
    return { label: 'Asteroid Addition', text: `${a} 🪨 + ${b} 🪨 = ?`, hint: 'Add the asteroids!', answer: a + b, options: generateDistractors(a + b, 3, 1, 10), mode: 'choice' };
  }
  if (type === 'sun_count') {"""
content = content.replace(cadet_insert_search, cadet_insert_replace)


# Explorer: currently 24. Add 2 -> 26. Prune 1 -> 25.
# Let's prune 'comet_compare' (redundant with 'comet_add', 'comet_sub', 'space_compare').
# New types: 'telescope_sub', 'ufo_add'
explorer_search = """function genExplorer() {
  const types = ['add', 'sub', 'missing', 'compare', 'double', 'alien_add', 'space_compare', 'star_fraction', 'ufo_sub', 'planet_pattern', 'comet_compare', 'meteor_sub', 'moon_pattern', 'rocket_compare', 'astronaut_sub', 'robot_pattern', 'satellite_compare', 'comet_sub', 'alien_pattern', 'planet_compare', 'star_sub', 'rocket_add', 'planet_sub', 'comet_add'];"""

explorer_replace = """function genExplorer() {
  // PRUNED [2026-04-12]: Removed 'comet_compare' to make room for 'telescope_sub' and stay within MAX 25 limit.
  const types = ['add', 'sub', 'missing', 'compare', 'double', 'alien_add', 'space_compare', 'star_fraction', 'ufo_sub', 'planet_pattern', 'meteor_sub', 'moon_pattern', 'rocket_compare', 'astronaut_sub', 'robot_pattern', 'satellite_compare', 'comet_sub', 'alien_pattern', 'planet_compare', 'star_sub', 'rocket_add', 'planet_sub', 'comet_add', 'telescope_sub', 'ufo_add'];"""
content = content.replace(explorer_search, explorer_replace)

explorer_prune_search = """  if (type === 'comet_compare') {
    const a = rand(10, 30), b = rand(10, 30);
    if (a === b) return genExplorer();
    const sym = a > b ? '>' : '<';
    return { label: 'Comet Fleet', text: `${a} ☄️  ◻  ${b} ☄️`, hint: 'Which is greater?', answer: sym, options: shuffle(['>', '<', '=']), mode: 'choice' };
  }
"""
content = content.replace(explorer_prune_search, "")

explorer_insert_search = """  if (type === 'star_sub') {"""
explorer_insert_replace = """  if (type === 'telescope_sub') {
    const a = rand(8, 15), b = rand(1, a - 1);
    return { label: 'Telescope Subtraction', text: `${a} 🔭 - ${b} 🔭 = ?`, hint: 'Subtract the telescopes', answer: a - b, options: generateDistractors(a - b, 3, 1, 15), mode: 'choice' };
  }
  if (type === 'ufo_add') {
    const a = rand(4, 9), b = rand(4, 9);
    return { label: 'UFO Addition', text: `${a} 🛸 + ${b} 🛸 = ?`, hint: 'Add the UFOs', answer: a + b, options: generateDistractors(a + b, 3, 5, 20), mode: 'choice' };
  }
  if (type === 'star_sub') {"""
content = content.replace(explorer_insert_search, explorer_insert_replace)


# Pilot: currently 24. Add 2 -> 26. Prune 1 -> 25.
# Prune: 'alien_word' (too similar to 'star_word').
# New types: 'comet_frac', 'planet_div'
pilot_search = """function genPilot() {
  const types = ['mult', 'div', 'frac_visual', 'word', 'missing_mult', 'comet_mult', 'asteroid_div', 'star_word', 'alien_mult', 'satellite_div', 'telescope_frac', 'planet_mult', 'ufo_div', 'rocket_word', 'robot_mult', 'meteor_div', 'alien_word', 'astronaut_mult', 'rocket_div', 'moon_frac', 'comet_div', 'meteor_mult', 'asteroid_mult', 'alien_div'];"""

pilot_replace = """function genPilot() {
  // PRUNED [2026-04-12]: Removed 'alien_word' to make room for 'comet_frac' and stay within MAX 25 limit.
  const types = ['mult', 'div', 'frac_visual', 'word', 'missing_mult', 'comet_mult', 'asteroid_div', 'star_word', 'alien_mult', 'satellite_div', 'telescope_frac', 'planet_mult', 'ufo_div', 'rocket_word', 'robot_mult', 'meteor_div', 'astronaut_mult', 'rocket_div', 'moon_frac', 'comet_div', 'meteor_mult', 'asteroid_mult', 'alien_div', 'comet_frac', 'planet_div'];"""

content = content.replace(pilot_search, pilot_replace)

pilot_prune_search = """  if (type === 'alien_word') {
    const ships = rand(3, 7), aliensPerShip = rand(4, 9);
    return { label: 'Alien Fleet', text: `There are ${ships} ships. Each holds ${aliensPerShip} aliens.`, hint: 'Multiply for total aliens.', answer: ships * aliensPerShip, options: generateDistractors(ships * aliensPerShip, 3, 10, 70), mode: 'choice' };
  }
"""
content = content.replace(pilot_prune_search, "")

pilot_insert_search = """  if (type === 'comet_div') {"""
pilot_insert_replace = """  if (type === 'comet_frac') {
    return { label: 'Comet Fractions', text: '☄️ ☄️ ☄️ 🪨', hint: 'Fraction of comets?', answer: '3/4', options: shuffle(['3/4', '1/4', '1/2', '4/3']), mode: 'choice' };
  }
  if (type === 'planet_div') {
    const b = rand(2, 9), ans = rand(2, 9);
    return { label: 'Planet Division', text: `${b * ans} 🪐 ÷ ${b} = ?`, hint: 'Divide the planets', answer: ans, options: generateDistractors(ans, 3, 1, 10), mode: 'choice' };
  }
  if (type === 'comet_div') {"""
content = content.replace(pilot_insert_search, pilot_insert_replace)


# Commander: currently 25. Add 2 -> 27. Prune 2 -> 25.
# Currently types list has duplicates: 'sci_not', 'dec_add', 'sci_not', 'dec_add'. That's strange.
# Let's count them: 'big_add', 'big_mult', 'fraction_add', 'decimal', 'percent', 'order_ops', 'galaxy_decimal', 'lightyear_percent', 'blackhole_ops', 'nebula_dec', 'blackhole_pct', 'galaxy_ops', 'comet_ops', 'star_decimal', 'asteroid_pct', 'robot_ops', 'ufo_decimal', 'rocket_pct', 'blackhole_add', 'asteroid_decimal', 'supernova_pct', 'sci_not', 'dec_add', 'sci_not', 'dec_add'. Total = 25. 'sci_not' and 'dec_add' are repeated.
# Prune 2 duplicates -> 23. Add 2 new -> 25.
# New types: 'speed_ops', 'planet_pct'

commander_search = """  const types = ['big_add', 'big_mult', 'fraction_add', 'decimal', 'percent', 'order_ops', 'galaxy_decimal', 'lightyear_percent', 'blackhole_ops', 'nebula_dec', 'blackhole_pct', 'galaxy_ops', 'comet_ops', 'star_decimal', 'asteroid_pct', 'robot_ops', 'ufo_decimal', 'rocket_pct', 'blackhole_add', 'asteroid_decimal', 'supernova_pct', 'sci_not', 'dec_add', 'sci_not', 'dec_add'];"""

commander_replace = """  // PRUNED [2026-04-12]: Removed duplicates of 'sci_not' and 'dec_add' to make room for 'speed_ops' and 'planet_pct' and stay within MAX 25 limit.
  const types = ['big_add', 'big_mult', 'fraction_add', 'decimal', 'percent', 'order_ops', 'galaxy_decimal', 'lightyear_percent', 'blackhole_ops', 'nebula_dec', 'blackhole_pct', 'galaxy_ops', 'comet_ops', 'star_decimal', 'asteroid_pct', 'robot_ops', 'ufo_decimal', 'rocket_pct', 'blackhole_add', 'asteroid_decimal', 'supernova_pct', 'sci_not', 'dec_add', 'speed_ops', 'planet_pct'];"""

content = content.replace(commander_search, commander_replace)

commander_insert_search = """  if (type === 'sci_not') {"""
commander_insert_replace = """  if (type === 'speed_ops') {
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
  if (type === 'sci_not') {"""

content = content.replace(commander_insert_search, commander_insert_replace)

with open('js/math-galaxy.js', 'w') as f:
    f.write(content)
