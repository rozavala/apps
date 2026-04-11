const fs = require('fs');
const contentLC = fs.readFileSync('js/learning-checks.js', 'utf8');
const match = contentLC.match(/const BANKS = \{([\s\S]*?)\};\n\nlet /);
if (match) {
    let str = match[1];
    let subjects = ['math', 'chess', 'history', 'art', 'faith', 'general', 'science'];
    subjects.forEach(s => {
       let m = str.match(new RegExp(`${s}:\\s*\\[([\\s\\S]*?)\\](?=,|$)`, 'm'));
       if (m) {
           console.log(`${s}: ${(m[1].match(/\{q/g) || []).length}`);
       } else {
           console.log(`${s} not found`);
       }
    });
}
