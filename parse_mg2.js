const fs = require('fs');
const contentMG = fs.readFileSync('js/math-galaxy.js', 'utf8');

const tStart = contentMG.indexOf('function genCadet()');
const lines = contentMG.substring(tStart).split('\n');
let tTypes = {};
for(let l of lines) {
    if(l.includes('const types = [')) {
       let m = l.match(/\[(.*)\]/);
       if (m) {
          let str = m[1].replace(/'/g, '').replace(/ /g, '');
          let types = str.split(',');
          for (let t of types) tTypes[t] = 1;
       }
    }
}
console.log(Object.keys(tTypes).join(', '));
