const fs = require('fs');
const contentFE = fs.readFileSync('js/fe-explorador.js', 'utf8');

const tStart = contentFE.indexOf('const SAINTS = [');
const lines = contentFE.substring(tStart).split('\n');

let cSaint = '';
let qCount = 0;
for (let i=0; i<lines.length; i++) {
   if (lines[i].includes('const HERITAGE')) break;
   let sm = lines[i].match(/id:\s*'([a-z_]+)'/);
   if (sm) {
       if (cSaint) console.log(`${cSaint}: ${qCount}`);
       cSaint = sm[1];
       qCount = 0;
   }
   if (lines[i].includes('{ q:')) {
       qCount++;
   }
}
if (cSaint) console.log(`${cSaint}: ${qCount}`);
