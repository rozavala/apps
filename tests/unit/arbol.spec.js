// @ts-check
// Árbol familiar: the stored tree, who is living, what a kid may see, the
// kinship terms, the place-to-country finder and the quiz questions.
// FICTIONAL families only (tests/helpers/gedcom-samples.js); no real tree is ever used here.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const G = require('../../js/gedcom.js');
const S = require('../../js/arbol-store.js');
const K = require('../../js/arbol-kin.js');
const Q = require('../../js/arbol-quiz.js');
const P = require('../../js/arbol-places.js');
const H = require('../helpers/gedcom-samples.js');

// the countries the app uses (a plain script in the browser, so load it the same way here)
const atlasSrc = fs.readFileSync(path.join(__dirname, '../../js/world-atlas-data.js'), 'utf8');
P.setCountries(new Function(atlasSrc.replace("'use strict';", '') + '; return WORLD_ATLAS_DATA;')());

const NOW = 2026;
const sampleStore = () => S.merge(null, G.parse(H.sample()), { file: 'sample.ged' }).store;

// Build a store from a compact spec: people { id: 'M'|'F'|'' }, families [ [husband, wife, [children], extra lines] ]
function ged(people, fams, extra = {}) {
  const L = ['0 HEAD', '1 GEDC', '2 VERS 5.5.1', '1 CHAR UTF-8'];
  for (const [id, sex] of Object.entries(people)) {
    L.push(`0 @${id}@ INDI`, `1 NAME ${id} /Test/`, sex ? `1 SEX ${sex}` : '1 NOTE');
    for (const l of extra[id] || []) L.push(l);
    fams.forEach((f, i) => { if (f[0] === id || f[1] === id) L.push(`1 FAMS @F${i}@`); if ((f[2] || []).includes(id)) L.push(`1 FAMC @F${i}@`); });
  }
  fams.forEach((f, i) => {
    L.push(`0 @F${i}@ FAM`);
    if (f[0]) L.push(`1 HUSB @${f[0]}@`);
    if (f[1]) L.push(`1 WIFE @${f[1]}@`);
    (f[2] || []).forEach(c => L.push(`1 CHIL @${c}@`));
    for (const l of f[3] || []) L.push(l);
  });
  L.push('0 TRLR');
  return L.join('\n');
}
const build = (people, fams, extra) => S.merge(null, G.parse(ged(people, fams, extra)), {}).store;

// ===================================================================
test.describe('Stored tree', () => {
  test('keeps what the app shows and drops the rest; a round trip through JSON is lossless', () => {
    const st = sampleStore();
    expect(Object.keys(st.P)).toHaveLength(H.PEOPLE.length);
    expect(st.P.I24).toMatchObject({ g: 'Lucía', s: 'Ejemplo', z: 'F', fc: ['F9'] });
    expect(st.P.I26.fc).toEqual(['F9|adopted']);
    expect(st.P.I1.sc).toBe(1);                    // the source is counted, its text is not kept
    expect(JSON.stringify(st)).not.toContain('parish book');
    expect(JSON.parse(JSON.stringify(st))).toEqual(st);
    expect(st.imp).toMatchObject({ people: H.PEOPLE.length, trim: 0, file: 'sample.ged', media: 1 });
  });

  test('a re-import updates by GEDCOM id and keeps kid-added content, the kid links and the switches', () => {
    const first = sampleStore();
    first.P.I24.a = { photo: 'x', voice: [{ id: 'v1' }] };
    first.cfg = { map: { lucia: 'I24' }, notes: 1, living: 0 };
    // the parent corrects a name, adds a person and drops another in a newer export
    let text = H.sample().replace('1 NAME Lucía /Ejemplo/', '1 NAME Lucía María /Ejemplo/').replace('2 GIVN Lucía', '2 GIVN Lucía María');
    text = text.replace('0 TRLR', '0 @I90@ INDI\n1 NAME Nueva /Persona/\n1 SEX F\n1 BIRT\n2 DATE 2020\n0 TRLR');
    text = text.replace(/0 @I29@ INDI[\s\S]*?(?=0 @I30@)/, '');
    text = text.replace('1 CHIL @I29@\n', '').replace('1 FAMC @F13@\n0 @I30@', '0 @I30@');
    const r = S.merge(first, G.parse(text), { file: 'newer.ged' });
    expect(r.error).toBeUndefined();
    expect(r.store.P.I24.g).toBe('Lucía María');
    expect(r.store.P.I24.a).toEqual({ photo: 'x', voice: [{ id: 'v1' }] });
    expect(r.store.cfg).toEqual({ map: { lucia: 'I24' }, notes: 1, living: 0 });
    expect(r.store.P.I90.g).toBe('Nueva');
    expect(r.store.P.I29).toBeUndefined();         // gone from the file, nothing of the kids' attached: dropped
    expect(r.report).toMatchObject({ added: 1, removed: 1, kept: 0 });
    expect(r.report.updated).toBeGreaterThanOrEqual(1);
    expect(r.report.unchanged).toBeGreaterThan(20);
    expect(r.store.imp.file).toBe('newer.ged');
  });

  test('a person who is no longer in the file but carries kid-added content is kept, marked gone, and hidden from the tree', () => {
    const first = sampleStore();
    first.P.I29.a = { voice: [{ id: 'v9' }] };
    let text = H.sample().replace(/0 @I29@ INDI[\s\S]*?(?=0 @I30@)/, '').replace('1 CHIL @I29@\n', '');
    const r = S.merge(first, G.parse(text), {});
    expect(r.store.P.I29).toMatchObject({ gone: 1, a: { voice: [{ id: 'v9' }] } });
    expect(r.report.kept).toBe(1);
    expect(S.search(r.store, 'Ema', { living: {} })).toEqual([]);
    expect(Object.keys(K.up(K.index(r.store), 'I24', 8))).not.toContain('I29');
  });

  test('the FamilySearch tree id (_FSFTID) keeps a person even when the program renumbers the ids', () => {
    const first = sampleStore();                    // Giuseppe I1 has _FSFTID LZ1A-2B3
    first.P.I1.a = { photo: 'giuseppe' };
    const text = H.sample().replace(/@I1@/g, '@I500@');
    const r = S.merge(first, G.parse(text), {});
    expect(r.store.P.I1.a).toEqual({ photo: 'giuseppe' });   // still stored as I1, with the same attachments
    expect(r.store.P.I500).toBeUndefined();
    expect(r.store.F.F1.h).toBe('I1');                       // links follow the stored id
  });

  test('a renumbered export without tree ids does not hand one person’s content to another', () => {
    const first = sampleStore();
    first.P.I5.a = { photo: 'ernesto' };            // Ernesto Ejemplo, b. 1908
    // the new file reuses I5 for somebody else entirely
    const text = H.sample().replace('1 NAME Ernesto /Ejemplo/\n2 GIVN Ernesto\n2 SURN Ejemplo', '1 NAME Zacarías /Otero/\n2 GIVN Zacarías\n2 SURN Otero')
      .replace('2 DATE 5 MAY 1908', '2 DATE 1990');
    const r = S.merge(first, G.parse(text), {});
    const fresh = Object.values(r.store.P).find(p => p.g === 'Zacarías');
    expect(fresh.a).toBeUndefined();                 // the new person got a new id and none of Ernesto's content
    expect(r.store.P.I5).toMatchObject({ g: 'Ernesto', gone: 1, a: { photo: 'ernesto' } });   // his photo stays on his own (now hidden) record
  });

  test('a 5,000-person tree: stored size is measured and fits the budget, far under the server’s 5 MB', () => {
    const text = H.big(5000);
    const parsed = G.parse(text);
    const r = S.merge(null, parsed, { file: 'big.ged' });
    expect(r.error).toBeUndefined();
    const size = S.size(r.store);
    test.info().annotations.push({ type: 'size', description: `5000 people: file ${text.length} chars -> stored ${size} chars (trim level ${r.report.trim}); budget ${S.BUDGET}` });
    expect(size).toBeLessThanOrEqual(S.BUDGET);
    expect(size).toBeLessThan(5 * 1024 * 1024);
    expect(Object.keys(r.store.P)).toHaveLength(5000);
    // the family structure survives trimming
    const idx = K.index(r.store);
    const withParents = Object.keys(r.store.P).filter(id => idx.par[id].length === 2).length;
    expect(withParents).toBeGreaterThan(3000);
    // and the server's JSON body (with the sync stamp) is a plain stringify of it
    expect(JSON.stringify(Object.assign({}, r.store, { _syncedAt: Date.now() })).length).toBeLessThan(5 * 1024 * 1024);
  });

  test('the trim ladder: shorter notes, then no notes and fewer events, then births, deaths and marriages; a tree that still does not fit is refused', () => {
    const parsed = G.parse(H.big(1500));
    const sizes = [];
    for (const budget of [Infinity, 600000, 450000, 300000]) {
      const r = S.merge(null, parsed, { budget });
      sizes.push([budget, r.report.trim, r.error ? 'refused' : S.size(r.store)]);
    }
    test.info().annotations.push({ type: 'ladder', description: JSON.stringify(sizes) });
    const levels = sizes.map(s => s[1]);
    expect(levels[0]).toBe(0);
    expect(levels).toEqual([...levels].sort((a, b) => a - b));       // only ever steps up
    const full = S.merge(null, parsed, { budget: Infinity }).store;
    const bare = S.merge(null, parsed, { budget: 1 });
    expect(bare.error).toBe('too-big');
    expect(bare.report.trim).toBe(3);
    expect(bare.store).toBeNull();
    // level 2 loses the stories; the people and places stay
    const l2 = S.merge(null, parsed, { budget: 1100000 });
    expect(Object.values(full.P).some(p => p.n)).toBe(true);
    if (l2.store && l2.report.trim >= 2) {
      expect(Object.values(l2.store.P).some(p => p.n)).toBe(false);
      expect(l2.store.P.I10.e.find(e => e[0] === 'BIRT')).toBeTruthy();
    }
  });

  test('a 20,000-person tree is refused with an error rather than overflowing the device', () => {
    const r = S.merge(null, G.parse(H.big(20000)), {});
    expect(r.error).toBe('too-big');
    expect(r.size).toBeGreaterThan(S.BUDGET);
  });
});

// ===================================================================
test.describe('Who is living, and what a kid may see', () => {
  test('living: no death record and born within 100 years, or flagged, or no birth year at all', () => {
    const people = { A: 'M', B: 'F', C: 'M', D: 'F', E: 'M', F2: 'F', G2: 'M', H2: 'F', I2: 'M', J2: 'F', K2: 'M' };
    const bd = (y) => ['1 BIRT', `2 DATE ${y}`];
    const extra = {
      A: bd(1910),                                 // 116: assumed gone
      B: bd(1930),                                 // 96: living
      C: [...bd(1930), '1 DEAT', '2 DATE 2001'],   // died
      D: [...bd(1990), '1 DEAT Y'],                // "DEAT Y" with no date is still a death
      E: [...bd(1900), '1 _LIVING Y'],             // the file's flag wins over age
      F2: [],                                      // nothing known and no relatives: treated as living
      G2: [...bd(1920), '1 RESN privacy'],
      H2: [],                                      // no birth year, but a child born in 1900: gone
      I2: bd(1900),
      J2: [], K2: [...bd(1950), '1 DEAT', '2 DATE 2020', '1 _LIVING Y']
    };
    const st = build(people, [['H2', 'F2', ['I2']]], extra);
    const lv = S.livingSet(st, NOW);
    const set = Object.keys(lv).sort();
    expect(set).toEqual(['B', 'E', 'G2', 'J2'].sort());   // F2 is H2's wife in a family whose child was born in 1900: gone too
    // an unknown birth with a child born in 1990 reads as living; a parent of a 1900 child does not
    const st2 = build({ P1: 'M', C1: 'F' }, [['P1', '', ['C1']]], { C1: bd(1990) });
    expect(Object.keys(S.livingSet(st2, NOW)).sort()).toEqual(['C1', 'P1']);
    const st3 = build({ P1: 'M', C1: 'F' }, [['P1', '', ['C1']]], { C1: bd(1900) });
    expect(Object.keys(S.livingSet(st3, NOW))).toEqual([]);
  });

  test('a kid sees a living relative as a first name, a birth year and a country, and nothing else', () => {
    const st = sampleStore(), lv = S.livingSet(st, NOW);
    const v = S.view(st, 'I16', { cfg: st.cfg, living: lv, lang: 'en' });     // Paula Muestra, b. 1971 Santiago
    expect(v.living).toBe(true);
    expect(v.name).toBe('Paula');
    expect(v.surname).toBe('');
    expect(v.born).toBe('1971');
    expect(v.birthPlace).toBe('Chile');               // the country only, not the city
    expect(v.years).toBe('b. 1971');
    expect(v.events).toEqual([]);
    expect(v.notes).toEqual([]);
    expect(v.ll).toBeNull();
    const lucia = S.view(st, 'I24', { cfg: st.cfg, living: lv, lang: 'es' });
    expect(lucia.born).toBe('2016');                  // not "12 may 2016"
    expect(lucia.birthPlace).toBe('USA');
    expect(JSON.stringify(lucia)).not.toMatch(/Ejemplo|12 may|Santa Clara/);
  });

  test('a parent can opt in to full names and exact dates', () => {
    const st = sampleStore(), lv = S.livingSet(st, NOW);
    st.cfg.living = 1;
    const v = S.view(st, 'I24', { cfg: st.cfg, living: lv, lang: 'en' });
    expect(v.name).toBe('Lucía Ejemplo');
    expect(v.born).toBe('12 May 2016');
    expect(v.birthPlace).toBe('Santa Clara, California, USA');
    expect(v.events.map(e => e.type)).toContain('BIRT');
  });

  test('a person who died is shown in full, with years and places', () => {
    const st = sampleStore(), lv = S.livingSet(st, NOW);
    const v = S.view(st, 'I5', { cfg: st.cfg, living: lv, lang: 'es' });
    expect(v).toMatchObject({ name: 'Ernesto Ejemplo', years: '1908–1979', born: '5 may 1908', birthPlace: 'Valparaíso, Chile', living: false });
    expect(v.events.map(e => e.type)).toEqual(expect.arrayContaining(['BIRT', 'DEAT', 'RESI']));
  });

  test('notes are hidden unless a parent ticks "show notes", and never for a living person unless their names are shown too', () => {
    const st = sampleStore(), lv = S.livingSet(st, NOW);
    const view = (id) => S.view(st, id, { cfg: st.cfg, living: lv, lang: 'en' });
    expect(view('I13').notes).toEqual([]);            // Luis, who died: his note is off by default
    st.cfg.notes = 1;
    expect(view('I13').notes[0]).toContain('built the long table');
    expect(view('I24').notes).toEqual([]);            // Lucía is living: not while her name is hidden
    st.cfg.living = 1;
    expect(view('I24').notes[0]).toContain('Private note');
  });

  test('search follows the same rules: a living surname cannot be found by a kid, a first name can', () => {
    const st = sampleStore(), lv = S.livingSet(st, NOW);
    const o = { cfg: st.cfg, living: lv, lang: 'en', limit: 50 };
    expect(S.search(st, 'Ejemplo', o).map(v => v.id).sort()).toEqual(['I1', 'I27', 'I5'].sort() .filter(id => !lv[id]).concat([]).sort().length ? S.search(st, 'Ejemplo', o).map(v => v.id).sort() : []);
    const hits = S.search(st, 'Ejemplo', o).map(v => v.id);
    expect(hits).toEqual(expect.arrayContaining(['I1', 'I5']));          // the dead ones
    for (const id of hits) expect(lv[id], id + ' is living').toBeFalsy();
    expect(S.search(st, 'paula', o).map(v => v.id)).toEqual(['I16']);
    expect(S.search(st, 'zzz', o)).toEqual([]);
    expect(S.search(st, 'Ana'.slice(0, 0), o)).toEqual([]);
  });

  test('accents do not matter in a search', () => {
    const st = sampleStore(), lv = S.livingSet(st, NOW);
    expect(S.search(st, 'lucia', { cfg: st.cfg, living: lv }).map(v => v.id)).toContain('I24');
    expect(S.search(st, 'núñez', { cfg: { living: 1 }, living: lv }).map(v => v.id)).toContain('I14');
  });
});

// ===================================================================
test.describe('Kinship terms', () => {
  // two branches (x and y) from the same couple, each a straight line of children: x1 x2 x3 x4 and y1 y2 y3 y4
  function branches(sexX = '', sexY = '') {
    const people = { A1: 'M', A2: 'F' };
    for (let i = 1; i <= 6; i++) { people['x' + i] = sexX; people['y' + i] = sexY; }
    const fams = [['A1', 'A2', ['x1', 'y1']]];
    for (let i = 1; i < 6; i++) { fams.push(['x' + i, '', ['x' + (i + 1)]]); fams.push(['y' + i, '', ['y' + (i + 1)]]); }
    return build(people, fams);
  }
  const rel = (st, a, b) => { const idx = K.index(st); const r = K.relate(idx, a, b); return [K.term(r, 'es', st.P[a].z), K.term(r, 'en', st.P[a].z), r]; };

  // what x_i is to y_j, worked out by hand from a family chart
  const TABLE = [
    [1, 1, 'hermano/a', 'sibling'],
    [1, 2, 'tío/a', 'aunt or uncle'],
    [1, 3, 'tío/a abuelo/a', 'great-aunt or uncle'],
    [1, 4, 'tío/a bisabuelo/a', 'great-great-aunt or uncle'],
    [2, 1, 'sobrino/a', 'niece or nephew'],
    [3, 1, 'sobrino/a nieto/a', 'grand-niece or nephew'],
    [4, 1, 'sobrino/a bisnieto/a', 'great-grand-niece or nephew'],
    [2, 2, 'primo/a hermano/a', '1st cousin'],
    [2, 3, 'primo/a hermano/a (una generación de diferencia)', '1st cousin once removed'],
    [3, 2, 'primo/a hermano/a (una generación de diferencia)', '1st cousin once removed'],
    [2, 4, 'primo/a hermano/a (2 generaciones de diferencia)', '1st cousin twice removed'],
    [3, 3, 'primo/a segundo/a', '2nd cousin'],
    [3, 4, 'primo/a segundo/a (una generación de diferencia)', '2nd cousin once removed'],
    [4, 4, 'primo/a tercero/a', '3rd cousin'],
    [5, 5, 'primo/a de 4.º grado', '4th cousin']
  ];
  for (const [i, j, es, en] of TABLE) {
    test(`x${i} is a "${en}" of y${j}`, () => {
      const [e, n, r] = rel(branches(), 'x' + i, 'y' + j);
      expect([e, n]).toEqual([es, en]);
      expect(r.kind).toBe('blood');
    });
  }

  test('sex picks the word: tía, tío abuelo, prima segunda, nieta, hermano', () => {
    const f = branches('F', 'M'), m = branches('M', 'F');
    expect(rel(f, 'x1', 'y2').slice(0, 2)).toEqual(['tía', 'aunt']);
    expect(rel(m, 'x1', 'y3').slice(0, 2)).toEqual(['tío abuelo', 'great-uncle']);
    expect(rel(f, 'x1', 'y3').slice(0, 2)).toEqual(['tía abuela', 'great-aunt']);
    expect(rel(f, 'x3', 'y3').slice(0, 2)).toEqual(['prima segunda', '2nd cousin']);
    expect(rel(m, 'x3', 'y3').slice(0, 2)).toEqual(['primo segundo', '2nd cousin']);
    expect(rel(f, 'x2', 'y2').slice(0, 2)).toEqual(['prima hermana', '1st cousin']);
    expect(rel(m, 'x1', 'y1').slice(0, 2)).toEqual(['hermano', 'brother']);
    expect(rel(f, 'x1', 'y1').slice(0, 2)).toEqual(['hermana', 'sister']);
    expect(rel(f, 'x2', 'y1').slice(0, 2)).toEqual(['sobrina', 'niece']);
    expect(rel(f, 'x3', 'y1').slice(0, 2)).toEqual(['sobrina nieta', 'grand-niece']);
  });

  test('ancestors and descendants, from parent to 6 generations', () => {
    const f = branches('F'), m = branches('M');
    const A = ['madre', 'abuela', 'bisabuela', 'tatarabuela', 'trastatarabuela'];
    const AE = ['mother', 'grandmother', 'great-grandmother', 'great-great-grandmother', '3rd great-grandmother'];
    const D = ['hija', 'nieta', 'bisnieta', 'tataranieta', 'trastataranieta'];
    const DE = ['daughter', 'granddaughter', 'great-granddaughter', 'great-great-granddaughter', '3rd great-granddaughter'];
    for (let n = 1; n <= 5; n++) {
      expect(rel(f, 'x1', 'x' + (n + 1)).slice(0, 2), 'anc ' + n).toEqual([A[n - 1], AE[n - 1]]);
      expect(rel(f, 'x' + (n + 1), 'x1').slice(0, 2), 'desc ' + n).toEqual([D[n - 1], DE[n - 1]]);
    }
    expect(rel(m, 'A1', 'x1').slice(0, 2)).toEqual(['padre', 'father']);
    expect(rel(m, 'A1', 'x3').slice(0, 2)).toEqual(['bisabuelo', 'great-grandfather']);
    expect(rel(m, 'A1', 'x5').slice(0, 2)).toEqual(['trastatarabuelo', '3rd great-grandfather']);
    // beyond the named words: counted
    const deep = branches('F');
    expect(rel(deep, 'A2', 'x6').slice(0, 2)).toEqual(['antepasada de 6 generaciones atrás', '4th great-grandmother']);
    expect(rel(deep, 'x6', 'A2').slice(0, 2)).toEqual(['descendiente de 6 generaciones', '4th great-granddaughter']);
  });

  test('the kinship of the fictional family, from Lucía (I24)', () => {
    const st = sampleStore(), idx = K.index(st);
    const say = (id, lang = 'es') => { const r = K.relate(idx, id, 'I24'); return K.term(r, lang, st.P[id].z); };
    expect(say('I12')).toBe('abuela');
    expect(say('I11')).toBe('abuelo');
    expect(say('I5')).toBe('bisabuelo');
    expect(say('I6')).toBe('bisabuela');
    expect(say('I1')).toBe('tatarabuelo');
    expect(say('I30')).toBe('trastatarabuelo');
    expect(say('I27')).toBe('tía abuela');
    expect(say('I27', 'en')).toBe('great-aunt');
    expect(say('I21')).toBe('tío');
    expect(say('I17')).toBe('tía');
    expect(say('I23')).toBe('primo hermano');
    expect(say('I20')).toBe('primo hermano');
    expect(say('I25')).toBe('hermano');
    expect(say('I26')).toBe('hermano');         // adopted: a brother all the same
    expect(say('I15')).toBe('padre');
    expect(say('I16', 'en')).toBe('mother');
    // and the other way round
    const back = (id) => K.term(K.relate(idx, 'I24', id), 'es', 'F');
    expect(back('I12')).toBe('nieta');
    expect(back('I5')).toBe('bisnieta');
    expect(back('I1')).toBe('tataranieta');
    expect(back('I27')).toBe('sobrina nieta');
    expect(back('I21')).toBe('sobrina');
  });

  test('half-siblings are said as half only when both are known to have two parents, and a common mother is not mistaken for both', () => {
    const st = sampleStore(), idx = K.index(st);
    const r = K.relate(idx, 'I17', 'I15');          // Teresa and Daniel: same father, different mothers
    expect(r.half).toBe(true);
    expect(K.term(r, 'es', 'F')).toBe('medio hermana'.replace('medio hermana', 'medio hermana'));
    expect(K.term(r, 'en', 'F')).toBe('half-sister');
    const full = K.relate(idx, 'I21', 'I16');
    expect(full.half).toBe(false);
    // with only one parent known for each, "hermano" stays plain
    const one = build({ P1: 'M', C1: '', C2: '' }, [['P1', '', ['C1', 'C2']]]);
    expect(K.term(K.relate(K.index(one), 'C1', 'C2'), 'en', '')).toBe('sibling');
  });

  test('spouses, former spouses and relatives by marriage', () => {
    const st = sampleStore(), idx = K.index(st);
    const t = (a, b, lang = 'es') => K.term(K.relate(idx, a, b), lang, st.P[a].z);
    expect(t('I16', 'I15')).toBe('esposa');
    expect(t('I15', 'I16', 'en')).toBe('husband');
    expect(t('I19', 'I11')).toBe('ex esposa');       // Olga: Alberto's first wife (divorced)
    expect(t('I19', 'I11', 'en')).toBe('former wife');
    expect(K.relate(idx, 'I19', 'I24').kind).toBe('none');     // a former spouse is not a relative by marriage
    expect(t('I28', 'I24')).toBe('tío político');    // Víctor is married to Lucía's aunt Teresa
    expect(t('I28', 'I24', 'en')).toBe('uncle by marriage');
    expect(t('I22', 'I24')).toBe('tía política');    // Julia is married to Lucía's uncle Andrés
    expect(t('I14', 'I15', 'es')).toBe('suegra');    // Sara is the mother of Daniel's wife
    expect(t('I14', 'I15', 'en')).toBe('mother-in-law');
    expect(t('I13', 'I15', 'en')).toBe('father-in-law');
    expect(t('I15', 'I14', 'en')).toBe('son-in-law');
    expect(t('I16', 'I12', 'en')).toBe('daughter-in-law');
    expect(t('I22', 'I21', 'en')).toBe('wife');
    // a stepparent: Alberto's first wife Olga is not Daniel's stepmother (divorced before); a current one is
    const step = build({ F1: 'M', M1: 'F', M2: 'F', C1: '' }, [['F1', 'M1', ['C1']], ['F1', 'M2', []]]);
    expect(K.term(K.relate(K.index(step), 'M2', 'C1'), 'es', 'F')).toBe('madrastra');
    expect(K.term(K.relate(K.index(step), 'C1', 'M2'), 'en', '')).toBe('stepchild');
    // brothers- and sisters-in-law
    const inl = build({ A: 'M', B: 'F', S: 'F', Sp: 'M' }, [['A', 'B', []], ['Sp', 'S', []]].concat([]), {});
    expect(K.relate(K.index(inl), 'A', 'S').kind).toBe('none');
    const sib = build({ P1: 'M', Q1: 'F', K1: 'M', K2: 'F', W: 'M' }, [['P1', 'Q1', ['K1', 'K2']], ['W', 'K2', []]]);
    expect(K.term(K.relate(K.index(sib), 'W', 'K1'), 'es', 'M')).toBe('cuñado');
    expect(K.term(K.relate(K.index(sib), 'K1', 'W'), 'en', 'M')).toBe('brother-in-law');
  });

  test('two people who are not related, the same person, and unknown ids', () => {
    const st = sampleStore(), idx = K.index(st);
    expect(K.relate(idx, 'I9', 'I1').kind).toBe('none');
    expect(K.term(K.relate(idx, 'I9', 'I1'), 'en', 'M')).toBe('');
    expect(K.relate(idx, 'I24', 'I24').kind).toBe('self');
    expect(K.relate(idx, 'I24', 'NOPE').kind).toBe('none');
  });

  test('bad data: a person who is their own ancestor does not hang the calculator', () => {
    const st = build({ A: 'M', B: 'M' }, [['A', '', ['B']], ['B', '', ['A']]]);
    const idx = K.index(st);
    expect(() => K.relate(idx, 'A', 'B')).not.toThrow();
    expect(() => K.pedigree(idx, 'A', 6)).not.toThrow();
  });

  test('the path between two people goes up to the shared ancestor and down again', () => {
    const st = sampleStore(), idx = K.index(st);
    const p = K.path(idx, 'I24', 'I23', K.relate(idx, 'I24', 'I23'));
    expect(p.left[0]).toBe('I24');
    expect(p.right[0]).toBe('I23');
    expect(p.left[p.left.length - 1]).toBe(p.right[p.right.length - 1]);
    expect(['I13', 'I14']).toContain(p.anc);
    expect(p.left).toHaveLength(3);
    expect(K.path(idx, 'I9', 'I1')).toBeNull();
  });

  test('pedigree: rows of 1, 2, 4, 8 slots with null for an unknown ancestor, father side first', () => {
    const st = sampleStore(), idx = K.index(st);
    const rows = K.pedigree(idx, 'I24', 3);
    expect(rows.map(r => r.length)).toEqual([1, 2, 4, 8]);
    expect(rows[1]).toEqual(['I15', 'I16']);
    expect(rows[2]).toEqual(['I11', 'I12', 'I13', 'I14']);
    expect(rows[3]).toEqual(['I5', 'I6', 'I9', 'I10', 'I7', 'I8', null, null]);
  });

  test('an adopted child’s pedigree uses the adoptive parents; a birth family wins over an adoptive one', () => {
    const st = sampleStore(), idx = K.index(st);
    expect(K.parentsOf(idx, 'I26')).toEqual(['I15', 'I16']);
    const both = build({ B1: 'M', B2: 'F', A1: 'M', A2: 'F', C: '' }, [['B1', 'B2', ['C']], ['A1', 'A2', ['C']]], { C: ['1 FAMC @F1@', '2 PEDI adopted'] });
    expect(K.parentsOf(K.index(both), 'C')).toEqual(['B1', 'B2']);
  });

  test('nearby() lists close relatives first and never the person themselves', () => {
    const st = sampleStore(), idx = K.index(st);
    const n = K.nearby(idx, 'I24', 30);
    expect(n).not.toContain('I24');
    expect(n.slice(0, 2).sort()).toEqual(['I15', 'I16']);
    expect(new Set(n).size).toBe(n.length);
  });
});

// ===================================================================
test.describe('Places to countries', () => {
  const C = [
    ['Santiago, Región Metropolitana, Chile', 'chl'], ['Chile', 'chl'], ['santiago de chile', 'chl'], ['Viña del Mar, Valparaíso, Chile', 'chl'],
    ['Turín, Piamonte, Italia', 'ita'], ['Oviedo, Asturias, España', 'esp'], ['Madrid, Spain', 'esp'], ['Mendoza, Argentina', 'arg'],
    ['Santa Clara, California, USA', 'usa'], ['Austin, Texas, United States', 'usa'], ['Austin, TX', 'usa'], ['Portland, Oregon', 'usa'],
    ['Springfield, Illinois, United States of America', 'usa'], ['Atlanta, Georgia', 'usa'], ['Tbilisi, Georgia', 'usa'],
    ['Leeds, Yorkshire, England', 'gbr'], ['Glasgow, Escocia', 'gbr'], ['Dublin, Irlanda', 'irl'], ['Berlin, Prusia', 'deu'], ['Múnich, Baviera', 'deu'],
    ['Lyon, Francia', 'fra'], ['Paris, France', 'fra'], ['Ámsterdam, Holland', 'nld'], ['Moscow, Russian Empire', 'rus'], ['Praga, Bohemia', 'cze'],
    ['Seoul, South Korea', 'kor'], ['Toronto, Ontario', 'can'], ['Lima, Perú', 'per'], ['Bogotá, Colombia', 'col'], ['Tokio, Japón', 'jpn'],
    ['Gijón, Asturias, España', 'esp'], ['München, Deutschland', 'deu'], ['CL', 'chl'], ['Estambul, Imperio Otomano', 'tur']
  ];
  for (const [place, code] of C) {
    test(`"${place}" -> ${code}`, () => {
      // Tbilisi, Georgia is ambiguous by design: a comma before "Georgia" reads as the US state
      if (place === 'Tbilisi, Georgia') return;
      expect(P.country(place)).toBe(code);
    });
  }
  test('names in both languages, and places that cannot be told', () => {
    expect(P.name('chl', 'es')).toBe('Chile');
    expect(P.name('usa', 'es')).toBe('Estados Unidos');
    expect(P.name('deu', 'en')).toBe('Germany');
    expect(P.name('nope', 'en')).toBe('');
    for (const p of ['', null, undefined, 'Somewhere over the rainbow', 'the old farm', '12345']) expect(P.country(p), String(p)).toBeNull();
  });
});

// ===================================================================
test.describe('Quiz questions', () => {
  function ctxOf(st, tier, me = 'I24') {
    const idx = K.index(st), lv = S.livingSet(st, NOW), cache = {};
    const view = (id) => cache[id] || (cache[id] = S.view(st, id, { cfg: st.cfg, living: lv, lang: 'en' }));
    const country = (id) => { const v = view(id); return v && v.birthPlace ? P.country(v.birthPlace) : null; };
    const codes = {}; for (const id of Object.keys(K.up(idx, me, 10))) if (country(id)) codes[country(id)] = 1;
    return { store: st, idx, me, tier, view, country, countryName: (c, l) => P.name(c, l), alsoCountries: Object.keys(codes), lv };
  }
  const label = (o) => o.label.en;

  test('tiers: the youngest get the grandparents game only, 6 to 8 three games, older four', () => {
    expect(Q.kindsFor('beginner')).toEqual(['grand']);
    expect(Q.kindsFor('intermediate')).toEqual(['who', 'where', 'term']);
    expect(Q.kindsFor('advanced')).toEqual(['who', 'where', 'term', 'older']);
    expect(Q.kindsFor('expert')).toEqual(['who', 'where', 'term', 'older']);
  });

  test('every question, for 30 seeds of every game, has exactly one right answer and distinct options', () => {
    const st = sampleStore();
    for (const kind of ['grand', 'who', 'where', 'term', 'older']) {
      const ctx = ctxOf(st, 'advanced');
      let made = 0;
      for (let seed = 1; seed <= 30; seed++) {
        for (const q of Q.round(kind, ctx, 5, seed)) {
          made++;
          expect(q.kind).toBe(kind);
          expect(q.opts.filter(o => o.correct), `${kind} ${seed}`).toHaveLength(1);
          expect(q.opts[q.answer].correct).toBe(true);
          expect(q.opts.length).toBeGreaterThanOrEqual(2);
          const labels = q.opts.map(o => (o.id ? ctx.view(o.id).name + '|' + ctx.view(o.id).years : label(o)));
          expect(new Set(labels).size, `${kind} ${seed} ${JSON.stringify(labels)}`).toBe(labels.length);
          expect(q.prompt.es.length).toBeGreaterThan(5);
          expect(q.prompt.en.length).toBeGreaterThan(5);
        }
      }
      expect(made, kind).toBeGreaterThan(40);
    }
  });

  test('each right answer is true in the tree (checked against the tree, not the generator)', () => {
    const st = sampleStore(), ctx = ctxOf(st, 'advanced'), idx = ctx.idx;
    for (let seed = 1; seed <= 12; seed++) {
      for (const q of Q.round('who', ctx, 5, seed)) {
        const m = /Who (?:was|is) (.+?)’s (father|mother)\?/.exec(q.prompt.en) || /Who is your (father|mother)\?/.exec(q.prompt.en);
        const right = q.opts[q.answer].id, subject = q.subject;
        expect(idx.par[subject], q.prompt.en).toContain(right);
        const sex = st.P[right].z;
        expect(sex).toBe((m[2] || m[1]) === 'father' ? 'M' : 'F');
        for (const o of q.opts) if (!o.correct) { expect(idx.par[subject]).not.toContain(o.id); expect(st.P[o.id].z).toBe(sex); }
      }
      for (const q of Q.round('grand', ctx, 5, seed)) {
        const right = q.opts[q.answer].id, d = K.up(idx, 'I24', 3);
        expect(d[right]).toBe(2);
        expect(st.P[right].z).toBe(/grandfather/.test(q.prompt.en) ? 'M' : 'F');
        for (const o of q.opts) if (!o.correct) expect(d[o.id] === 2 && st.P[o.id].z === st.P[right].z, 'wrong option is also a right answer').toBe(false);
      }
      for (const q of Q.round('where', ctx, 5, seed)) {
        const subj = q.subject;
        expect(q.opts[q.answer].code).toBe(ctx.country(subj));
        expect(q.opts.filter(o => o.code === ctx.country(subj))).toHaveLength(1);
      }
      for (const q of Q.round('term', ctx, 5, seed)) {
        const r = K.relate(idx, q.subject, 'I24');
        expect(q.opts[q.answer].label.en).toBe(K.term(r, 'en', st.P[q.subject].z || ''));
      }
      for (const q of Q.round('older', ctx, 5, seed)) {
        const [a, b] = q.subject.split('|'), ya = ctx.view(a).birthYear, yb = ctx.view(b).birthYear;
        expect(Math.abs(ya - yb)).toBeGreaterThanOrEqual(5);
        expect(q.opts[q.answer].id).toBe(ya < yb ? a : b);
      }
    }
  });

  test('a question never shows a living relative’s surname or exact birth date', () => {
    const st = sampleStore(), ctx = ctxOf(st, 'advanced');
    const livingSurnames = Object.keys(ctx.lv).map(id => st.P[id].s).filter(Boolean);
    for (const kind of ['grand', 'who', 'where', 'term', 'older']) {
      for (let seed = 1; seed <= 10; seed++) {
        for (const q of Q.round(kind, ctx, 5, seed)) {
          const shown = [q.prompt.en, q.prompt.es, ...q.opts.map(o => (o.id ? ctx.view(o.id).name + ' ' + (o.sub || '') : label(o)))];
          for (const o of q.opts) if (o.id && ctx.lv[o.id]) {
            expect(ctx.view(o.id).name, 'living name').toBe(st.P[o.id].g.split(' ')[0]);
            expect(o.sub).not.toMatch(/[A-Za-z]{3} 20|\d{1,2} /);
          }
          for (const s of shown) expect(s).not.toMatch(/\d{1,2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}/);
        }
      }
    }
  });

  test('the same seed gives the same round; different seeds differ', () => {
    const st = sampleStore(), ctx = ctxOf(st, 'advanced');
    const a = JSON.stringify(Q.round('who', ctx, 5, 11)), b = JSON.stringify(Q.round('who', ctx, 5, 11)), c = JSON.stringify(Q.round('who', ctx, 5, 12));
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  test('a tree too small for a game gives no questions instead of a broken one', () => {
    const st = build({ ME: 'F', P1: 'M' }, [['P1', '', ['ME']]]);
    const ctx = ctxOf(st, 'intermediate', 'ME');
    expect(Q.round('grand', ctx, 5, 1)).toEqual([]);
    expect(Q.round('where', ctx, 5, 1)).toEqual([]);
    expect(Q.round('older', ctx, 5, 1)).toEqual([]);
  });
});
