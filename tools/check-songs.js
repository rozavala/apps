/* ================================================================
   Little Maestro song check

   Compiles every song (SONGS in little-maestro.html plus the score-
   format songs in js/lm-songs.js) with js/lm-score.js and reports:
     - errors: bars that don't add up, unreadable tokens, duplicate ids
     - warnings: notes off the on-screen keyboard (C2–C6), bad fingers

   Usage: node tools/check-songs.js [--verbose]
   Exits non-zero when there are errors.
   ================================================================ */

const fs = require('fs');
const path = require('path');
const LMScore = require('../js/lm-score.js');
const LM_SONGS = require('../js/lm-songs.js');

const ROOT = path.resolve(__dirname, '..');

// Same balanced-bracket lift as tools/build-progress-catalog.js
function extractArray(src, name) {
  const re = new RegExp('(?:const|var|let)\\s+' + name + '\\s*=\\s*\\[');
  const m = re.exec(src);
  if (!m) throw new Error('array "' + name + '" not found');
  const start = m.index + m[0].length - 1;
  let depth = 0, i = start, inStr = null, esc = false;
  for (; i < src.length; i++) {
    const c = src[i];
    if (inStr) {
      if (esc) { esc = false; continue; }
      if (c === '\\') { esc = true; continue; }
      if (c === inStr) inStr = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if (c === '[' || c === '{' || c === '(') depth++;
    else if (c === ']' || c === '}' || c === ')') {
      depth--;
      if (depth === 0) { i++; break; }
    }
  }
  return new Function('return (' + src.slice(start, i) + ')')();
}

function loadSongs() {
  const html = fs.readFileSync(path.join(ROOT, 'little-maestro.html'), 'utf8');
  return extractArray(html, 'SONGS').concat(LM_SONGS);
}

function check(songs) {
  const errors = [];
  const warnings = [];
  const seen = {};
  const LO = LMScore.midiOf('C2'), HI = LMScore.midiOf('C6');
  songs.forEach(s => {
    const label = '#' + s.id + ' ' + s.title;
    if (seen[s.id]) errors.push(label + ': duplicate id (also "' + seen[s.id] + '")');
    seen[s.id] = s.title;
    let c;
    try { c = LMScore.compile(s); } catch (e) { errors.push(e.message); return; }
    c.notes.forEach(n => {
      const m = LMScore.midiOf(n.note);
      if (m < LO || m > HI) warnings.push(label + ': ' + n.note + ' (bar ' + (n.m + 1) + ') is off the on-screen keyboard');
      if (n.finger != null && !(n.finger >= 1 && n.finger <= 5)) warnings.push(label + ': finger ' + n.finger + ' on ' + n.note);
    });
    if (s.score && !s.bpm) errors.push(label + ': missing bpm');
  });
  return { errors, warnings };
}

if (require.main === module) {
  const songs = loadSongs();
  const { errors, warnings } = check(songs);
  const verbose = process.argv.includes('--verbose');
  const legacy = songs.filter(s => !s.score);
  const dropped = legacy.filter(s => { try { return LMScore.compile(s).lhDropped; } catch (e) { return false; } });
  console.log(songs.length + ' songs (' + (songs.length - legacy.length) + ' in score format), ' +
    dropped.length + ' old songs play right hand only (left hand out of step)');
  if (verbose) dropped.forEach(s => console.log('  RH only: #' + s.id + ' ' + s.title));
  warnings.forEach(w => console.log('warning: ' + w));
  errors.forEach(e => console.log('ERROR: ' + e));
  process.exit(errors.length ? 1 : 0);
}

module.exports = { loadSongs, check };
