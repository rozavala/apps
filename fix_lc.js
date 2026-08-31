const fs = require('fs');

let lc = fs.readFileSync('js/learning-checks.js', 'utf8');

// The naive split '},' missed because it's a bit more complex, let's just do a manual check of the file
const historyIdx = lc.indexOf('history: [');
// find the first ] after history: [
let open = 0;
let end = -1;
for(let i=historyIdx; i<lc.length; i++) {
  if (lc[i] === '[') open++;
  if (lc[i] === ']') {
    open--;
    if(open === 0) {
      end = i;
      break;
    }
  }
}
const historyStr = lc.substring(historyIdx, end + 1);

// manually count '{'
const count = historyStr.match(/\{/g).length;
console.log("Learning Checks History Real Count:", count);
