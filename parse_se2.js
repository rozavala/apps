const fs = require('fs');
const contentSE = fs.readFileSync('js/story-explorer.js', 'utf8');
const tStart = contentSE.indexOf('const STORIES = [');
const lines = contentSE.substring(tStart).split('\n');
let cStory = '';
let wCount = 0;
let inVocab = false;
for (let i=0; i<lines.length; i++) {
   if (lines[i].includes('let currentState')) break;
   if (lines[i].includes('id:')) {
       if (cStory) console.log(`${cStory} - words: ${wCount}`);
       cStory = lines[i].match(/id:\s*'([a-z_]+)'/)[1];
       wCount = 0;
   }
   if (lines[i].includes('vocab:')) {
       inVocab = true;
   }
   if (inVocab && lines[i].includes('{ word:')) {
       wCount++;
   }
   if (inVocab && lines[i].includes(']')) {
       inVocab = false;
   }
}
if (cStory) console.log(`${cStory} - words: ${wCount}`);
