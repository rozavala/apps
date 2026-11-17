// @ts-check
// Taller de Máquinas, part 1 (no browser): the numbers a kid sees.
// Forces, mechanical advantage, distances and gear ratios are checked
// against worked answers; every challenge must be solvable within its
// own controls; every chain-reaction level must succeed with its
// reference answer and fail with nothing placed.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const P = require('../../js/taller-physics.js');
const D = require('../../js/taller-data.js');

const close = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;

test.describe('Taller: simple machines', () => {

  test('lever: moments balance (E × dE = L × dL), and the three classes are told apart', () => {
    // seesaw: 60 kg at 0.25 m, fulcrum at 2 m, push at 3.9 m
    const s = P.lever({ fulcrum: 2, loadPos: 0.25, effortPos: 3.9, mass: 60 });
    expect(s.cls).toBe(1);
    expect(s.effort).toBeCloseTo(60 * 1.75 / 1.9, 10);
    expect(s.effort * s.armEffort).toBeCloseTo(s.load * s.armLoad, 10);
    expect(s.ma).toBeCloseTo(1.9 / 1.75, 10);
    // fulcrum in the middle with equal arms: same force
    expect(P.lever({ fulcrum: 2, loadPos: 0, effortPos: 4, mass: 50 }).effort).toBe(50);
    // crowbar: 200 kg rock, 7 cm from the fulcrum, push 1.43 m away
    const c = P.lever({ fulcrum: 0.12, loadPos: 0.05, effortPos: 1.55, mass: 200 });
    expect(c.effort).toBeCloseTo(200 * 0.07 / 1.43, 10);
    expect(c.effort).toBeLessThan(10);
    // wheelbarrow (class 2): 80 kg at 0.6 m from the wheel, lift at 1.55 m
    const w = P.lever({ fulcrum: 0, loadPos: 0.6, effortPos: 1.55, mass: 80 });
    expect(w.cls).toBe(2);
    expect(w.effort).toBeCloseTo(80 * 0.6 / 1.55, 10);
    // fishing rod (class 3): more force than the fish weighs
    const r = P.lever({ fulcrum: 0.05, loadPos: 2.35, effortPos: 0.6, mass: 3 });
    expect(r.cls).toBe(3);
    expect(r.effort).toBeCloseTo(3 * 2.3 / 0.55, 10);
    expect(r.ma).toBeLessThan(1);
  });

  test('lever: the effort end moves MA times as far as the load', () => {
    const s = P.lever({ fulcrum: 1, loadPos: 0, effortPos: 4, mass: 90, lift: 0.2 });
    expect(s.loadDist).toBe(0.2);
    expect(s.effortDist).toBeCloseTo(0.6, 10);
    expect(s.effort * s.effortDist).toBeCloseTo(s.load * s.loadDist, 10);
  });

  test('pulleys: effort = load ÷ ropes, rope pulled = ropes × lift', () => {
    expect(P.pulley({ n: 1, mass: 100 }).effort).toBe(100);
    expect(P.pulley({ n: 1, mass: 100 }).fixedOnly).toBe(true);
    expect(P.pulley({ n: 2, mass: 100 }).effort).toBe(50);
    expect(P.pulley({ n: 4, mass: 100 }).effort).toBe(25);
    const six = P.pulley({ n: 6, mass: 120, lift: 0.5 });
    expect(six.effort).toBe(20);
    expect(six.effortDist).toBe(3);
    expect(six.ma).toBe(6);
  });

  test('ramp: effort = W × h / L (sin of the angle), the push goes L to lift h', () => {
    const r = P.incline({ length: 3, height: 1, mass: 60 });
    expect(r.effort).toBeCloseTo(20, 10);
    expect(r.ma).toBe(3);
    expect(r.angle).toBeCloseTo(Math.asin(1 / 3) * 180 / Math.PI, 10);
    expect(r.run).toBeCloseTo(Math.sqrt(8), 10);
    expect(r.effortDist).toBe(3);
    expect(r.loadDist).toBe(1);
    // 30° ramp halves the force
    const half = P.incline({ length: 2, height: 1, mass: 50 });
    expect(half.angle).toBeCloseTo(30, 10);
    expect(half.effort).toBeCloseTo(25, 10);
  });

  test('wedge: spreading force = push × length ÷ thickness', () => {
    const w = P.wedge({ length: 0.32, thickness: 0.04, resist: 400 });
    expect(w.ma).toBeCloseTo(8, 10);
    expect(w.effort).toBeCloseTo(50, 10);
    expect(w.spread(50)).toBeCloseTo(400, 10);
  });

  test('wheel and axle: effort = W × r / R, one turn moves 2πR and 2πr', () => {
    const w = P.wheelAxle({ wheelR: 0.2, axleR: 0.05, mass: 12, turns: 1 });
    expect(w.effort).toBeCloseTo(3, 10);
    expect(w.ma).toBeCloseTo(4, 10);
    expect(w.effortDist).toBeCloseTo(2 * Math.PI * 0.2, 10);
    expect(w.loadDist).toBeCloseTo(2 * Math.PI * 0.05, 10);
  });

  test('screw jack: effort = W × pitch ÷ 2πR, one turn lifts one pitch', () => {
    const s = P.screw({ pitch: 0.004, handleR: 0.2, mass: 1000, turns: 1 });
    expect(s.effort).toBeCloseTo(1000 * 0.004 / (2 * Math.PI * 0.2), 10);
    expect(s.effort).toBeCloseTo(3.183, 3);
    expect(s.loadDist).toBe(0.004);
    expect(s.effort * s.effortDist).toBeCloseTo(s.load * s.loadDist, 10);
  });

  test('newtons are kilograms-force × 9.81', () => {
    expect(P.N(25)).toBeCloseTo(245.25, 10);
  });

  test('every machine conserves work (ideal, no friction)', () => {
    const cases = [
      ['lever', { fulcrum: 0.7, loadPos: 0.1, effortPos: 3.2, mass: 140, lift: 0.3 }],
      ['pulley', { n: 3, mass: 75, lift: 0.8 }],
      ['incline', { length: 4.2, height: 1.3, mass: 90 }],
      ['wedge', { length: 0.2, thickness: 0.05, resist: 300 }],
      ['wheel', { wheelR: 0.33, axleR: 0.06, mass: 20, turns: 2 }],
      ['screw', { pitch: 0.006, handleR: 0.25, mass: 800, turns: 5 }]
    ];
    for (const [k, p] of cases) {
      const r = P.machine(/** @type {string} */ (k), p);
      expect(r.effort * r.effortDist, k).toBeCloseTo(r.load * r.loadDist, 9);
      expect(r.ma, k).toBeCloseTo(r.load / r.effort, 9);
    }
  });
});

test.describe('Taller: gears and the bicycle', () => {

  test('two meshing gears turn opposite ways, speed × teeth is the same', () => {
    const t = P.gearTrain([{ teeth: 24 }, { teeth: 12, link: 'mesh' }], 30);
    expect(t.gears[1].rpm).toBe(-60);
    expect(t.speedUp).toBe(2);
    expect(t.sameDir).toBe(false);
    expect(t.frac).toEqual([2, 1]);
  });

  test('an idler flips the direction but not the speed', () => {
    const t = P.gearTrain([{ teeth: 24 }, { teeth: 40, link: 'mesh' }, { teeth: 24, link: 'mesh' }], 30);
    expect(t.gears[2].rpm).toBeCloseTo(30, 10);
    expect(t.sameDir).toBe(true);
    expect(t.speedUp).toBeCloseTo(1, 10);
    // the idler's size does not matter
    const t2 = P.gearTrain([{ teeth: 24 }, { teeth: 8, link: 'mesh' }, { teeth: 24, link: 'mesh' }], 30);
    expect(t2.gears[2].rpm).toBeCloseTo(30, 10);
  });

  test('gears on one axle turn together and the ratios multiply', () => {
    // 36 → 12 (×3), then a 24 on the 12's axle → 12 (×2): six times faster
    const t = P.gearTrain([{ teeth: 36 }, { teeth: 12, link: 'mesh' }, { teeth: 24, link: 'axle' }, { teeth: 12, link: 'mesh' }], 30);
    expect(t.gears[2].rpm).toBe(t.gears[1].rpm);
    expect(t.speedUp).toBeCloseTo(6, 10);
    expect(t.frac).toEqual([6, 1]);
    expect(t.sameDir).toBe(true);   // two meshes: back to the motor's direction
  });

  test('layout: meshing gears sit exactly r1 + r2 apart; axle gears share a centre', () => {
    const gears = [{ teeth: 20 }, { teeth: 10, link: 'mesh' }, { teeth: 30, link: 'axle' }, { teeth: 16, link: 'mesh' }];
    const L = P.gearLayout(gears, 1);
    const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    expect(d(L[0], L[1])).toBeCloseTo(15, 10);
    expect(d(L[1], L[2])).toBe(0);
    expect(d(L[2], L[3])).toBeCloseTo(23, 10);
  });

  test('phases: where one gear has a tooth on the line of centres, the next has a gap', () => {
    const gears = [{ teeth: 24 }, { teeth: 15, link: 'mesh' }, { teeth: 32, link: 'mesh' }];
    const L = P.gearLayout(gears, 1), th = P.gearPhases(gears, L);
    for (let k = 1; k < gears.length; k++) {
      const phi = L[k].phi;
      const fi = (((phi - th[k - 1]) / (2 * Math.PI / gears[k - 1].teeth)) % 1 + 1) % 1;
      const fj = (((phi + Math.PI - th[k]) / (2 * Math.PI / gears[k].teeth)) % 1 + 1) % 1;
      expect(((fi + fj) % 1 + 1) % 1).toBeCloseTo(0.5, 9);
    }
  });

  test('bicycle: wheel turns per pedal turn = chainring ÷ cog, distance = that × π × D', () => {
    const b = P.bike(48, 16, 0.66);
    expect(b.wheelTurns).toBe(3);
    expect(b.metres).toBeCloseTo(3 * Math.PI * 0.66, 10);
    expect(P.bike(28, 32, 0.66).wheelTurns).toBeCloseTo(0.875, 10);
    expect(P.bike(28, 14).wheelTurns).toBe(2);
  });
});

test.describe('Taller: challenges are solvable', () => {

  test('every machine challenge starts too heavy and has an answer within its controls', () => {
    const solvable = {
      'c-pulley': () => P.pulley({ n: 4, mass: 100 }).effort,
      'c-crowbar': () => P.lever({ fulcrum: 0.12, loadPos: 0.05, effortPos: 1.55, mass: 200 }).effort,
      'c-ramp': () => P.incline({ length: 3, height: 1, mass: 60 }).effort,
      'c-well': () => P.wheelAxle({ wheelR: 0.25, axleR: 0.05, mass: 12 }).effort,
      'c-barrow': () => P.lever({ fulcrum: 0, loadPos: 0.38, effortPos: 1.55, mass: 80 }).effort,
      'c-wedge': () => P.wedge({ length: 0.32, thickness: 0.04, resist: 400 }).effort,
      'c-jack': () => P.screw({ pitch: 0.002, handleR: 0.1, mass: 1000 }).effort
    };
    const start = {
      'c-pulley': s => P.pulley(s).effort,
      'c-crowbar': s => P.lever({ fulcrum: s.fulcrum, loadPos: 0.05, effortPos: 1.55, mass: s.mass }).effort,
      'c-ramp': s => P.incline(s).effort,
      'c-well': s => P.wheelAxle(s).effort,
      'c-barrow': s => P.lever({ fulcrum: 0, loadPos: s.load, effortPos: 1.55, mass: s.mass }).effort,
      'c-wedge': s => P.wedge(s).effort,
      'c-jack': s => P.screw(s).effort
    };
    for (const c of D.CHALLENGES.filter(c => c.maxEffort)) {
      expect(solvable[c.id], c.id + ' has a worked answer').toBeTruthy();
      expect(start[c.id](c.setup), c.id + ' is too heavy at the start').toBeGreaterThan(c.maxEffort);
      expect(solvable[c.id](), c.id + ' answer').toBeLessThanOrEqual(c.maxEffort);
    }
  });

  test('every gear challenge has a train that meets it with the offered sizes', () => {
    const ok = (c, gears) => {
      const t = P.gearTrain(gears, 30), g = c.gears;
      if (g.count && gears.length !== g.count) return false;
      if (g.dir === 'same' && !t.sameDir) return false;
      if (g.dir === 'opp' && t.sameDir) return false;
      return Math.abs(t.speedUp - g.speed) < 1e-9;
    };
    const answers = {
      'g-double': [{ teeth: 24 }, { teeth: 16, link: 'mesh' }, { teeth: 12, link: 'mesh' }],
      'g-slow': [{ teeth: 16 }, { teeth: 48, link: 'mesh' }],
      'g-idler': [{ teeth: 24 }, { teeth: 8, link: 'mesh' }, { teeth: 24, link: 'mesh' }],
      'g-six': [{ teeth: 36 }, { teeth: 12, link: 'mesh' }, { teeth: 24, link: 'axle' }, { teeth: 12, link: 'mesh' }]
    };
    for (const c of D.CHALLENGES.filter(c => c.gears)) {
      const a = answers[c.id];
      expect(a, c.id).toBeTruthy();
      expect(a[0].teeth, c.id + ' keeps the motor gear').toBe(c.setup.gears[0]);
      a.slice(1).forEach(g => expect(D.GEAR_SIZES, c.id + ' sizes offered').toContain(g.teeth));
      expect(ok(c, a), c.id).toBe(true);
      expect(ok(c, [{ teeth: c.setup.gears[0] }, { teeth: 12, link: 'mesh' }]) && c.id !== 'g-double', c.id + ' not solved by a plain pair').toBe(false);
    }
    // six times faster needs an axle: no plain chain of offered sizes reaches it
    const best = Math.max(...D.GEAR_SIZES.map(z => 36 / z));
    expect(best).toBeLessThan(6);
  });

  test('bicycle challenges: the hill gear is the lowest ratio; two turns exists', () => {
    const all = [];
    D.BIKE.fronts.forEach(f => D.BIKE.rears.forEach(r => all.push([f, r, f / r])));
    const lowest = all.reduce((a, b) => (b[2] < a[2] ? b : a));
    expect(lowest.slice(0, 2)).toEqual([Math.min(...D.BIKE.fronts), Math.max(...D.BIKE.rears)]);
    expect(all.some(x => x[2] === 2)).toBe(true);
    const start = D.CHALLENGES.find(c => c.id === 'b-two').setup;
    expect(start.front / start.rear).not.toBe(2);
  });
});

test.describe('Taller: chain-reaction levels', () => {

  for (const L of D.LEVELS) {
    test(`level ${L.id} works with its answer and not with nothing placed`, () => {
      const a = P.runLevel(L, L.answer, 10);
      expect(a.ok, L.id + ' answer').toBe(true);
      expect(P.runLevel(L, [], 10).ok, L.id + ' empty').toBe(false);
      // the answer fits the parts on offer and is within par
      const used = {};
      L.answer.forEach(p => { used[p.type] = (used[p.type] || 0) + 1; });
      Object.keys(used).forEach(t => expect(used[t], L.id + ' ' + t).toBeLessThanOrEqual(L.parts[t] || 0));
      expect(L.answer.length, L.id + ' par').toBeLessThanOrEqual(L.par);
    });
  }

  test('a domino row with gaps wider than a domino is tall stops short of the bell', () => {
    const L = D.LEVELS.find(l => l.id === 'r2');
    const sparse = [1.33, 1.58, 1.83, 2.08].map(x => ({ type: 'domino', x, y: 0.1 }));
    expect(P.runLevel(L, sparse, 8).ok).toBe(false);
  });

  test('the simulation is deterministic and settles: a lone domino stays standing', () => {
    const L = { w: 3, h: 1.8, statics: [], fixed: [] };
    const W = P.buildWorld(L, [{ type: 'domino', x: 1, y: 0.1 }]);
    for (let i = 0; i < 300; i++) W.step();
    const pose = W.boxPose(W.boxes[0]);
    expect(Math.abs(pose.ang)).toBeLessThan(0.01);
    expect(Math.abs(pose.x - 1)).toBeLessThan(0.01);
    expect(W.kinetic()).toBeLessThan(1e-4);
    const a = P.runLevel(D.LEVELS[1], D.LEVELS[1].answer, 10), b = P.runLevel(D.LEVELS[1], D.LEVELS[1].answer, 10);
    expect(a.t).toBe(b.t);
  });

  test('a ball dropped into a cup counts; a ball beside it does not', () => {
    const L = { w: 3, h: 1.8, statics: [], fixed: [], goal: { type: 'cup', x: 2, y: 0, w: 0.3, h: 0.2 } };
    expect(P.runLevel(L, [{ type: 'ball', x: 2, y: 0.6 }], 3).ok).toBe(true);
    expect(P.runLevel(L, [{ type: 'ball', x: 1.5, y: 0.6 }], 3).ok).toBe(false);
  });

  test('surfaceBelow finds the top of a plank under a point', () => {
    const L = { w: 3, h: 1.8, statics: [{ x: 1, y: 0.5, w: 1, h: 0.04 }], fixed: [] };
    expect(P.surfaceBelow(L, [], 1, 1.2)).toBeCloseTo(0.52, 9);
    expect(P.surfaceBelow(L, [], 2, 1.2)).toBe(0);
    expect(P.surfaceBelow(L, [{ type: 'plank', x: 2, y: 0.8, a: 0 }], 2, 1.2)).toBeCloseTo(0.82, 9);
  });
});

test.describe('Taller: content', () => {

  const RESTRICTED = /genero|género|identidad|diversidad|inclusi[oó]n|pronombre|trans |gay|lesbiana|queer|pride|diverso|equidad|justicia social|colonialismo|opres|patriarcado|feminis|woke|diversity|equity|inclusion|gender |lgbt|transgender/i;

  test('every text has Spanish and English, and passes the restricted-word grep', () => {
    const pairs = [];
    D.MACHINES.forEach(m => ['name', 'short', 'rule', 'fact', 'examples'].forEach(k => pairs.push(m[k])));
    D.CHALLENGES.forEach(c => { pairs.push(c.title); pairs.push(c.goal); });
    D.LEVELS.forEach(l => { pairs.push(l.name); pairs.push(l.say); });
    D.LEVERS.forEach(l => pairs.push(l.name));
    Object.values(D.PART_NAMES).forEach(p => pairs.push(p));
    Object.values(D.FACTS).forEach(p => pairs.push(p));
    for (const p of pairs) {
      expect(Array.isArray(p) && p.length === 2 && p[0] && p[1], JSON.stringify(p)).toBeTruthy();
    }
    for (const f of ['taller-physics.js', 'taller-data.js', 'taller-art.js', 'taller-scenes.js', 'taller.js']) {
      const src = fs.readFileSync(path.resolve(__dirname, '../../js/' + f), 'utf8');
      expect(RESTRICTED.test(src), f).toBe(false);
    }
  });

  test('ids are unique', () => {
    const ids = D.CHALLENGES.map(c => c.id).concat(D.LEVELS.map(l => l.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
