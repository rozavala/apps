const fs = require('fs');
const content = fs.readFileSync('js/world-explorer.js', 'utf8');

const match = content.match(/const CONTINENTS = \[([\s\S]*?)\];\n\n  \/\/ ── State ──/);
if (match) {
  const continentsBlock = match[1];

  const conts = ['south_america', 'north_america', 'europe', 'africa', 'asia', 'oceania'];

  conts.forEach(cont => {
    // try to find the continent
    const search = continentsBlock.indexOf(`id: '${cont}'`);
    if(search > -1) {
       const block = continentsBlock.substring(search, continentsBlock.indexOf(`id: '${conts[conts.indexOf(cont)+1] || 'XXX'}'`, search));
       const countriesCount = (block.match(/id:\s*'[^']+', name:/g) || []).length;
       console.log(`Continent ${cont}: ${countriesCount} countries`);

       if (countriesCount > 0) {
          const ids = [...block.matchAll(/id:\s*'([^']+)', name:/g)];
          ids.forEach(idMatch => {
             const countryId = idMatch[1];
             const cSearch = block.indexOf(`id: '${countryId}'`);
             const cEnd = block.indexOf(`id: '`, cSearch + 20);
             const countryBlock = block.substring(cSearch, cEnd > -1 ? cEnd : block.length);

             const facts = (countryBlock.match(/{ en: /g) || []).length;
             const quizzes = (countryBlock.match(/{ q: /g) || []).length;

             console.log(`  Country: ${countryId}, Facts: ${facts}, Quizzes: ${quizzes}`);
          });
       }
    }
  });
}
