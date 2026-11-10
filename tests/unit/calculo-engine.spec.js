// @ts-check
// Cálculo Rápido: the maths behind the app. The generators are deterministic
// under a seed, so every answer is checked here against arithmetic written
// again from scratch (not the app's own formulas), and the time-zone rules
// are checked against the browser's own time-zone database.
const { test, expect } = require('@playwright/test');
const E = require('../../js/calculo-rapido-engine.js');
const U = require('../../js/calculo-rapido-units.js');
const P = require('../../js/calculo-rapido-problems.js');
const D = require('../../js/calculo-rapido-data.js');

const close = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps * Math.max(1, Math.abs(b));
// Thousands of checks per test: collect the failures and assert once (a Playwright
// expect() per check is far too slow for these loops).
function checker() {
  const fails = [];
  const ok = (cond, msg) => { if (!cond && fails.length < 15) fails.push(String(msg)); };
  ok.fails = fails;
  return ok;
}

test.describe('Sprint facts', () => {
  const RE = /^(\d+) (\+|−|×|÷) (\d+) = \?$/;

  test('every level, 400 seeds: the answer matches an independent sum and is never negative or ambiguous', () => {
    const ok = checker();
    for (let level = 1; level <= 12; level++) {
      for (let seed = 0; seed < 400; seed++) {
        const r = E.rng(seed * 31 + level);
        for (let k = 0; k < 2; k++) {
          const q = E.sprintQuestion(level, r);
          const m = RE.exec(q.text);
          ok(m, 'format ' + q.text);
          if (!m) continue;
          const a = +m[1], b = +m[3], op = m[2];
          let want;
          if (op === '+') want = a + b;
          else if (op === '\u2212') want = a - b;
          else if (op === '\u00D7') want = a * b;
          else {
            ok(b >= 2, 'no division by zero or by one: ' + q.text);
            ok(a % b === 0, 'divides exactly: ' + q.text);
            want = a / b;
          }
          ok(q.answer === want, q.text + ' answer ' + q.answer + ' wanted ' + want);
          ok(Number.isInteger(q.answer) && q.answer >= 1, 'whole and positive: ' + q.text);
          ok(a > 0 && b > 0, 'no zero operands: ' + q.text);
          ok(q.level === level, 'level');
          const addsub = op === '+' || op === '\u2212';
          if (level === 1) ok(op === '+' && a + b <= 5, 'L1 ' + q.text);
          if (level === 2) ok(op === '+' && a + b <= 10, 'L2 ' + q.text);
          if (level === 3) ok(Math.max(a, b) <= 10 && addsub, 'L3 ' + q.text);
          if (level === 4) ok(Math.max(a, b) <= 20 && addsub, 'L4 ' + q.text);
          if (level === 5) ok(Math.max(a, b) <= 100 && addsub, 'L5 ' + q.text);
          if (level <= 5) ok(addsub, 'young levels only add and take away: ' + q.text);
          if (level === 6) ok(op === '\u00D7' && ([2, 5, 10].includes(a) || [2, 5, 10].includes(b)) && Math.max(a, b) <= 10, 'L6 ' + q.text);
        }
      }
    }
    expect(ok.fails).toEqual([]);
  });

  test('the same seed asks the same facts, a different seed does not', () => {
    const run = (seed) => { const r = E.rng(seed); return Array.from({ length: 30 }, () => E.sprintQuestion(9, r).text); };
    expect(run(123)).toEqual(run(123));
    expect(run(123)).not.toEqual(run(124));
  });

  test('a fact never repeats straight away', () => {
    const r = E.rng(5), ok = checker();
    let prev = '';
    for (let i = 0; i < 200; i++) { const q = E.nextQuestion(1, r, prev); ok(q.text !== prev, 'repeat ' + prev); prev = q.text; }
    expect(ok.fails).toEqual([]);
  });

  test('four answers to pick from: the right one, distinct, never below zero', () => {
    const ok = checker();
    for (let a = 0; a <= 20; a++) for (let s = 0; s < 20; s++) {
      const c = E.choicesFor(a, E.rng(s));
      ok(c.length === 4 && new Set(c).size === 4 && c.includes(a) && Math.min(...c) >= 0, a + ' ' + s + ' ' + c);
    }
    expect(ok.fails).toEqual([]);
  });

  test('every level has a name in both languages', () => {
    for (let l = 1; l <= 12; l++) { expect(E.LEVEL_NAMES[l][0].length).toBeGreaterThan(3); expect(E.LEVEL_NAMES[l][1].length).toBeGreaterThan(3); }
    expect(E.TARGET_SEC.length).toBe(13);
  });
});

test.describe('The level ladder (speed and accuracy)', () => {
  test('four quick right answers in a row move up one level and master the one left', () => {
    const st = E.newAdapt('intermediate', 0);
    expect(st.level).toBe(3);
    const fast = E.TARGET_SEC[3] * 1000 - 1;
    expect([1, 2, 3].map(() => E.adaptStep(st, true, fast))).toEqual([0, 0, 0]);
    expect(E.adaptStep(st, true, fast)).toBe(1);
    expect(st.level).toBe(4);
    expect(st.mastered).toBe(3);
  });

  test('slow right answers do not move the level', () => {
    const st = E.newAdapt('advanced', 8);
    for (let i = 0; i < 20; i++) expect(E.adaptStep(st, true, 60000)).toBe(0);
    expect(st.level).toBe(8);
    expect(st.mastered).toBe(0);
  });

  test('a wrong answer breaks the fast streak; two wrong in a row move down', () => {
    const st = E.newAdapt('advanced', 8);
    const fast = 1000;
    E.adaptStep(st, true, fast); E.adaptStep(st, true, fast); E.adaptStep(st, true, fast);
    expect(E.adaptStep(st, false, fast)).toBe(0);
    expect(st.fast).toBe(0);
    expect(E.adaptStep(st, false, fast)).toBe(-1);
    expect(st.level).toBe(7);
    // a right answer between two wrong ones resets the count
    E.adaptStep(st, false, fast); E.adaptStep(st, true, 60000); expect(E.adaptStep(st, false, fast)).toBe(0);
  });

  test('each age tier stays inside its levels, and a saved level is pulled back inside', () => {
    expect(E.newAdapt('beginner', 0).level).toBe(1);
    expect(E.newAdapt('beginner', 9).level).toBe(4);
    expect(E.newAdapt('expert', 2).level).toBe(7);
    const b = E.newAdapt('beginner', 4);
    for (let i = 0; i < 40; i++) E.adaptStep(b, true, 100);
    expect(b.level).toBe(4);
    expect(b.mastered).toBe(4);
    const down = E.newAdapt('intermediate', 2);
    for (let i = 0; i < 10; i++) E.adaptStep(down, false, 100);
    expect(down.level).toBe(2);
  });
});

test.describe('Rounds and the personal best', () => {
  test('each right answer is worth its level', () => {
    const s = E.summarizeRound([{ level: 3, correct: true }, { level: 4, correct: true }, { level: 4, correct: false }, { level: 5, correct: true }]);
    expect(s).toEqual({ right: 3, wrong: 1, points: 12, maxLevel: 5, accuracy: 75 });
    expect(E.summarizeRound([]).accuracy).toBe(0);
  });
  test('the round list keeps the latest 30 and the best survives', () => {
    let list = [];
    for (let i = 0; i < 40; i++) list = E.pushRound(list, { d: '2026-11-0' + (i % 9 + 1), p: i, c: 1, w: 0, l: 1 });
    expect(list).toHaveLength(30);
    expect(list[0].p).toBe(10);
    expect(E.personalBest(list, 0)).toBe(39);
    expect(E.personalBest([{ p: 3 }], 50)).toBe(50);
    expect(E.personalBest([], 0)).toBe(0);
    expect(E.pushRound(undefined, { p: 1 })).toHaveLength(1);
  });
});

test.describe('Estimate it', () => {
  test('stars: within half again 3, double or half 2, four times 1, otherwise none', () => {
    for (const truth of [2.9, 150, 4300]) {
      expect(E.estimateStars(truth, truth)).toBe(3);
      expect(E.estimateStars(truth * 1.5, truth)).toBe(3);
      expect(E.estimateStars(truth / 1.5, truth)).toBe(3);
      expect(E.estimateStars(truth * 1.51, truth)).toBe(2);
      expect(E.estimateStars(truth * 2, truth)).toBe(2);
      expect(E.estimateStars(truth / 2, truth)).toBe(2);
      expect(E.estimateStars(truth * 2.1, truth)).toBe(1);
      expect(E.estimateStars(truth * 4, truth)).toBe(1);
      expect(E.estimateStars(truth / 4, truth)).toBe(1);
      expect(E.estimateStars(truth * 4.1, truth)).toBe(0);
      expect(E.estimateStars(truth / 10, truth)).toBe(0);
    }
    expect(E.estimateStars(0, 10)).toBe(0);
    expect(E.estimateStars(-5, 10)).toBe(0);
    expect(E.estimateStars(NaN, 10)).toBe(0);
  });

  test('the slider is a log scale: monotonic, inside its range, and its middle is a sensible guess', () => {
    for (const q of D.ESTIMATES) {
      let prev = -Infinity, bad = 0;
      for (let p = 0; p <= E.SLIDER_STEPS; p++) {
        const v = E.sliderValue(p, q.min, q.max);
        if (v < prev || v < q.min || v > q.max) bad++;
        prev = v;
      }
      expect(bad, q.id + ' monotonic and in range').toBe(0);
      expect(E.sliderValue(0, q.min, q.max)).toBe(q.min);
      expect(E.sliderValue(E.SLIDER_STEPS, q.min, q.max)).toBe(q.max);
      // the reference can be reached, within the two-significant-figure rounding
      const at = E.sliderValue(E.sliderPos(q.truth, q.min, q.max), q.min, q.max);
      expect(E.estimateStars(at, q.truth), q.id + ' is reachable for 3 stars').toBe(3);
    }
  });

  test('every question has both languages, a reference inside a wide range, and states the reference value', () => {
    const ids = new Set();
    for (const q of D.ESTIMATES) {
      expect(ids.has(q.id), 'unique ' + q.id).toBe(false); ids.add(q.id);
      expect([1, 2, 3]).toContain(q.tier);
      for (const k of ['q', 'unit', 'hint', 'ref']) { expect(q[k].es.length, q.id + ' ' + k + ' es').toBeGreaterThan(1); expect(q[k].en.length, q.id + ' ' + k + ' en').toBeGreaterThan(1); }
      expect(q.min).toBeLessThan(q.truth); expect(q.max).toBeGreaterThan(q.truth);
      // a wide range: the reference is not hugging an end, and the range spans at least a factor 8
      expect(q.max / q.min, q.id + ' range').toBeGreaterThanOrEqual(8);
      const pos = E.sliderPos(q.truth, q.min, q.max);
      expect(pos, q.id + ' not at the left end').toBeGreaterThan(150);
      expect(pos, q.id + ' not at the right end').toBeLessThan(850);
      // the reference text states the number it is scored against, in both number styles
      expect(q.ref.en, q.id).toContain(E.fmtNum(q.truth, false));
      expect(q.ref.es, q.id).toContain(E.fmtNum(q.truth, true));
    }
    expect(D.ESTIMATES.filter(q => q.tier === 1).length).toBeGreaterThanOrEqual(5);
    expect(D.ESTIMATES.length).toBeGreaterThanOrEqual(20);
  });
});

test.describe('Numbers', () => {
  test('fmtNum and parseAnswer', () => {
    expect(E.fmtNum(1234567.5, false)).toBe('1,234,567.5');
    expect(E.fmtNum(1234567.5, true)).toBe('1.234.567,5');
    expect(E.fmtNum(950, false)).toBe('950');
    expect(E.fmtNum(0.5, true)).toBe('0,5');
    expect(E.fmtNum(12.56, false)).toBe('12.56');
    expect(E.parseAnswer('12.5')).toBe(12.5);
    expect(E.parseAnswer('12,5')).toBe(12.5);
    expect(E.parseAnswer(' 7 ')).toBe(7);
    expect(E.parseAnswer('')).toBeNull();
    expect(E.parseAnswer('abc')).toBeNull();
    expect(E.parseAnswer('1.2.3')).toBeNull();
    expect(E.parseAnswer('-3')).toBeNull();
    expect(E.checkNumber(12.56, 12.56)).toBe(true);
    expect(E.checkNumber(12.5, 12.56)).toBe(false);
    expect(E.checkNumber(null, 3)).toBe(false);
  });
  test('missed-numeric choices: four distinct positive values that include the answer', () => {
    for (const a of [1, 2, 5, 12, 78.5, 0.5, 4500, 12.56]) {
      const c = E.numericChoices(a, 'x' + a);
      expect(c).toHaveLength(4); expect(new Set(c).size).toBe(4); expect(c).toContain(a);
      c.forEach(v => expect(v).toBeGreaterThan(0));
      expect(E.numericChoices(a, 'x' + a)).toEqual(c);
    }
  });
});

// ── units ────────────────────────────────────────────────────
// Independent: every unit through its SI base, written here again.
const BASE = {
  mi: ['length', 1609.344], km: ['length', 1000], ft: ['length', 0.3048], m: ['length', 1], 'in': ['length', 0.0254], cm: ['length', 0.01],
  lb: ['mass', 0.45359237], kg: ['mass', 1], oz: ['mass', 0.028349523125], g: ['mass', 0.001],
  gal: ['vol', 3.785411784], L: ['vol', 1], floz: ['vol', 0.0295735295625], mL: ['vol', 0.001],
  mph: ['speed', 0.44704], 'km/h': ['speed', 1 / 3.6], 'm/s': ['speed', 1],
  USD: ['money', 950], CLP: ['money', 1]
};
function indep(from, to, v) {
  if (from === 'C') return v * 1.8 + 32;
  if (from === 'F') return (v - 32) / 1.8;
  expect(BASE[from][0]).toBe(BASE[to][0]);
  return v * BASE[from][1] / BASE[to][1];
}
const rnd = (x, d) => Math.round(x * Math.pow(10, d) + 1e-9) / Math.pow(10, d);

test.describe('Units and conversions', () => {
  test('every pair and every friendly value converts to what an independent calculation says', () => {
    for (const p of U.PAIRS) for (const dir of ['xy', 'yx']) {
      const from = dir === 'xy' ? p.x : p.y, to = dir === 'xy' ? p.y : p.x;
      for (const v of p[dir].vals) {
        const bad = !close(U.convert(p, v, dir), indep(from, to, v), 1e-12) || !(U.convert(p, v, dir) >= 0);
        if (bad) throw new Error(p.id + ' ' + dir + ' ' + v);
      }
    }
  });

  test('the whole-number pairs are exact, and the money rate is the stated practice rate', () => {
    expect(U.USD_CLP).toBe(950);
    expect(U.convert(U.pairById('usd-clp'), 10, 'xy')).toBe(9500);
    expect(U.convert(U.pairById('usd-clp'), 9500, 'yx')).toBe(10);
    expect(U.convert(U.pairById('C-F'), 100, 'xy')).toBe(212);
    expect(U.convert(U.pairById('C-F'), 0, 'xy')).toBe(32);
    expect(U.convert(U.pairById('C-F'), -40, 'xy')).toBe(-40);
    expect(U.convert(U.pairById('ms-kmh'), 10, 'xy')).toBeCloseTo(36, 10);
    expect(U.convert(U.pairById('mi-km'), 1, 'xy')).toBeCloseTo(1.609344, 12);
  });

  test('quiz questions: the right choice is the independent answer, rounded as the question says', () => {
    const ok = checker();
    const topics = ['length', 'mass', 'volume', 'temp', 'speed', 'money'];
    for (const topic of topics) for (let seed = 0; seed < 300; seed++) {
      const q = U.unitQuestion(topic, E.rng(seed)), id = topic + ' ' + seed;
      const p = U.pairById(q.pair);
      const want = rnd(indep(q.from, q.to, q.value), q.dec);
      ok(p.topic === topic, id + ' topic');
      ok(q.answer === want, id + ' answer ' + q.answer + ' wanted ' + want);
      ok(q.choices[q.correct].v === want, id + ' the marked choice');
      ok(q.choices.length === 4 && new Set(q.choices.map(c => c.en)).size === 4, id + ' distinct choices');
      ok(q.choices.every(c => c.v >= 0), id + ' no negative choices');
      ok(q.text.en.includes(q.dec === 0 ? 'nearest whole number' : 'one decimal'), id + ' rounding stated');
      ok(q.text.es.length > 10 && q.steps.length >= 3, id + ' text and steps');
      ok(q.steps[q.steps.length - 1].en.includes(q.choices[q.correct].en), id + ' last step states the answer');
      const raw = indep(q.from, q.to, q.value) * Math.pow(10, q.dec), fr = raw - Math.floor(raw);
      ok(Math.abs(fr - 0.5) > 0.02, id + ' too close to a rounding edge');
      if (topic === 'money') ok(/approximate, not today/.test(q.note.en) && /aproximado, no el de hoy/.test(q.note.es), id + ' money note');
    }
    expect(ok.fails).toEqual([]);
  });

  test('a quiz is deterministic under its seed', () => {
    for (const topic of ['length', 'zones']) expect(JSON.stringify(U.question(topic, E.rng(42)))).toBe(JSON.stringify(U.question(topic, E.rng(42))));
  });

  test('a missed question becomes a plain-text review item that stands on its own', () => {
    const q = U.unitQuestion('speed', E.rng(3)), it = U.reviewItem(q, false);
    expect(it.choices).toContain(it.answer);
    expect(it.prompt).toContain('Convert');
    expect(U.reviewItem(q, true).prompt).toContain('Convierte');
  });
});

// ── time zones against the browser's own database ────────────
function oracleOffset(tz, utcMs) {
  const f = oracleOffset.cache[tz] || (oracleOffset.cache[tz] = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }));
  const o = {};
  f.formatToParts(new Date(utcMs)).forEach(p => { o[p.type] = +p.value; });
  return Math.round((Date.UTC(o.year, o.month - 1, o.day, o.hour, o.minute, o.second) - Math.floor(utcMs / 1000) * 1000) / 60000);
}
oracleOffset.cache = {};
const TZ = { LA: 'America/Los_Angeles', SCL: 'America/Santiago' };

test.describe('Time zones: California and Santiago', () => {
  test('offsets match the time-zone database for every 20 minutes around each change, 2023 to 2040', () => {
    for (let y = 2023; y <= 2040; y++) {
      const t = U.transitions(y);
      for (const key of ['laStart', 'laEnd', 'sclStart', 'sclEnd']) {
        const zone = key.startsWith('la') ? 'LA' : 'SCL';
        for (let m = -180; m <= 180; m += 20) {
          const u = t[key] + m * 60000;
          if (U.offsetMinutes(zone, u) !== oracleOffset(TZ[zone], u)) throw new Error(y + ' ' + key + ' ' + m);
        }
      }
    }
  });

  test('offsets match the time-zone database every 6 hours, 2023 to 2040', () => {
    let n = 0;
    for (let u = Date.UTC(2023, 0, 1); u < Date.UTC(2041, 0, 1); u += 6 * 3600000) {
      for (const zone of ['LA', 'SCL']) {
        const got = U.offsetMinutes(zone, u), want = oracleOffset(TZ[zone], u);
        if (got !== want) throw new Error(zone + ' ' + new Date(u).toISOString() + ' got ' + got + ' want ' + want);
        n++;
      }
    }
    expect(n).toBeGreaterThan(50000);
  });

  test('the rules in words: the 2026 dates', () => {
    const t = U.transitions(2026), iso = ms => new Date(ms).toISOString();
    expect(iso(t.laStart)).toBe('2026-03-08T10:00:00.000Z');      // second Sunday of March, 2:00 am PST
    expect(iso(t.laEnd)).toBe('2026-11-01T09:00:00.000Z');        // first Sunday of November, 2:00 am PDT
    expect(iso(t.sclEnd)).toBe('2026-04-05T03:00:00.000Z');       // first Saturday of April, midnight
    expect(iso(t.sclStart)).toBe('2026-09-06T04:00:00.000Z');     // first Saturday of September, midnight
    // hours Santiago is ahead of California on the 15th of each month of 2026
    expect(U.aheadByMonth(2026)).toEqual([5, 5, 4, 3, 3, 3, 3, 3, 4, 4, 5, 5]);
  });

  test('wall-clock times that do not exist or happen twice are refused', () => {
    expect(U.localToUtc('LA', 2026, 3, 8, 2, 30)).toBeNull();     // skipped when clocks go forward
    expect(U.localToUtc('LA', 2026, 11, 1, 1, 30)).toBeNull();    // happens twice
    expect(U.localToUtc('LA', 2026, 11, 1, 3, 30)).not.toBeNull();
    expect(U.localToUtc('SCL', 2026, 9, 6, 0, 30)).toBeNull();    // midnight to 1:00 is skipped
    expect(U.localToUtc('SCL', 2026, 4, 4, 23, 30)).toBeNull();   // 23:00 to midnight happens twice
    expect(U.localToUtc('SCL', 2026, 9, 6, 1, 30)).not.toBeNull();
  });

  test('converting a time: the four situations in a year', () => {
    const at = (from, y, m, d, hh, mm) => { const r = U.convertZone(from, from === 'LA' ? 'SCL' : 'LA', y, m, d, hh, mm); return U.fmtShort(r.to, false) + '/' + U.hoursAhead(r.utc); };
    expect(at('LA', 2026, 1, 15, 9, 0)).toBe('Thu 2:00 PM/5');     // both on standard time... Chile on summer time
    expect(at('LA', 2026, 3, 20, 9, 0)).toBe('Fri 1:00 PM/4');     // California already on daylight time, Chile still summer
    expect(at('LA', 2026, 7, 15, 9, 0)).toBe('Wed 12:00 PM/3');    // California daylight, Chile winter
    expect(at('LA', 2026, 9, 20, 9, 0)).toBe('Sun 1:00 PM/4');     // Chile back on summer time first
    expect(at('LA', 2026, 11, 10, 21, 30)).toBe('Wed 2:30 AM/5');  // past midnight: the next day
    expect(at('SCL', 2026, 11, 10, 1, 30)).toBe('Mon 8:30 PM/5');  // and back: the day before
  });

  test('quiz questions: the answer agrees with the database, the times are unambiguous, the choices differ', () => {
    const ok = checker();
    const pad = n => String(n).padStart(2, '0');
    const wall = (tz, utc) => { const f = new Intl.DateTimeFormat('en-CA', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }); const o = {}; f.formatToParts(new Date(utc)).forEach(p => { o[p.type] = p.value; }); return o.year + '-' + o.month + '-' + o.day + ' ' + o.hour + ':' + o.minute; };
    for (let seed = 0; seed < 400; seed++) {
      const q = U.zoneQuestion(E.rng(seed));
      ok(q, 'seed ' + seed);
      if (!q) continue;
      const from = TZ[q.from], to = TZ[q.to];
      const start = q.y + '-' + pad(q.m) + '-' + pad(q.d) + ' ' + pad(q.hh) + ':' + pad(q.mm);
      const naive = Date.UTC(q.y, q.m - 1, q.d, q.hh, q.mm);
      const guess = naive - oracleOffset(from, naive) * 60000;
      ok(wall(from, guess) === start, 'the start time exists once: ' + start);
      const a = q.answerTime;
      ok(wall(to, guess) === a.y + '-' + pad(a.m) + '-' + pad(a.d) + ' ' + pad(a.hh) + ':' + pad(a.mm), 'answer ' + seed);
      for (const z of [from, to]) for (const dh of [-48, 48]) ok(oracleOffset(z, guess + dh * 3600000) === oracleOffset(z, guess), 'a clock change is near ' + start);
      ok(q.choices.length === 4 && new Set(q.choices.map(c => c.en)).size === 4, 'distinct choices ' + seed);
      const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(Date.UTC(a.y, a.m - 1, a.d)).getUTCDay()];
      const clock = ((a.hh % 12) || 12) + ':' + pad(a.mm) + ' ' + (a.hh < 12 ? 'AM' : 'PM');
      ok(q.choices[q.correct].en === dow + ' ' + clock, 'marked choice ' + seed + ': ' + q.choices[q.correct].en + ' vs ' + dow + ' ' + clock);
      ok([3, 4, 5].includes(q.ahead), 'ahead');
      ok(q.steps[q.steps.length - 1].en.includes(q.choices[q.correct].en), 'last step');
    }
    expect(ok.fails).toEqual([]);
  });
});

// ── Engineer's problems ──────────────────────────────────────
// The answer from the numbers shown, by a formula written here.
const ORACLE = {
  'rect-area': (p) => p.w * p.h,
  tiles: (p) => p.w * p.h * 10000 / (p.side * p.side),
  lshape: (p) => p.W * p.H - p.cw * p.ch,
  triangle: (p) => p.b * p.h / 2,
  'circle-area': (p) => 314 * p.r * p.r / 100,
  'box-volume': (p) => p.l * p.w * p.h,
  'tank-litres': (p) => p.l * p.w * p.h / 1000,
  'cyl-litres': (p) => 314 * p.r * p.r * p.h / 100,
  'map-km': (p) => p.cm * p.scale / 100000,
  'map-cm': (p) => p.km * 100000 / p.scale,
  'plan-m': (p) => p.cm * p.scale / 100,
  'model-cm': (p) => p.m * 100 / p.scale,
  'pump-time': (p) => p.V / p.Q,
  'two-pumps': (p) => p.V / (p.Q1 + p.Q2),
  'leaky-tank': (p) => p.V / (p.In - p.Out),
  'find-rate': (p) => p.V / p.t,
  'concrete-mix': (p, pr) => p.total * pr.art.parts[pr.art.hi] / (p.a + p.b + p.c),
  'paint-mix': (p, pr) => p.total * pr.art.parts[pr.art.hi] / (p.x + p.y),
  'gear-ratio': (p) => p.big / p.small,
  'paint-cover': (p) => p.area / p.cover,
  'pct-of': (p) => p.pct * p.base / 100,
  discount: (p) => p.price - p.price * p.pct / 100,
  increase: (p) => p.len + p.len * p.pct / 100,
  'what-pct': (p) => 100 * p.part / p.whole,
  speed: (p) => p.d / p.t,
  distance: (p) => p.v * p.t,
  time: (p) => p.d / p.v,
  'speed-ms': (p) => p.d / p.t,
  'speed-min': (p) => p.d / (p.m / 60),
  'ohm-v': (p) => p.I * p.R,
  'ohm-i': (p) => p.V / p.R,
  'ohm-r': (p) => p.V / p.I,
  power: (p) => p.V * p.I,
  'ohm-series': (p) => p.V / (p.R1 + p.R2)
};

test.describe("Engineer's problems", () => {
  test('eight topics, each with a link to the app that teaches the idea', () => {
    expect(P.TOPICS.map(t => t.id)).toEqual(['area', 'volume', 'scale', 'rates', 'ratio', 'percent', 'speed', 'ohm']);
    expect(P.LINKS.ohm).toBe('circuit-lab.html');
    expect(P.LINKS.area).toBe('euclid-workshop.html');
    expect(P.LINKS.scale).toBe('little-engineer.html');
    expect(P.LINKS.percent).toBe('math-galaxy.html');
  });

  test('every topic, 400 seeds: the stated answer is the independent answer, exact and positive', () => {
    const ok = checker(), kindsSeen = {};
    for (const t of P.TOPICS) {
      for (let seed = 0; seed < 400; seed++) {
        const pr = P.problem(t.id, t.id + ':' + seed), id = pr.kind + ' ' + JSON.stringify(pr.p);
        const o = ORACLE[pr.kind];
        ok(o, 'an oracle for ' + pr.kind);
        if (!o) continue;
        const want = o(pr.p, pr);
        ok(close(pr.answer, want, 1e-9), id + ' wanted ' + want + ' got ' + pr.answer);
        ok(Number.isFinite(pr.answer) && pr.answer > 0, id + ' positive and finite');
        ok(Math.abs(pr.answer * 100 - Math.round(pr.answer * 100)) < 1e-7, id + ' exact to two decimals: ' + pr.answer);
        ok(pr.dec === P.decimalsOf(pr.answer), id + ' dec');
        ok(Object.values(pr.p).every(v => Number.isFinite(v) && v > 0), id + ' every number shown is positive');
        (kindsSeen[t.id] = kindsSeen[t.id] || new Set()).add(pr.kind);
      }
      ok(kindsSeen[t.id].size >= 3, t.id + ' has several kinds of problem');
    }
    expect(ok.fails).toEqual([]);
  });

  test('every number the problem is built from is in its statement, in both languages', () => {
    const ok = checker();
    for (const t of P.TOPICS) for (let seed = 0; seed < 150; seed++) {
      const pr = P.problem(t.id, 'text:' + seed);
      for (const v of Object.values(pr.p)) {
        ok(pr.text.en.includes(E.fmtNum(v, false)), pr.kind + ' en ' + v);
        ok(pr.text.es.includes(E.fmtNum(v, true)), pr.kind + ' es ' + v);
      }
      ok(/\?/.test(pr.text.en) && /\?/.test(pr.text.es), pr.kind + ' asks a question');
    }
    expect(ok.fails).toEqual([]);
  });

  test('the worked solution has steps in both languages and ends with the answer', () => {
    const ok = checker();
    for (const t of P.TOPICS) for (let seed = 0; seed < 150; seed++) {
      const pr = P.problem(t.id, 'steps:' + seed), last = pr.steps[pr.steps.length - 1];
      ok(pr.steps.length >= 3 && pr.steps.every(s => s.en.length > 3 && s.es.length > 3), pr.kind + ' steps');
      ok(last.en.includes(E.fmtNum(pr.answer, false)) && last.es.includes(E.fmtNum(pr.answer, true)), pr.kind + ' last step ' + last.en);
      ok(pr.hint.en.length > 5 && pr.hint.es.length > 5 && pr.art && pr.art.kind && /\.html$/.test(pr.link), pr.kind + ' hint, art, link');
    }
    expect(ok.fails).toEqual([]);
  });

  test('a seed always gives the same problem', () => {
    for (const t of P.TOPICS) {
      expect(JSON.stringify(P.problem(t.id, 77))).toBe(JSON.stringify(P.problem(t.id, 77)));
      expect(JSON.stringify(P.problem(t.id, 77))).not.toBe(JSON.stringify(P.problem(t.id, 78)));
    }
    expect(P.problem('nope', 1)).toBeNull();
  });

  test('a missed problem becomes a plain-text review item with the answer among four choices', () => {
    const ok = checker();
    for (const t of P.TOPICS) for (let seed = 0; seed < 40; seed++) {
      const pr = P.problem(t.id, 'rev:' + seed), it = P.reviewItem(pr, false), esIt = P.reviewItem(pr, true);
      ok(it.choices.length === 4 && new Set(it.choices).size === 4 && it.choices.includes(it.answer), pr.kind + ' choices ' + it.choices);
      ok(it.prompt === pr.text.en && esIt.prompt === pr.text.es, pr.kind + ' prompt');
      ok(it.prompt.length <= 240 && it.answer.length <= 80, pr.kind + ' fits what Repaso keeps');
    }
    expect(ok.fails).toEqual([]);
  });
});
