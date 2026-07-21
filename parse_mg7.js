const fs = require('fs');

function extractTypesList(code, fnName) {
    const startIdx = code.indexOf(`function ${fnName}()`);
    const typesIdx = code.indexOf('const types = [', startIdx);
    const endIdx = code.indexOf('];', typesIdx);

    const extracted = code.substring(typesIdx, endIdx + 2);
    let tStr = extracted.replace('const types = ', '').trim();
    if (tStr.endsWith(';')) tStr = tStr.slice(0, -1);
    return eval("(" + tStr + ")");
}
let code = fs.readFileSync('js/math-galaxy.js', 'utf8');
let cmd = extractTypesList(code, 'genCommander');
console.log(cmd.slice(15));
