const fs = require('fs');
const content = fs.readFileSync('js/guitar-jam.js', 'utf8');
const chordsMatch = content.match(/const CHORDS = \[([\s\S]*?)\];/);
const songsMatch = content.match(/const SONGS = \[([\s\S]*?)\];/);

console.log("Chords:");
if (chordsMatch) {
  const chords = chordsMatch[1].split('\n').filter(line => line.includes('{ name:'));
  console.log(`Count: ${chords.length}`);
}
console.log("Songs:");
if (songsMatch) {
  const songs = songsMatch[1].split('\n').filter(line => line.includes('{ id:'));
  console.log(`Count: ${songs.length}`);
}
