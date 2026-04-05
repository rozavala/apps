const fs = require('fs');
const content = fs.readFileSync('js/learning-checks.js', 'utf8');
const match = content.match(/const QUESTIONS = {([\s\S]*?)};\n\n  \/\/ ── Storage/);

if (match) {
  const block = match[1];
  const subjects = ['math', 'music', 'chess', 'history', 'art', 'faith', 'general', 'science', 'geography', 'reading'];

  subjects.forEach(subject => {
     const startIdx = block.indexOf(`${subject}: [`);
     if(startIdx > -1) {
         let endIdx = block.indexOf('],', startIdx);
         if(endIdx === -1) endIdx = block.indexOf(']', startIdx); // last one

         const subBlock = block.substring(startIdx, endIdx);
         const qCount = (subBlock.match(/{ q:/g) || []).length;
         console.log(`Learning check ${subject}: ${qCount}`);
     } else {
         console.log(`Learning check ${subject}: Not found`);
     }
  });
}
