const fs = require('fs');
const content = fs.readFileSync('js/descubre-chile.js', 'utf8');

const match = content.match(/const TOPICS=\[([\s\S]*?)\];\nlet curTopic=null;/);
if (match) {
  const topicsBlock = match[1];
  const items = topicsBlock.split(/\s*{id:/).slice(1);
  console.log(`Topics items: ${items.length}`);

  items.forEach(item => {
    const idMatch = item.match(/^'([^']+)'/);
    if (idMatch) {
       console.log(`- ${idMatch[1]}`);
    }
  });
} else {
  console.log('Topics not found');
}

const matchQB = content.match(/const QB={([\s\S]*?)};\n\nfunction renderQuizMenu/);
if (matchQB) {
  const qbBlock = matchQB[1];
  const subjects = ['geography', 'antartica', 'indigenous', 'history', 'culture', 'nature', 'famous', 'inventors', 'volcanes', 'animales', 'volcanes_chile', 'fiestas_patrias'];
  subjects.forEach(subject => {
     const subMatch = qbBlock.match(new RegExp(`${subject}:\\[([\\s\\S]*?)\\](?:,|$)\\n\\s*(?:[a-z_]+:|$)`));
     if (subMatch) {
        const questions = (subMatch[1].match(/{q:/g) || []).length;
        console.log(`Quiz questions for ${subject}: ${questions}`);
     } else {
        console.log(`Quiz questions for ${subject}: Not found`);
     }
  });
}
