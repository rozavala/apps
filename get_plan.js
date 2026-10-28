const fs = require('fs');

console.log(`
1. Math Galaxy (js/math-galaxy.js)
  - genCadet(): Find weak types like 'sun_count_2' and 'planet_compare' (or others like 'astronaut_count', 'satellite_add'). Remove them. Add 2 new types.
  - genExplorer(): Find weak types. Remove 2. Add 2.
  - genPilot(): Find weak types. Remove 2. Add 2.
  - genCommander(): Prune down 15 types to reach 23, then add 2. I'll need to remove 15 entries from the array and their corresponding if statements.

2. Descubre Chile (js/descubre-chile.js)
  - animales: Add 3 questions.
  - volcanes_chile: Add 3 questions.
  - fiestas_patrias: Add 3 questions.

3. Fe Explorador (js/fe-explorador.js)
  - SAINTS: Prune 6 saints. Add "San Juan de Dios" with 3 questions.
  - HERITAGE: Prune 4 items. Add "Fiesta de La Tirana".

4. World Explorer (js/world-explorer.js)
  - oceania: Add Fiji (id: fiji).

5. Guitar Jam (js/guitar-jam.js)
  - CHORDS: Prune 9 chords. Add "Cmaj7" if it doesn't exist, else "Gmaj7".
  - SONGS: Prune 7 songs. Add 1 new song.

6. Learning Checks (js/learning-checks.js)
  - All subjects have exactly 8 questions, which is the MAX. I will PRUNE 2 questions and add 1-2 questions to each? Wait, prompt says: "count existing items in each bank. If a bank is at or above its MAX, remove the oldest/weakest items to make room. Never let a bank exceed its MAX." Then for learning checks: "For any subject with fewer than 6 questions, add 1-2 new questions." Since no subject has fewer than 6, I don't add. If I don't add, I don't need to make room. I will leave this file unchanged.

7. Story Explorer (js/story-explorer.js)
  - Prune 5 stories. Add 1 new story.
  - For remaining stories, add vocab words to reach 8.

I will use 'replace_with_git_merge_diff' for all of these. I need to make sure to do the syntax check on all files, and run the compliance grep, and run 'npm run test'.
`);
