const fs = require('fs');
const contentMG = fs.readFileSync('js/math-galaxy.js', 'utf8');

function findFallback(type) {
    let t = contentMG.indexOf("const a = rand(");
    if(t === -1) return "NOT FOUND";
    let end = contentMG.indexOf("}", t);
    return contentMG.substring(t, end+1);
}
console.log("fallback");
