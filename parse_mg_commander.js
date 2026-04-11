const fs = require('fs');
const contentMG = fs.readFileSync('js/math-galaxy.js', 'utf8');

function findTypeFunc(type) {
    let t = contentMG.indexOf("if (type === '" + type + "')");
    if(t === -1) return "NOT FOUND: " + type;
    let end = contentMG.indexOf("}", t);
    return contentMG.substring(t, end+1);
}

console.log(findTypeFunc('percent'));
console.log(findTypeFunc('order_ops'));
