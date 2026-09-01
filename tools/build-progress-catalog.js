#!/usr/bin/env node
/* ================================================================
   BUILD PROGRESS CATALOG (tools/build-progress-catalog.js)

   Regenerates js/progress-catalog.js — the ordered list of "units"
   (songs, puzzles, stories, lessons…) that Parents Corner's Progress
   Manager lets a grown-up set a kid's position in.

   Every list already exists inside the app that owns it (SONGS in
   little-maestro.html, PUZZLES in js/code-cadet.js, …). Rather than
   hand-copying those into a second place and letting them drift, this
   script lifts each array literal straight out of the source file and
   boils it down to {id, label, group}.

   Run it after adding or reordering songs/lessons in any app:

       npm run build:catalog

   tests/unit/progress-catalog.spec.js fails when the checked-in file
   no longer matches the sources, so drift shows up in CI.
   ================================================================ */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT  = path.join(ROOT, 'js', 'progress-catalog.js');

// ── Lift a top-level array literal out of a source file ───────────
// The catalogs are pure data (no identifiers, no calls), so slicing
// the literal on balanced brackets and evaluating it is enough.
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
  if (depth !== 0) throw new Error('unbalanced literal for "' + name + '"');
  return new Function('return (' + src.slice(start, i) + ')')();
}

const cache = {};
function load(file) {
  if (!cache[file]) cache[file] = fs.readFileSync(path.join(ROOT, file), 'utf8');
  return cache[file];
}
function arr(file, name) { return extractArray(load(file), name); }

function unit(id, label, group, kind) {
  const u = { i: id, l: String(label) };
  if (group) u.g = String(group);
  if (kind) u.k = kind;
  return u;
}

// ── One builder per app that has an ordered progression ───────────
const BUILDERS = {
  // Little Maestro. The quest map groups songs by world (worlds
  // ascending, array order within a world), and "the song you're on"
  // is the first uncompleted node walking that same order — so the
  // catalog has to be in quest-map order, not raw array order.
  piano() {
    const songs = arr('little-maestro.html', 'SONGS').filter(s => !s.isBonus && s.world);
    const worlds = [...new Set(songs.map(s => s.world))].sort((a, b) => a - b);
    const out = [];
    worlds.forEach(w => {
      songs.filter(s => s.world === w)
           .forEach(s => out.push(unit(s.id, s.title, 'World ' + w)));
    });
    return out;
  },

  codecadet() {
    return arr('js/code-cadet.js', 'PUZZLES')
      .map(p => unit(p.id, p.name, 'World ' + p.world));
  },

  chile() {
    return arr('js/descubre-chile.js', 'TOPICS')
      .map(t => unit(t.id, t.icon + ' ' + t.name, 'Temas'));
  },

  story() {
    return arr('js/story-explorer.js', 'STORIES')
      .map(s => unit(s.id, (s.icon ? s.icon + ' ' : '') + s.title, _title(s.tier)));
  },

  bible() {
    return arr('js/bible-explorer.js', 'STORIES')
      .map(s => unit(s.id, (s.icon ? s.icon + ' ' : '') + s.title.en,
                     s.testament === 'OT' ? 'Old Testament' : 'New Testament'));
  },

  vocab() {
    return arr('js/vocabulario-vivo.js', 'ROOTS')
      .map(r => unit(r.id, r.id + '- · ' + r.meaning.en, 'Tier ' + r.tier));
  },

  // Lab Explorer counts finished experiments inside each lab, so the
  // unit carries how many that lab has.
  lab() {
    return arr('js/lab-explorer.js', 'LABS').map(l => {
      const u = unit(l.id, l.icon + ' ' + l.title, _title(l.category));
      u.n = (l.experiments || []).length;
      return u;
    });
  },

  guitar() {
    return arr('js/guitar-jam.js', 'SONGS')
      .map(s => unit(s.id, s.title, _title(s.tier)));
  },

  art() {
    return arr('js/art-studio.js', 'LESSONS')
      .map(l => unit(l.id, l.icon + ' ' + l.title, _title(l.tier)));
  },

  // Civics Lab tracks two separate checklists in one blob, so each
  // unit carries the list it belongs to.
  civics() {
    const branches = arr('js/civics-lab.js', 'BRANCHES')
      .map(b => unit(b.id, b.icon + ' ' + b.title.en, 'Branches', 'branch'));
    const insts = arr('js/civics-lab.js', 'INSTITUTIONS')
      .map(i => unit(i.id, i.icon + ' ' + i.title.en, 'Institutions', 'inst'));
    return branches.concat(insts);
  },

  // Chess Quest only stores a solved *count*, so the unit id is the
  // puzzle's position in PUZZLES.
  chess() {
    return arr('js/chess-quest.js', 'PUZZLES')
      .map((p, idx) => unit(idx + 1, p.name, _title(p.tier)));
  },

  world() {
    const out = [];
    arr('js/world-explorer.js', 'CONTINENTS').forEach(c => {
      (c.countries || []).forEach(country => {
        out.push(unit(country.id, country.flag + ' ' + country.name, c.icon + ' ' + c.name));
      });
    });
    return out;
  },
};

function _title(s) {
  if (!s) return '';
  return String(s).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ── Emit ──────────────────────────────────────────────────────────
function build() {
  const catalog = {};
  Object.keys(BUILDERS).sort().forEach(id => {
    const units = BUILDERS[id]();
    if (!units.length) throw new Error('catalog "' + id + '" came out empty');
    const seen = new Set();
    units.forEach(u => {
      const k = String(u.i);
      if (seen.has(k)) throw new Error('catalog "' + id + '" has duplicate id ' + k);
      seen.add(k);
    });
    catalog[id] = units;
  });

  const body = Object.keys(catalog).map(id =>
    '  ' + id + ': [\n' +
    catalog[id].map(u => '    ' + JSON.stringify(u)).join(',\n') +
    '\n  ]'
  ).join(',\n\n');

  return '/* ================================================================\n' +
    '   PROGRESS CATALOG (js/progress-catalog.js)\n' +
    '\n' +
    '   AUTO-GENERATED by tools/build-progress-catalog.js — do not edit.\n' +
    '   Regenerate with `npm run build:catalog` after changing any app\'s\n' +
    '   song/lesson/puzzle list.\n' +
    '\n' +
    '   Each entry is one unit of progress, in the order a kid meets it:\n' +
    '     i = id used in that app\'s saved data\n' +
    '     l = label shown to the parent\n' +
    '     g = group heading (world, tier, testament…)\n' +
    '     k = sub-list the unit belongs to, when an app keeps several\n' +
    '   ================================================================ */\n' +
    '\n' +
    'window.ZSProgressCatalog = {\n' + body + '\n};\n';
}

if (require.main === module) {
  const text = build();
  if (process.argv.indexOf('--check') !== -1) {
    const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
    if (current !== text) {
      console.error('js/progress-catalog.js is out of date — run `npm run build:catalog`.');
      process.exit(1);
    }
    console.log('js/progress-catalog.js is up to date.');
  } else {
    fs.writeFileSync(OUT, text);
    console.log('Wrote ' + path.relative(ROOT, OUT));
  }
}

module.exports = { build, extractArray };
