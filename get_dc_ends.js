const fs = require('fs');

let content = fs.readFileSync('js/descubre-chile.js', 'utf8');

const idxA = content.indexOf('animales:');
const endA = content.indexOf('],', idxA);
console.log("ANIMALES:");
console.log(content.substring(endA - 100, endA + 20));

const idxF = content.indexOf('fiestas_patrias:');
const endF = content.indexOf(']', idxF);
console.log("\nFIESTAS:");
console.log(content.substring(endF - 100, endF + 20));
