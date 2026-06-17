const fs = require('fs');
const wCode = fs.readFileSync('js/world-explorer.js', 'utf8');
let cMatch = wCode.match(/const CONTINENTS\s*=\s*\[([\s\S]*?)\];/);

if (cMatch) {
    try {
        const arr = eval('[' + cMatch[1] + ']');
        arr.forEach(c => {
          c.countries.forEach(country => {
            if (country.facts.length < 3) console.log(`${country.id} has ${country.facts.length} facts`);
            if (country.quiz.length < 3) console.log(`${country.id} has ${country.quiz.length} questions`);
          });
        });
        console.log('Checked all countries for < 3 facts or < 3 questions.');
    } catch(e) { console.log('error CONTINENTS', e.message); }
}
