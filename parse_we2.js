const fs = require('fs');
const contentWE = fs.readFileSync('js/world-explorer.js', 'utf8');

const tStart = contentWE.indexOf('const CONTINENTS = [');
const lines = contentWE.substring(tStart).split('\n');
let cCont = '';
let cCount = 0;
for (let i=0; i<lines.length; i++) {
   if (lines[i].includes('let currentState')) break;

   let idMatch = lines[i].match(/id:\s*'([a-z]+)'/);
   if (idMatch && lines[i].includes('name:')) {
       if (cCont) console.log(`${cCont}: ${cCount}`);
       cCont = idMatch[1];
       cCount = 0;
   }

   let cIdMatch = lines[i].match(/[ \t]+id:\s*'([a-z]+)'/);
   if (cIdMatch && lines[i].includes('nameEs:') && lines[i].includes('flag:')) {
       cCount++;
   }
}
if (cCont) console.log(`${cCont}: ${cCount}`);
