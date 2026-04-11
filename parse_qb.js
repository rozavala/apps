const fs = require('fs');
const contentDC = fs.readFileSync('js/descubre-chile.js', 'utf8');

const qbStart = contentDC.indexOf('const QB={');
const qbEnd = contentDC.indexOf('};\n\nlet currentState', qbStart);
if (qbStart !== -1 && qbEnd !== -1) {
    const qbStr = contentDC.substring(qbStart, qbEnd + 1);
    const topics = ['geography', 'antartica', 'indigenous', 'history', 'culture'];
    topics.forEach(t => {
        const tStart = qbStr.indexOf(`${t}:[`);
        if (tStart !== -1) {
            let nextTStart = qbStr.length;
            const nextTopics = topics.filter(t2 => t2 !== t && qbStr.indexOf(`${t2}:[`) > tStart);
            if (nextTopics.length > 0) {
                nextTopics.sort((a,b) => qbStr.indexOf(`${a}:[`) - qbStr.indexOf(`${b}:[`));
                nextTStart = qbStr.indexOf(`${nextTopics[0]}:[`);
            }
            const block = qbStr.substring(tStart, nextTStart);
            console.log(`${t} questions: ${(block.match(/\{q/g) || []).length}`);
        } else {
             console.log(`${t} questions: 0`);
        }
    });
}
