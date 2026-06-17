const fs = require('fs');
const gCode = fs.readFileSync('js/guitar-jam.js', 'utf8');

let chMatch = gCode.match(/const CHORDS\s*=\s*\[([\s\S]*?)\];/);
if (!chMatch) chMatch = gCode.match(/var CHORDS\s*=\s*\[([\s\S]*?)\];/);
if (!chMatch) chMatch = gCode.match(/let CHORDS\s*=\s*\[([\s\S]*?)\];/);

if (chMatch) {
    try {
        const arr = eval('[' + chMatch[1] + ']');
        console.log('Guitar Jam CHORDS length:', arr.length);
    } catch(e) { console.log('error CHORDS', e.message); }
} else {
    console.log("CHORDS not found");
}

let sMatch = gCode.match(/const SONGS\s*=\s*\[([\s\S]*?)\];/);
if (!sMatch) sMatch = gCode.match(/var SONGS\s*=\s*\[([\s\S]*?)\];/);
if (!sMatch) sMatch = gCode.match(/let SONGS\s*=\s*\[([\s\S]*?)\];/);
if (sMatch) {
    try {
        const arr = eval('[' + sMatch[1] + ']');
        console.log('Guitar Jam SONGS length:', arr.length);
    } catch(e) { console.log('error SONGS', e.message); }
} else {
    console.log("SONGS not found");
}
