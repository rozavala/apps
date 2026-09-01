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
    // The quest map groups by world, so each world must be one
    // contiguous run in the catalog and the worlds must ascend.
    const src = fs.readFileSync(OUT, 'utf8');
    const catalog = new Function(
      'window',
      src + '\nreturn window.ZSProgressCatalog;'
    )({});

    const worlds = [];
    catalog.piano.forEach(u => { if (worlds[worlds.length - 1] !== u.g) worlds.push(u.g); });
    const numbers = worlds.map(w => parseInt(w.replace('World ', ''), 10));

    expect(new Set(worlds).size, 'each world is one contiguous run').toBe(worlds.length);
    expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
  });
});
