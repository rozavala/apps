const fs = require('fs');
const content = fs.readFileSync('js/story-explorer.js', 'utf8');

const matchStories = content.match(/const STORIES = \[([\s\S]*?)\];\n\n  \/\/ ── State ──/);
if (matchStories) {
  const block = matchStories[1];
  const stories = [...block.matchAll(/id:\s*'([^']+)',/g)];
  console.log(`Stories: ${stories.length}`);

  stories.forEach(sMatch => {
     const id = sMatch[1];
     const search = block.indexOf(`id: '${id}'`);
     let nextSearch = block.indexOf(`id: '`, search + 10);
     if (nextSearch === -1) nextSearch = block.length;
     const storyBlock = block.substring(search, nextSearch);
     const vocabWords = (storyBlock.match(/word:/g) || []).length;
     console.log(`- ${id}: ${vocabWords} words`);
  });
}
