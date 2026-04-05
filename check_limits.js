const fs = require('fs');

function checkLimits() {
  let output = '';

  // Learning Checks
  const lcContent = fs.readFileSync('js/learning-checks.js', 'utf8');
  const subjects = ['math', 'music', 'chess', 'history', 'art', 'faith', 'general', 'science', 'geography', 'reading'];
  subjects.forEach(subject => {
    const match = lcContent.match(new RegExp(`${subject}: \\s*\\[([\\s\\S]*?)\\]\\s*,\\s*(?:[a-z]+:|})`));
    if (match) {
        const qCount = (match[1].match(/{ q:/g) || []).length;
        output += `Learning Checks - ${subject}: ${qCount} questions\n`;
    } else {
        output += `Learning Checks - ${subject}: NOT FOUND\n`;
    }
  });

  console.log(output);
}

checkLimits();
