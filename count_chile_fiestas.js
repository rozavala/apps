const fs = require('fs');
const content = fs.readFileSync('js/descubre-chile.js', 'utf8');

const matchQB = content.match(/const QB={([\s\S]*?)};\n\nfunction renderQuizMenu/);
if (matchQB) {
  const qbBlock = matchQB[1];
  const subMatch = qbBlock.match(/fiestas_patrias:\[([\s\S]*?)\]\n/);
  if (subMatch) {
    const questions = (subMatch[1].match(/{q:/g) || []).length;
    console.log(`Quiz questions for fiestas_patrias: ${questions}`);
  } else {
    console.log(`Quiz questions for fiestas_patrias: Not found. Let me look closer...`);
    const search = qbBlock.indexOf('fiestas_patrias');
    console.log("Index of fiestas_patrias: " + search);
    if(search > -1) {
      console.log(qbBlock.substring(search, search + 500));
    }
  }
}
