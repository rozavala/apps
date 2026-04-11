const fs = require('fs');
const contentDC = fs.readFileSync('js/descubre-chile.js', 'utf8');

const tStart = contentDC.indexOf('const TOPICS=[');
const tLines = contentDC.substring(tStart, contentDC.indexOf('// ── QUIZ ──')).split('\n');
tLines.forEach(l => {
    let m = l.match(/id:'([^']+)'/);
    if(m) console.log(m[1]);
});
