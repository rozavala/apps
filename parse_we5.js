const fs = require('fs');
const contentWE = fs.readFileSync('js/world-explorer.js', 'utf8');

const tStart = contentWE.indexOf('const CONTINENTS = [');
const lines = contentWE.substring(tStart).split('\n');

let conts = {};
let curC = '';

for(let l of lines) {
    if(l.includes('let currentState')) break;
    let cm = l.match(/id:\s*'([a-z_]+)'/);
    if(cm && l.includes('name:') && l.includes('nameEs:')) {
        if (!l.includes('flag:')) { // avoid country id matching
            curC = cm[1];
            conts[curC] = 0;
        }
    }
    if(l.match(/[ \t]+id:\s*'([a-z]+)'/) && l.includes('nameEs:') && l.includes('flag:')) {
        conts[curC]++;
    }
}
console.log(conts);
