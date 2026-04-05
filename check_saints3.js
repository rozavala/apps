const fs = require('fs');
const content = fs.readFileSync('js/fe-explorador.js', 'utf8');
const lines = content.split('\n');

let currentSaint = '';
let inQuestions = false;
let qCount = 0;
let saintCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('const MYSTERIES = [')) break;

  const nameMatch = line.match(/name:\s*'([^']+)'/);
  if (nameMatch) {
    if (currentSaint !== '') {
      console.log(`Saint: ${currentSaint}, Questions: ${qCount}`);
    }
    currentSaint = nameMatch[1];
    saintCount++;
    qCount = 0;
  }

  if (line.includes('{ q:')) {
    qCount += (line.match(/{ q:/g) || []).length;
  }
}
if (currentSaint !== '') {
  console.log(`Saint: ${currentSaint}, Questions: ${qCount}`);
}
console.log(`Total Saints: ${saintCount}`);
