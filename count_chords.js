const fs = require('fs');
const content = fs.readFileSync('js/guitar-jam.js', 'utf8');

const matchChords = content.match(/const CHORDS = \[([\s\S]*?)\];\n\nconst SONGS/);
if (matchChords) {
  const chords = (matchChords[1].match(/{ name:/g) || []).length;
  console.log(`Chords: ${chords}`);
}

const matchSongs = content.match(/const SONGS = \[([\s\S]*?)\];\n\nconst GuitarJam/);
if (matchSongs) {
  const songs = (matchSongs[1].match(/{ id:/g) || []).length;
  console.log(`Songs: ${songs}`);
}
