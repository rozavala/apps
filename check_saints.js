const fs = require('fs');

function checkSaints() {
  const content = fs.readFileSync('js/fe-explorador.js', 'utf8');
  const saintsBlockMatch = content.match(/const SAINTS = \[([\s\S]*?)\];\n\n  const MYSTERIES/);

  if (saintsBlockMatch) {
    const saintsBlock = saintsBlockMatch[1];
    const saints = saintsBlock.split('    {').slice(1);

    let count = 0;
    saints.forEach(saintStr => {
      count++;
      const idMatch = saintStr.match(/id: '([^']+)'/);
      if (idMatch) {
          const id = idMatch[1];
          const qCount = (saintStr.match(/{ q:/g) || []).length;
          console.log(`Saint: ${id}, Questions: ${qCount}`);
      }
    });
    console.log(`Total Saints: ${count}`);
  }
}

checkSaints();
