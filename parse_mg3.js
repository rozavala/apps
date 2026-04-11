const fs = require('fs');
const contentMG = fs.readFileSync('js/math-galaxy.js', 'utf8');
const lines = contentMG.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const types = [')) {
    console.log(lines[i].trim());
  }
}
