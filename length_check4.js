const fs = require('fs');

const stCode = fs.readFileSync('js/story-explorer.js', 'utf8');
let tMatch = stCode.match(/const STORIES\s*=\s*\[([\s\S]*?)\];/);
if (!tMatch) tMatch = stCode.match(/var STORIES\s*=\s*\[([\s\S]*?)\];/);
if (!tMatch) tMatch = stCode.match(/let STORIES\s*=\s*\[([\s\S]*?)\];/);
if (tMatch) {
    try {
        const arr = eval('[' + tMatch[1] + ']');
        let en=0, es=0;
        arr.forEach(s => {
          if (s.lang === 'en') en++;
          if (s.lang === 'es') es++;
          console.log(`Story ${s.id} (${s.lang}): ${s.vocab ? s.vocab.length : 0} words`);
        });
        console.log(`Story Explorer: ${en} EN, ${es} ES`);
    } catch(e) { console.log('error STORIES', e.message); }
} else {
    console.log("STORIES not found either");
}

let oMatch = stCode.match(/const CATALOG\s*=\s*\[([\s\S]*?)\];/);
if (!oMatch) oMatch = stCode.match(/var CATALOG\s*=\s*\[([\s\S]*?)\];/);
if (!oMatch) oMatch = stCode.match(/let CATALOG\s*=\s*\[([\s\S]*?)\];/);
if (oMatch) {
    try {
        const arr = eval('[' + oMatch[1] + ']');
        let en=0, es=0;
        arr.forEach(s => {
          if (s.lang === 'en') en++;
          if (s.lang === 'es') es++;
          console.log(`Story ${s.id} (${s.lang}): ${s.vocab ? s.vocab.length : 0} words`);
        });
        console.log(`Story Explorer CATALOG: ${en} EN, ${es} ES`);
    } catch(e) { console.log('error CATALOG', e.message); }
} else {
    console.log("CATALOG not found either");
}
