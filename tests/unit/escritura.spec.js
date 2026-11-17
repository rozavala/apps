// @ts-check
// Escritura: the letter data, the stroke checks, the letter recogniser and
// the saved-progress rules, in Node (no browser).
const { test, expect } = require('@playwright/test');
const E = require('../../js/escritura-engine.js');
const D = require('../../js/escritura-data.js');

const STYLES = ['print', 'cursive'];
const rev = (s) => s.slice().reverse();
const shift = (s, dx, dy) => s.map(p => ({ x: p.x + dx, y: p.y + dy }));
// a seeded wobble, like a real hand
function wobble(s, amt, seed = 1) {
  let k = seed;
  const r = () => { k = (k * 16807) % 2147483647; return k / 2147483647 - 0.5; };
  return s.map(p => ({ x: p.x + r() * amt, y: p.y + r() * amt }));
}

test.describe('Escritura data', () => {
  test('every letter in every set has strokes, and no set repeats a letter', () => {
    for (const st of STYLES) {
      const all = D.letters(st);
      expect(new Set(all).size, st + ' letters are unique').toBe(all.length);
      for (const ch of all) {
        const g = D.font(st).glyphs[ch];
        expect(g, st + ' ' + ch).toBeTruthy();
        const strokes = E.glyphStrokes(g);
        expect(strokes.length).toBeGreaterThan(0);
        strokes.forEach(s => s.forEach(p => { expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true); }));
      }
    }
    // print has the whole Spanish alphabet, both cases, plus accents
    const print = D.letters('print').join('');
    for (const c of 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZabcdefghijklmnñopqrstuvwxyzáéíóúü') expect(print).toContain(c);
    const cursive = D.letters('cursive').join('');
    for (const c of 'abcdefghijklmnñopqrstuvwxyzáéíóúü') expect(cursive).toContain(c);
  });

  test('letters stay on the school lines', () => {
    for (const st of STYLES) {
      for (const ch of D.letters(st)) {
        const L = E.layout(ch, D.font(st), { margin: 10 });
        L.strokes.forEach(s => s.forEach(p => {
          expect(p.y, st + ' ' + ch).toBeGreaterThanOrEqual(-62);
          expect(p.y, st + ' ' + ch).toBeLessThanOrEqual(E.ROW_TOP);
        }));
      }
    }
  });

  test('every practice word can be written in print; cursive skips only words with capitals', () => {
    for (const w of D.WORDS) {
      expect(D.writable(w.t, 'print'), w.t).toBe(true);
      expect(D.writable(w.t, 'cursive'), w.t).toBe(w.t === w.t.toLowerCase());
      expect(['es', 'en']).toContain(w.l);
      expect(D.GROUPS.map(g => g.id)).toContain(w.g);
    }
    expect(new Set(D.WORDS.map(w => w.id)).size).toBe(D.WORDS.length);
  });

  test('a cursive word is joined: each letter starts where the last one left off', () => {
    const L = E.layout('hola', D.font('cursive'));
    const mains = L.letters.map(l => L.strokes[l.first]);
    for (let i = 1; i < mains.length; i++) {
      const end = mains[i - 1][mains[i - 1].length - 1], start = mains[i][0];
      expect(Math.hypot(end.x - start.x, end.y - start.y)).toBeLessThan(0.5);
    }
  });

  test('long phrases wrap onto more rows', () => {
    const one = E.layout('a la rueda rueda', D.font('print'), { maxRow: 2000 });
    const two = E.layout('a la rueda rueda', D.font('print'), { maxRow: 400 });
    expect(one.rows).toBe(1);
    expect(two.rows).toBeGreaterThan(1);
    expect(two.width).toBeLessThanOrEqual(400 + 60);
  });

  test('letter names for the voice', () => {
    expect(D.letterName('ñ', 'es')).toBe('la eñe minúscula');
    expect(D.letterName('B', 'es')).toBe('la be mayúscula');
    expect(D.letterName('b', 'en')).toBe('small B');
    expect(D.letterName('á', 'es')).toBe('la a con tilde');
  });
});

test.describe('Escritura stroke check', () => {
  const tol = E.tolerance('intermediate');

  test('every model stroke passes against itself and with a wobbly hand', () => {
    for (const st of STYLES) {
      for (const ch of D.letters(st)) {
        const L = E.layout(ch, D.font(st));
        L.strokes.forEach((m, i) => {
          expect(E.checkStroke(m, m, { tol }).pass, st + ' ' + ch + ' #' + i).toBe(true);
          expect(E.checkStroke(wobble(m, tol * 0.8, i + 3), m, { tol }).pass, st + ' ' + ch + ' #' + i + ' wobbly').toBe(true);
        });
      }
    }
  });

  test('a line drawn backwards, a stroke off the path and a half stroke are refused', () => {
    const [down] = E.layout('l', D.font('print')).strokes;
    const back = E.checkStroke(rev(down), down, { tol });
    expect(back.pass).toBe(false);
    expect(back.reason).toBe('dir');
    const off = E.checkStroke(shift(down, tol * 2.5, 0), down, { tol });
    expect(off.pass).toBe(false);
    const half = E.checkStroke(down.slice(0, Math.floor(down.length / 3)), down, { tol });
    expect(half.pass).toBe(false);
    expect(half.reason).toBe('short');
  });

  test('an O drawn the other way round is refused; the right way passes', () => {
    const [o] = E.layout('O', D.font('print')).strokes;
    expect(E.checkStroke(o, o, { tol }).pass).toBe(true);
    const r = E.checkStroke(rev(o), o, { tol });
    expect(r.pass).toBe(false);
    expect(r.reason).toBe('dir');
  });

  test('the dot of the i: a tap near it passes, a long line does not', () => {
    const [, dot] = E.layout('i', D.font('print')).strokes;
    expect(E.checkStroke([{ x: dot[0].x + 4, y: dot[0].y - 3 }], dot, { tol }).pass).toBe(true);
    expect(E.checkStroke([{ x: dot[0].x - 40, y: dot[0].y }, { x: dot[0].x + 40, y: dot[0].y }], dot, { tol }).pass).toBe(false);
  });

  test('the youngest get the widest path', () => {
    expect(E.tolerance('beginner')).toBeGreaterThan(E.tolerance('intermediate'));
    expect(E.tolerance('intermediate')).toBeGreaterThan(E.tolerance('expert'));
  });
});

test.describe('Escritura free writing and recognition', () => {
  const tol = E.tolerance('intermediate');

  test('a word written a little to the side and a little wider still counts when copying', () => {
    const L = E.layout('sol', D.font('print'));
    const ink = L.strokes.map(s => s.map(p => ({ x: 40 + (p.x - 14) * 1.15, y: p.y })));
    expect(E.checkFree(ink, L.strokes, { tol, align: true }).pass).toBe(true);
    expect(E.checkFree(ink, L.strokes, { tol, align: false }).pass, 'tracing is not slid into place').toBe(false);
    expect(E.checkFree(L.strokes, L.strokes, { tol, align: false }).quality).toBeGreaterThan(0.95);
  });

  test('half a word, a scribble or nothing does not count', () => {
    const L = E.layout('hola', D.font('cursive'));
    const first = L.strokes[0];
    expect(E.checkFree([first.slice(0, Math.floor(first.length / 2))], L.strokes, { tol }).pass).toBe(false);
    const scribble = [Array.from({ length: 80 }, (_, i) => ({ x: 20 + (i % 10) * 20, y: (i % 2) * 90 - 20 }))];
    expect(E.checkFree(scribble, L.strokes, { tol }).pass).toBe(false);
    expect(E.checkFree([], L.strokes, { tol }).pass).toBe(false);
  });

  for (const [style, kind, filter] of [['print', 'small', (c) => /^[a-zñ]$/.test(c)], ['print', 'capital', (c) => /^[A-ZÑ]$/.test(c)], ['cursive', 'small', (c) => /^[a-zñ]$/.test(c)]]) {
    test('the recogniser reads ' + style + ' ' + kind + ' letters written a little wobbly, shifted and smaller', () => {
      const pool = D.letters(style).filter(filter);
      const cands = pool.map(ch => ({ ch, strokes: E.layout(ch, D.font(style), { margin: 0 }).strokes }));
      let right = 0;
      const wrong = [];
      pool.forEach((ch, i) => {
        const ink = cands[i].strokes.map((s, j) => wobble(shift(s.map(p => ({ x: p.x * 0.92, y: p.y * 0.92 })), 37, 0), 3, i * 7 + j + 1));
        const best = E.recognize(ink, cands)[0];
        if (best.ch === ch) right++; else wrong.push(ch + '→' + best.ch);
      });
      expect(right / pool.length, wrong.join(' ')).toBeGreaterThanOrEqual(0.9);
    });
  }

  test('b, d, p and q are told apart by where they sit on the lines', () => {
    const pool = ['b', 'd', 'p', 'q'];
    const cands = pool.map(ch => ({ ch, strokes: E.layout(ch, D.font('print'), { margin: 0 }).strokes }));
    pool.forEach((ch, i) => expect(E.recognize(cands[i].strokes, cands)[0].ch).toBe(ch));
  });
});

test.describe('Escritura progress', () => {
  test('old or broken saves are upgraded without losing anything', () => {
    expect(E.migrate(null)).toEqual({ L: {}, W: {}, dict: {}, rounds: 0, v: 1 });
    expect(E.migrate([1, 2]).L).toEqual({});
    const old = { L: { 'print:A': 2 }, style: 'cursive', extra: 'kept' };
    const m = E.migrate(old);
    expect(m.L['print:A']).toBe(2);
    expect(m.style).toBe('cursive');
    expect(m.extra).toBe('kept');
  });

  test('stars: letters by step, words by copy quality, dictation by score, all capped at 3', () => {
    expect(E.starsForStage(3)).toBe(3);
    expect(E.starsForStage(9)).toBe(3);
    expect(E.wordStars(true, false, 0)).toBe(1);
    expect(E.wordStars(true, true, 0.8)).toBe(2);
    expect(E.wordStars(true, true, 0.9)).toBe(3);
    expect(E.dictStars(10, 10)).toBe(3);
    expect(E.dictStars(7, 10)).toBe(2);
    expect(E.dictStars(5, 10)).toBe(1);
    expect(E.dictStars(2, 10)).toBe(0);
    expect(E.totalStars({ L: { a: 3, b: 7, c: -1 }, W: { w: 2 }, dict: { d: 1 } })).toBe(3 + 3 + 0 + 2 + 1);
  });
});
