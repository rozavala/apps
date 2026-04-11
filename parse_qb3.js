const fs = require('fs');
const contentDC = fs.readFileSync('js/descubre-chile.js', 'utf8');

const qbStart = contentDC.indexOf('const QB={');
let currentTopic = '';
let qCount = 0;
const lines = contentDC.substring(qbStart).split('\n');
for (let i = 0; i < lines.length; i++) {
   if (lines[i].trim() === '};') {
       if (currentTopic) console.log(`${currentTopic}: ${qCount}`);
       break;
   }
   const topicMatch = lines[i].match(/^[ \t]*([a-zA-Z0-9_]+):\[/);
   if (topicMatch) {
       if (currentTopic) console.log(`${currentTopic}: ${qCount}`);
       currentTopic = topicMatch[1];
       qCount = 0;
   }
   if (lines[i].includes('{q:')) {
       qCount++;
   }
}
