const fs = require('fs');
const content = fs.readFileSync('js/learning-checks.js', 'utf8');

const subjects = ['math', 'music', 'chess', 'history', 'art', 'faith', 'general', 'science', 'geography', 'reading'];

subjects.forEach(subject => {
   const startStr = `    ${subject}: [\n`;
   let startIdx = content.indexOf(startStr);
   if(startIdx === -1) startIdx = content.indexOf(`    ${subject}: [`); // maybe no newline

   if (startIdx > -1) {
       const endIdx = content.indexOf('    ],', startIdx);
       const subBlock = content.substring(startIdx, endIdx);
       const qCount = (subBlock.match(/{ q:/g) || []).length;
       console.log(`${subject}: ${qCount}`);
   } else {
       console.log(`${subject}: Not found`);
   }
});
