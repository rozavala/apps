const fs = require('fs');
const content = fs.readFileSync('js/math-galaxy.js', 'utf8');
['genCadet', 'genExplorer', 'genPilot', 'genCommander'].forEach(level => {
    const regex = new RegExp(`function ${level}\\(\\) {[\\s\\S]*?const types = \\[(.*?)\\];`);
    const match = content.match(regex);
    if (match) {
        console.log(`-- ${level} --`);
        console.log(match[1]);
    }
});
