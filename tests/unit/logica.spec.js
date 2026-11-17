// @ts-check
// Lógica, part 1 (no browser): the generators and solvers. The rule for
// every generated puzzle is that it has exactly one solution, so each
// generator is run over many seeds and its output is counted again by
// an independent check. Content (clear thinking) is checked for both
// languages, one right answer, and the restricted-word grep.
const { test, expect } = require('@playwright/test');

const E = require('../../js/logica-engine.js');
const D = require('../../js/logica-data.js');
const Art = require('../../js/logica-art.js');

const SEEDS = Array.from({ length: 40 }, (_, i) => 1000 + i * 7919);
const RESTRICTED = /genero|género|identidad|diversidad|inclusi[oó]n|pronombre|trans |gay|lesbiana|queer|pride|diverso|equidad|justicia social|colonialismo|opres|patriarcado|feminis|woke|diversity|equity|inclusion|gender |lgbt|transgender/i;
// Clear-thinking examples stay everyday: no news, politics or social issues.
const OFF_TOPIC = /pol[ií]tic|president|gobierno|government|elecci|election|vot[oa]r?\b|vote|partido pol|party\b|guerra|war\b|religi|immigra|inmigra|protest|marcha|derecho|rights|clima|climate|aborto|abortion|arma|weapon|gun\b|police|polic[ií]a/i;

/** brute-force sudoku check, independent of the engine's solver */
function validFull(grid, n) {
  const [br, bc] = E.sudokuBox(n);
  for (let i = 0; i < n; i++) {
    const row = new Set(), col = new Set(), box = new Set();
    for (let j = 0; j < n; j++) {
      row.add(grid[i * n + j]); col.add(grid[j * n + i]);
      const r = Math.floor(i / (n / bc)) * br + Math.floor(j / bc), c = (i % (n / bc)) * bc + (j % bc);
      box.add(grid[r * n + c]);
    }
    if (row.size !== n || col.size !== n || box.size !== n) return false;
  }
  return grid.every(v => v >= 1 && v <= n);
}

test.describe('Lógica engine', () => {

  test('sudoku: every size and level has exactly one solution, and it is the hidden one', () => {
    for (const n of [4, 6, 9]) for (const lv of [0, 1, 2]) for (const seed of SEEDS.slice(0, n === 9 ? 12 : 30)) {
      const p = E.sudokuMake(n, lv, seed);
      expect(validFull(p.solution, n)).toBe(true);
      p.puzzle.forEach((v, i) => { if (v) expect(v).toBe(p.solution[i]); });
      const r = E.sudokuSolve(p.puzzle, n, 3);
      expect(r.count).toBe(1);
      expect(r.solution).toEqual(p.solution);
    }
  });

  test('sudoku: the solver counts more than one solution when there is more than one', () => {
    expect(E.sudokuSolve(new Array(16).fill(0), 4, 2).count).toBe(2);
    const p = E.sudokuMake(4, 0, 5), holed = p.puzzle.map(() => 0);
    holed[0] = p.solution[0];
    expect(E.sudokuSolve(holed, 4, 2).count).toBe(2);
    const bad = new Array(16).fill(0); bad[0] = 1; bad[1] = 1;
    expect(E.sudokuSolve(bad, 4, 2).count).toBe(0);
  });

  test('sudoku: harder levels leave fewer clues, and a hint gives a correct value', () => {
    const clues = lv => E.sudokuMake(9, lv, 77).puzzle.filter(Boolean).length;
    expect(clues(0)).toBeGreaterThan(clues(1));
    expect(clues(1)).toBeGreaterThan(clues(2));
    const p = E.sudokuMake(6, 1, 9), h = E.sudokuHint(p, p.puzzle.slice());
    expect(h && h.value).toBe(p.solution[h.cell]);
    expect(p.puzzle[h.cell]).toBe(0);
  });

  test('nonograms: every picture has a unique solution that is the picture', () => {
    for (const pic of D.NONOGRAMS) {
      const size = pic.rows.length;
      expect([5, 7, 10]).toContain(size);
      pic.rows.forEach(r => expect(r.length, pic.id).toBe(size));
      const p = E.nonoMake(pic);
      const r = E.nonoSolve(p.rows, p.cols, 3);
      expect(r.count, pic.id).toBe(1);
      expect(r.solution, pic.id).toEqual(p.solution);
      expect(pic.name[0].length && pic.name[1].length).toBeTruthy();
    }
    // a level for every size, with at least 5 pictures each
    for (const s of [5, 7, 10]) expect(E.nonoPictures(s).length).toBeGreaterThanOrEqual(5);
    expect(new Set(D.NONOGRAMS.map(p => p.id)).size).toBe(D.NONOGRAMS.length);
  });

  test('nonograms: the solver sees an ambiguous picture', () => {
    // a 2x2 diagonal has two solutions with clues [1],[1] / [1],[1]
    expect(E.nonoSolve([[1], [1]], [[1], [1]], 3).count).toBe(2);
    expect(E.lineSolve([3], [-1, -1, -1, -1])).toEqual([-1, 1, 1, -1]);
    expect(E.lineSolve([2], [1, -1, 1, -1])).toBeNull();
  });

  test('logic grids: every level has exactly one solution, the hidden one, with no extra clues', () => {
    for (const lv of [0, 1, 2, 3]) for (const seed of SEEDS.slice(0, lv === 3 ? 10 : 30)) {
      const p = E.gridMake(lv, seed), m = p.cats.length;
      const r = E.gridCount(p.n, m, p.clues, 3);
      expect(r.count).toBe(1);
      expect(r.solution).toEqual(p.solution);
      p.clues.forEach(c => expect(E.gridTruth(c, p.solution)).toBe(true));
      // every clue is needed (minimal)
      p.clues.forEach((c, i) => {
        if (lv <= 1 && c.t === 'is') return;      // the easy levels keep one direct clue as a way in
        expect(E.gridCount(p.n, m, p.clues.filter((_, j) => j !== i), 2).count).toBeGreaterThan(1);
      });
      if (lv === 3) expect(p.clues.some(c => c.t === 'is')).toBe(false);
      for (const lang of ['es', 'en']) p.clues.forEach(c => {
        const t = E.gridClueText(p, c, lang);
        expect(t).toMatch(/^[A-ZÁÉÍÓÚÑ].*\.$/);
        expect(t).not.toMatch(/undefined|null/);
      });
    }
  });

  test('truth or fib: every puzzle has exactly one consistent assignment', () => {
    for (const lv of [0, 1, 2]) for (const seed of SEEDS) {
      const p = E.kkMake(lv, seed);
      const r = E.kkCount(p.n, p.statements);
      expect(r.count).toBe(1);
      expect(r.solution).toEqual(p.solution);
      expect(p.statements.length).toBe(p.n);
      expect(new Set(p.names).size).toBe(p.n);
      // nobody says "I am a knave" or something about only themselves
      p.statements.forEach(s => { if (s.who != null) expect(s.who).not.toBe(s.s); });
      for (const lang of ['es', 'en']) p.statements.forEach(s => expect(E.kkText(p, s, lang).length).toBeGreaterThan(5));
    }
  });

  test('balance: "which is heaviest" has one answer, and the block puzzles have one weight each', () => {
    for (const seed of SEEDS) {
      const o = E.balMake(0, seed);
      // the two scales chain the three fruits: the answer is the one never on the light side
      const light = new Set(o.scales.map(s => s.tilt === -1 ? s.right.o[0] : s.left.o[0]));
      const never = o.objs.filter(x => !light.has(x));
      expect(never).toEqual([o.answer]);
      for (const lv of [1, 2]) {
        const b = E.balMake(lv, seed);
        expect(b.objs.length).toBe(lv + 1);
        const r = E.balCount(b.objs, b.scales, 3);
        expect(r.count).toBe(1);
        expect(r.solution).toEqual(b.weights);
        expect(b.choices.filter(c => c === b.answer).length).toBe(1);
        expect(b.choices.length).toBe(4);
        b.scales.forEach(s => expect(E.sideWeight(s.left, b.weights)).toBe(E.sideWeight(s.right, b.weights)));
      }
    }
  });

  test('fake coin: a real strategy always finds it, and a lucky guess never wins', () => {
    // optimal plans against the adversary
    function play(level, plan) {
      const st = E.coinsNew(level), r = E.rng(3);
      plan(st, (L, R) => E.coinsWeigh(st, L, R, r).out);
      return E.coinsOf(st.hyps);
    }
    // 3 coins, 1 weighing
    expect(play(0, (st, w) => { w([0], [1]); })).toHaveLength(1);
    // 9 coins, 2 weighings: 3 v 3, then 1 v 1 inside the group
    expect(play(1, (st, w) => {
      const o = w([0, 1, 2], [3, 4, 5]);
      const g = o === 'L' ? [0, 1, 2] : o === 'R' ? [3, 4, 5] : [6, 7, 8];
      w([g[0]], [g[1]]);
    })).toHaveLength(1);
    // 8 coins, 2 weighings: 3 v 3 with 2 left out
    expect(play(2, (st, w) => {
      const o = w([0, 1, 2], [3, 4, 5]);
      if (o === '=') w([6], [7]); else { const g = o === 'L' ? [0, 1, 2] : [3, 4, 5]; w([g[0]], [g[1]]); }
    })).toHaveLength(1);
    // 12 coins, heavier or lighter, 3 weighings (the classic plan)
    expect(play(3, (st, w) => {
      const a = w([0, 1, 2, 3], [4, 5, 6, 7]);
      if (a === '=') {
        const b = w([8, 9, 10], [0, 1, 2]);
        if (b === '=') w([11], [0]); else w([8], [9]);
      } else {
        // fake is among 0-7; heavy side known
        const b = w([0, 1, 4], [2, 5, 8]);
        if (b === '=') w([6], [7]); else if (b === a) w([0], [1]); else w([2], [8]);
      }
    })).toHaveLength(1);
    // a naive plan for 9 coins (4 v 4 then 2 v 2) cannot always find it
    const left = play(1, (st, w) => { const o = w([0, 1, 2, 3], [4, 5, 6, 7]); if (o !== '=') w([0, 1], [2, 3]); });
    const st = E.coinsNew(1), r = E.rng(1);
    E.coinsWeigh(st, [0, 1, 2, 3], [4, 5, 6, 7], r);
    expect(E.coinsOf(st.hyps).length).toBeGreaterThan(3);       // the adversary keeps the big group
    expect(left.length).toBeGreaterThan(1);
    // guessing while two coins are still possible is wrong
    const g = E.coinsGuess({ hyps: [{ c: 2, d: 1 }, { c: 5, d: 1 }] }, 2);
    expect(g.ok).toBe(false);
    expect(g.coin).toBe(5);
    // unequal pans are refused
    expect(E.coinsWeigh(E.coinsNew(1), [0, 1], [2]).error).toBe('equal');
  });

  test('river crossings: each puzzle is solvable and the fewest crossings are the classic ones', () => {
    expect(E.riverSolve('fox').cost).toBe(7);
    expect(E.riverSolve('family').cost).toBe(9);
    expect(E.riverSolve('hens').cost).toBe(11);
    expect(E.riverSolve('bridge').cost).toBe(17);
    // a found path really works move by move
    for (const id of ['fox', 'family', 'hens', 'bridge']) {
      let st = E.riverStart(id);
      for (const g of E.riverSolve(id).path) { const r = E.riverMove(id, st, g); expect(r.ok).toBe(true); st = r.state; }
      expect(E.riverDone(id, st)).toBe(true);
    }
    // the rules bite
    expect(E.riverMove('fox', E.riverStart('fox'), ['farmer', 'corn']).why).toBe('foxhen');
    expect(E.riverMove('fox', E.riverStart('fox'), ['fox']).ok).toBe(false);
    expect(E.riverMove('family', E.riverStart('family'), ['dad', 'kid1']).why).toBe('boat');
    expect(E.riverMove('hens', E.riverStart('hens'), ['hen1', 'hen2']).why).toBe('outnumber');
    // the bridge counts the slower walker
    expect(E.riverMove('bridge', E.riverStart('bridge'), ['p1', 'p10']).state.minutes).toBe(10);
  });

  test('patterns: exactly one choice continues each sequence', () => {
    for (const lv of [0, 1, 2, 3]) for (const seed of SEEDS) {
      E.patternRound(lv, seed, 6).forEach(q => {
        expect(q.answer).toBeGreaterThanOrEqual(0);
        if (q.kind === 'pic') {
          const keys = q.seq.map(E.tokKey);
          const fits = q.choices.filter(c => { const k = keys.concat([E.tokKey(c)]); return E.minPeriod(k) <= Math.floor(k.length / 2); });
          expect(fits.length).toBe(1);
          expect(E.tokKey(fits[0])).toBe(E.tokKey(q.choices[q.answer]));
          expect(new Set(q.choices.map(E.tokKey)).size).toBe(q.choices.length);
        } else if (q.kind === 'num') {
          const preds = E.predictions(q.seq);
          expect(preds).toEqual([q.choices[q.answer]]);
          expect(q.choices.filter(c => preds.includes(c)).length).toBe(1);
          expect(new Set(q.choices).size).toBe(4);
        } else {
          const ok = q.choices.filter(c => E.matFits(q.cells.concat([c])));
          expect(ok.length).toBe(1);
          expect(ok[0]).toBe(q.choices[q.answer]);
        }
      });
    }
  });

  test('clear thinking: both languages, exactly one right answer, everyday topics only', () => {
    for (const set of ['fo', 'need', 'arg']) {
      const items = D.THINK[set];
      expect(items.length).toBeGreaterThanOrEqual(12);
      expect(new Set(items.map(i => i.id)).size).toBe(items.length);
      items.forEach(it => {
        expect(it.q).toHaveLength(2);
        expect(it.a).toBeGreaterThanOrEqual(0);
        expect(it.a).toBeLessThan(it.o.length);
        expect(new Set(it.o.map(o => o[1])).size).toBe(it.o.length);
        const all = [...it.q, ...it.why, ...it.o.flat()];
        all.forEach(s => { expect(typeof s).toBe('string'); expect(s.length).toBeGreaterThan(1); });
        expect(all.join(' ')).not.toMatch(RESTRICTED);
        expect(all.join(' ')).not.toMatch(OFF_TOPIC);
      });
      // a round shuffles the choices but keeps the right one right
      const round = E.thinkRound(set, 42, 6);
      expect(round).toHaveLength(6);
      round.forEach(q => {
        const src = items.find(i => i.id === q.id);
        expect(q.o[q.a]).toEqual(src.o[src.a]);
      });
    }
    // facts and opinions are roughly balanced
    const facts = D.THINK.fo.filter(i => i.a === 0).length;
    expect(Math.abs(facts * 2 - D.THINK.fo.length)).toBeLessThanOrEqual(2);
  });

  test('the weak step: only one listed flaw fits each argument (no close pairs offered together)', () => {
    const F = D.FLAWS;
    D.THINK.arg.forEach(it => {
      expect(it.o).toHaveLength(4);
      expect(it.o[it.a]).toEqual(F[it.k]);
      const keys = it.o.map(o => Object.keys(F).find(k => F[k] === o));
      expect(new Set(keys).size).toBe(4);
      (D.CLOSE_FLAWS[it.k] || []).forEach(k => expect(keys, it.id).not.toContain(k));
    });
    // the "it happened after" items never offer "one example"
    const after = D.THINK.arg.filter(i => i.k === 'after');
    expect(after.length).toBeGreaterThanOrEqual(3);
    after.forEach(i => expect(i.o).not.toContainEqual(F.one));
  });

  test('every word the app shows from data passes the restricted-word grep', () => {
    const text = JSON.stringify(D);
    expect(text).not.toMatch(RESTRICTED);
  });

  test('levels by age: little kids get picture levels, older kids get the full set', () => {
    const ids = t => E.ROOMS.flatMap(r => E.levelsFor(r.id, t).map(l => l.id));
    expect(ids('beginner')).toEqual(expect.arrayContaining(['su4p', 'no5', 'lg3p', 'pa_pic', 'ba_order']));
    expect(ids('beginner')).not.toContain('su9a');
    expect(ids('beginner')).not.toContain('ct_arg');
    expect(ids('advanced')).toEqual(expect.arrayContaining(['su9b', 'no10', 'lg4x3', 'ct_arg', 'co12', 'kk3h']));
    expect(ids('expert').length).toBe(Object.keys(E.LEVEL_BY_ID).length);
    // every daily level exists and is offered to its tier
    for (const t of E.TIERS) E.DAILY[t].forEach(id => expect(ids(t)).toContain(id));
  });

  test('daily puzzle: same all day, a streak grows on consecutive days and resets after a gap', () => {
    expect(E.dailyPick('2026-11-17', 'advanced')).toEqual(E.dailyPick('2026-11-17', 'advanced'));
    expect(E.dailyPick('2026-11-17', 'advanced').level).not.toBe(E.dailyPick('2026-11-18', 'advanced').level);
    let d = E.dailySolve({}, '2026-11-17');
    expect(d).toEqual({ last: '2026-11-17', streak: 1, best: 1, n: 1 });
    d = E.dailySolve(d, '2026-11-17');               // twice the same day counts once
    expect(d.n).toBe(1);
    d = E.dailySolve(d, '2026-11-18');
    d = E.dailySolve(d, '2026-11-19');
    expect(d.streak).toBe(3);
    expect(E.dailyStreak(d, '2026-11-20')).toBe(3);   // still alive the next day
    expect(E.dailyStreak(d, '2026-11-21')).toBe(0);   // a missed day breaks it
    d = E.dailySolve(d, '2026-11-22');
    expect(d.streak).toBe(1);
    expect(d.best).toBe(3);
    expect(E.prevDay('2026-03-01')).toBe('2026-02-28');
    expect(E.prevDay('2027-01-01')).toBe('2026-12-31');
  });

  test('stars: hints and mistakes lower them, rounds score by right answers', () => {
    expect(E.puzzleStars(0, 0)).toBe(3);
    expect(E.puzzleStars(1, 1)).toBe(2);
    expect(E.puzzleStars(2, 2)).toBe(1);
    expect(E.roundStars(6, 6)).toBe(3);
    expect(E.roundStars(4, 6)).toBe(2);
    expect(E.roundStars(1, 6)).toBe(0);
    expect(E.riverStars('fox', { moves: 7 }, 0)).toBe(3);
    expect(E.riverStars('fox', { moves: 15 }, 0)).toBe(1);
    expect(E.riverStars('bridge', { minutes: 17 }, 0)).toBe(3);
    expect(E.riverStars('bridge', { minutes: 19 }, 0)).toBe(2);
  });

  test('art: every piece is an SVG and labels are escaped', () => {
    const pieces = [Art.owl(80), Art.star(true), Art.flame(30), Art.block(), Art.coin(7), Art.boat(100), Art.lantern(30),
      Art.riverScene('river'), Art.riverScene('bridge'), Art.scale({ left: { o: ['apple', 'pear'] }, right: { b: 5 }, tilt: 0 }, 200),
      Art.scale({ left: { c: [0, 1] }, right: { c: [2, 3] }, tilt: -1 }, 200)];
    E.ROOMS.forEach(r => pieces.push(Art.room(r.id, 56)));
    D.BAL_OBJECTS.forEach(o => pieces.push(Art.fruit(o.id, 30)));
    E.SHAPES.forEach(s => E.COLORS.forEach(c => pieces.push(Art.shape(s, c, 30))));
    Object.values(D.GRID_CATS).forEach(c => c.items.forEach(it => { const s = Art.item(it.id, 30); expect(s, it.id).toMatch(/^<svg/); }));
    Object.keys(E.RIVERS).forEach(id => E.RIVERS[id].who.forEach(w => { const s = Art.crosser(w, 50); expect(s, w).toMatch(/<path/); }));
    pieces.forEach(p => { expect(p).toMatch(/^<svg[^>]*viewBox/); expect(p).not.toMatch(/undefined|NaN/); });
    expect(Art.fruit('apple', 30, 'a "quoted" <b>')).not.toMatch(/"quoted"/);
  });
});
