const fs = require('fs');
const content = fs.readFileSync('js/fe-explorador.js', 'utf8');

const match = content.match(/const HERITAGE = \[([\s\S]*?)\];\n\n  function _key\(\)/);
if (match) {
  const heritageBlock = match[1];
  const items = (heritageBlock.match(/id:\s*'/g) || []).length;
  console.log(`Heritage items: ${items}`);
} else {
  console.log('Heritage not found');
}
