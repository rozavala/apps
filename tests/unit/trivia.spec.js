// @ts-check
// Trivia Familiar, part 1 (no browser): the question bank and the game
// maths. Content is the risk, so every question must have a tier, a type
// its answers fit, text and a "did you know?" in both languages, drawings
// and tunes that exist, and pass the restricted-word grep.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '../..');
// The other apps' data, as the page loads it (plain scripts with globals).
['world-atlas-data', 'world-map-data', 'descubre-chile-data', 'lm-songs'].forEach(f => {
  vm.runInThisContext(fs.readFileSync(path.join(ROOT, 'js', f + '.js'), 'utf8').replace(/^'use strict';/m, ''), { filename: f + '.js' });
});
const E = require('../../js/trivia-engine.js');
const Gen = require('../../js/trivia-gen.js');
const Art = require('../../js/trivia-art.js');
const HAND = ['ciencia', 'mundo', 'fe', 'arte'].flatMap(f => require('../../js/trivia-q-' + f + '.js'));
const GEN = Gen.rows();
const ROWS = HAND.concat(GEN);
const BANK = E.build(ROWS);
const G = /** @type {any} */ (globalThis);

// Same pattern as the pre-push grep in CONTRIBUTING.md.
const RESTRICTED = /genero|género|identidad|diversidad|inclusi[oó]n|pronombre|trans |gay|lesbiana|queer|pride|diverso|equidad|justicia social|colonialismo|opres|patriarcado|feminis|woke|diversity|equity|inclusion|gender |lgbt|transgender/i;
// Politics and violence that do not belong in a family quiz.
const OFF_LIMITS = /pinochet|allende|dictadur|dictator|golpe de|\bcoup\b|socialis|comunis|communis|marxis|estallido|plebiscit|esclav|slave|genocid|asesin|masacre|tortur|murder|massacre|torture|slaughter|assassinat|decapit/i;

/** @param {any[]} r */
function strings(r) {
  const out = [r[3], r[4], r[6], r[7]];
  if (Array.isArray(r[5])) r[5].forEach(x => { if (Array.isArray(x)) out.push(x[0], x[1]); else out.push(String(x)); });
  if (r[8] && r[8].s) out.push(r[8].s);
  return out;
}

test.describe('Trivia Familiar: the question bank', () => {

  test('at least 600 questions, ids unique, every subject in every age band', () => {
    expect(ROWS.length).toBeGreaterThanOrEqual(600);
    expect(HAND.length).toBeGreaterThanOrEqual(380);
    const ids = ROWS.map(r => r[0]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(BANK.length).toBe(ROWS.length);
    for (const c of E.CATS) {
      for (const t of [1, 2, 3, 4]) {
        const n = BANK.filter(q => q.cat === c.id && q.tier === t).length;
        expect(n, `${c.id} tier ${t}`).toBeGreaterThanOrEqual(2);
      }
      expect(BANK.filter(q => q.cat === c.id).length, c.id).toBeGreaterThanOrEqual(25);
    }
    // Enough for a long night at each age, across all subjects.
    for (const t of [1, 2, 3, 4]) expect(BANK.filter(q => q.tier === t).length, 'tier ' + t).toBeGreaterThanOrEqual(90);
  });

  test('every question is well formed, in both languages, with a "did you know?"', () => {
    const bad = [];
    ROWS.forEach(r => {
      const why = [];
      const [id, tier, type, qes, qen, ans, fes, fen, x] = r;
      if (!E.catOf(id)) why.push('subject prefix');
      if (![1, 2, 3, 4].includes(tier)) why.push('tier');
      if (!E.TYPES.includes(type)) why.push('type');
      [qes, qen, fes, fen].forEach((s, i) => { if (typeof s !== 'string' || s.trim().length < 3) why.push('text ' + i); });
      if (qes === qen) why.push('question identical in both languages');
      if (fes === fen) why.push('fact identical in both languages');
      if (type === 'tf') { if (typeof ans !== 'boolean') why.push('tf answer'); }
      else {
        if (!Array.isArray(ans)) why.push('answers');
        else {
          const min = type === 'ord' ? 3 : 4;
          if (ans.length < min) why.push('needs ' + min + ' items');
          const keys = ans.map(a => Array.isArray(a) ? a[0] + '|' + a[1] : String(a));
          if (new Set(keys).size !== keys.length) why.push('duplicate answers');
          ans.forEach(a => { if (Array.isArray(a) ? (a.length !== 2 || !a[0] || !a[1]) : !a) why.push('empty answer'); });
          ans.filter(a => typeof a === 'string' && a[0] === '@').forEach(a => { if (!Art.has(a.slice(1))) why.push('missing drawing ' + a); });
        }
      }
      if (type === 'pic' && !(x && Art.has(x.art))) why.push('picture question without a drawing');
      if (x && x.art && !Art.has(x.art)) why.push('missing drawing ' + x.art);
      if (type === 'snd' && !(x && x.tune && Gen.findSong(G.LM_SONGS, x.tune))) why.push('tune not in Little Maestro');
      if (type === 'map') {
        if (!x || !['world', 'cont', 'chile'].includes(x.map) || !Array.isArray(x.o) || x.o.length !== ans.length) why.push('map codes');
        else if (x.map === 'world') x.o.forEach(c => { if (!G.WorldMap.info(c)) why.push('unknown country ' + c); });
        else if (x.map === 'chile') x.o.forEach(c => { if (!G.DC_GEO.regions.some(rg => rg.id === c)) why.push('unknown region ' + c); });
      }
      if (why.length) bad.push(id + ': ' + why.join(', '));
    });
    expect(bad).toEqual([]);
  });

  test('every string passes the restricted-word grep and stays clear of politics and violence', () => {
    const hits = [];
    ROWS.forEach(r => strings(r).forEach(s => {
      if (RESTRICTED.test(s)) hits.push(r[0] + ' (restricted): ' + s);
      if (OFF_LIMITS.test(s)) hits.push(r[0] + ' (off limits): ' + s);
    }));
    expect(hits).toEqual([]);
    // The source files themselves too (comments included).
    ['trivia-engine', 'trivia-gen', 'trivia-art', 'trivia', 'trivia-q-ciencia', 'trivia-q-mundo', 'trivia-q-fe', 'trivia-q-arte'].forEach(f => {
      expect(RESTRICTED.test(fs.readFileSync(path.join(ROOT, 'js', f + '.js'), 'utf8')), f).toBe(false);
    });
  });

  test('answers written as one string are not Spanish-only names', () => {
    // A name that is different in English must be an [es, en] pair, or the
    // English game shows the Spanish word ("Atenas", "Miguel Ángel").
    const esOnly = new Set();
    G.WORLD_ATLAS_DATA.forEach(c => {
      if (c.nameEs !== c.name) esOnly.add(c.nameEs);
      if (c.capitalEs && c.capitalEs !== c.capital) esOnly.add(c.capitalEs);
    });
    ['Miguel Ángel', 'Rafael', 'Pompeya', 'Herodes', 'Salomón', 'Saúl', 'Moisés', 'Noé', 'Nicolás Copérnico', 'Cristóbal Colón',
     'Fernando de Magallanes', 'Julio César', 'César Augusto', 'Nerón', 'Constantino', 'Ptolomeo', 'Aristóteles', 'Pitágoras',
     'Arquímedes', 'Euclides', 'Juan', 'Pedro', 'Pablo', 'Mateo', 'Marcos', 'Lucas', 'José', 'María', 'Jesús'].forEach(n => esOnly.add(n));
    const bad = [];
    ROWS.forEach(r => {
      if (!Array.isArray(r[5])) return;
      r[5].forEach(a => { if (typeof a === 'string' && esOnly.has(a)) bad.push(r[0] + ': ' + a); });
    });
    expect(bad).toEqual([]);
  });

  test('generated "did you know?" lines read well and never claim a full list of borders', () => {
    const bad = [];
    GEN.forEach(r => {
      [r[6], r[7]].forEach(t => {
        if (/\.\./.test(t)) bad.push(r[0] + ' double full stop: ' + t);
        if (/of Chile of|Chile de Chile|chilena de Chile/.test(t)) bad.push(r[0] + ': ' + t);
      });
      if (/limita con (?!países como)/.test(r[6]) || /borders (?!countries such as)/.test(r[7])) bad.push(r[0] + ' border list: ' + r[7]);
    });
    expect(bad).toEqual([]);
    // France is not said to border Brazil (that is French Guiana, overseas).
    const fra = GEN.find(r => r[0] === 'ge-map-fra');
    expect(fra[7]).not.toContain('Brazil');
    expect(fra[8].o).not.toContain('bra');
    // A country with more than one capital uses the atlas's note.
    const zaf = GEN.find(r => r[0] === 'ge-map-zaf');
    expect(zaf[7]).toContain('Cape Town');
  });

  test('less obvious facts for the older players carry a source', () => {
    // Tier-4 questions cite a source, or the passage they quote
    // ("Lucas 2, 1"); pure arithmetic needs neither.
    const t4 = HAND.filter(r => r[1] === 4 && !r[0].startsWith('ma-'));
    const sourced = t4.filter(r => (r[8] && r[8].s) || /\([1-3]? ?[A-ZÁÉÍÓÚ][a-záéíóú]+ \d+[,:]/.test(r[6]));
    expect(sourced.length / t4.length).toBeGreaterThan(0.8);
    HAND.filter(r => r[8] && r[8].s).forEach(r => expect(r[8].s.length, r[0]).toBeGreaterThan(3));
  });

  test('facts agree with the other apps’ data', () => {
    const A = Object.fromEntries(G.WORLD_ATLAS_DATA.map(c => [c.id, c]));
    // Capitals and flags come straight from World Atlas.
    GEN.filter(r => r[0].startsWith('ge-cap-')).forEach(r => {
      const c = A[r[0].slice(7)];
      expect(r[5][0], r[0]).toEqual([c.capitalEs, c.capital]);
      expect(c.capitalNote, r[0] + ' has a capital note, so it is not asked').toBeFalsy();
    });
    // Chile's regions and capitals come from Descubre Chile.
    const R = Object.fromEntries(G.DC_REGIONS.map(r => [r.id.toLowerCase(), r]));
    GEN.filter(r => r[0].startsWith('cl-cap-')).forEach(r => expect(r[5][0], r[0]).toBe(R[r[0].slice(7)].capital));
    expect(GEN.filter(r => r[0].startsWith('cl-reg-')).length).toBe(16);
    // Hand-written facts that other apps also state.
    const byId = Object.fromEntries(HAND.map(r => [r[0], r]));
    expect(byId['cl-17'][5][0]).toBe(String(G.DC_REGIONS.length));
    expect(byId['bi-23'][5][0]).toBe('73');
    expect(byId['ge-15'][5][0][1]).toBe('Vatican City');
    expect(byId['mu-06'][5][0]).toBe('6');
  });

  test('a Christmas night has carols, the Nativity and traditions at every age', () => {
    const xmas = BANK.filter(q => q.cat === 'navidad');
    expect(xmas.length).toBeGreaterThanOrEqual(45);
    [1, 2, 3, 4].forEach(t => expect(xmas.filter(q => q.tier === t).length, 'tier ' + t).toBeGreaterThanOrEqual(5));
    const tunes = xmas.filter(q => q.type === 'snd');
    expect(tunes.length).toBeGreaterThanOrEqual(10);
    tunes.forEach(q => expect(G.LM_SONGS.find(s => s.title === q.tune), q.id).toBeTruthy());
    const text = xmas.map(q => q.q.es + ' ' + q.fact.es).join(' ');
    ['Belén', 'pesebre', 'Viejito Pascuero', 'Reyes Magos', 'Estados Unidos', 'Chile', 'Noche de paz'].forEach(w => expect(text, w).toContain(w));
  });

  test('melodies parse from Little Maestro’s notation', () => {
    // The page plays the first bars of each tune; the same parse the page
    // uses must find notes in every song asked about.
    const STEP = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    GEN.filter(r => r[2] === 'snd').forEach(r => {
      const s = Gen.findSong(G.LM_SONGS, r[8].tune);
      const toks = s.score.rh.split('|').flatMap(b => b.trim().split(/\s+/)).filter(Boolean);
      const notes = toks.map(t => /^(R|([A-G])([#b]?)(\d))(?:\+[A-G][#b]?\d)*([whqes])(\.?)(~?)/.exec(t.replace(/^'+/, ''))).filter(Boolean);
      expect(notes.length, r[0]).toBeGreaterThan(8);
      notes.filter(m => m[1] !== 'R').forEach(m => expect(STEP[m[2]]).not.toBeUndefined());
    });
  });
});

test.describe('Trivia Familiar: the game', () => {
  const players = [
    { id: 'k:Sofía', name: 'Sofía', age: 4, kid: true },
    { id: 'k:Clara', name: 'Clara', age: 10, kid: true },
    { id: 'mama', name: 'Mamá', age: 0, kid: false }
  ];

  test('ages map to tiers; grown-ups play the top tier', () => {
    expect([4, 5, 6, 8, 9, 11, 12, 40, 0].map(E.tierOfAge)).toEqual([1, 1, 2, 2, 3, 3, 4, 4, 4]);
  });

  test('little ones get three choices, others four; the right one is always there', () => {
    const rand = E.rng(5);
    const q = BANK.find(x => x.id === 'ci-12');
    expect(E.choices(q, 1, rand).length).toBe(3);
    expect(E.choices(q, 3, rand).length).toBe(4);
    for (let i = 0; i < 20; i++) expect(E.choices(q, 1 + (i % 4), rand).some(c => c.value === 0)).toBe(true);
    const tf = BANK.find(x => x.type === 'tf');
    expect(E.choices(tf, 1).map(c => c.value)).toEqual([true, false]);
    const ord = BANK.find(x => x.type === 'ord');
    const sh = E.choices(ord, 3, rand);
    expect(sh.map(c => c.value).sort()).toEqual(ord.items.map((_, i) => i));
    expect(sh.every((c, i) => c.value === i)).toBe(false);
    expect(E.isRight(ord, ord.items.map((_, i) => i))).toBe(true);
    expect(E.isRight(ord, [1, 0, 2, 3].slice(0, ord.items.length))).toBe(false);
  });

  test('a pick matches the tier and subjects, and prefers questions never seen', () => {
    const rand = E.rng(9);
    const hist = {};
    const seen = new Set();
    for (let i = 0; i < 30; i++) {
      const q = E.pick(BANK, { tier: 2, cats: ['navidad', 'fe'], hist, rand, used: {} });
      expect(q.tier).toBe(2);
      expect(['navidad', 'fe']).toContain(q.cat);
      expect(seen.has(q.id), 'repeat before the pool ran out').toBe(false);
      seen.add(q.id);
      E.remember(hist, q.id);
      if (seen.size >= BANK.filter(x => x.tier === 2 && ['navidad', 'fe'].includes(x.cat)).length) break;
    }
  });

  test('history keeps the most recent questions and drops the oldest', () => {
    let h = {};
    for (let i = 0; i < E.HISTORY_MAX + 50; i++) h = E.remember(h, 'q' + i);
    expect(Object.keys(h).length).toBe(E.HISTORY_MAX);
    expect(h.q0).toBeUndefined();
    expect(h['q' + (E.HISTORY_MAX + 49)]).toBeGreaterThan(h['q' + (E.HISTORY_MAX + 48)]);
  });

  test('a full game: head start, normal rounds, the steal round and the final', () => {
    const g = E.createGame(BANK, players, { rounds: 3, seed: 4 });
    expect(g.sides.map(s => s.tier)).toEqual([1, 3, 4]);
    expect(g.sides.map(s => s.score)).toEqual([15, 5, 0]);
    expect(E.roundKind(g)).toBe('normal');
    // Round 1: everyone right.
    for (let i = 0; i < 3; i++) {
      const c = E.next(g);
      expect(c.q.tier).toBe(c.side.tier);
      expect(E.timerFor(g, c.side)).toBe([0, 0, 60, 45, 30][c.side.tier]);
      const right = c.q.type === 'tf' ? c.q.truth : c.q.type === 'ord' ? c.q.items.map((_, k) => k) : 0;
      expect(E.answer(g, right).ok).toBe(true);
      E.advance(g);
    }
    expect(g.sides.map(s => s.score)).toEqual([25, 15, 10]);
    // Round 2 is the steal round. Sofía misses a multiple-choice question; Clara steals it.
    expect(E.roundKind(g)).toBe('steal');
    let c = E.next(g);
    while (c.q.type === 'tf' || c.q.type === 'ord') { g.used[c.q.id] = 1; c = E.next(g); }
    const r = E.answer(g, c.choices.find(x => x.value !== 0).value);
    expect(r.ok).toBe(false);
    expect(r.canSteal).toBe(true);
    const st = E.steal(g, g.sides[1].id, 0);
    expect(st.ok).toBe(true);
    expect(g.sides[1].score).toBe(15 + E.POINTS.steal);
    expect(E.steal(g, g.sides[2].id, 0)).toBeNull();
    E.advance(g);
    for (let i = 0; i < 2; i++) { E.next(g); E.answer(g, null); E.advance(g); }
    // Round 3 is the final: questions for everyone, at the youngest level.
    expect(E.roundKind(g)).toBe('final');
    expect(g.finalQs.length).toBe(E.FINAL_QUESTIONS);
    expect(g.finalQs.every(f => f.q.tier === 1 && f.q.type !== 'ord')).toBe(true);
    expect(E.next(g)).toBeNull();
    E.finalMark(g, [g.sides[0].id, g.sides[2].id]);
    E.finalMark(g, []);
    E.finalMark(g, [g.sides[0].id]);
    expect(g.done).toBe(true);
    const top = E.standings(g);
    expect(top[0].id).toBe('p-k:Sofía');
    expect(top[0].score).toBe(25 + 2 * E.POINTS.final);
    // Nobody was asked the same question twice.
    const asked = g.log.filter(l => !l.steal).map(l => l.q);
    expect(new Set(asked).size).toBe(asked.length);
    // Each player's history now holds what they saw.
    expect(Object.keys(g.hist['k:Sofía']).length).toBeGreaterThanOrEqual(2 + E.FINAL_QUESTIONS);
  });

  test('teams answer at the level of their youngest member; no head start when it is off', () => {
    const ps = players.map((p, i) => ({ ...p, team: i === 1 ? 'B' : 'A' }));
    const g = E.createGame(BANK, ps, { teams: true, rounds: 4, headStart: false, timers: false, seed: 2 });
    expect(g.sides.map(s => [s.id, s.tier, s.score])).toEqual([['teamA', 1, 0], ['teamB', 3, 0]]);
    expect(E.timerFor(g, g.sides[1])).toBe(0);
    expect(E.roundKind(g, 3)).toBe('steal');
    expect(E.roundKind(g, 4)).toBe('final');
  });

  test('a question seen in an earlier game waits behind the fresh ones', () => {
    const q0 = BANK.filter(q => q.tier === 1 && q.cat === 'navidad');
    const hist = {};
    q0.slice(0, q0.length - 1).forEach(q => E.remember(hist, q.id));
    const g = E.createGame(BANK, [players[0]], { cats: ['navidad'], rounds: 3, seed: 1, hist: { 'k:Sofía': hist } });
    expect(E.next(g).q.id).toBe(q0[q0.length - 1].id);
  });
});
