const fs = require('fs');
const contentDC = fs.readFileSync('js/descubre-chile.js', 'utf8');

const match = contentDC.match(/const QB=\{([\s\S]*?)};\n\nlet/);
if (match) {
    const qbStr = match[1];
    const topics = ['geography', 'antartica', 'indigenous', 'history', 'culture'];
    topics.forEach((t, i) => {
        let regex = new RegExp(`${t}:\\[([\\s\\S]*?)\\](?=,\\s*[a-z]+:\\[|$)`);
        let m = qbStr.match(regex);
        if (m) {
            console.log(`${t} questions: ${(m[1].match(/\{q/g) || []).length}`);
        } else {
            console.log(`${t} not found`);
        }
    });
}
