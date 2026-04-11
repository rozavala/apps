const fs = require('fs');
const contentDC = fs.readFileSync('js/descubre-chile.js', 'utf8');

const match = contentDC.match(/const QB=([\s\S]*?^};\n)/m);
if (match) {
    const qbStr = match[1];
    const topics = ['geography', 'antartica', 'indigenous', 'history', 'culture'];
    for (const t of topics) {
       const reg = new RegExp(`${t}:\\[([\\s\\S]*?)\\]`, 'g');
       const m = reg.exec(qbStr);
       if (m) {
           console.log(`${t}: ${(m[1].match(/\{q/g) || []).length}`);
       }
    }
} else {
    console.log("QB pattern not matched.");
}
