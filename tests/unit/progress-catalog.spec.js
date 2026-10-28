// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { build } = require('../../tools/build-progress-catalog');

const OUT = path.resolve(__dirname, '../../js/progress-catalog.js');

test.describe('progress catalog', () => {

  test('checked-in catalog matches the app sources', () => {
    // Songs, puzzles and lessons live in the apps that own them. If one
    // of those lists changed, the catalog Parents Corner reads from is
    // stale — run `npm run build:catalog`.
    expect(fs.readFileSync(OUT, 'utf8'),
      'js/progress-catalog.js is out of date — run `npm run build:catalog`').toBe(build());
  });

  test('little-maestro song order is the quest-map order', () => {
    // The map is a run of paths (Primer → Level 1 → Level 2), each a run
    // of worlds, so every "<path> · World N" group must be one contiguous
    // run, the paths must come in order, and worlds ascend inside a path.
    const src = fs.readFileSync(OUT, 'utf8');
    const catalog = new Function(
      'window',
      src + '\nreturn window.ZSProgressCatalog;'
    )({});

    const groups = [];
    catalog.piano.forEach(u => { if (groups[groups.length - 1] !== u.g) groups.push(u.g); });
    expect(new Set(groups).size, 'each world is one contiguous run').toBe(groups.length);

    const PATHS = ['Primer', 'Level 1', 'Level 2'];
    const keys = groups.map(g => {
      const m = /^(.+) · World (\d+)$/.exec(g);
      expect(m, 'group label "' + g + '"').toBeTruthy();
      return PATHS.indexOf(m[1]) * 100 + parseInt(m[2], 10);
    });
    expect(keys.every(k => k >= 0)).toBe(true);
    expect(keys).toEqual([...keys].sort((a, b) => a - b));
  });
});
