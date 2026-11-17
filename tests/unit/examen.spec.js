// @ts-check
// Examen y Virtudes, part 1 (no browser): the journal rules and the content.
// The content is the risk here: every virtue must have its saint in Fe
// Explorador, every prayer must be one Fe Explorador has, every picture
// must be drawn, the wording stays warm (no guilt, no "lost streak"),
// and the restricted-word grep must come back empty.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const E = require('../../js/examen-engine.js');
const D = require('../../js/examen-data.js');
const Art = require('../../js/examen-art.js');
// @ts-ignore  the engine names virtues through the page's ExamenData global
global.ExamenData = D;
// Fe Explorador's data module is a plain script with one global.
const FM = new Function(fs.readFileSync(path.join(ROOT, 'js/fe-explorador.js'), 'utf8') + '\nreturn FeManager;')();

const RESTRICTED = /genero|género|identidad|diversidad|inclusi[oó]n|pronombre|trans |gay|lesbiana|queer|pride|diverso|equidad|justicia social|colonialismo|opres|patriarcado|feminis|woke|diversity|equity|inclusion|gender |lgbt|transgender/i;
// Never guilt-inducing: no sin/punishment/failure talk, no broken streaks.
const HARSH = /pecad|castig|culpa|fracas|fallaste|perdiste|verg[uü]enza de ti|malo\b|mala\b|bad (boy|girl|kid)|naughty|guilt|shame|punish|failed|you lost|streak lost|racha perdida|perdiste tu racha/i;

/** @param {any} o @param {string[]} out */
function allStrings(o, out = []) {
  if (typeof o === 'string') out.push(o);
  else if (Array.isArray(o)) o.forEach(x => allStrings(x, out));
  else if (o && typeof o === 'object') Object.keys(o).forEach(k => allStrings(o[k], out));
  return out;
}

test.describe('Examen y Virtudes: content', () => {

  test('ten virtues, each with both languages, ideas and a saint who is in Fe Explorador', () => {
    expect(D.VIRTUES.map(v => v.id)).toEqual(['paciencia', 'amabilidad', 'compartir', 'honestidad', 'valentia',
      'gratitud', 'obediencia', 'humildad', 'diligencia', 'dominio']);
    for (const v of D.VIRTUES) {
      for (const f of ['name', 'little', 'desc', 'why']) {
        expect(v[f], v.id + '.' + f).toHaveLength(2);
        expect(v[f][0].length && v[f][1].length, v.id + '.' + f).toBeTruthy();
      }
      expect(v.ideas.length, v.id).toBeGreaterThanOrEqual(2);
      v.ideas.forEach(i => expect(i[0] && i[1]).toBeTruthy());
      const s = FM.getSaint(v.saint);
      expect(s, v.id + ' → ' + v.saint).toBeTruthy();
      // the "why" line names that saint
      const short = s.name.replace(/^(San|Santa|Santo|Beata) /, '').split(' ')[0];
      expect(v.why[0], v.id).toContain(short);
      expect(Art.EMBLEMS[v.id], 'medallion for ' + v.id).toBeTruthy();
      expect(Art.virtue(v.id)).toMatch(/^<svg [^>]*viewBox="0 0 120 120"/);
    }
    expect(FM.getSaint(D.IGNATIUS.saint)).toBeTruthy();
  });

  test('every picture choice is drawn, ids are unique, and each "do better" item points at a virtue', () => {
    for (const name of ['THANKS', 'HAPPY', 'BETTER']) {
      const list = D.list(name);
      expect(list.length, name).toBeGreaterThanOrEqual(8);
      expect(new Set(list.map(x => x.id)).size, name).toBe(list.length);
      for (const it of list) {
        expect(Art.ICONS[it.icon], name + ':' + it.icon).toBeTruthy();
        expect(it.t[0] && it.t[1], it.id).toBeTruthy();
        const svg = Art.tile(it.icon, name.toLowerCase());
        expect(svg).toMatch(/^<svg [^>]*viewBox="0 0 96 96"/);
        expect(svg).not.toMatch(/undefined|NaN/);
      }
    }
    D.BETTER.forEach(b => expect(D.virtue(b.virtue), b.id).toBeTruthy());
    D.DID.forEach(x => expect(Art.ICONS[x.icon], x.id).toBeTruthy());
    for (const scene of [Art.hero('x'), Art.night('x'), Art.candles(2, 4)]) expect(scene).not.toMatch(/undefined|NaN/);
  });

  test('the closing prayers are Fe Explorador\'s own (read from it, never copied)', () => {
    expect(D.PRAYERS).toEqual(['padrenuestro', 'avemaria', 'angelguarda']);
    D.PRAYERS.forEach(id => expect(FM.getPrayer(id), id).toBeTruthy());
    const ui = fs.readFileSync(path.join(ROOT, 'js/examen.js'), 'utf8');
    const data = fs.readFileSync(path.join(ROOT, 'js/examen-data.js'), 'utf8');
    // No prayer line is retyped in the app's own files.
    for (const id of D.PRAYERS) for (const line of FM.getPrayer(id).lines) {
      if (line.length < 12) continue;
      expect(ui.includes(line) || data.includes(line), line).toBe(false);
    }
    expect(fs.readFileSync(path.join(ROOT, 'examen.html'), 'utf8')).toMatch(/js\/fe-explorador\.js\?v=\d+/);
  });

  test('wording: restricted-word grep is clean and nothing is harsh or guilt-inducing', () => {
    const texts = allStrings({ v: D.VIRTUES, t: D.THANKS, h: D.HAPPY, b: D.BETTER, s: D.STEPS, d: D.DID, i: D.IGNATIUS });
    for (const s of texts) {
      expect(RESTRICTED.test(s), s).toBe(false);
      expect(HARSH.test(s), s).toBe(false);
    }
    for (const f of ['examen.html', 'js/examen.js', 'js/examen-data.js', 'js/examen-engine.js', 'js/examen-art.js', 'css/examen.css']) {
      const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
      expect(RESTRICTED.test(src), f).toBe(false);
    }
    // the app's own messages (the step after a "not yet" included)
    const ui = fs.readFileSync(path.join(ROOT, 'js/examen.js'), 'utf8');
    const quoted = ui.match(/'(?:[^'\\]|\\.)*'/g) || [];
    for (const q of quoted) expect(HARSH.test(q), q).toBe(false);
  });

  test('no network: the app files fetch nothing and load no CDN script', () => {
    for (const f of ['js/examen.js', 'js/examen-data.js', 'js/examen-engine.js', 'js/examen-art.js']) {
      const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
      expect(src, f).not.toMatch(/fetch\(|XMLHttpRequest|https?:\/\/(?!www\.w3\.org)/);
    }
    const html = fs.readFileSync(path.join(ROOT, 'examen.html'), 'utf8');
    for (const m of html.matchAll(/<script src="([^"]+)"/g)) expect(m[1], m[1]).toMatch(/^js\//);
  });
});

test.describe('Examen y Virtudes: journal rules', () => {

  const entry = (o = {}) => Object.assign({ thanks: ['familia'], happy: ['jugar'], better: ['turno'], virtue: 'paciencia', prayer: 'avemaria' }, o);

  test('migrate keeps good entries and drops junk without throwing', () => {
    expect(E.migrate(null)).toEqual({ v: 1, lang: 'es', entries: {} });
    expect(E.migrate([1, 2]).entries).toEqual({});
    const d = E.migrate({ lang: 'en', entries: { '2026-11-10': { done: true, thanks: ['a', 'a', 3, 'b'] }, 'nope': { done: true }, '2026-11-11': 7 } });
    expect(d.lang).toBe('en');
    expect(Object.keys(d.entries)).toEqual(['2026-11-10']);
    expect(d.entries['2026-11-10'].thanks).toEqual(['a', 'b']);
  });

  test('one star a day: finishing again the same evening changes the answers, not the stars', () => {
    const d = E.migrate(null);
    expect(E.saveEntry(d, '2026-11-16', entry(), 1000).first).toBe(true);
    expect(E.saveEntry(d, '2026-11-16', entry({ virtue: 'gratitud' }), 2000).first).toBe(false);
    expect(d.entries['2026-11-16'].virtue).toBe('gratitud');
    expect(d.entries['2026-11-16'].t).toBe(1000);
    expect(E.stars(d)).toBe(1);
    E.saveEntry(d, '2026-11-17', entry(), 3000);
    expect(E.stars(d)).toBe(2);
  });

  test('text is capped, lists are capped, a drawing must be an image', () => {
    const d = E.migrate(null);
    E.saveEntry(d, '2026-11-16', entry({ thanksText: 'x'.repeat(500), happy: Array.from({ length: 20 }, (_, i) => 'h' + i), draw: 'javascript:alert(1)' }));
    const e = d.entries['2026-11-16'];
    expect(e.thanksText).toHaveLength(E.MAX_TEXT);
    expect(e.happy).toHaveLength(10);
    expect(e.draw).toBeUndefined();
    E.saveEntry(d, '2026-11-16', entry({ draw: 'data:image/png;base64,AAAA' }));
    expect(d.entries['2026-11-16'].draw).toBe('data:image/png;base64,AAAA');
  });

  test('only the newest drawings are kept; the words stay', () => {
    const d = E.migrate(null);
    for (let i = 1; i <= 25; i++) E.saveEntry(d, '2026-10-' + String(i).padStart(2, '0'), entry({ draw: 'data:image/png;base64,AA', thanksText: 'día ' + i }));
    const withDraw = E.days(d).filter(k => d.entries[k].draw);
    expect(withDraw).toHaveLength(E.KEEP_DRAWINGS);
    expect(withDraw[0]).toBe('2026-10-06');
    expect(d.entries['2026-10-01'].thanksText).toBe('día 1');
  });

  test('the streak only counts up and never punishes a missed evening', () => {
    const d = E.migrate(null);
    ['2026-11-13', '2026-11-14', '2026-11-15', '2026-11-16'].forEach(k => E.saveEntry(d, k, entry()));
    expect(E.streak(d, '2026-11-16')).toBe(4);
    expect(E.streak(d, '2026-11-17')).toBe(4);       // tonight's still to do: yesterday's run stands
    expect(E.streak(d, '2026-11-19')).toBe(0);       // a gap: simply nothing shown, total stays
    expect(E.total(d)).toBe(4);
  });

  test('"did you practise it?" asks about the last virtue, once, within three days', () => {
    const d = E.migrate(null);
    E.saveEntry(d, '2026-11-15', entry({ virtue: 'amabilidad' }));
    expect(E.pendingCheck(d, '2026-11-16')).toEqual({ day: '2026-11-15', virtue: 'amabilidad' });
    expect(E.pendingCheck(d, '2026-11-18')).toEqual({ day: '2026-11-15', virtue: 'amabilidad' });
    expect(E.pendingCheck(d, '2026-11-19')).toBe(null);
    expect(E.answerCheck(d, '2026-11-15', 'maybe', '2026-11-16')).toBe(false);
    expect(E.answerCheck(d, '2026-11-15', 'yes', '2026-11-16')).toBe(true);
    expect(E.pendingCheck(d, '2026-11-16')).toBe(null);
    // a newer evening without a virtue is not skipped over to an older one
    E.saveEntry(d, '2026-11-16', entry({ virtue: '' }));
    expect(E.pendingCheck(d, '2026-11-17')).toBe(null);
  });

  test('the week: "you practised kindness 4 times", counting yes and a little, never "not yet"', () => {
    const d = E.migrate(null);
    // Mon 9 Nov 2026 … Sun 15 Nov
    const days = ['2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14'];
    days.forEach(k => E.saveEntry(d, k, entry({ virtue: 'amabilidad' })));
    const answers = ['yes', 'little', 'notyet', 'yes', 'yes', 'notyet'];
    answers.forEach((a, i) => E.answerCheck(d, days[i], a, days[i + 1]));
    const w = E.week(d, '2026-11-09', '2026-11-15');
    expect(w.evenings).toBe(6);
    expect(w.practised).toEqual({ amabilidad: 4 });
    expect(w.top).toEqual({ id: 'amabilidad', n: 4 });
    expect(E.thisWeek(d, '2026-11-15')).toEqual(w);
    expect(E.mondayOf('2026-11-15')).toBe('2026-11-09');
    expect(E.mondayOf('2026-11-09')).toBe('2026-11-09');
  });

  test('the Sunday Report line has counts only, never what was written', () => {
    const d = E.migrate(null);
    E.saveEntry(d, '2026-11-10', entry({ virtue: 'amabilidad', thanksText: 'SECRET-THANKS', betterText: 'SECRET-BETTER' }));
    E.saveEntry(d, '2026-11-11', entry({ virtue: 'amabilidad' }));
    E.answerCheck(d, '2026-11-10', 'yes', '2026-11-11');
    const r = E.insightFor(d, '2026-11-09', '2026-11-15');
    expect(r.strong).toHaveLength(1);
    expect(r.strong[0].text).toContain('2 evenings of reflection');
    expect(r.strong[0].text).toContain('practised kindness 1 time 🌟');
    expect(JSON.stringify(r)).not.toMatch(/SECRET/);
    expect(E.insightFor(d, '2026-11-16', '2026-11-22')).toBe(null);
  });
});
