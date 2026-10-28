const fs = require('fs');

function countMathGalaxy() {
  const content = fs.readFileSync('js/math-galaxy.js', 'utf8');
  ['genCadet', 'genExplorer', 'genPilot', 'genCommander'].forEach(fn => {
    const fnMatch = content.match(new RegExp(`function ${fn}\\(\\) {[\\s\\S]*?const types = \\[(.*?)\\];`));
    if (fnMatch) {
      const typesStr = fnMatch[1];
      const types = typesStr.match(/'[^']+'/g) || [];
      console.log(`${fn} types: ${types.length}`);
    }
  });
}

function countDescubreChile() {
  const content = fs.readFileSync('js/descubre-chile.js', 'utf8');
  const topicsMatch = content.match(/const TOPICS = (\[[\s\S]*?\]);\n/);
  if (topicsMatch) {
    const topics = eval(topicsMatch[1]);
    console.log(`Descubre Chile topics: ${topics.length}`);
  }
  const qbMatch = content.match(/const QB = (\{[\s\S]*?\n\});/);
  if (qbMatch) {
    const code = qbMatch[1];
    const qbKeys = [...code.matchAll(/([a-zA-Z0-9_]+): \[/g)].map(m => m[1]);
    console.log('Descubre Chile QB keys:', qbKeys.join(', '));
    qbKeys.forEach(k => {
       const keyMatch = content.match(new RegExp(`${k}: \\[(.*?)\\]\\s*(,|})`, 's'));
       if(keyMatch) {
           const matches = [...keyMatch[1].matchAll(/{ q:/g)];
           console.log(`  ${k} questions: ${matches.length}`);
       }
    });
  }
}

function countFeExplorador() {
  const content = fs.readFileSync('js/fe-explorador.js', 'utf8');
  const saintsMatch = content.match(/const SAINTS = (\[[\s\S]*?\]);\nconst HERITAGE/);
  if (saintsMatch) {
    const saintsStr = saintsMatch[1];
    const saints = saintsStr.match(/\{ id: '/g) || [];
    console.log(`Fe Explorador saints: ${saints.length}`);
  }
  const heritageMatch = content.match(/const HERITAGE = (\[[\s\S]*?\]);\n/);
  if (heritageMatch) {
    const heritageStr = heritageMatch[1];
    const heritage = heritageStr.match(/\{ id: '/g) || [];
    console.log(`Fe Explorador heritage: ${heritage.length}`);
  }
}

function countWorldExplorer() {
  const content = fs.readFileSync('js/world-explorer.js', 'utf8');
  // Use string manipulation to extract the CONTINENTS array properly
  let extractCont = content.substring(content.indexOf('const CONTINENTS = ['));
  // Find the end of the array
  extractCont = extractCont.substring(0, extractCont.indexOf(';\n\n//'));
  // It's just a count we need
  const continents = ['south_america', 'north_america', 'europe', 'asia', 'africa', 'oceania'];
  continents.forEach(cont => {
    const contRegex = new RegExp(`id: '${cont}'[\\s\\S]*?countries: \\[(.*?)\\]\\s*}\\s*`, 's');
    const match = extractCont.match(contRegex);
    if(match) {
        const countries = match[1].match(/{ id: '/g) || [];
        console.log(`World Explorer ${cont} countries: ${countries.length}`);
    }
  });
}

function countGuitarJam() {
    const content = fs.readFileSync('js/guitar-jam.js', 'utf8');
    const chords = (content.match(/name: '/g) || []).length;
    const songs = (content.match(/title: '/g) || []).length;
    console.log(`Guitar Jam chords: ${chords}`);
    console.log(`Guitar Jam songs: ${songs}`);
}

function countLearningChecks() {
    const content = fs.readFileSync('js/learning-checks.js', 'utf8');
    const banksMatch = content.match(/var QUESTIONS = (\{[\s\S]*?\n\});/);
    if (banksMatch) {
        const keys = ['math', 'chess', 'history', 'art', 'faith', 'general', 'science'];
        keys.forEach(k => {
           const kMatch = banksMatch[1].match(new RegExp(`${k}: \\[(.*?)\\](,|\\s*})`, 's'));
           if(kMatch) {
              const qCount = (kMatch[1].match(/{ q:/g) || []).length;
              console.log(`Learning Checks ${k}: ${qCount}`);
           }
        });
    }
}

function countStoryExplorer() {
    const content = fs.readFileSync('js/story-explorer.js', 'utf8');
    const stories = (content.match(/title: '/g) || []).length;
    console.log(`Story Explorer stories: ${stories}`);
}

countMathGalaxy();
countDescubreChile();
countFeExplorador();
countWorldExplorer();
countGuitarJam();
countLearningChecks();
countStoryExplorer();
