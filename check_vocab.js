const fs = require('fs');

function checkVocab() {
  const content = fs.readFileSync('js/story-explorer.js', 'utf8');

  // Quick and dirty counting based on the known structure
  const storyBlocks = content.split('id: \'').slice(1);
  storyBlocks.forEach(block => {
    const idMatch = block.match(/^([^']+)'/);
    if (idMatch) {
      const id = idMatch[1];
      const vocabCount = (block.match(/{ word:/g) || []).length;
      console.log(`Story: ${id}, Vocab count: ${vocabCount}`);
    }
  });
}

checkVocab();
