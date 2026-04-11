const fs = require('fs');
const contentWE = fs.readFileSync('js/world-explorer.js', 'utf8');

const weMatch = contentWE.match(/const CONTINENTS = \[([\s\S]*?)\];/);
if (weMatch) {
    let weStr = weMatch[1];
    let continents = weStr.split('{id:').slice(1);
    continents.forEach(c => {
       let id = c.match(/'([^']+)'/)[1];
       let countries = (c.match(/id:'[^']+'/g) || []).length - 1; // minus continent id if there is one? actually countries have id
       let realCountriesMatch = c.match(/countries:\[([\s\S]*?)\}\s*\]/);
       if (realCountriesMatch) {
           let cCount = (realCountriesMatch[1].match(/id:'/g) || []).length;
           console.log(`Continent ${id}: ${cCount} countries`);
       }
    });
}
