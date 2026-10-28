const fs = require('fs');

const fe = fs.readFileSync('js/fe-explorador.js', 'utf8');
const saints = eval(fe.match(/const SAINTS = (\[[\s\S]*?\]);\n/)[1]);
console.log("Last 6 saints ids:", saints.slice(-6).map(s => s.id));
const heritage = eval(fe.match(/const HERITAGE = (\[[\s\S]*?\]);\n/)[1]);
console.log("Last 4 heritage ids:", heritage.slice(-4).map(h => h.id));

const gj = fs.readFileSync('js/guitar-jam.js', 'utf8');
const chordsMatch = gj.match(/const CHORDS = (\[[\s\S]*?\]);\n/);
if (chordsMatch) {
    const chords = eval(chordsMatch[1]);
    console.log("Last 9 chords names:", chords.slice(-9).map(c => c.name));
}
const songsMatch = gj.match(/const SONGS = (\[[\s\S]*?\]);\n/);
if (songsMatch) {
    const songs = eval(songsMatch[1]);
    console.log("Last 7 songs titles:", songs.slice(-7).map(s => s.title));
}

const se = fs.readFileSync('js/story-explorer.js', 'utf8');
const storiesMatch = se.match(/const STORIES = (\[[\s\S]*?\]);\n/);
if (storiesMatch) {
    const stories = eval(storiesMatch[1]);
    console.log("Last 5 stories ids:", stories.slice(-5).map(s => s.id));
}
