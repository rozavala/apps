const fs = require('fs');
const content = fs.readFileSync('js/descubre-chile.js', 'utf8');

const qbMatch = content.match(/const QB=\{([\s\S]*?\n\});\n/);
if (qbMatch) {
    const qb = eval(`({${qbMatch[1]})`);
    for (const k in qb) {
        if (qb[k].length < 15) console.log(`${k}: ${qb[k].length}`);
    }
}
