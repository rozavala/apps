const fs = require('fs');
const contentLC = fs.readFileSync('js/learning-checks.js', 'utf8');
const match = contentLC.match(/var QUESTIONS = \{([\s\S]*?)\};\n\n  \/\/ Interrupts/);
if (match) {
    let str = match[1];
    let subjects = ['math', 'music', 'chess', 'history', 'art', 'faith', 'general', 'science'];
    subjects.forEach(s => {
       let m = str.match(new RegExp(`${s}:\\s*\\[([\\s\\S]*?)\\](?=,|\\s*\\n\\s*\\})`, 'm'));
       if (m) {
           console.log(`${s}: ${(m[1].match(/\{ q:/g) || []).length}`);
       } else {
           console.log(`${s} not found`);
       }
    });
}
