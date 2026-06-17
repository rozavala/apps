const fs = require('fs');

function extractArray(code, regex) {
  const match = code.match(regex);
  if (match) {
    try {
      const arr = eval(match[0]);
      return arr.length;
    } catch(e) {
      console.log("Error evaluating", regex);
      return null;
    }
  }
  return null;
}

const feCode = fs.readFileSync('js/fe-explorador.js', 'utf8');
const saintsMatch = feCode.match(/const SAINTS=\[([\s\S]*?)\];/);
if (saintsMatch) {
  try {
    const arr = eval('[' + saintsMatch[1] + ']');
    console.log('Fe Explorador SAINTS:', arr.length);
    arr.forEach(s => {
      console.log(`  ${s.id} questions:`, s.questions.length);
    });
  } catch(e) { console.log('error SAINTS'); }
}

const heritageMatch = feCode.match(/const HERITAGE=\[([\s\S]*?)\];/);
if (heritageMatch) {
  try {
    const arr = eval('[' + heritageMatch[1] + ']');
    console.log('Fe Explorador HERITAGE:', arr.length);
  } catch(e) { console.log('error HERITAGE'); }
}

const worldCode = fs.readFileSync('js/world-explorer.js', 'utf8');
const continentsMatch = worldCode.match(/const CONTINENTS=\[([\s\S]*?)\];/);
if (continentsMatch) {
  try {
    const arr = eval('[' + continentsMatch[1] + ']');
    arr.forEach(c => {
      console.log(`World Explorer Continent ${c.id}: ${c.countries.length} countries`);
      c.countries.forEach(country => {
        console.log(`  ${country.id}: ${country.facts.length} facts, ${country.quiz.length} questions`);
      });
    });
  } catch(e) { console.log('error CONTINENTS'); }
}

const guitarCode = fs.readFileSync('js/guitar-jam.js', 'utf8');
const chordsMatch = guitarCode.match(/const CHORDS=\[([\s\S]*?)\];/);
if (chordsMatch) {
  try {
    const arr = eval('[' + chordsMatch[1] + ']');
    console.log('Guitar Jam CHORDS:', arr.length);
  } catch(e) { console.log('error CHORDS'); }
}

const songsMatch = guitarCode.match(/const SONGS=\[([\s\S]*?)\];/);
if (songsMatch) {
  try {
    const arr = eval('[' + songsMatch[1] + ']');
    console.log('Guitar Jam SONGS:', arr.length);
  } catch(e) { console.log('error SONGS'); }
}

const checksCode = fs.readFileSync('js/learning-checks.js', 'utf8');
const banksMatch = checksCode.match(/const BANKS=({[\s\S]*?});/);
if (banksMatch) {
  try {
    let BANKS = {};
    eval('BANKS=' + banksMatch[1]);
    for (const key in BANKS) {
      console.log(`Learning Checks BANKS[${key}]:`, BANKS[key].length);
    }
  } catch(e) { console.log('error BANKS'); }
} else {
  const qMatch = checksCode.match(/var QUESTIONS = ({[\s\S]*?});/);
  if (qMatch) {
      try {
          let QUESTIONS = {};
          eval('QUESTIONS=' + qMatch[1]);
          for (const key in QUESTIONS) {
              console.log(`Learning Checks QUESTIONS[${key}]:`, QUESTIONS[key].length);
          }
      } catch(e) { console.log('error QUESTIONS'); }
  } else {
      console.log('Learning Checks BANKS or QUESTIONS not found');
  }
}

const storyCode = fs.readFileSync('js/story-explorer.js', 'utf8');
const storiesMatch = storyCode.match(/const STORIES=\[([\s\S]*?)\];/);
if (storiesMatch) {
  try {
    const arr = eval('[' + storiesMatch[1] + ']');
    let en = 0, es = 0;
    arr.forEach(s => {
      if (s.lang === 'en') en++;
      if (s.lang === 'es') es++;
      console.log(`Story ${s.id} (${s.lang}): ${s.vocab.length} words`);
    });
    console.log(`Story Explorer: ${en} EN, ${es} ES`);
  } catch(e) { console.log('error STORIES'); }
} else {
    console.log("STORIES not found");
}
