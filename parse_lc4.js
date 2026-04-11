const fs = require('fs');
const contentLC = fs.readFileSync('js/learning-checks.js', 'utf8');
const tStart = contentLC.indexOf('var QUESTIONS = {');
const tEnd = contentLC.indexOf('  function maybePrompt', tStart);
const qStr = contentLC.substring(tStart, tEnd);
let cCont = '';
let cCount = 0;
const lines = qStr.split('\n');
for (let i=0; i<lines.length; i++) {
   let m = lines[i].match(/^\s*([a-z]+):\s*\[/);
   if (m) {
       if (cCont) console.log(`${cCont}: ${cCount}`);
       cCont = m[1];
       cCount = 0;
   }
   if (lines[i].includes('{ q:')) {
       cCount++;
   }
}
if (cCont) console.log(`${cCont}: ${cCount}`);
