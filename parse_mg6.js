const fs = require('fs');

let code = fs.readFileSync('js/math-galaxy.js', 'utf8');

let startP = code.indexOf("function genPilot()");
let endP = code.indexOf("return { label: 'Fallback'", startP);

console.log(code.substring(endP - 500, endP));
