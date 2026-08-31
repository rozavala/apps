const fs = require('fs');

let mg = fs.readFileSync('js/math-galaxy.js', 'utf8');

function addLogic(fnName, logicStr) {
    const startIdx = mg.indexOf(`function ${fnName}()`);
    const returnIdx = mg.indexOf("return { label: 'Fallback'", startIdx);
    if (returnIdx !== -1) {
        mg = mg.substring(0, returnIdx) + logicStr + "\n  " + mg.substring(returnIdx);
    }
}

const cadetLogic = `
  if (type === 'robot_count') {
    const n = rand(1, 10);
    return { label: 'Counting', text: '🤖'.repeat(n), hint: 'How many robots?', answer: n, options: generateDistractors(n, 3, 1, 10), mode: 'choice' };
  }
  if (type === 'alien_shapes') {
    return { label: 'Shapes', text: '⭐ 🌕 ⭐ 🌕 ?', hint: 'What comes next?', answer: '⭐', options: shuffle(['⭐', '🌕', '🪐', '🚀']), mode: 'choice' };
  }`;

const explorerLogic = `
  if (type === 'nebula_pattern') {
    return { label: 'Patterns', text: '2, 4, 6, 8, ?', hint: 'Add 2', answer: 10, options: [9, 10, 11, 12], mode: 'choice' };
  }
  if (type === 'half_moon') {
    return { label: 'Fractions', text: '1/2 of 10 = ?', hint: 'Divide by 2', answer: 5, options: [4, 5, 6, 10], mode: 'choice' };
  }`;

const pilotLogic = `
  if (type === 'meteor_mult_2') {
    return { label: 'Multiplication', text: '6 × 7 = ?', hint: '', answer: 42, options: [36, 42, 48, 49], mode: 'choice' };
  }
  if (type === 'alien_word_prob') {
    return { label: 'Word Problem', text: '3 aliens have 4 eyes each. Total eyes?', hint: 'Multiply', answer: 12, options: [7, 12, 16, 24], mode: 'choice' };
  }`;

const commanderLogic = `
  if (type === 'void_neg_2') {
    return { label: 'Deep Void', text: '-5 + (-3) = ?', hint: 'Add negatives', answer: -8, options: [-2, -8, 2, 8], mode: 'choice' };
  }
  if (type === 'star_power_2') {
    return { label: 'Exponents', text: '3^3 = ?', hint: '3 × 3 × 3', answer: 27, options: [9, 18, 27, 81], mode: 'choice' };
  }`;

addLogic('genCadet', cadetLogic);
addLogic('genExplorer', explorerLogic);
addLogic('genPilot', pilotLogic);
addLogic('genCommander', commanderLogic);

fs.writeFileSync('js/math-galaxy.js', mg);
