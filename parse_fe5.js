const fs = require('fs');
const contentFE = fs.readFileSync('js/fe-explorador.js', 'utf8');

const tStart = contentFE.indexOf('const HERITAGE = [');
const lines = contentFE.substring(tStart).split('\n');

let cHer = '';
for (let i=0; i<lines.length; i++) {
   if (lines[i].includes('let currentState')) break;
   let sm = lines[i].match(/id:\s*'([a-z_]+)'/);
   if (sm) {
       console.log(sm[1]);
   }
}
