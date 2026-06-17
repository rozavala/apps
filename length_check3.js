const fs = require('fs');
const feCode = fs.readFileSync('js/fe-explorador.js', 'utf8');

let saintMatch = feCode.match(/const SAINTS\s*=\s*\[([\s\S]*?)\];/);
if (!saintMatch) {
    saintMatch = feCode.match(/var SAINTS\s*=\s*\[([\s\S]*?)\];/);
}
if (!saintMatch) {
    saintMatch = feCode.match(/let SAINTS\s*=\s*\[([\s\S]*?)\];/);
}

if (saintMatch) {
    console.log("SAINTS MATCHED");
    try {
        const str = saintMatch[1];
        const arr = eval('[' + str + ']');
        console.log('Fe Explorador SAINTS:', arr.length);
        arr.forEach(s => {
            console.log(`  ${s.id} questions:`, s.questions ? s.questions.length : 0);
        });
    } catch(e) { console.log('error SAINTS', e.message); }
} else {
    console.log("SAINTS not found");
}

let hMatch = feCode.match(/const HERITAGE\s*=\s*\[([\s\S]*?)\];/);
if (!hMatch) hMatch = feCode.match(/var HERITAGE\s*=\s*\[([\s\S]*?)\];/);
if (!hMatch) hMatch = feCode.match(/let HERITAGE\s*=\s*\[([\s\S]*?)\];/);

if (hMatch) {
    try {
        const arr = eval('[' + hMatch[1] + ']');
        console.log('Fe Explorador HERITAGE:', arr.length);
    } catch(e) { console.log('error HERITAGE', e.message); }
} else {
    console.log("HERITAGE not found");
}


const wCode = fs.readFileSync('js/world-explorer.js', 'utf8');
let cMatch = wCode.match(/const CONTINENTS\s*=\s*\[([\s\S]*?)\];/);
if (!cMatch) cMatch = wCode.match(/var CONTINENTS\s*=\s*\[([\s\S]*?)\];/);
if (!cMatch) cMatch = wCode.match(/let CONTINENTS\s*=\s*\[([\s\S]*?)\];/);

if (cMatch) {
    try {
        const arr = eval('[' + cMatch[1] + ']');
        arr.forEach(c => {
          console.log(`World Explorer Continent ${c.id}: ${c.countries.length} countries`);
          c.countries.forEach(country => {
            console.log(`  ${country.id}: ${country.facts.length} facts, ${country.quiz.length} questions`);
          });
        });
    } catch(e) { console.log('error CONTINENTS', e.message); }
} else {
    console.log("CONTINENTS not found");
}

const gCode = fs.readFileSync('js/guitar-jam.js', 'utf8');
let chMatch = gCode.match(/const CHORDS\s*=\s*\[([\s\S]*?)\];/);
if (!chMatch) chMatch = gCode.match(/var CHORDS\s*=\s*\[([\s\S]*?)\];/);
if (!chMatch) chMatch = gCode.match(/let CHORDS\s*=\s*\[([\s\S]*?)\];/);

if (chMatch) {
    try {
        const arr = eval('[' + chMatch[1] + ']');
        console.log('Guitar Jam CHORDS:', arr.length);
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
        console.log('Guitar Jam SONGS:', arr.length);
    } catch(e) { console.log('error SONGS', e.message); }
} else {
    console.log("SONGS not found");
}

const stCode = fs.readFileSync('js/story-explorer.js', 'utf8');
let stMatch = stCode.match(/const LIBRARY\s*=\s*\[([\s\S]*?)\];/);
if (!stMatch) stMatch = stCode.match(/var LIBRARY\s*=\s*\[([\s\S]*?)\];/);
if (!stMatch) stMatch = stCode.match(/let LIBRARY\s*=\s*\[([\s\S]*?)\];/);
if (stMatch) {
    try {
        const arr = eval('[' + stMatch[1] + ']');
        let en=0, es=0;
        arr.forEach(s => {
          if (s.lang === 'en') en++;
          if (s.lang === 'es') es++;
          console.log(`Story ${s.id} (${s.lang}): ${s.vocab.length} words`);
        });
        console.log(`Story Explorer: ${en} EN, ${es} ES`);
    } catch(e) { console.log('error LIBRARY', e.message); }
} else {
    console.log("LIBRARY not found");
}
