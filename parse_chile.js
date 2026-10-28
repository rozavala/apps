const fs = require('fs');

const contentChile = fs.readFileSync('js/descubre-chile.js', 'utf8');

const startIndex = contentChile.indexOf('const TOPICS = [');
if (startIndex !== -1) {
    let bracketCount = 0;
    let inString = false;
    let stringChar = '';
    let endIndex = -1;

    for (let i = startIndex + 15; i < contentChile.length; i++) {
        const char = contentChile[i];
        if (!inString) {
            if (char === '[' || char === '{') bracketCount++;
            else if (char === ']' || char === '}') {
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
            if (char === stringChar && contentChile[i-1] !== '\\') inString = false;
        }
    }

    if (endIndex !== -1) {
        const topicsStr = contentChile.substring(startIndex + 15, endIndex);
        const topics = eval('(' + topicsStr + ')');
        console.log(`Descubre Chile topics: ${topics.length}`);
    }
}

const qbStartIndex = contentChile.indexOf('const QB = {');
if (qbStartIndex !== -1) {
    let bracketCount = 0;
    let inString = false;
    let stringChar = '';
    let endIndex = -1;

    for (let i = qbStartIndex + 11; i < contentChile.length; i++) {
        const char = contentChile[i];
        if (!inString) {
            if (char === '{' || char === '[') bracketCount++;
            else if (char === '}' || char === ']') {
                bracketCount--;
                if (bracketCount === 0 && char === '}') {
                    endIndex = i + 1;
                    break;
                }
            } else if (char === "'" || char === '"' || char === '`') {
                inString = true;
                stringChar = char;
            }
        } else {
            if (char === stringChar && contentChile[i-1] !== '\\') inString = false;
        }
    }

    if (endIndex !== -1) {
        const qbStr = contentChile.substring(qbStartIndex + 11, endIndex);
        const qb = eval('(' + qbStr + ')');
        for (const key in qb) {
            console.log(`Descubre Chile QB ${key}: ${qb[key].length} questions`);
        }
    }
}
