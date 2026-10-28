const fs = require('fs');
const content = fs.readFileSync('js/learning-checks.js', 'utf8');
const banks = content.match(/var QUESTIONS = (\{[\s\S]*?\n\});/);
if (banks) {
    const qb = eval(`(${banks[1]})`);
    for (const k in qb) {
        if (qb[k].length < 6) console.log(`Learning Checks - ${k}: ${qb[k].length}`);
    }
}
