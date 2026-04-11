const fs = require('fs');
const contentGJ = fs.readFileSync('js/guitar-jam.js', 'utf8');

const m = contentGJ.match(/const CHORDS = \[([\s\S]*?)\];/);
if (m) {
    let str = m[1];
    let chords = str.match(/name:/g);
    console.log("Chords:", chords ? chords.length : 0);
}

const sm = contentGJ.match(/const SONGS = \[([\s\S]*?)\];/);
if (sm) {
    let str = sm[1];
    let songs = str.match(/id:/g);
    console.log("Songs:", songs ? songs.length : 0);
}
