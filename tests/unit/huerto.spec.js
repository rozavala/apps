// @ts-check
// Huerto, part 1 (no browser): the plant guide, the dates, the watering
// checks, growth, predictions, the star rule and the drawings.
// The facts are the risk here, so the guide is checked for complete,
// sane and conservative numbers, and every string for the restricted words.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '../..');
const D = require('../../js/huerto-data.js');
const E = require('../../js/huerto-engine.js');
const Art = require('../../js/huerto-art.js');

const RESTRICTED = /genero|género|identidad|diversidad|inclusi[oó]n|pronombre|trans |gay|lesbiana|queer|pride|diverso|equidad|justicia social|colonialismo|opres|patriarcado|feminis|woke|diversity|equity|inclusion|gender |lgbt|transgender/i;
// No eco-guilt or activism framing (content-guidelines.md).
const ACTIVISM = /cambio clim|climate change|calentamiento global|global warming|salva(r)? el planeta|save the planet|contamina|pollut/i;

/** @param {any} x @param {string[]} out */
function allStrings(x, out = []) {
  if (typeof x === 'string') out.push(x);
  else if (Array.isArray(x)) x.forEach(v => allStrings(v, out));
  else if (x && typeof x === 'object') Object.values(x).forEach(v => allStrings(v, out));
  return out;
}

test.describe('Huerto guide', () => {
  test('twenty plants, each complete, with sane and conservative numbers', () => {
    expect(D.PLANTS.length).toBe(20);
    const ids = new Set();
    for (const p of D.PLANTS) {
      expect(ids.has(p.id), 'unique ' + p.id).toBe(false); ids.add(p.id);
      for (const k of ['es', 'en', 'sci']) expect(typeof p[k] === 'string' && p[k].length > 1, p.id + ' ' + k).toBe(true);
      for (const k of ['tip', 'fact', 'what']) { expect(p[k].length, p.id + ' ' + k).toBe(2); expect(p[k][0].length > 2 && p[k][1].length > 2).toBe(true); }
      expect(['seed', 'plant', 'tuber']).toContain(p.from);
      expect(['veg', 'herb', 'flower', 'fruit']).toContain(p.kind);
      expect(['full', 'part']).toContain(p.sun);
      expect([1, 2, 3]).toContain(p.water);
      expect(p.where.length).toBeGreaterThan(0);
      p.where.forEach(w => expect(['cup', 'pot', 'bed']).toContain(w));
      // ranges: min <= max, sprouting within 3 to 28 days, harvest well after sprouting
      expect(p.sprout[0]).toBeGreaterThanOrEqual(3); expect(p.sprout[1]).toBeLessThanOrEqual(28);
      expect(p.sprout[0]).toBeLessThanOrEqual(p.sprout[1]);
      expect(p.harvest[0]).toBeLessThan(p.harvest[1]);
      expect(p.harvest[0]).toBeGreaterThanOrEqual(p.sprout[1] + 14);
      expect(p.harvest[1]).toBeLessThanOrEqual(150);
      expect(p.months.length).toBeGreaterThan(0);
      p.months.forEach(m => expect(m >= 1 && m <= 12).toBe(true));
      if (p.from !== 'seed' || p.start) expect(p.note || p.start, p.id + ' explains how it starts').toBeTruthy();
      expect(Art.has(p.id), 'drawing for ' + p.id).toBe(true);
    }
  });

  test('a few well-known numbers stay where the seed packets put them', () => {
    // radishes are the quick one, parsley and carrots the slow sprouters
    expect(D.plant('rabano').harvest[1]).toBeLessThanOrEqual(35);
    expect(D.plant('perejil').sprout[1]).toBeGreaterThanOrEqual(21);
    expect(D.plant('zanahoria').sprout[1]).toBeGreaterThanOrEqual(14);
    // warm-season plants are never sown outdoors in a California winter
    for (const id of ['poroto', 'tomate', 'choclo', 'zapallito', 'pepino', 'aji', 'albahaca', 'maravilla'])
      expect(D.plant(id).months.filter(m => m === 12 || m === 1 || m === 2), id).toEqual([]);
  });

  test('Chile plants six months after California: the same seasons, opposite hemispheres', () => {
    expect(D.chileMonths(D.plant('poroto'))).toEqual([10, 11, 12, 1].sort((a, b) => a - b));
    expect(D.chileMonths(D.plant('papa'))).toEqual([8, 9, 10]);
    for (const p of D.PLANTS) {
      const cl = D.chileMonths(p);
      expect(cl.length).toBe(p.months.length);
      p.months.forEach(m => expect(cl).toContain(((m + 5) % 12) + 1));
    }
  });

  test('three experiments, each with steps, guesses and what is learned in both languages', () => {
    expect(D.EXPERIMENTS.map(x => x.id)).toEqual(['sol', 'agua', 'bolsa']);
    for (const x of D.EXPERIMENTS) {
      expect(x.steps.length).toBeGreaterThanOrEqual(3);
      expect(x.guesses.length).toBe(3);
      expect(x.learned.length).toBe(2);
      expect(x.materials.length).toBeGreaterThan(1);
    }
    expect(D.experiment('bolsa').checks.length).toBe(5);
  });

  test('no restricted or activism wording anywhere in the guide', () => {
    const s = allStrings({ P: D.PLANTS, X: D.EXPERIMENTS, S: D.STAGES, W: D.WHERE, U: D.SUN, A: D.WATER });
    expect(s.filter(t => RESTRICTED.test(t))).toEqual([]);
    expect(s.filter(t => ACTIVISM.test(t))).toEqual([]);
    const app = fs.readFileSync(path.join(ROOT, 'js/huerto.js'), 'utf8');
    expect(RESTRICTED.test(app)).toBe(false);
    expect(ACTIVISM.test(app)).toBe(false);
  });
});

test.describe('Huerto engine', () => {
  test('dates count whole local days, across months and the clock change', () => {
    expect(E.days('2026-10-30', '2026-11-02')).toBe(3);
    expect(E.days('2026-03-07', '2026-03-09')).toBe(2);
    expect(E.days('2026-11-01', '2026-11-08')).toBe(7);
    expect(E.addDays('2026-12-30', 3)).toBe('2027-01-02');
    expect(E.isDate('2026-02-30')).toBe(false);
  });

  test('watering: a cup every day, a bed less often; a check is due once the days have passed', () => {
    const bean = D.plant('poroto'), mint = D.plant('menta'), cal = D.plant('calendula');
    expect(E.everyDays(bean, 'cup')).toBe(1);
    expect(E.everyDays(bean, 'pot')).toBe(2);
    expect(E.everyDays(bean, 'bed')).toBe(3);
    expect(E.everyDays(mint, 'pot')).toBe(1);
    expect(E.everyDays(cal, 'pot')).toBe(3);
    const pl = { planted: '2026-11-01', ev: 2, water: ['2026-11-10'] };
    expect(E.needsWater(pl, new Date(2026, 10, 11))).toBe(false);
    expect(E.needsWater(pl, new Date(2026, 10, 12))).toBe(true);
    expect(E.needsWater({ ...pl, done: 1 }, new Date(2026, 10, 20))).toBe(false);
    const d = { plants: [{ water: ['2026-11-15', '2026-11-16'] }, { water: ['2026-11-17', '2026-11-12'] }] };
    expect(E.waterStreak(d, new Date(2026, 10, 17))).toBe(3);
    expect(E.waterStreak(d, new Date(2026, 10, 18))).toBe(3);   // yesterday still counts
    expect(E.waterStreak(d, new Date(2026, 10, 19))).toBe(0);
  });

  test('the stage follows the kid first and the guide after', () => {
    const p = D.plant('poroto'), now = new Date(2026, 10, 17);
    expect(E.stage({ planted: '2026-11-15' }, p, now)).toBe(0);
    expect(E.stage({ planted: '2026-11-05', sprouted: '2026-11-12' }, p, now)).toBe(1);
    expect(E.stage({ planted: '2026-09-20', sprouted: '2026-09-28' }, p, now)).toBe(4);
    expect(E.stage({ planted: '2026-11-01', flowered: '2026-11-16' }, p, now)).toBe(4);
    expect(E.stage({ planted: '2026-11-01', harvested: '2026-11-16' }, p, now)).toBe(5);
    expect(E.sproutNews({ planted: '2026-11-14' }, p, now)).toBe('soon');
    expect(E.sproutNews({ planted: '2026-11-09' }, p, now)).toBe('window');
    expect(E.sproutNews({ planted: '2026-10-20' }, p, now)).toBe('late');
  });

  test('growth: one height per day, a rate and a straight-line projection', () => {
    const pl = { planted: '2026-11-01', log: [{ d: '2026-11-05', h: 2 }, { d: '2026-11-09', h: 4 }, { d: '2026-11-09', h: 5 }, { d: '2026-11-13', h: 8 }, { d: '2026-11-14', n: 'note' }] };
    expect(E.series(pl)).toEqual([{ d: '2026-11-05', day: 4, h: 2 }, { d: '2026-11-09', day: 8, h: 5 }, { d: '2026-11-13', day: 12, h: 8 }]);
    expect(E.rate(pl)).toBe(0.75);
    expect(E.projection(pl, '2026-11-17')).toBe(11);
  });

  test('predict, then measure: close within 1 cm or 20 %, settled near the guessed day only', () => {
    expect(E.close(10, 11.9)).toBe(true);
    expect(E.close(10, 13)).toBe(false);
    expect(E.close(1.5, 2.4)).toBe(true);
    const pl = { pred: [{ made: '2026-11-10', for: '2026-11-17', h: 10 }] };
    expect(E.settle(pl, '2026-11-12', 6)).toBe(null);          // too early: still open
    expect(E.openPred(pl)).toBeTruthy();
    expect(E.settle(pl, '2026-11-18', 11)).toEqual({ guess: 10, got: 11, close: true });
    expect(E.openPred(pl)).toBe(null);
    const late = { pred: [{ for: '2026-11-01', h: 3 }] };
    expect(E.settle(late, '2026-11-17', 9)).toBe(null);
    expect(late.pred[0].got).toBe(-1);                          // closed, never scored
  });

  test('the star rule is the same here and in auth.js', () => {
    /** @type {any} */
    const ctx = { localStorage: { getItem() { return null; } }, sessionStorage: { getItem() { return null; } }, console,
      addEventListener() {}, location: { pathname: '/huerto.html', search: '' }, navigator: {}, document: { addEventListener() {}, readyState: 'complete' } };
    ctx.window = ctx;
    vm.createContext(ctx);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/auth.js'), 'utf8'), ctx);
    const samples = [
      {},
      { plants: [{ sprouted: 'x', log: [{ h: 1 }, { n: 'a' }, { w: 1 }], water: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], pred: [{ h: 5, got: 5.5 }, { h: 5, got: -1 }] }], exp: { sol: { guess: 'a', obs: [1, 2, 3], done: 'y' } } },
      { plants: Array.from({ length: 14 }, (_, i) => ({ sprouted: 's', harvested: i % 2 ? 'h' : '', log: [{ h: 1 }, { h: 2 }, { h: 3 }], water: Array.from({ length: 30 }, (_, j) => 'd' + i + '-' + j), pred: Array.from({ length: 3 }, () => ({ h: 2, got: 2 })) })) }
    ];
    for (const s of samples) expect(ctx.getAppStars('huerto', s)).toBe(E.stars(s));
    expect(E.stars(samples[2])).toBe(10 * 2 + 5 + 10 + 10);
  });

  test('clean never drops a plant or an entry: unknown kinds and odd entries are kept, missing fields filled', () => {
    const many = Array.from({ length: 300 }, (_, i) => ({ d: '2026-11-01', h: i }));
    const future = { sp: 'calabaza-nueva', id: 'z9', where: 'roof', custom: [1, 2] };
    const d = E.clean({ plants: [{ sp: 'poroto', where: 'moon', planted: 'nope', water: ['2026-11-01', 'bad'], log: [{ d: '2026-11-02', h: '3', n: 5, ph: { id: 'abc' } }, { d: 'x' }, ...many], extra: 1 }, future, 'junk', ...Array.from({ length: 45 }, () => ({ sp: 'rabano' }))], region: 'cl' }, D);
    expect(d.plants.length).toBe(47);                       // only the non-object is gone
    const pl = d.plants[0];
    expect(pl.where).toBe('pot');
    expect(E.isDate(pl.planted)).toBe(true);
    expect(pl.water).toEqual(['2026-11-01', 'bad']);
    expect(pl.log.length).toBe(302);
    expect(pl.log[0].h).toBe(3);
    expect(pl.log[0].ph).toEqual({ id: 'abc' });
    expect(pl.extra).toBe(1);
    expect(d.region).toBe('cl');
    expect(pl.ev).toBe(2);
    // a kind from a newer version of the app is left exactly as it was, and not shown
    expect(d.plants[1]).toMatchObject({ sp: 'calabaza-nueva', id: 'z9', where: 'roof', custom: [1, 2] });
    expect(E.known(d, D).map(x => x.sp)).not.toContain('calabaza-nueva');
    expect(E.entries(pl).length).toBe(301);
    expect(E.clean({ trash: ['a'.repeat(32), '../x'] }, D).trash).toEqual(['a'.repeat(32)]);
  });
});

test.describe('Huerto drawings', () => {
  test('every plant draws at every stage in every container, with no broken numbers', () => {
    for (const p of D.PLANTS) for (let s = 0; s <= 5; s++) for (const w of ['cup', 'pot', 'bed']) {
      const svg = Art.plant(p.id, s, { where: w });
      expect(svg.startsWith('<svg'), p.id + s + w).toBe(true);
      expect(/NaN|undefined|Infinity/.test(svg), p.id + ' ' + s + ' ' + w).toBe(false);
      expect(svg.length).toBeLessThan(120000);
    }
    expect(/NaN|undefined/.test(Art.seasons(true) + Art.seasons(false))).toBe(false);
  });
  test('ids never clash between two drawings on one page', () => {
    const a = Art.plant('tomate', 5, { where: 'pot' }), b = Art.plant('tomate', 5, { where: 'pot' });
    const ids = s => [...s.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
    const shared = ids(a).filter(x => ids(b).includes(x));
    expect(shared).toEqual([]);
    // the same plant always looks the same (seeded)
    expect(a.replace(/hu\d+_/g, '')).toBe(b.replace(/hu\d+_/g, ''));
  });
});
