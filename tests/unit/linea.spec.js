// @ts-check
// Línea del Tiempo, part 1 (no browser): the events and the game maths.
// Content is the risk here, so this file is strict: every event needs a
// date, a lane, a source and text in both languages; every string goes
// through the restricted-word grep; links must point at real ids in the
// other apps; wars and recent Chilean history stay out.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '../..');
const D = require('../../js/linea-data.js');
const E = require('../../js/linea-engine.js');
const Art = require('../../js/linea-art.js');

/** @param {any} e */
function strings(e) {
  const out = [e.id, e.src, e.art];
  [e.t, e.d, e.w, e.dt].forEach(p => p && p.forEach(s => out.push(s)));
  if (e.x) ['c', 'e'].forEach(k => e.x[k] && e.x[k].forEach(s => out.push(s)));
  e.ln.forEach(l => out.push(l.es, l.en));
  return out.filter(Boolean);
}

// Same pattern as the pre-push grep in CONTRIBUTING.md.
const RESTRICTED = /genero|género|identidad|diversidad|inclusi[oó]n|pronombre|trans |gay|lesbiana|queer|pride|diverso|equidad|justicia social|colonialismo|opres|patriarcado|feminis|woke|diversity|equity|inclusion|gender |lgbt|transgender/i;
// Politics and detail that does not belong in kid-facing history.
const POLITICAL = /pinochet|allende|dictadur|dictator|golpe de|coup|socialis|comunis|communis|marxis|protest|estallido|constituyente|plebiscit|neruda|esclav|slave|conquista|conquest|genocid|invasi[oó]n|invasion/i;
const VIOLENT = /asesin|masacre|tortur|ejecut|murder|massacre|torture|slaughter|assassinat|executed|degoll|sangr|blood|\bgore\b|decapit/i;
const WAR_WORDS = /guerra|\bwar\b|batalla|battle/i;

test.describe('Línea del Tiempo: the events', () => {

  test('about 150 events, ids unique, three lanes', () => {
    expect(D.EVENTS.length).toBeGreaterThanOrEqual(140);
    const ids = D.EVENTS.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    const lanes = new Set(D.LANES.map(l => l.id));
    expect(lanes).toEqual(new Set(['cl', 'wd', 'ch']));
    D.LANES.forEach(l => expect(D.EVENTS.filter(e => e.lane === l.id).length).toBeGreaterThanOrEqual(40));
  });

  test('every event has a date, a lane, a tier, a source and text in both languages', () => {
    const bad = [];
    D.EVENTS.forEach(e => {
      const why = [];
      if (typeof e.y !== 'number' || !isFinite(e.y) || e.y === 0 || Math.floor(e.y) === 0) why.push('date (there is no year 0)');
      if (e.y < D.START || e.y > D.END) why.push('date out of range');
      if (!['cl', 'wd', 'ch'].includes(e.lane)) why.push('lane');
      if (![1, 2, 3].includes(e.tier)) why.push('tier');
      if (!e.art) why.push('art');
      ['t', 'd', 'w'].forEach(k => {
        if (!Array.isArray(e[k]) || e[k].length !== 2 || e[k].some(s => typeof s !== 'string' || s.trim().length < 3)) why.push('both-language ' + k);
      });
      if (e.t && e.t[0] === e.t[1] && !/^[A-Z][\wÀ-ÿ’' -]+$/.test(e.t[0])) why.push('title identical in both languages');
      if (e.d && e.d[0] === e.d[1]) why.push('desc identical in both languages');
      if (typeof e.src !== 'string' || !e.src.includes(': ')) why.push('source (publisher: page)');
      else if (!D.SOURCES.some(p => e.src.startsWith(p + ': '))) why.push('source publisher not on the list: ' + e.src);
      if (/wikipedia|wikimedia|reddit|blog/i.test(e.src || '')) why.push('source must be a reputable reference');
      if (e.dt && (e.dt.length !== 2 || e.dt.some(s => !s))) why.push('dt both languages');
      if (e.x) ['c', 'e'].forEach(k => { if (e.x[k] && (e.x[k].length !== 2 || e.x[k].some(s => !s))) why.push('x.' + k + ' both languages'); });
      if (why.length) bad.push(e.id + ': ' + why.join(', '));
    });
    expect(bad).toEqual([]);
  });

  test('old and traditional dates are marked "c." or as a tradition', () => {
    const bad = D.EVENTS.filter(e => e.y < -500 && !e.c && !e.dt).map(e => e.id);
    expect(bad).toEqual([]);
    // an explicit tradition says so in both languages
    D.EVENTS.filter(e => e.dt && /tradici|tradition/i.test(e.dt.join(' '))).forEach(e => {
      expect(e.dt[0]).toMatch(/tradici/i); expect(e.dt[1]).toMatch(/tradition/i);
    });
    // every approximate date shows its "c." (or is a range / century written out)
    D.EVENTS.filter(e => e.c).forEach(e => {
      expect(E.dateText(e, true) + E.dateText(e, false)).toMatch(/c\.|siglo|century/);
    });
  });

  test('people have a life span; years lived are plausible', () => {
    const persons = D.EVENTS.filter(e => e.person);
    expect(persons.length).toBeGreaterThanOrEqual(30);
    persons.forEach(e => {
      expect(e.sp[0]).toBe(e.y);
      expect(e.sp[1]).toBeGreaterThan(e.sp[0]);
      const life = E.astro(e.sp[1]) - E.astro(e.sp[0]);
      expect(life).toBeGreaterThanOrEqual(10);
      expect(life).toBeLessThanOrEqual(100);
    });
  });

  test('restricted-word grep over every string of every event', () => {
    const hits = [];
    D.EVENTS.forEach(e => strings(e).forEach(s => { if (RESTRICTED.test(s)) hits.push(e.id + ': ' + s); }));
    expect(hits).toEqual([]);
    // and the whole data file, art file and engine, as the pre-push grep would
    ['js/linea-data.js', 'js/linea-art.js', 'js/linea-engine.js', 'js/linea.js', 'linea-del-tiempo.html'].forEach(f => {
      const txt = fs.readFileSync(path.join(ROOT, f), 'utf8').split('\n').filter(l => RESTRICTED.test(l));
      expect({ f, txt }).toEqual({ f, txt: [] });
    });
  });

  test('no politics, no violent detail, and wars only as a date and an outcome', () => {
    const hits = [];
    D.EVENTS.forEach(e => strings(e).forEach(s => {
      if (POLITICAL.test(s)) hits.push('political ' + e.id + ': ' + s);
      if (VIOLENT.test(s)) hits.push('violent ' + e.id + ': ' + s);
    }));
    expect(hits).toEqual([]);
    // war words: only the two world wars, a recorded "armistice" line, the independence
    // battles (named with date and outcome) and the Maipú temple
    const allowed = ['ww1', 'ww2', 'maipu', 'andes-crossing', 'independence-1818', 'araucana'];
    const warry = D.EVENTS.filter(e => e.d.concat(e.w, e.t).some(s => WAR_WORDS.test(s))).map(e => e.id).filter(id => !allowed.includes(id));
    expect(warry).toEqual([]);
    ['ww1', 'ww2', 'maipu'].forEach(id => {
      const e = D.BY_ID[id];
      expect(e.d[0].length).toBeLessThan(260);
    });
  });

  test('Chilean history stops well before the divisive decades', () => {
    // After 1925 the Chile lane keeps to science, sport, culture, heritage and the Church,
    // each reviewed one by one.
    const okLate = ['mistral-nobel', 'mistral', 'quake-1960', 'worldcup-1962', 'teresa-canon', 'rapanui-unesco', 'paranal', 'valparaiso-unesco',
      'hurtado-canon', 'mineros-2010', 'alma', 'copa-america-2015'];
    const late = D.EVENTS.filter(e => e.lane === 'cl' && (e.sp ? e.sp[1] : e.y) > 1925 && e.y > 1925).map(e => e.id).filter(id => !okLate.includes(id));
    expect(late).toEqual([]);
    const between = D.EVENTS.filter(e => e.lane === 'cl' && e.y >= 1964 && e.y <= 1992).map(e => e.id);
    expect(between).toEqual([]);
  });

  test('links point at real regions, saints and countries in the other apps', () => {
    const sandbox = { window: {}, localStorage: { getItem() { return null; }, setItem() {} }, document: {} };
    const dc = fs.readFileSync(path.join(ROOT, 'js/descubre-chile-data.js'), 'utf8') + '\n;this.__r = DC_REGIONS.map(r => r.id).concat(Object.keys(DC_ISLANDS));';
    const ctx1 = vm.createContext({ ...sandbox });
    vm.runInContext(dc, ctx1);
    const regions = new Set(ctx1.__r);
    const fe = fs.readFileSync(path.join(ROOT, 'js/fe-explorador.js'), 'utf8') + '\n;this.__s = FeManager.SAINTS.map(s => s.id);';
    const ctx2 = vm.createContext({ ...sandbox });
    vm.runInContext(fe, ctx2);
    const saints = new Set(ctx2.__s);
    const we = fs.readFileSync(path.join(ROOT, 'js/world-explorer.js'), 'utf8');
    const countries = new Set([...we.matchAll(/id: '([a-z_]+)', name: '[^']+', nameEs:/g)].map(m => m[1]));
    expect(regions.size).toBeGreaterThan(15);
    expect(saints.size).toBeGreaterThan(20);
    expect(countries.size).toBeGreaterThan(30);
    const bad = [];
    D.EVENTS.forEach(e => e.ln.forEach(l => {
      if (!D.APP_LINKS[l.app]) { bad.push(e.id + ': app ' + l.app); return; }
      if (l.app === 'chile' && !regions.has(l.id)) bad.push(e.id + ': region ' + l.id);
      if (l.app === 'fe' && !saints.has(l.id)) bad.push(e.id + ': saint ' + l.id);
      if (l.app === 'world' && !countries.has(l.id)) bad.push(e.id + ': country ' + l.id);
      if (['chile', 'fe', 'world'].includes(l.app) && (!l.es || !l.en)) bad.push(e.id + ': link needs a name');
    }));
    expect(bad).toEqual([]);
    // each saint's lifespan here agrees with Fe Explorador's own card
    const dates = sandbox; // (kept simple: the saint lines below compare the years)
    const feSaints = vm.runInContext('FeManager.SAINTS', ctx2);
    D.EVENTS.filter(e => e.person && e.ln.some(l => l.app === 'fe')).forEach(e => {
      const s = feSaints.find((/** @type {any} */ x) => x.id === e.ln.find(l => l.app === 'fe').id);
      const m = /(\d{3,4})\D+(\d{3,4})/.exec(s.dates || '');
      if (m && !e.c) expect([e.id, e.sp[0], e.sp[1]]).toEqual([e.id, +m[1], +m[2]]);
    });
    void dates;
  });

  test('every scene and portrait named by an event exists in the art file', () => {
    const scenes = new Set(Art.ids);
    D.ERAS.forEach(er => expect(scenes.has(er.art)).toBe(true));
    D.EVENTS.forEach(e => {
      if (e.art.startsWith('p:')) expect(Art.looks).toContain(e.art.slice(2));
      else expect(scenes.has(e.art)).toBe(true);
      const svg = Art.scene(e.art, e.id, e.t[0]);
      expect(svg.startsWith('<svg')).toBe(true);
      expect(svg).not.toMatch(/undefined|NaN/);
    });
  });

  test('the tiers give little kids a short list and every tier a good spread', () => {
    const t1 = D.EVENTS.filter(e => e.tier === 1);
    expect(t1.length).toBeGreaterThanOrEqual(24);
    expect(t1.length).toBeLessThanOrEqual(40);
    D.LANES.forEach(l => expect(t1.filter(e => e.lane === l.id).length).toBeGreaterThanOrEqual(5));
  });
});

test.describe('Línea del Tiempo: dates and games', () => {
  test('BC and AD: no year 0, labels in both languages', () => {
    expect(E.astro(-1)).toBe(0);
    expect(E.astro(1)).toBe(1);
    expect(E.astro(-2)).toBe(-1);
    expect(E.fromAstro(0)).toBe(-1);
    expect(E.fromAstro(5)).toBe(5);
    expect(E.yearLabel(-776, true)).toBe('776 a. C.');
    expect(E.yearLabel(-776, false)).toBe('776 BC');
    expect(E.dateText(D.BY_ID['great-pyramid'], true)).toBe('c. 2560 a. C.');
    expect(E.dateText(D.BY_ID['great-pyramid'], false)).toBe('c. 2560 BC');
    expect(E.dateText(D.BY_ID['santiago-founded'], true)).toBe('1541');
    expect(E.dateText(D.BY_ID['francis-assisi'], false)).toBe('c. 1181–1226');
    expect(E.dateText(D.BY_ID['plato'], false)).toBe('c. 428–348 BC');
    expect(E.dateText(D.BY_ID['jesus-birth'], false)).toBe('c. 6–4 BC');
    // the span from 1 BC to AD 1 is one year, not two
    expect(E.astro(1) - E.astro(-1)).toBe(1);
    expect(E.fmtNum(4586, true)).toBe('4.586');
    expect(E.fmtNum(4586, false)).toBe('4,586');
  });

  test('eras cover everything once', () => {
    D.EVENTS.forEach(e => { const er = E.eraOf(e); expect(e.y >= (er.id === 'anc' ? -1e9 : er.from) && e.y < er.to).toBe(true); });
    expect(E.eraOf(D.BY_ID['moon-landing']).id).toBe('c20');
    expect(E.eraOf(D.BY_ID['webb']).id).toBe('now');
    expect(E.eraOf(D.BY_ID['great-pyramid']).id).toBe('anc');
  });

  test('put in order: the right number of cards, spread apart, one right answer', () => {
    E.TIERS.forEach((tier, ti) => {
      const r = E.rng(11 + ti);
      for (let i = 0; i < 200; i++) {
        const p = E.genOrder(r, tier);
        expect(p).not.toBeNull();
        expect(p.shown.length).toBe(E.ORDER_N[ti]);
        expect(E.ORDER_N[ti]).toBeGreaterThanOrEqual(3);
        expect(E.ORDER_N[ti]).toBeLessThanOrEqual(6);
        expect(new Set(p.shown).size).toBe(p.shown.length);
        const years = p.answer.map(id => E.astro(D.BY_ID[id].y));
        for (let k = 1; k < years.length; k++) expect(years[k] - years[k - 1]).toBeGreaterThanOrEqual(E.GAP.order[ti]);
        expect(p.shown.slice().sort().join()).toBe(p.answer.slice().sort().join());
        expect(p.shown.join()).not.toBe(p.answer.join());
        p.shown.forEach(id => { expect(D.BY_ID[id].tier).toBeLessThanOrEqual(E.maxTier(tier)); expect(D.BY_ID[id].person).toBe(false); });
      }
    });
  });

  test('who lived at the same time: the answer overlaps and the others do not', () => {
    E.TIERS.forEach((tier, ti) => {
      const r = E.rng(21 + ti), n = tier === 'beginner' ? 2 : 3;
      for (let i = 0; i < 300; i++) {
        const q = E.genSame(r, tier);
        expect(q).not.toBeNull();
        expect(q.options.length).toBe(n);
        expect(q.options).toContain(q.answer);
        const A = D.BY_ID[q.a];
        expect(A.person).toBe(true);
        const ok = id => {
          const b = D.BY_ID[id];
          if (q.kind === 'person') return E.overlap(A, b) > 0;
          const y = E.astro(b.y); return y >= E.astro(A.sp[0]) && y <= E.astro(A.sp[1]);
        };
        q.options.forEach(id => expect(ok(id)).toBe(id === q.answer));
        if (tier === 'beginner') expect(q.kind).toBe('person');
      }
    });
  });

  test('before or after: the answer follows from the dates', () => {
    E.TIERS.forEach((tier, ti) => {
      const r = E.rng(31 + ti);
      for (let i = 0; i < 300; i++) {
        const q = E.genBA(r, tier), a = D.BY_ID[q.a], b = D.BY_ID[q.b];
        expect(Math.abs(E.astro(a.y) - E.astro(b.y))).toBeGreaterThanOrEqual(E.GAP.ba[ti]);
        expect(q.answer).toBe(E.astro(b.y) < E.astro(a.y) ? 'before' : 'after');
        expect(a.person || b.person).toBe(false);
      }
    });
  });

  test('time-travel trivia: six well-formed questions for every tier and era', () => {
    E.TIERS.forEach((tier, ti) => {
      ['all'].concat(D.ERAS.map(e => e.id)).forEach(era => {
        const r = E.rng(41 + ti);
        for (let i = 0; i < 6; i++) {
          const qs = E.genTrivia(r, tier, era, 6, 2026);
          expect(qs.length).toBe(6);
          qs.forEach(q => {
            const ev = D.BY_ID[q.ev];
            expect(E.KINDS[tier]).toContain(q.kind);
            expect(q.answer).toBeGreaterThanOrEqual(0);
            expect(q.answer).toBeLessThan(q.choices.length);
            const labels = q.choices.map(c => c.es);
            expect(new Set(labels).size).toBe(labels.length);
            expect(ev.tier).toBeLessThanOrEqual(E.maxTier(tier));
            if (q.kind === 'year') {
              expect(q.choices[q.answer].es).toBe(E.dateText(ev, true));
              expect(q.choices.length).toBe(4);
            }
            if (q.kind === 'what') expect(q.choices[q.answer].id).toBe(ev.id);
            if (q.kind === 'why') expect(q.choices[q.answer].id).toBe(ev.id);
            if (/^(first|last)/.test(q.kind)) {
              const ys = q.choices.map(c => E.astro(D.BY_ID[c.id].y));
              const best = q.kind === 'last3' ? Math.max.apply(null, ys) : Math.min.apply(null, ys);
              expect(ys[q.answer]).toBe(best);
              expect(ys.filter(y => y === best).length).toBe(1);
            }
          });
          expect(new Set(qs.map(q => q.ev)).size).toBe(qs.length);
          if (era !== 'all') expect(qs.some(q => E.eraOf(D.BY_ID[q.ev]).id === era || (q.choices || []).some(c => c.id && E.eraOf(D.BY_ID[c.id]).id === era))).toBe(true);
        }
      });
    });
  });

  test('stars follow the share of right answers', () => {
    expect(E.starsFor(6, 6)).toBe(3);
    expect(E.starsFor(5, 6)).toBe(2);   // 83%
    expect(E.starsFor(4, 6)).toBe(2);
    expect(E.starsFor(3, 6)).toBe(1);
    expect(E.starsFor(0, 6)).toBe(0);
    expect(E.starsFor(5, 5)).toBe(3);
  });

  test('timeline layout: the same zoom always places the same markers, and big ones win', () => {
    const a = E.layout(0.12, { rows: 2, width: 88, maxTier: 3 }), b = E.layout(0.12, { rows: 2, width: 88, maxTier: 3 });
    expect(a).toEqual(b);
    // nothing placed in the same row of a lane closer than the marker width
    D.LANES.forEach(l => {
      for (let row = 0; row < 2; row++) {
        const xs = D.EVENTS.filter(e => e.lane === l.id && a[e.id] === row).map(e => E.astro(e.y) * 0.12).sort((p, q) => p - q);
        for (let i = 1; i < xs.length; i++) expect(xs[i] - xs[i - 1]).toBeGreaterThanOrEqual(88);
      }
    });
    // zoomed far out, a tier-1 event is not displaced by a tier-3 one
    const far = E.layout(0.047, { rows: 2, width: 88, maxTier: 3 });
    const t1 = D.EVENTS.filter(e => e.tier === 1), shown1 = t1.filter(e => far[e.id] !== undefined).length;
    expect(shown1).toBeGreaterThanOrEqual(Math.floor(t1.length * 0.35));
    // zoomed in to decades, everything in view fits
    const near = E.layout(10, { rows: 2, width: 88, maxTier: 3 });
    expect(near['moon-landing']).not.toBeUndefined();
  });

  test('axis ticks: BC labels count down from the year 1 BC, no tick for a year 0', () => {
    const t = E.ticks(-1300, 300, 1, true);
    const texts = t.map(x => x.text);
    expect(texts).toContain('1000 a. C.');
    expect(texts).toContain('100');
    expect(texts).not.toContain('0');
    expect(texts).not.toContain('0 a. C.');
    const m = t.find(x => x.text === '500 a. C.');
    expect(m.a).toBe(-499);                       // 500 BC is 499 years before 1 BC
    expect(E.ticks(0, 100, 5, false).some(x => /BC/.test(x.text))).toBe(false);
  });
});
