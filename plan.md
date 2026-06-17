1. **Math Galaxy (`js/math-galaxy.js`)**:
   - `genCadet()` limit is 25. Prune 2 types (e.g. `'meteor_add', 'meteor_count'`). Add `'comet_count', 'comet_add'`. Using `replace_with_git_merge_diff`.
   - `genExplorer()` limit is 25. Prune 2 types (e.g. `'comet_add', 'asteroid_sub'`). Add `'moon_sub', 'orbit_add'`. Using `replace_with_git_merge_diff`.
   - `genPilot()` limit is 25. Prune 2 types (e.g. `'moon_div', 'comet_mult_2'`). Add `'planet_frac', 'sun_mult'`. Using `replace_with_git_merge_diff`.
   - `genCommander()` limit is 25. Prune 2 types (e.g. `'blackhole_sub', 'galaxy_pct_2'`). Add `'gravity_dec', 'orbit_pct'`. Using `replace_with_git_merge_diff`.

2. **Descubre Chile (`js/descubre-chile.js`)**:
   - Topic `inventors`: add 3 new questions to `inventors` array in `QB`. (Lines 434-439). Using `replace_with_git_merge_diff`.
   - Topic `volcanes`: add 3 new questions to `volcanes` array in `QB`. (Lines 442-447). Using `replace_with_git_merge_diff`.

3. **World Explorer (`js/world-explorer.js`)**:
   - Continent `europe`: append `italy` and `germany` to the `countries` array of `europe`. Using `replace_with_git_merge_diff`.

4. **Verify changes**:
   - Run `npm run test` to verify frontend changes.
   - Run `node -c` on modified JS files.
   - Run `grep` to verify no forbidden words.

5. **Pre-commit**:
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.

6. **Output Patches**:
   - Write out the required patches in the exact format to the final submission.
