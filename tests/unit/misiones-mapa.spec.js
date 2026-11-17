// @ts-check
// Misiones de Mapa, part 1 (no browser): content and maths. Every clue
// needs both languages and must name real neighbours (checked against the
// Natural Earth borders in world-map-data.js); the regions and the Ruta 5
// must run north to south; the trip maths (distance, flight time, time
// zones, the date line) and the question generators must be right; and
// every string goes through the restricted-word grep.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '../..');
const D = require('../../js/misiones-mapa-data.js');
const E = require('../../js/misiones-mapa-engine.js');
const A = require('../../js/misiones-mapa-art.js');

const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/world-map-data.js'), 'utf8') + ';this.WorldMap = WorldMap;', ctx);
/** @type {any} */
const WM = ctx.WorldMap;

// Same pattern as the pre-push grep in CONTRIBUTING.md.
const RESTRICTED = /genero|género|identidad|diversidad|inclusi[oó]n|pronombre|trans |gay|lesbiana|queer|pride|diverso|equidad|justicia social|colonialismo|opres|patriarcado|feminis|woke|diversity|equity|inclusion|gender |lgbt|transgender/i;
// Map content stays geography: no politics, disputes or wars.
const POLITICAL = /dispute|disputa|guerra|\bwar\b|ocupad|occupied|reclam|claim|conflict|invasi|invasion|soberan|sovereign|protest|dictad|dictator/i;

/** @param {any} v @param {string[]} out */
function collect(v, out) {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach(x => collect(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach(x => collect(x, out));
  return out;
}

const pair = (/** @type {any} */ p) => Array.isArray(p) && p.length === 2 && p.every(s => typeof s === 'string' && s.trim().length > 1);
const city = (/** @type {string} */ id) => D.BY_CITY[id];

test.describe('Misiones de Mapa — content', () => {

  test('every mystery place has a map outline, a flag and 3 to 6 bilingual clues', () => {
    expect(D.MYSTERY.length).toBeGreaterThanOrEqual(30);
    const codes = new Set();
    for (const m of D.MYSTERY) {
      expect(codes.has(m.c), m.c + ' twice').toBe(false);
      codes.add(m.c);
      expect(WM.info(m.c), m.c + ' outline').toBeTruthy();
      expect(WM.path(m.c).length, m.c + ' path').toBeGreaterThan(20);
      expect(WM.hasFlag(m.c), m.c + ' flag').toBe(true);
      expect(D.REGIONS.some(r => r.id === m.reg), m.c + ' zoom').toBe(true);
      let n = 0;
      for (const k of ['cl', 'lm', 'fl', 'rv', 'xx']) {
        if (!m[k]) continue;
        expect(pair(m[k]), m.c + '.' + k).toBe(true);
        n++;
      }
      if (m.nb.length) n++;
      expect(n, m.c + ' clue count').toBeGreaterThanOrEqual(4);
    }
  });

  test('neighbour clues only name countries that really share a border', () => {
    for (const m of D.MYSTERY) {
      const real = WM.info(m.c).n;
      for (const nb of m.nb) expect(real, m.c + ' is not next to ' + nb).toContain(nb);
    }
    // the clue never names the answer itself
    for (const m of D.MYSTERY) expect(m.nb).not.toContain(m.c);
  });

  test('every country a neighbour clue names has a Spanish and English name in World Atlas data', () => {
    const src = fs.readFileSync(path.join(ROOT, 'js/world-atlas-data.js'), 'utf8');
    const c2 = {};
    vm.createContext(c2);
    vm.runInContext(src + ';this.D = WORLD_ATLAS_DATA;', c2);
    const ids = new Set(c2.D.map(c => c.id));
    for (const m of D.MYSTERY) for (const nb of m.nb.concat([m.c])) expect(ids.has(nb), nb).toBe(true);
  });

  test('cities have real time zones, both names and sensible coordinates', () => {
    for (const c of D.CITIES) {
      expect(pair(c.n), c.id).toBe(true);
      expect(Math.abs(c.ll[0]) <= 180 && Math.abs(c.ll[1]) <= 90, c.id).toBe(true);
      expect(() => new Intl.DateTimeFormat('en-US', { timeZone: c.tz }), c.id + ' ' + c.tz).not.toThrow();
      // the fallback table agrees with the device's zone data in January and July
      const y = 2026;
      const jan = E.tzOffsetMin(c.tz, Date.UTC(y, 0, 15, 12)), jul = E.tzOffsetMin(c.tz, Date.UTC(y, 6, 15, 12));
      expect([jan / 60, jul / 60], c.id + ' offsets').toEqual(c.off);
      expect(WM.info(c.c), c.id + ' country').toBeTruthy();
    }
    for (const t of D.TRIPS) {
      expect(city(t.from) && city(t.to), t.id).toBeTruthy();
      expect(/^\d\d:\d\d$/.test(t.dep), t.id).toBe(true);
      expect([0, 6]).toContain(t.mon);
      expect(pair(t.why), t.id).toBe(true);
    }
    for (const id of D.LITTLE_CITIES) expect(city(id), id).toBeTruthy();
  });

  test('the 16 regions run north to south, each with its capital and a fact', () => {
    expect(D.REGIONS_CL.length).toBe(16);
    expect(D.REGIONS_CL[0].n[0]).toBe('Arica y Parinacota');
    expect(D.REGIONS_CL[15].cap).toBe('Punta Arenas');
    for (let i = 0; i < 16; i++) {
      const g = D.REGIONS_CL[i];
      expect(pair(g.n) && pair(g.f) && g.cap.length > 2, g.id).toBe(true);
      if (i) expect(g.ll[1], g.id + ' south of the one before').toBeLessThan(D.REGIONS_CL[i - 1].ll[1]);
    }
    expect(D.REGIONS_CL.map(g => g.cap)).toEqual(['Arica', 'Iquique', 'Antofagasta', 'Copiapó', 'La Serena', 'Valparaíso', 'Santiago',
      'Rancagua', 'Talca', 'Chillán', 'Concepción', 'Temuco', 'Valdivia', 'Puerto Montt', 'Coyhaique', 'Punta Arenas']);
  });

  test('the Ruta 5 kilometres grow away from Santiago in both directions', () => {
    const pos = D.RUTA5.map(c => E.ruta5Pos(c));
    for (let i = 1; i < pos.length; i++) expect(pos[i], D.RUTA5[i].n).toBeGreaterThan(pos[i - 1]);
    for (let i = 1; i < D.RUTA5.length; i++) expect(D.RUTA5[i].ll[1], D.RUTA5[i].n).toBeLessThan(D.RUTA5[i - 1].ll[1]);
    const by = Object.fromEntries(D.RUTA5.map(c => [c.id, c]));
    expect(E.ruta5Km(by.ari, by.lsc)).toBe(2060 - 470);          // same side: subtract
    expect(E.ruta5Km(by.lsc, by.zco)).toBe(470 + 680);           // across Santiago: add
    expect(E.ruta5Km(by.zco, by.lsc)).toBe(E.ruta5Km(by.lsc, by.zco));
  });

  test('cross-sections have their labelled points on the line', () => {
    for (const p of D.PROFILES) {
      expect(pair(p.t) && pair(p.s), p.id).toBe(true);
      for (let i = 1; i < p.pts.length; i++) expect(p.pts[i][0]).toBeGreaterThan(p.pts[i - 1][0]);
      for (const m of p.marks) expect(Math.abs(E.heightAt(p, m.km) - m.m), p.id + ' ' + m.id).toBeLessThan(1);
    }
    const andes = D.PROFILES.find(p => p.id === 'andes33');
    expect(andes.marks.find(m => m.id === 'acon').m).toBe(6961);
  });

  test('all text passes the restricted-word grep and stays clear of politics', () => {
    const all = collect(D, []);
    const ui = fs.readFileSync(path.join(ROOT, 'js/misiones-mapa.js'), 'utf8');
    for (const s of all) {
      expect(RESTRICTED.test(s), s).toBe(false);
      expect(POLITICAL.test(s), s).toBe(false);
    }
    expect(RESTRICTED.test(ui)).toBe(false);
    expect(POLITICAL.test(ui.replace(/\/\/.*$/gm, ''))).toBe(false);
  });

  test('the app never fetches anything at runtime', () => {
    for (const f of ['misiones-mapa.js', 'misiones-mapa-data.js', 'misiones-mapa-engine.js', 'misiones-mapa-art.js']) {
      const src = fs.readFileSync(path.join(ROOT, 'js', f), 'utf8');
      expect(/fetch\(|XMLHttpRequest|https?:\/\/(?!www\.w3\.org\/2000\/svg)/.test(src), f).toBe(false);
    }
  });
});

test.describe('Misiones de Mapa — maths', () => {

  test('great-circle distances match known values', () => {
    const km = (a, b) => E.distanceKm(city(a).ll, city(b).ll);
    expect(Math.abs(km('scl', 'bue') - 1140)).toBeLessThan(20);
    expect(Math.abs(km('scl', 'mad') - 10700)).toBeLessThan(60);
    expect(Math.abs(km('scl', 'ipc') - 3760)).toBeLessThan(40);
    expect(Math.abs(km('lon', 'par') - 343)).toBeLessThan(10);
    expect(km('scl', 'sfo')).toBeCloseTo(WM.distanceKm(city('scl').ll, city('sfo').ll), 3);
  });

  test("the pilot's rule: 800 km an hour plus half an hour, to the half hour", () => {
    expect(E.flightMinutes(800)).toBe(90);
    expect(E.flightMinutes(1140)).toBe(120);       // 1.43 h + 0.5 h = 1.93 h → 2 h
    expect(E.flightMinutes(9560)).toBe(750);       // 11.95 + 0.5 = 12.45 → 12 h 30 min
    expect(E.flightMinutes(10)).toBe(30);
    expect(E.flightHoursSimple(9560)).toBe(12);
    expect(E.fmtDuration(750)).toBe('12 h 30 min');
    expect(E.fmtDuration(120)).toBe('2 h');
  });

  test('leave Santiago at 22:00 on 15 January, land in San Francisco at 05:30 the next day', () => {
    const t = E.trip(city('scl'), city('sfo'), '22:00', 0, 2026);
    expect(t.mins).toBe(750);
    expect(t.offFrom).toBe(-180);
    expect(t.offTo).toBe(-480);
    expect(t.arr).toBe('05:30');
    expect(t.days).toBe(1);
    expect(t.arrHome).toBe('10:30');                // what a Santiago watch says
    expect(E.fmtOffset(t.offFrom)).toBe('UTC−3');
  });

  test('winter in Chile: Punta Arenas is an hour ahead of Santiago; Easter Island is 2 hours behind all year', () => {
    const pa = E.trip(city('scl'), city('pnt'), '08:00', 6, 2026);
    expect(pa.diffMin).toBe(60);
    expect(pa.arr).toBe('12:00');
    for (const mon of [0, 6]) expect(E.trip(city('scl'), city('ipc'), '09:30', mon, 2026).diffMin).toBe(-120);
  });

  test('flying west across the Pacific to Sydney skips a calendar day', () => {
    const t = E.trip(city('scl'), city('syd'), '11:00', 0, 2026);
    expect(t.offTo).toBe(11 * 60);
    expect(t.arr).toBe('15:30');
    expect(t.days).toBe(1);
  });

  test('arrival choices hold the right time once, plus the "forgot the time zone" mistake', () => {
    const t = E.trip(city('scl'), city('sfo'), '22:00', 0, 2026);
    for (let s = 1; s < 30; s++) {
      const cs = E.arrivalChoices(t, E.rng(s));
      expect(cs.choices.length).toBe(4);
      expect(new Set(cs.choices).size).toBe(4);
      expect(cs.choices[cs.answer]).toBe('05:30|1');
      expect(cs.choices).toContain('10:30|1');
    }
  });

  test('compass directions and bearings', () => {
    expect(E.dir8(E.degFromDelta(0, -1))).toBe('N');
    expect(E.dir8(E.degFromDelta(1, 1))).toBe('SE');
    expect(E.dir8(E.degFromDelta(-1, 0))).toBe('O');
    expect(E.dir4(200)).toBe('S');
    expect(E.opposite('NE')).toBe('SO');
    expect(E.dirDeg('SO')).toBe(225);
    expect(Math.round(E.bearing([0, 0], [10, 0]))).toBe(90);
    expect(Math.round(E.bearing([0, 0], [0, -10]))).toBe(180);
  });

  test('compass questions on the valley map are always true', () => {
    const at = Object.fromEntries(D.VILLAGE.map(v => [v.id, v]));
    for (const level of [4, 8]) {
      for (let s = 1; s < 200; s++) {
        const q = E.compassQ(D.VILLAGE, level, E.rng(s));
        const a = at[q.from], b = at[q.to];
        expect(E.dir8(E.degFromDelta(b.x - a.x, b.y - a.y))).toBe(q.dir);
        if (level === 4) expect(q.dir.length).toBe(1);
        if (q.kind === 'which') expect(q.choices[q.answer]).toBe(q.dir);
        else {
          expect(q.choices[q.answer]).toBe(q.to);
          // no other choice lies in the same direction
          for (const c of q.choices) if (c !== q.to) {
            const v = at[c];
            expect(E.dir8(E.degFromDelta(v.x - a.x, v.y - a.y)) === q.dir && Math.max(Math.abs(v.x - a.x), Math.abs(v.y - a.y)) <= 1).toBe(false);
          }
        }
        expect(new Set(q.choices.map(String)).size).toBe(q.choices.length);
      }
    }
  });

  test('scale questions: km = cm × km per cm, and 1:N scales', () => {
    for (const lv of ['blocks', 'cm', 'two', 'ratio', 'back']) {
      for (let s = 1; s < 60; s++) {
        const q = E.scaleQ(lv, E.rng(s));
        const right = q.kind === 'back' ? q.cm : q.km;
        expect(q.choices[q.answer], lv).toBe(right);
        expect(new Set(q.choices).size).toBe(4);
        if (q.kind === 'two') expect(q.km).toBe(q.per * (q.cm + q.cm2));
        else if (q.kind === 'ratio') expect(q.km).toBe(q.den / 100000 * q.cm);
        else expect(q.km).toBe(q.per * q.cm);
      }
    }
  });

  test('cross-section, contour, latitude, Ruta 5 and order questions have exactly one right answer', () => {
    for (let s = 1; s < 80; s++) {
      const r = E.rng(s);
      const p = D.PROFILES[s % 2], pq = E.profileQ(p, r);
      expect(pq.answer).toBeGreaterThanOrEqual(0);
      expect(new Set(pq.choices.map(String)).size).toBe(pq.choices.length);
      if (pq.kind === 'highest') expect(pq.choices[pq.answer]).toBe(p.marks.reduce((a, b) => (b.m > a.m ? b : a)).id);

      const cq = E.contourQ(r);
      if (cq.kind === 'top') expect(cq.choices[cq.answer]).toBe(cq.n * cq.step);
      if (cq.kind === 'steep') expect(cq.choices[cq.answer]).toBe(cq.steep);
      if (cq.kind === 'dot') expect(cq.choices[cq.answer]).toBe(cq.ring * cq.step);

      const lq = E.latlonQ(D.CITIES, 'read', r), c = city(lq.city);
      expect(lq.choices[lq.answer]).toEqual([Math.round(c.ll[0]) || 0, Math.round(c.ll[1]) || 0]);
      const hq = E.latlonQ(D.CITIES, 'hemi', r), h = city(hq.city);
      expect(hq.choices[hq.answer]).toBe(hq.kind === 'ns' ? (h.ll[1] < 0 ? 'S' : 'N') : (h.ll[0] < 0 ? 'O' : 'E'));

      const rq = E.ruta5Q(D.RUTA5, s % 3 ? 'km' : 'time', r);
      if (rq.kind === 'km') expect(rq.choices[rq.answer]).toBe(rq.km);
      expect(new Set(rq.choices).size).toBe(4);

      const nq = E.northQ(D.RUTA5, r), byId = Object.fromEntries(D.RUTA5.map(x => [x.id, x]));
      const [a, b] = nq.choices.map(id => byId[id]);
      expect(nq.answer).toBe(a.ll[1] > b.ll[1] ? 0 : 1);

      const op = E.orderPuzzle(D.REGIONS_CL, 5, r), idx = op.answer.map(id => D.REGIONS_CL.findIndex(g => g.id === id));
      expect(idx).toEqual([...idx].sort((x, y) => x - y));
      expect([...op.shown].sort()).toEqual([...op.answer].sort());
      expect(op.shown.join()).not.toBe(op.answer.join());
    }
  });

  test('round stars: all right 3, 80% 2, 60% 1', () => {
    expect(E.roundStars(6, 6)).toBe(3);
    expect(E.roundStars(5, 6)).toBe(2);
    expect(E.roundStars(4, 6)).toBe(1);
    expect(E.roundStars(3, 6)).toBe(0);
    expect(E.roundStars(0, 0)).toBe(0);
  });

  test('the art builds valid-looking SVG for every tile, zone and thing', () => {
    const parts = [A.rose({}), A.plane('x'), A.contour({ n: 5, step: 100, steep: 'E', ring: 2 }), A.profileChart(D.PROFILES[0], { es: true })];
    A.TILE_NAMES.forEach(n => parts.push(A.tile(n)));
    D.ZONES.forEach(z => parts.push(A.zone(z.art)));
    D.ZONE_THINGS.forEach(t => parts.push(A.thing(t.art)));
    for (const s of parts) {
      expect(s.startsWith('<svg')).toBe(true);
      expect(s.endsWith('</svg>')).toBe(true);
      expect(/NaN|undefined/.test(s), s.slice(0, 80)).toBe(false);
    }
    for (const v of D.VILLAGE) expect(A.TILE_NAMES).toContain(v.art);
  });
});
