const fs = require('fs');
const contentMG = fs.readFileSync('js/math-galaxy.js', 'utf8');
const cadetM = contentMG.match(/function genCadet[\s\S]*?const types = \[(.*?)\];/);
const explorerM = contentMG.match(/function genExplorer[\s\S]*?const types = \[(.*?)\];/);
const pilotM = contentMG.match(/function genPilot[\s\S]*?const types = \[(.*?)\];/);
const commanderM = contentMG.match(/function genCommander[\s\S]*?const types = \[(.*?)\];/);

console.log("cadet:", cadetM ? cadetM[1].split(',').length : 0);
console.log("explorer:", explorerM ? explorerM[1].split(',').length : 0);
console.log("pilot:", pilotM ? pilotM[1].split(',').length : 0);
console.log("commander:", commanderM ? commanderM[1].split(',').length : 0);
