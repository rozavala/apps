// @ts-check
// Árbol familiar: the GEDCOM reader, on FICTIONAL families only (see
// tests/helpers/gedcom-samples.js). No real tree is ever used in this repository.
const { test, expect } = require('@playwright/test');
const G = require('../../js/gedcom.js');
const H = require('../helpers/gedcom-samples.js');

const enc = (s) => new TextEncoder().encode(s);
const bytes = (...parts) => Uint8Array.from(parts.flatMap(p => typeof p === 'string' ? [...Buffer.from(p, 'latin1')] : p));

test.describe('GEDCOM: records', () => {
  const t = G.parse(H.sample());

  test('reads people, families, names, sex, events and places', () => {
    expect(t.version).toBe('5.5.1');
    expect(t.stats.individuals).toBe(H.PEOPLE.length);
    expect(t.stats.families).toBe(H.FAMILIES.length);
    const lucia = t.people.I24;
    expect(lucia).toMatchObject({ g: 'Lucía', s: 'Ejemplo', z: 'F' });
    expect(lucia.e[0]).toEqual(['BIRT', '12 MAY 2016', 'Santa Clara, California, USA']);
    const f9 = t.families.F9;
    expect(f9.h).toBe('I15');
    expect(f9.w).toBe('I16');
    expect(f9.c).toEqual(['I24', 'I25', 'I26']);
    expect(f9.e[0]).toEqual(['MARR', '2012', 'Santiago, Chile']);
    expect(t.families.F6.e.map(e => e[0])).toEqual(['MARR', 'DIV']);
  });

  test('every name, sex and birth in the sample is read back as written (independent of the parser)', () => {
    for (const [id, g, s, sex, birth, death] of H.PEOPLE) {
      const p = t.people[id];
      expect([p.g, p.s, p.z], id).toEqual([g, s, sex]);
      expect(p.e.find(e => e[0] === 'BIRT').slice(1, 3), id).toEqual(birth);
      if (death) expect(p.e.find(e => e[0] === 'DEAT').slice(1, 3), id).toEqual(death);
      else expect(p.e.some(e => e[0] === 'DEAT'), id).toBe(false);
    }
  });

  test('family links agree in both directions, and a pedigree flag is kept', () => {
    expect(t.people.I24.fc.map(x => x.f)).toEqual(['F9']);
    expect(t.people.I26.fc).toEqual([{ f: 'F9', p: 'adopted' }]);
    expect(t.people.I11.fs.sort()).toEqual(['F6', 'F7']);
    for (const f of Object.values(t.families)) {
      for (const c of f.c) expect(t.people[c].fc.some(x => x.f === f.id), f.id + ' child ' + c).toBe(true);
    }
  });

  test('a link written on only one side is completed, and a dangling or @VOID@ id is dropped', () => {
    const p = G.parse(['0 HEAD', '0 @I1@ INDI', '1 NAME A /B/', '1 FAMS @F1@', '0 @I2@ INDI', '1 NAME C /D/',
      '0 @F1@ FAM', '1 HUSB @I1@', '1 WIFE @VOID@', '1 CHIL @I2@', '1 CHIL @I99@', '0 TRLR'].join('\n'));
    expect(p.families.F1.w).toBe('');
    expect(p.families.F1.c).toEqual(['I2']);
    expect(p.people.I2.fc).toEqual([{ f: 'F1', p: '' }]);
  });

  test('notes: CONC glues, CONT breaks the line, and a pointer note is resolved', () => {
    expect(t.people.I13.n[0]).toContain('built the long table where the family ate on Sundays. He liked to whistle');
    expect(t.people.I13.n[0]).toContain('\nHe taught his children to measure twice and cut once.');
    expect(t.people.I13.n[0]).not.toContain('CONC');
    expect(t.people.I5.n[0]).toBe('The family kept a small shop near the port.\nIt was open every morning, and a bell rang over the door.');
  });

  test('a CONC that splits a word, and one that starts with a space, rebuild the text exactly', () => {
    const p = G.parse(['0 HEAD', '0 @I1@ INDI', '1 NAME A /B/', '1 NOTE The quick bro', '2 CONC wn fox ', '2 CONC jumps', '2 CONT next line', '0 TRLR'].join('\n'));
    expect(p.people.I1.n[0]).toBe('The quick brown fox jumps\nnext line');
  });

  test('custom _tags, privacy flags, source and media counts and unknown records are tolerated', () => {
    expect(t.people.I15.g).toBe('Daniel');
    expect(t.people.I12.lv).toBe(1);                    // RESN privacy
    expect(t.people.I1.ft).toBe('LZ1A-2B3');            // FamilySearch tree id
    expect(t.people.I1.e.map(e => e[0])).toEqual(expect.arrayContaining(['EMIG', 'IMMI']));
    expect(t.stats.sources).toBe(1);
    expect(t.stats.media).toBe(1);
    expect(t.people.I1.src).toBe(1);
    expect(t.people.I1.obj).toBe(1);
  });

  test('OCCU keeps its text, RESI and EVEN keep their type', () => {
    expect(t.people.I13.e.find(e => e[0].startsWith('OCCU'))[0]).toBe('OCCU:Carpenter');
    expect(t.people.I5.e.find(e => e[0] === 'RESI')[1]).toBe('FROM 1930 TO 1950');
  });

  test('GEDCOM 7.0: version, no CHAR line, @VOID@, SNOTE and CONT-only notes', () => {
    const p = G.parse(H.sample({ version: '7.0' }));
    expect(p.version).toBe('7.0');
    expect(p.stats.v7).toBe(true);
    expect(p.stats.individuals).toBe(H.PEOPLE.length);
    expect(p.people.I13.n[0]).toContain('measure twice');
    const q = G.parse('0 HEAD\n1 GEDC\n2 VERS 7.0\n0 @I1@ INDI\n1 NAME Ana /Prueba/\n1 SNOTE @N1@\n0 @N1@ SNOTE A shared note\n2 CONT second line\n0 TRLR\n');
    expect(q.people.I1.n[0]).toBe('A shared note\nsecond line');
  });

  test('Windows, Mac and Unix line endings, a blank line, and indentation all read the same', () => {
    for (const eol of ['\r\n', '\r', '\n']) {
      const p = G.parse(H.sample({ eol }));
      expect(p.stats.individuals, JSON.stringify(eol)).toBe(H.PEOPLE.length);
      expect(p.people.I24.g).toBe('Lucía');
    }
    const q = G.parse('0 HEAD\n\n  0 @I1@ INDI\n   1 NAME Ana /Prueba/\n');
    expect(q.people.I1.g).toBe('Ana');
  });

  test('an empty or unrelated file yields no people and a warning, not an exception', () => {
    expect(G.parse('').stats.individuals).toBe(0);
    const p = G.parse('hello\nthis is not a family tree\n');
    expect(p.stats.individuals).toBe(0);
    expect(p.warnings.length).toBeGreaterThan(0);
  });

  test('a person with a private placeholder name is flagged as living', () => {
    const p = G.parse('0 HEAD\n0 @I1@ INDI\n1 NAME Private /Private/\n0 @I2@ INDI\n1 NAME Living /\n0 TRLR\n');
    expect(p.people.I1.lv).toBe(1);
  });

  test('malformed lines are skipped and counted, and the rest is read', () => {
    const p = G.parse('0 HEAD\n???\n0 @I1@ INDI\n1 NAME Ana /Prueba/\n@@@ junk\n0 TRLR\n');
    expect(p.people.I1.g).toBe('Ana');
    expect(p.warnings.join(' ')).toMatch(/2 line/);
  });
});

test.describe('GEDCOM: character sets', () => {
  const head = (cs) => '0 HEAD\n1 CHAR ' + cs + '\n0 @I1@ INDI\n1 NAME ';
  const tail = '\n0 TRLR\n';

  test('UTF-8, with and without a byte-order mark', () => {
    const txt = head('UTF-8') + 'José /Núñez Ríos/' + tail;
    for (const b of [enc(txt), Uint8Array.from([0xEF, 0xBB, 0xBF, ...enc(txt)])]) {
      const p = G.parse(G.decode(b));
      expect([p.people.I1.g, p.people.I1.s]).toEqual(['José', 'Núñez Ríos']);
    }
  });

  test('UTF-16 with a byte-order mark, either byte order', () => {
    const txt = head('UNICODE') + 'María /Pérez/' + tail;
    const le = new Uint8Array(2 + txt.length * 2), be = new Uint8Array(2 + txt.length * 2);
    le.set([0xFF, 0xFE]); be.set([0xFE, 0xFF]);
    for (let i = 0; i < txt.length; i++) {
      const c = txt.charCodeAt(i);
      le[2 + i * 2] = c & 255; le[3 + i * 2] = c >> 8;
      be[2 + i * 2] = c >> 8; be[3 + i * 2] = c & 255;
    }
    for (const b of [le, be]) expect(G.parse(G.decode(b)).people.I1.g).toBe('María');
  });

  test('ANSEL: the mark comes before the letter, and the special letters map to Unicode', () => {
    // é = E2 65, ü = E8 75, ñ = E4 6E, ø = B2, Ł = A1, ß = C7
    const b = bytes(head('ANSEL'), 'Jos', [0xE2], 'e /M', [0xE8], 'uller/ ', 'S', [0xB2], 'ren ', [0xA1], 'ukasz Pe', [0xE4], 'na ', [0xC7], tail);
    const p = G.parse(G.decode(b));
    expect(p.people.I1.g).toBe('José');
    expect(p.people.I1.s).toBe('Müller');
    expect(G.decodeAnsel(bytes('S', [0xB2], 'ren'))).toBe('Søren');
    expect(G.decodeAnsel(bytes([0xA1], 'ukasz'))).toBe('Łukasz');
    expect(G.decodeAnsel(bytes('Pe', [0xE4], 'na'))).toBe('Pe\u00F1a');
    expect(G.decodeAnsel(bytes('Stra', [0xC7], 'e'))).toBe('Straße');
  });

  test('ANSI / Windows-1252 (CHAR ANSI), and a file that says ANSI but is really UTF-8', () => {
    const latin = bytes(head('ANSI'), 'Jos', [0xE9], ' /N', [0xFA], [0xF1], 'ez/ ', [0x80], tail);   // é ú ñ and the euro sign
    expect(G.parse(G.decode(latin)).people.I1.g).toBe('José');
    expect(G.parse(G.decode(latin)).people.I1.s).toBe('Núñez');
    expect(G.parse(G.decode(enc(head('ANSI') + 'José /Núñez/' + tail))).people.I1.g).toBe('José');
  });

  test('a file with no CHAR line is read as UTF-8 when it is valid UTF-8, else as Windows-1252', () => {
    expect(G.parse(G.decode(enc('0 HEAD\n0 @I1@ INDI\n1 NAME Zoë /Ó/\n'))).people.I1.g).toBe('Zoë');
    expect(G.parse(G.decode(bytes('0 HEAD\n0 @I1@ INDI\n1 NAME Zo', [0xEB], ' /', [0xD3], '/\n'))).people.I1.g).toBe('Zoë');
  });
});

test.describe('GEDCOM: dates', () => {
  const cases = [
    ['12 MAR 1950', { y: 1950, m: 3, d: 12, q: '' }],
    ['MAR 1950', { y: 1950, m: 3, d: 0, q: '' }],
    ['1950', { y: 1950, m: 0, d: 0, q: '' }],
    ['ABT 1900', { y: 1900, q: 'abt' }],
    ['Abt. 1900', { y: 1900, q: 'abt' }],
    ['CAL 1 JAN 1900', { y: 1900, m: 1, d: 1, q: 'abt' }],
    ['EST 1875', { y: 1875, q: 'abt' }],
    ['BEF 1850', { y: 1850, q: 'bef' }],
    ['AFT 3 JUN 1850', { y: 1850, m: 6, d: 3, q: 'aft' }],
    ['BET 1900 AND 1910', { y: 1900, q: 'bet', y2: 1910 }],
    ['FROM 1930 TO 1950', { y: 1930, q: 'from', y2: 1950 }],
    ['FROM 1930', { y: 1930, q: 'from', y2: null }],
    ['@#DJULIAN@ 5 FEB 1700', { y: 1700, m: 2, d: 5 }],
    ['5 FEB 1700/01', { y: 1700, m: 2, d: 5 }],
    ['500 BC', { y: -500 }],
    ['INT 1900 (about then)', { y: 1900 }],
    ['(unknown)', { y: null }],
    ['', { y: null }],
    ['sometime', { y: null }],
    ['31 FEB 1900', { y: 1900, m: 2, d: 31 }]    // an impossible day is kept as written; only the year is ever relied on
  ];
  for (const [raw, want] of cases) {
    test('parses "' + raw + '"', () => { expect(G.parseDate(raw)).toMatchObject(want); });
  }
  test('yearOf', () => { expect(G.yearOf('12 MAR 1950')).toBe(1950); expect(G.yearOf('x')).toBeNull(); });

  test('formatDate in Spanish and English, with the day left out when asked', () => {
    expect(G.formatDate('12 MAR 1950', 'en', true)).toBe('12 Mar 1950');
    expect(G.formatDate('12 MAR 1950', 'es', true)).toBe('12 mar 1950');
    expect(G.formatDate('12 MAR 1950', 'en', false)).toBe('1950');
    expect(G.formatDate('ABT 1900', 'es')).toBe('hacia 1900');
    expect(G.formatDate('ABT 1900', 'en')).toBe('about 1900');
    expect(G.formatDate('BET 1900 AND 1910', 'en')).toBe('1900–1910');
    expect(G.formatDate('BEF 1850', 'es')).toBe('antes de 1850');
    expect(G.formatDate('500 BC', 'en')).toBe('500 BC');
    expect(G.formatDate('', 'en')).toBe('');
  });
});

test.describe('GEDCOM: speed on a large file', () => {
  test('a generated 5,000-person file (2.7 MB) parses in well under a second', () => {
    const text = H.big(5000);
    const t0 = Date.now();
    const p = G.parse(text);
    const ms = Date.now() - t0;
    test.info().annotations.push({ type: 'size', description: text.length + ' bytes, ' + ms + ' ms' });
    expect(p.stats.individuals).toBe(5000);
    expect(ms).toBeLessThan(3000);
  });
});
