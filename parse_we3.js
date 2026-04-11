const fs = require('fs');
const contentWE = fs.readFileSync('js/world-explorer.js', 'utf8');

const tStart = contentWE.indexOf('const CONTINENTS = [');
const lines = contentWE.substring(tStart).split('\n');

let cCont = '';
let inCountry = false;
let qCount = 0;
let fCount = 0;
for (let i=0; i<lines.length; i++) {
   if (lines[i].includes('let currentState')) break;
   let cMatch = lines[i].match(/id:\s*'([a-z]+)'/);
   if (cMatch && lines[i].includes('name:') && lines[i].includes('countries:')) {
       cCont = cMatch[1];
   }

   let idMatch = lines[i].match(/[ \t]+id:\s*'([a-z]+)'/);
   if (idMatch && lines[i].includes('nameEs:') && lines[i].includes('flag:')) {
       if (inCountry) console.log(`  facts: ${fCount}, questions: ${qCount}`);
       console.log(`Country: ${idMatch[1]} (${cCont})`);
       inCountry = true;
       qCount = 0;
       fCount = 0;
   }

   if (inCountry && lines[i].includes('{ en:')) {
       fCount++;
   }
   if (inCountry && lines[i].includes('{ q:')) {
       qCount++;
   }
}
if (inCountry) console.log(`  facts: ${fCount}, questions: ${qCount}`);
