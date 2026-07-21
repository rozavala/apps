const fs = require('fs');

const file = 'js/world-explorer.js';
const code = fs.readFileSync(file, 'utf8');

const sStr = "const CONTINENTS =";
const sIdx = code.indexOf(sStr);
const oceaniaIdx = code.indexOf("id: 'oceania'", sIdx);
const aIdx = code.indexOf("id: 'australia'", oceaniaIdx);
const qIdx = code.indexOf("questions: [", aIdx);
const fIdx = code.indexOf("facts: [", aIdx);

console.log(code.substring(qIdx, qIdx + 100));
