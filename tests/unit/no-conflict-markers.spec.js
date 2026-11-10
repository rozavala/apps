// @ts-check
// Guards against a merge-conflict marker being committed. A half-resolved merge
// once left `<<<<<<<` lines in index.html, which breaks the page's script.
const { test, expect } = require('@playwright/test');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const TEXT = /\.(html?|js|mjs|cjs|json|css|md|txt|svg|webmanifest|ya?ml|sh)$/i;
// Start-of-line markers git writes: "<<<<<<< ours", "||||||| base", ">>>>>>> theirs".
// A bare "=======" is skipped: it is also a valid Markdown heading underline.
const MARKER = /^(<{7}|>{7})( .*)?$|^\|{7} .*$/;

function trackedTextFiles() {
  const out = execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 }).toString('utf8');
  return out.split('\0').filter(f => f && TEXT.test(f));
}

test.describe('repository hygiene', () => {
  test('no merge-conflict markers in tracked text files', () => {
    const files = trackedTextFiles();
    expect(files.length).toBeGreaterThan(50);
    const hits = [];
    for (const f of files) {
      const full = path.join(ROOT, f);
      if (!fs.existsSync(full)) continue; // deleted in the working tree
      fs.readFileSync(full, 'utf8').split(/\r?\n/).forEach((line, i) => {
        if (MARKER.test(line)) hits.push(`${f}:${i + 1}: ${line.slice(0, 60)}`);
      });
    }
    expect(hits, 'conflict markers found:\n' + hits.join('\n')).toEqual([]);
  });

  test('the marker pattern matches real conflict lines and ignores look-alikes', () => {
    for (const l of ['<<<<<<< HEAD', '>>>>>>> origin/main', '<<<<<<<', '||||||| merged common ancestors']) {
      expect(MARKER.test(l), l).toBe(true);
    }
    for (const l of ['=======', '  <<<<<<< indented', '<<<<<<<<', 'a <<<<<<< b', '<<<<<< six']) {
      expect(MARKER.test(l), l).toBe(false);
    }
  });
});
