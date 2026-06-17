const fs = require('fs');
const stCode = fs.readFileSync('js/story-explorer.js', 'utf8');
let tMatch = stCode.match(/const STORIES\s*=\s*\[([\s\S]*?)\];/);
if (tMatch) {
    try {
        const arr = eval('[' + tMatch[1] + ']');
        console.log(`Story Explorer STORIES: ${arr.length}`);
        arr.forEach(s => {
          let vocabCount = 0;
          if (s.pages) {
            s.pages.forEach(p => {
              if (p.vocab) vocabCount += p.vocab.length;
            });
          }
          console.log(`Story ${s.id}: ${vocabCount} words total`);
        });
    } catch(e) { console.log('error STORIES', e.message); }
}
