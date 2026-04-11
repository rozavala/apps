const fs = require('fs');
const contentMG = fs.readFileSync('js/math-galaxy.js', 'utf8');
const contentDC = fs.readFileSync('js/descubre-chile.js', 'utf8');
const contentFE = fs.readFileSync('js/fe-explorador.js', 'utf8');
const contentWE = fs.readFileSync('js/world-explorer.js', 'utf8');
const contentGJ = fs.readFileSync('js/guitar-jam.js', 'utf8');
const contentLC = fs.readFileSync('js/learning-checks.js', 'utf8');
const contentSE = fs.readFileSync('js/story-explorer.js', 'utf8');

console.log("math-galaxy arrays are 25 lengths (from grep)");
console.log("----");
let dcTopicsMatch = contentDC.match(/const TOPICS = \[([\s\S]*?)\];/);
if (dcTopicsMatch) {
    let topicsStr = dcTopicsMatch[1];
    let topicCount = (topicsStr.match(/\{/g) || []).length;
    console.log("DC TOPICS count:", topicCount);
} else {
    console.log("DC TOPICS not found");
}

let feSaintsMatch = contentFE.match(/const SAINTS = \[([\s\S]*?)\];/);
if (feSaintsMatch) {
    console.log("FE SAINTS count:", (feSaintsMatch[1].match(/id:/g) || []).length);
}

let feHeritageMatch = contentFE.match(/const HERITAGE = \[([\s\S]*?)\];/);
if (feHeritageMatch) {
    console.log("FE HERITAGE count:", (feHeritageMatch[1].match(/id:/g) || []).length);
}

let gjChordsMatch = contentGJ.match(/const CHORDS = \[([\s\S]*?)\];/);
if (gjChordsMatch) {
    console.log("GJ CHORDS count:", (gjChordsMatch[1].match(/name:/g) || []).length);
}

let gjSongsMatch = contentGJ.match(/const SONGS = \[([\s\S]*?)\];/);
if (gjSongsMatch) {
    console.log("GJ SONGS count:", (gjSongsMatch[1].match(/title:/g) || []).length);
}

let seStoriesMatch = contentSE.match(/const STORIES = \[([\s\S]*?)\];/);
if (seStoriesMatch) {
    console.log("SE STORIES count:", (seStoriesMatch[1].match(/id:/g) || []).length);
}
