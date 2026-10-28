const fs = require('fs');

const contentWorld = fs.readFileSync('js/world-explorer.js', 'utf8');

// Find the start of the continents array
const startIndex = contentWorld.indexOf('const CONTINENTS = [');
if (startIndex !== -1) {
    let bracketCount = 0;
    let inString = false;
    let stringChar = '';
    let endIndex = -1;

    for (let i = startIndex + 19; i < contentWorld.length; i++) {
        const char = contentWorld[i];

        if (!inString) {
            if (char === '[' || char === '{') {
                bracketCount++;
            } else if (char === ']' || char === '}') {
                bracketCount--;
                if (bracketCount === 0 && char === ']') {
                    endIndex = i + 1;
                    break;
                }
            } else if (char === "'" || char === '"' || char === '`') {
                inString = true;
                stringChar = char;
            }
        } else {
            if (char === stringChar && contentWorld[i-1] !== '\\') {
                inString = false;
            }
        }
    }

    if (endIndex !== -1) {
        const continentsStr = contentWorld.substring(startIndex + 19, endIndex);
        const continents = eval('(' + continentsStr + ')');
        continents.forEach(c => {
            console.log(`World Explorer ${c.id}: ${c.countries.length} countries`);
            c.countries.forEach(country => {
                console.log(`  ${country.id}: ${country.facts.length} facts, ${country.quiz.length} questions`);
            });
        });
    }
}
