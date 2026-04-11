const fs = require('fs');
const contentSE = fs.readFileSync('js/story-explorer.js', 'utf8');
const tStart = contentSE.indexOf('const STORIES = [');
const lines = contentSE.substring(tStart).split('\n');
let cLang = '';
let cCount = 0;
for (let i=0; i<lines.length; i++) {
   if (lines[i].includes('let currentState')) break;
   if (lines[i].includes('lang:')) {
       cLang = lines[i].match(/lang:\s*'([a-z]+)'/)[1];
   }
   if (lines[i].includes('id:')) {
       console.log(`Story: ${cLang} - words: ${(lines[i].match(/vocab:\s*\[([^\]]+)\]/)[1].match(/'[^']+'/g) || []).length}`);
   }
}
