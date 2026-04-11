const fs = require('fs');

const contentDC = fs.readFileSync('js/descubre-chile.js', 'utf8');
let topicsCount = 0;
let matchDC = contentDC.match(/const TOPICS = \[([\s\S]*?)\];/);
if (matchDC) {
    topicsCount = (matchDC[1].match(/id:/g) || []).length;
    console.log("DC Topics Count:", topicsCount);
}

let qbMatch = contentDC.match(/const QB = {([\s\S]*?)};/);
if (qbMatch) {
    let qbText = qbMatch[1];
    let topics = qbText.match(/[a-zA-Z0-9_]+:\s*\[/g);
    console.log("QB keys:", topics ? topics.length : 0);
    if(topics) {
        topics.forEach(t => {
            let key = t.replace(':[', '').replace(':', '').trim();
            let regex = new RegExp(key + ":\\s*\\[([\\s\\S]*?)\\](?=,|\\})", "g");
            // simplified count
        });
    }
}

const contentWE = fs.readFileSync('js/world-explorer.js', 'utf8');
let weMatch = contentWE.match(/const CONTINENTS = \[([\s\S]*?)\];/);
if (weMatch) {
    let continentsStr = weMatch[1];
    console.log("WE Continents found.");
}

const contentLC = fs.readFileSync('js/learning-checks.js', 'utf8');
let lcMatch = contentLC.match(/const BANKS = {([\s\S]*?)};/);
if (lcMatch) {
    console.log("LC Banks found.");
}
