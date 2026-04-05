const fs = require('fs');

function checkSaints() {
  const content = fs.readFileSync('js/fe-explorador.js', 'utf8');

  const ids = [...content.matchAll(/id: '([^']*)',\s*name: '([^']*)'/g)];
  ids.forEach(match => {
      const startIndex = match.index;
      const id = match[1];
      const name = match[2];

      const endIndex = content.indexOf('},', startIndex);
      const saintBlock = content.substring(startIndex, endIndex);

      const questionsMatch = saintBlock.match(/questions:\s*\[([\s\S]*?)\]/);
      if (questionsMatch) {
          const qCount = (questionsMatch[1].match(/{ q:/g) || []).length;
          console.log(`Saint: ${name} (${id}), Questions: ${qCount}`);
      }
  });

  console.log(`Total IDs found (might include non-saints): ${ids.length}`);
}

checkSaints();
