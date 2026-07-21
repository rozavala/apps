const fs = require('fs');

let code = fs.readFileSync('js/math-galaxy.js', 'utf8');

let startP = code.indexOf("function genPilot()");
let endP = code.indexOf("  return {", startP);

console.log(code.substring(endP - 100, endP));
