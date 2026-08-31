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

// I will now extract the exact if logic block structure for one type so I can construct replacements
let startC = code.indexOf("function genCadet()");
let typeC = code.indexOf("if (type === 'count')", startC);
let endC = code.indexOf("if (type === 'add')", typeC);

console.log(code.substring(typeC, endC));
