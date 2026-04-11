const fs = require('fs');
const code = fs.readFileSync('js/math-galaxy.js', 'utf8');
const cadet_types = code.match(/function genCadet\(\) \{\n[\s\S]*?const types = \[(.*?)\];/)[1];
const expl_types = code.match(/function genExplorer\(\) \{\n[\s\S]*?const types = \[(.*?)\];/)[1];
const pilot_types = code.match(/function genPilot\(\) \{\n[\s\S]*?const types = \[(.*?)\];/)[1];
const comm_types = code.match(/function genCommander\(\) \{\n[\s\S]*?const types = \[(.*?)\];/)[1];

console.log("cadet:", cadet_types.substring(0, 50));
console.log("explorer:", expl_types.substring(0, 50));
console.log("pilot:", pilot_types.substring(0, 50));
console.log("commander:", comm_types.substring(0, 50));
