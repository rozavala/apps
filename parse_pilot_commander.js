const fs = require('fs');
const contentMG = fs.readFileSync('js/math-galaxy.js', 'utf8');

console.log(contentMG.match(/const type = types\[rand\(0, types.length - 1\)\];\n.*\n.*\n.*\n.*\n/g)[2]);
console.log(contentMG.match(/const type = types\[rand\(0, types.length - 1\)\];\n.*\n.*\n.*\n.*\n/g)[3]);
