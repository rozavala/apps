const fs = require('fs');
const content = fs.readFileSync('js/learning-checks.js', 'utf8');
const banksMatch = content.match(/var QUESTIONS = (\{[\s\S]*?\n\});/);
if (banksMatch) {
    const keys = ['math', 'music', 'chess', 'history', 'art', 'faith', 'general', 'science'];
    keys.forEach(k => {
       const kMatch = banksMatch[1].match(new RegExp(`${k}: \\[(.*?)\\](,|\\s*})`, 's'));
       if(kMatch) {
          const qCount = (kMatch[1].match(/{ q:/g) || []).length;
          console.log(`Learning Checks ${k}: ${qCount}`);
       }
    });
}
