const fs = require('fs');

let code = fs.readFileSync('js/math-galaxy.js', 'utf8');

['genCadet', 'genExplorer', 'genPilot', 'genCommander'].forEach(fn => {
  let startP = code.indexOf(`function ${fn}()`);
  let endP = code.indexOf("  return {", startP);
  console.log(`\n--- ${fn} ---`);
  console.log(code.substring(endP - 200, endP));
});
