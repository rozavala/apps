// @ts-check
// Sibling challenges: the rules (challenge-engine.js), the sync merge of the
// household event log, and the star rule. Invented kids only.
const { test, expect } = require('@playwright/test');
const E = require('../../js/challenge-engine.js');

const ANA = { name: 'Ana', age: 11 };
const BEN = { name: 'Ben', age: 7 };
const CARLA = { name: 'Carla', age: 4 };
const DIEGO = { name: 'Diego', age: 11 };

const q = (over = {}) => E.make(Object.assign({ from: 'Ana', to: 'Ben', kind: 'q', text: 'What is 6 x 7?', options: ['41', '42', '43'], answer: 1 }, over));

test.describe('challenge engine: making one', () => {

  test('a question keeps 2 to 4 answers and which one is right', () => {
    const r = q();
    expect(r.ok).toBe(true);
    expect(r.event.options).toEqual(['41', '42', '43']);
    expect(r.event.answer).toBe(1);
    expect(r.event.type).toBe('create');
    expect(r.event.id).toMatch(/^c_/);

    expect(q({ options: ['only one'], answer: 0 }).error).toBe('options');
    expect(q({ options: ['a', 'b', 'c', 'd', 'e'], answer: 0 }).error).toBe('options');
    expect(q({ options: ['a', 'A'], answer: 0 }).error, 'two answers the same').toBe('options');
    expect(q({ options: ['a', 'b'], answer: 5 }).error).toBe('answer');
    expect(q({ text: '   ' }).error).toBe('text');
  });

  test('an empty answer box is dropped and the right answer stays right', () => {
    const r = q({ options: ['', 'red', '', 'blue'], answer: 3 });
    expect(r.ok).toBe(true);
    expect(r.event.options).toEqual(['red', 'blue']);
    expect(r.event.options[r.event.answer]).toBe('blue');
    expect(q({ options: ['', 'red', 'blue'], answer: 0 }).error, 'the right answer was left empty').toBe('answer');
  });

  test('free text is cut to 120 characters on write', () => {
    const long = 'x'.repeat(300);
    const r = q({ text: long, options: [long, 'short'], answer: 1, hint: long });
    expect(r.ok).toBe(true);
    expect(Array.from(r.event.text)).toHaveLength(120);
    expect(Array.from(r.event.options[0])).toHaveLength(120);
    expect(Array.from(r.event.hint)).toHaveLength(120);
    // an emoji is never cut in half
    const emoji = E.make({ from: 'Ana', to: 'Ben', kind: 'q', text: '😀'.repeat(200), options: ['a', 'b'], answer: 0 });
    expect(Array.from(emoji.event.text)).toHaveLength(120);
    expect(emoji.event.text).not.toMatch(/[\ud800-\udbff]$/);
  });

  test('control characters and hidden marks become plain spaces', () => {
    const r = q({ text: 'a\u0000b\nc‮d' + String.fromCharCode(0x2028) + 'e' + String.fromCharCode(0x200b) + 'f' });
    expect(r.event.text).toBe('a b c d e f');
  });

  test('spelling: one word, a language; map: a country id', () => {
    expect(E.make({ from: 'Ana', to: 'Ben', kind: 'spell', answer: 'ballena', lang: 'es' }).event).toMatchObject({ kind: 'spell', answer: 'ballena', lang: 'es' });
    expect(E.make({ from: 'Ana', to: 'Ben', kind: 'spell', answer: 'two words' }).error).toBe('word');
    expect(E.make({ from: 'Ana', to: 'Ben', kind: 'spell', answer: 'a' }).error).toBe('word');
    expect(E.make({ from: 'Ana', to: 'Ben', kind: 'spell', answer: 'abc123' }).error).toBe('word');
    expect(E.make({ from: 'Ana', to: 'Ben', kind: 'map', answer: 'CHL' }).event.answer).toBe('chl');
    expect(E.make({ from: 'Ana', to: 'Ben', kind: 'map', answer: 'chile' }).error).toBe('country');
  });

  test('it needs two different kids and a known kind', () => {
    expect(q({ to: 'ana' }).error, 'a kid cannot challenge themselves').toBe('who');
    expect(q({ to: '' }).error).toBe('who');
    expect(q({ kind: 'trivia' }).error).toBe('kind');
  });
});

test.describe('challenge engine: reading the log', () => {

  test('free text is cut again on read, so an event from elsewhere cannot be long', () => {
    const long = 'y'.repeat(500);
    const v = E.view([{ id: 'c1', type: 'create', ts: 1, from: 'Ana', to: 'Ben', kind: 'q', text: long, options: [long, 'b'], answer: 0, hint: long }]);
    expect(v.challenges).toHaveLength(1);
    const c = v.challenges[0];
    expect(c.text).toHaveLength(120);
    expect(c.options[0]).toHaveLength(120);
    expect(c.hint).toHaveLength(120);
  });

  test('broken or odd events are skipped, never thrown on', () => {
    const v = E.view([
      null, 'x', {}, { id: 'a' }, { id: 'c0', type: 'create' },
      { id: 'c1', type: 'create', ts: 1, from: 'Ana', to: 'Ana', kind: 'q', text: 't', options: ['a', 'b'], answer: 0 },   // to self
      { id: 'c2', type: 'create', ts: 1, from: 'Ana', to: 'Ben', kind: 'q', text: 't', options: ['a'], answer: 0 },        // one answer
      { id: 'c3', type: 'create', ts: 1, from: 'Ana', to: 'Ben', kind: 'q', text: 't', options: ['a', 'b'], answer: 7 },    // no such answer
      { id: 'c4', type: 'create', ts: 1, from: 'Ana', to: 'Ben', kind: 'map', answer: 'xx' },
      { id: 'ok', type: 'create', ts: 2, from: 'Ana', to: 'Ben', kind: 'map', answer: 'chl' }
    ]);
    expect(v.challenges.map(c => c.id)).toEqual(['ok']);
    expect(E.view(undefined).challenges).toEqual([]);
  });

  test('only the receiver can solve it, and a second solve changes nothing', () => {
    const c = q().event;
    const forged = E.makeSolve(c.id, 'Carla', 1);
    expect(E.view([c, forged]).challenges[0].solved, 'someone else cannot solve it').toBeNull();
    const first = Object.assign(E.makeSolve(c.id, 'Ben', 1), { ts: 100 });
    const again = Object.assign(E.makeSolve(c.id, 'Ben', 4), { id: 'other', ts: 200 });
    expect(E.view([c, again, first]).challenges[0].solved).toMatchObject({ by: 'Ben', ts: 100 });
    expect(first.id, 'the solve id comes from the challenge id').toBe('s_' + c.id);
  });

  test('2 wrong tries open the hint; only the receiver\'s tries count', () => {
    const c = q({ hint: 'Think of 6 x 6, plus 6.' }).event;
    const view = (...evs) => E.view([c, ...evs]).challenges[0];
    expect(E.hintOpen(view())).toBe(false);
    expect(E.hintOpen(view(E.makeMiss(c.id, 'Ben')))).toBe(false);
    expect(E.hintOpen(view(E.makeMiss(c.id, 'Ben'), E.makeMiss(c.id, 'ben')))).toBe(true);
    expect(E.hintOpen(view(E.makeMiss(c.id, 'Carla'), E.makeMiss(c.id, 'Carla')))).toBe(false);
  });

  test('a parent\'s removal hides it from everyone, and the inbox shows only what is waiting', () => {
    const a = q().event;
    const b = q({ text: 'Second one?' }).event;
    const done = q({ text: 'Third one?' }).event;
    const log = [a, b, done, E.makeSolve(done.id, 'Ben', 1), E.makeRemove(a.id)];
    const v = E.view(log);
    expect(E.inbox(v, 'Ben').map(c => c.text)).toEqual(['Second one?']);
    expect(E.inbox(v, 'Ana')).toEqual([]);
    expect(E.sent(v, 'Ana')).toHaveLength(2);
    expect(E.solvedSent(v, 'Ana').map(c => c.text)).toEqual(['Third one?']);
  });

  test('checking answers: index, spelling without case, country id', () => {
    const qc = E.view([q().event]).challenges[0];
    expect(E.check(qc, 1)).toBe(true);
    expect(E.check(qc, 0)).toBe(false);
    expect(E.check(qc, '')).toBe(false);
    const sc = E.view([E.make({ from: 'Ana', to: 'Ben', kind: 'spell', answer: 'Canción', lang: 'es' }).event]).challenges[0];
    expect(E.check(sc, ' canción ')).toBe(true);
    expect(E.check(sc, 'cancion'), 'the accent is part of the spelling').toBe(false);
    const mc = E.view([E.make({ from: 'Ana', to: 'Ben', kind: 'map', answer: 'chl' }).event]).challenges[0];
    expect(E.check(mc, 'CHL')).toBe(true);
    expect(E.check(mc, 'arg')).toBe(false);
  });

  test('answers are shown in a fixed order that is not always the creator\'s', () => {
    const c = E.view([q({ options: ['a', 'b', 'c', 'd'], answer: 0 }).event]).challenges[0];
    const o = E.shuffled(c);
    expect(o.slice().sort()).toEqual([0, 1, 2, 3]);
    expect(E.shuffled(c)).toEqual(o);
    const firsts = new Set();
    for (let i = 0; i < 30; i++) firsts.add(E.shuffled(Object.assign({}, c, { id: 'c_' + i }))[0]);
    expect(firsts.size, 'the right answer is not always first').toBeGreaterThan(1);
  });
});

test.describe('challenge engine: who can challenge whom', () => {
  const kids = [ANA, BEN, CARLA, DIEGO];

  test('younger siblings only, unless a parent allows any', () => {
    expect(E.receivers(kids, ANA, false).map(k => k.name)).toEqual(['Ben', 'Carla']);
    expect(E.receivers(kids, BEN, false).map(k => k.name)).toEqual(['Carla']);
    expect(E.receivers(kids, CARLA, false)).toEqual([]);
    expect(E.receivers(kids, CARLA, true).map(k => k.name)).toEqual(['Ana', 'Ben', 'Diego']);
    expect(E.receivers(kids, { name: 'Ana' }, false), 'no age, no younger kids').toEqual([]);
    expect(E.receivers([ANA, { name: 'Guest', age: 4, isGuest: true }], ANA, true)).toEqual([]);
  });

  test('the parent setting is the latest config event', () => {
    const on = Object.assign(E.makeConfig(true), { ts: 10 });
    const off = Object.assign(E.makeConfig(false), { ts: 20 });
    expect(E.view([off, on]).anyone).toBe(false);
    expect(E.view([on]).anyone).toBe(true);
    expect(E.view([]).anyone).toBe(false);
  });
});

test.describe('challenge engine: stars', () => {

  test('both kids of a solved challenge get a star, even if it was deleted later', () => {
    const c = q().event;
    const log = [c, Object.assign(E.makeSolve(c.id, 'Ben', 2), { ts: new Date(2026, 10, 10, 12).getTime() })];
    expect(E.starsByKid(log)).toEqual({ ana: { [c.id]: '2026-11-10' }, ben: { [c.id]: '2026-11-10' } });
    expect(E.starsByKid([c])).toEqual({});
    expect(E.starsByKid(log.concat(E.makeRemove(c.id)))).toEqual(E.starsByKid(log));
  });
});

test.describe('challenges sync', () => {

  test.beforeEach(async ({ page }) => {
    await page.route(/tail57521e\.ts\.net/, r => r.abort());
    await page.goto('/');
    await page.waitForFunction(() => !!window.CloudSync && !!window.getAppStars);
  });

  test('two devices\' events both survive a merge, in time order, whichever syncs first', async ({ page }) => {
    const out = await page.evaluate(() => {
      const m = /** @type {any} */ (window).CloudSync._mergeChallenges;
      const phone = { v: 1, events: [{ id: 'c1', type: 'create', ts: 1 }, { id: 'm1', type: 'miss', ts: 5 }], _syncedAt: 10 };
      const ipad = { v: 1, events: [{ id: 'c1', type: 'create', ts: 1 }, { id: 's_c1', type: 'solve', ts: 6 }], _syncedAt: 20 };
      return {
        a: m(phone, ipad).events.map(e => e.id),
        b: m(ipad, phone).events.map(e => e.id),
        stamp: m(phone, ipad)._syncedAt,
        empty: m(null, null)
      };
    });
    expect(out.a).toEqual(['c1', 'm1', 's_c1']);
    expect(out.b).toEqual(out.a);
    expect(out.stamp).toBe(10);
    expect(out.empty).toEqual({ v: 1, events: [] });
  });

  test('a removed challenge loses its words everywhere, and a stale copy cannot bring them back', async ({ page }) => {
    const out = await page.evaluate(() => {
      const m = /** @type {any} */ (window).CloudSync._mergeChallenges;
      const create = { id: 'c1', type: 'create', ts: 1, from: 'Ana', to: 'Ben', kind: 'q', text: 'secret words', options: ['a', 'b'], answer: 0, hint: 'more words' };
      const parent = { v: 1, events: [Object.assign({}, create), { id: 'r_c1', type: 'remove', ts: 9, ch: 'c1' }] };
      const stale = { v: 1, events: [Object.assign({}, create)] };
      return [m(parent, stale), m(stale, parent), m(stale, null)];
    });
    expect(JSON.stringify(out[0])).not.toContain('secret words');
    expect(out[0]).toEqual(out[1]);
    expect(out[0].events.map(/** @param {any} e */ e => e.id)).toEqual(['c1', 'r_c1']);
    expect(out[0].events[0]).toMatchObject({ id: 'c1', from: 'Ana', to: 'Ben', gone: true });
    expect(JSON.stringify(out[2]), 'with no removal it is kept').toContain('secret words');
  });

  test('the engine\'s scrub and the sync merge drop the same words', async ({ page }) => {
    const log = [
      { id: 'c1', type: 'create', ts: 1, from: 'Ana', to: 'Ben', kind: 'q', text: 'words', options: ['a', 'b'], answer: 0, hint: 'h' },
      { id: 'c2', type: 'create', ts: 2, from: 'Ana', to: 'Ben', kind: 'q', text: 'kept', options: ['a', 'b'], answer: 0 },
      { id: 'r_c1', type: 'remove', ts: 3, ch: 'c1' }
    ];
    const merged = await page.evaluate((log) => /** @type {any} */ (window).CloudSync._mergeChallenges({ events: log }, null).events, log);
    expect(merged).toEqual(E.scrub(log));
  });

  test('the household key and the star record are registered for sync', async ({ page }) => {
    const src = await page.evaluate(async () => (await fetch('js/sync.js')).text());
    expect(src).toContain("'zs_challenges':            'challenges'");
    expect(src).toContain("'zs_challenge_': 'challenge'");
  });

  // A fake family server inside the page, for the zs_challenges bucket
  // (GET returns the stored copy, PUT replaces it, like vps/server.js).
  async function fakeServer(page, initial) {
    await page.evaluate((initial) => {
      const srv = { data: initial, puts: 0 };
      // @ts-ignore
      window.__srv = srv;
      // @ts-ignore
      window.fetch = async (url, opts) => {
        if (!String(url).endsWith('/api/kids/_household/challenges')) return { ok: true, status: 200, json: async () => ({}) };
        if (opts && opts.method === 'PUT') {
          srv.puts++;
          srv.data = Object.assign({}, JSON.parse(opts.body), { _syncedAt: new Date().toISOString() });
          return { ok: true, status: 200, json: async () => ({ status: 'saved', syncedAt: srv.data._syncedAt }) };
        }
        return { ok: true, status: 200, json: async () => JSON.parse(JSON.stringify(srv.data)) };
      };
      // @ts-ignore
      window.CloudSync.online = true;
    }, initial);
  }
  const ids = (/** @type {any} */ d) => d.events.map((/** @type {any} */ e) => e.id);

  test('pushing keeps the other device\'s events: the server copy is merged first', async ({ page }) => {
    await fakeServer(page, { v: 1, events: [{ id: 'c1', type: 'create', ts: 1 }, { id: 'm_ipad', type: 'miss', ts: 4 }], _syncedAt: '2026-11-09T00:00:00.000Z' });
    await page.evaluate(() => {
      localStorage.setItem('zs_challenges', JSON.stringify({ v: 1, events: [{ id: 'c1', type: 'create', ts: 1 }, { id: 's_c1', type: 'solve', ts: 6 }], _syncedAt: 5 }));
      return /** @type {any} */ (window).CloudSync.push('zs_challenges');
    });
    const srv = await page.evaluate(() => /** @type {any} */ (window).__srv.data);
    const local = await page.evaluate(() => JSON.parse(localStorage.getItem('zs_challenges') || '{}'));
    expect(ids(srv)).toEqual(['c1', 'm_ipad', 's_c1']);
    expect(ids(local)).toEqual(['c1', 'm_ipad', 's_c1']);
  });

  test('pulling merges instead of overwriting, and sends this device\'s events back', async ({ page }) => {
    await fakeServer(page, { v: 1, events: [{ id: 'c1', type: 'create', ts: 1 }, { id: 'm_ipad', type: 'miss', ts: 4 }], _syncedAt: '2030-01-01T00:00:00.000Z' });
    await page.evaluate(async () => {
      // The server is "newer", yet this device's own solve must survive.
      localStorage.setItem('zs_challenges', JSON.stringify({ v: 1, events: [{ id: 'c1', type: 'create', ts: 1 }, { id: 's_c1', type: 'solve', ts: 6 }], _syncedAt: 5 }));
      await /** @type {any} */ (window).CloudSync.pull('zs_challenges');
    });
    await expect.poll(() => page.evaluate(() => /** @type {any} */ (window).__srv.puts)).toBeGreaterThan(0);
    const local = await page.evaluate(() => JSON.parse(localStorage.getItem('zs_challenges') || '{}'));
    const srv = await page.evaluate(() => /** @type {any} */ (window).__srv.data);
    expect(ids(local)).toEqual(['c1', 'm_ipad', 's_c1']);
    expect(ids(srv)).toEqual(['c1', 'm_ipad', 's_c1']);
  });

  test('the star rule: one per solved challenge, at most 3 a day', async ({ page }) => {
    const got = await page.evaluate(() => {
      const f = /** @type {any} */ (window).getAppStars;
      return {
        none: f('challenge', {}),
        three: f('challenge', { stars: { a: '2026-11-10', b: '2026-11-10', c: '2026-11-11' } }),
        capped: f('challenge', { stars: { a: '2026-11-10', b: '2026-11-10', c: '2026-11-10', d: '2026-11-10', e: '2026-11-10' } }),
        junk: f('challenge', { stars: 'x' })
      };
    });
    expect(got).toEqual({ none: 0, three: 3, capped: 3, junk: 0 });
  });
});
