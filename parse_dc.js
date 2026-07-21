const fs = require('fs');

let content = fs.readFileSync('js/descubre-chile.js', 'utf8');
const searchAnimales = "animales:";
const idxA = content.indexOf(searchAnimales);
const endA = content.indexOf('],', idxA);

console.log(content.substring(endA - 50, endA + 20));

const searchFiestas = "fiestas_patrias:";
const idxF = content.indexOf(searchFiestas);
const endF = content.indexOf(']', idxF);

console.log(content.substring(endF - 50, endF + 20));
