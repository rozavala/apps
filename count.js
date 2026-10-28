const fs = require('fs');

const files = {
  math: 'js/math-galaxy.js',
  chile: 'js/descubre-chile.js',
  fe: 'js/fe-explorador.js',
  world: 'js/world-explorer.js',
  guitar: 'js/guitar-jam.js',
  checks: 'js/learning-checks.js',
  story: 'js/story-explorer.js'
};

for (const [key, file] of Object.entries(files)) {
  if (fs.existsSync(file)) {
    console.log(`--- ${key} ---`);
    const content = fs.readFileSync(file, 'utf8');
    if (key === 'math') {
      const cadet = content.match(/function genCadet\(\) \{[\s\S]*?const types = \[([^\]]+)\];/);
      const explorer = content.match(/function genExplorer\(\) \{[\s\S]*?const types = \[([^\]]+)\];/);
      const pilot = content.match(/function genPilot\(\) \{[\s\S]*?const types = \[([^\]]+)\];/);
      const commander = content.match(/function genCommander\(\) \{[\s\S]*?const types = \[([^\]]+)\];/);
      console.log('Cadet:', cadet ? cadet[1].split(',').length : 0);
      console.log('Explorer:', explorer ? explorer[1].split(',').length : 0);
      console.log('Pilot:', pilot ? pilot[1].split(',').length : 0);
      console.log('Commander:', commander ? commander[1].split(',').length : 0);
    }
    if (key === 'chile') {
      const topicsMatch = content.match(/const TOPICS = \[([\s\S]*?)\];/);
      console.log('Topics:', topicsMatch ? topicsMatch[1].split('{ id:').length - 1 : 0);
      const qbMatch = content.match(/const QB = \{([\s\S]*?)\n\};/);
      if (qbMatch) {
         // let's do a more robust parsing next step if needed
      }
    }
  }
}
