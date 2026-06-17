const fs = require('fs');

const feCode = fs.readFileSync('js/fe-explorador.js', 'utf8');

let hMatch = feCode.match(/const HERITAGE\s*=\s*\[([\s\S]*?)\];/);
if (!hMatch) hMatch = feCode.match(/var HERITAGE\s*=\s*\[([\s\S]*?)\];/);
if (!hMatch) hMatch = feCode.match(/let HERITAGE\s*=\s*\[([\s\S]*?)\];/);

if (hMatch) {
    try {
        const arr = eval('[' + hMatch[1] + ']');
        console.log('Fe Explorador HERITAGE IDs:');
        arr.forEach(h => console.log('  ' + h.id));
    } catch(e) { console.log('error HERITAGE', e.message); }
}

const wCode = fs.readFileSync('js/world-explorer.js', 'utf8');
let cMatch = wCode.match(/const CONTINENTS\s*=\s*\[([\s\S]*?)\];/);

if (cMatch) {
    try {
        const arr = eval('[' + cMatch[1] + ']');
        let smallest = arr[0];
        arr.forEach(c => {
          if (c.countries.length < smallest.countries.length) smallest = c;
        });
        console.log(`Smallest continent is ${smallest.id} with ${smallest.countries.length} countries`);
        smallest.countries.forEach(country => {
          console.log(`  ${country.id}`);
        });
    } catch(e) { console.log('error CONTINENTS', e.message); }
}
