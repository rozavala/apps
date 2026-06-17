const fs = require('fs');

function countArr(regex, file) {
    const code = fs.readFileSync(file, 'utf8');
    const match = code.match(regex);
    if (match) {
        const str = match[1];
        try {
            const arr = eval('[' + str + ']');
            return arr.length;
        } catch (e) {
            console.log('error evaluating array', e.message);
            return null;
        }
    }
    return null;
}

const descubreCode = fs.readFileSync('js/descubre-chile.js', 'utf8');
const topicsMatch = descubreCode.match(/const TOPICS=\[([\s\S]*?)\];/);
if (topicsMatch) {
    try {
        const topicsStr = topicsMatch[1];
        const topics = eval('[' + topicsStr + ']');
        console.log('Descubre Chile topics:', topics.length);
    } catch(e) {
        console.log('error evaluating topics', e.message);
    }
}

const qbMatch = descubreCode.match(/const QB=({[\s\S]*?\n});/);
if (qbMatch) {
    try {
        const qbStr = qbMatch[1];
        let QB = {};
        eval('QB=' + qbStr);
        for (const key in QB) {
            console.log(`Descubre Chile QB[${key}]:`, QB[key].length);
        }
    } catch(e) {
        console.log('error evaluating QB', e.message);
    }
} else {
    // maybe var?
    const qbMatch2 = descubreCode.match(/const QB=({[\s\S]*?});\n/s);
    if (qbMatch2) {
        try {
            const qbStr = qbMatch2[1];
            let QB = {};
            eval('QB=' + qbStr);
            for (const key in QB) {
                console.log(`Descubre Chile QB[${key}]:`, QB[key].length);
            }
        } catch(e) {
            console.log('error evaluating QB', e.message);
        }
    } else {
        console.log('QB not found in descubre-chile.js');
    }
}
