// @ts-check
// Repaso del día: the shared review module (Leitner boxes), the review page,
// and the hooks in the apps that feed it.
const { test, expect } = require('@playwright/test');
const { injectMockProfile } = require('../helpers/utils');

const KEY = 'zs_review_test';

async function open(page, url) {
  await injectMockProfile(page);
  await page.goto(url);
  await page.waitForFunction(() => !!window.Review);
}
const read = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), KEY);

test.describe('Review engine', () => {
  test.beforeEach(async ({ page }) => { await open(page, '/repaso.html'); });

  test('a miss is due the next day, then climbs boxes 1, 2, 4, 8, 16 days and retires', async ({ page }) => {
    const out = await page.evaluate(() => {
      // @ts-ignore
      const R = window.Review, td = R.dayNum(), log = [];
      const it = R.add(null, { app: 'math', prompt: '7 x 8 = ?', answer: '56', choices: ['54', '56', '63'] });
      log.push({ box: it.box, due: it.due - td, early: R.hit(null, it.id).early === true });   // not due yet: no change
      let id = it.id;
      for (let step = 0; step < 6; step++) {
        const d = JSON.parse(localStorage.getItem('zs_review_test')); // make it due now
        if (d.items[id]) { d.items[id].due = td; localStorage.setItem('zs_review_test', JSON.stringify(d)); }
        const r = R.hit(null, id);
        const now = R.get(null, id);
        log.push({ r, box: now && now.box, gap: now && now.due - td });
      }
      return log;
    });
    expect(out[0]).toEqual({ box: 1, due: 1, early: true });
    expect(out.slice(1, 5).map(x => [x.box, x.gap])).toEqual([[2, 2], [3, 4], [4, 8], [5, 16]]);
    expect(out[5].r).toMatchObject({ retired: true });
    expect(out[5].box).toBeNull();
    const d = await read(page);
    expect(d.retired).toBe(1);
  });

  test('a miss sends an item back to box 1; the item is tidied and capped', async ({ page }) => {
    const out = await page.evaluate(() => {
      // @ts-ignore
      const R = window.Review, td = R.dayNum();
      const it = R.add(null, { app: 'Math Galaxy!', prompt: '  a   b ', answer: 'x'.repeat(500), choices: ['a', 'a', 'b', 'c', 'd', 'e'] });
      const d = JSON.parse(localStorage.getItem('zs_review_test'));
      d.items[it.id].box = 4; d.items[it.id].due = td; localStorage.setItem('zs_review_test', JSON.stringify(d));
      const m = R.miss(null, it.id);
      const after = R.get(null, it.id);
      return { id: it.id, app: it.app, prompt: it.prompt, alen: it.answer.length, ch: it.choices, m, box: after.box, gap: after.due - td, bad: R.add(null, { app: 'x', prompt: '', answer: 'y' }), unknown: R.hit(null, 'nope:1') };
    });
    expect(out.app).toBe('mathgalaxy');
    expect(out.prompt).toBe('a b');
    expect(out.alen).toBe(120);
    expect(out.ch.length).toBeLessThanOrEqual(4);
    expect(out.ch).toContain('x'.repeat(80));      // the right answer is always a choice
    expect(out.m).toMatchObject({ was: 4, now: 1 });
    expect(out.box).toBe(1);
    expect(out.gap).toBe(1);
    expect(out.bad).toBeNull();
    expect(out.unknown).toBeNull();
  });

  test('due() mixes apps and only returns what is due; counts() agrees', async ({ page }) => {
    const out = await page.evaluate(() => {
      // @ts-ignore
      const R = window.Review, td = R.dayNum();
      ['a', 'a', 'a', 'b', 'b', 'c'].forEach((app, i) => R.add(null, { app, prompt: 'q' + i, answer: 'x' + i }));
      const d = JSON.parse(localStorage.getItem('zs_review_test'));
      Object.keys(d.items).forEach((k, i) => { d.items[k].due = i < 5 ? td - i : td + 3; });   // five due, one later
      localStorage.setItem('zs_review_test', JSON.stringify(d));
      const due = R.due(null, 4);
      return { apps: due.map(x => x.app), n: R.dueCount(null), c: R.counts(null) };
    });
    expect(out.n).toBe(5);
    expect(out.apps).toHaveLength(4);
    expect(out.apps.slice(0, 2)[0]).not.toBe(out.apps.slice(0, 2)[1]);   // neighbours come from different apps
    expect(out.c).toMatchObject({ due: 5, total: 6, doneToday: false });
  });

  test('finishing the day counts once, builds a streak, and the star rule counts days', async ({ page }) => {
    const out = await page.evaluate(() => {
      // @ts-ignore
      const R = window.Review;
      const first = R.complete(null, 6), again = R.complete(null, 3);
      const y = new Date(); y.setDate(y.getDate() - 1);
      const d = JSON.parse(localStorage.getItem('zs_review_test'));
      d.done[R.dateKey(y)] = 4; localStorage.setItem('zs_review_test', JSON.stringify(d));
      // @ts-ignore
      return { first, again, streak: R.streak(null), stars: window.getAppStars('review', JSON.parse(localStorage.getItem('zs_review_test'))) };
    });
    expect(out.first).toMatchObject({ first: true, streak: 1 });
    expect(out.again.first).toBe(false);
    expect(out.streak).toBe(2);
    expect(out.stars).toBe(2);
  });

  test('the key is synced like any app key', async ({ page }) => {
    const src = await (await page.request.get('/js/sync.js')).text();
    expect(src).toContain("'zs_review_': 'review'");
  });
});

test.describe('Review page', () => {
  test('nothing due: says so, no Start button action', async ({ page }) => {
    await open(page, '/repaso.html');
    await expect(page.locator('#rp-due')).toContainText(/Nothing to review|Nada por repasar/);
    await expect(page.locator('#rp-go')).toHaveText(/Back to home|Volver al inicio/);
  });

  test('a session: right answer climbs, wrong one goes back, self-check items, star once', async ({ page }) => {
    await injectMockProfile(page);
    await page.addInitScript(() => {
      const td = Math.round(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()) / 86400000);
      if (localStorage.getItem('zs_review_test')) return;   // seed once, so a reload keeps what the page saved
      const mk = (id, app, prompt, answer, choices, extra) => Object.assign({ id, app, prompt, answer, choices, box: 1, due: td, added: td - 2, misses: 1, hits: 0 }, extra || {});
      localStorage.setItem('zs_review_test', JSON.stringify({ v: 1, done: {}, retired: 0, items: {
        'math:1': mk('math:1', 'math', '6 x 7 = ?', '42', ['40', '42', '48']),
        'atlas:1': mk('atlas:1', 'atlas', 'Capital of France?', 'Paris', ['Paris', 'Rome']),
        'bible:1': mk('bible:1', 'bible', 'Ps 23:1 — The Lord is my ____', 'shepherd'),
        'chess:p0': mk('chess:p0', 'chess', 'Win the Queen!', 'Nxe5', undefined, { fen: '4k3/8/8/4q3/8/3N4/8/6K1 w - - 0 1' })
      } }));
    });
    await page.goto('/repaso.html');
    await expect(page.locator('#rp-due b')).toHaveText('4');
    await page.locator('#rp-go').click();

    const seen = [];
    for (let n = 0; n < 4; n++) {
      await expect(page.locator('#rp-quiz')).toHaveClass(/active/);
      const prompt = (await page.locator('#rp-prompt').textContent()) || '';
      seen.push(prompt);
      if (prompt.startsWith('6 x 7')) {
        await page.locator('.rp-choice', { hasText: '42' }).click();              // right
      } else if (prompt.startsWith('Capital')) {
        await page.locator('.rp-choice', { hasText: 'Rome' }).click();            // wrong
        await expect(page.locator('#rp-feedback')).toContainText('Paris');
      } else if (prompt.startsWith('Ps 23')) {
        await page.locator('#rp-show').click();
        await expect(page.locator('#rp-feedback')).toContainText('shepherd');
        await page.locator('#rp-knew').click();
      } else {
        await expect(page.locator('#rp-board svg')).toBeVisible();               // chess diagram
        await page.locator('#rp-show').click();
        await page.locator('#rp-notyet').click();
      }
      await page.locator('#rp-next').click();
    }
    expect(seen).toHaveLength(4);
    await expect(page.locator('#rp-done')).toHaveClass(/active/);
    await expect(page.locator('#rp-done-sum')).toHaveText(/2 \/ 4/);
    await expect(page.locator('#rp-done-star')).toContainText(/1 star|1 estrella/);

    const d = await read(page);
    expect(d.items['math:1'].box).toBe(2);                  // right → up a box
    expect(d.items['bible:1'].box).toBe(2);
    expect(d.items['atlas:1'].box).toBe(1);                 // wrong → back to box 1
    expect(d.items['chess:p0'].box).toBe(1);
    expect(Object.keys(d.done)).toHaveLength(1);

    // Nothing is due any more, and a second visit earns no second star.
    await page.goto('/repaso.html');
    await expect(page.locator('#rp-due')).toContainText(/All done|Listo/);
    const stars = await page.evaluate(() => (/** @type {any} */ (window)).getAppStars('review', JSON.parse(localStorage.getItem('zs_review_test'))));
    expect(stars).toBe(1);
  });

  test('item text is shown as text, never as HTML', async ({ page }) => {
    await injectMockProfile(page);
    await page.addInitScript(() => {
      const td = Math.round(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()) / 86400000);
      localStorage.setItem('zs_review_test', JSON.stringify({ v: 1, done: {}, retired: 0, items: {
        'math:x': { id: 'math:x', app: 'math', prompt: '<img src=x onerror="window.__pwned=1"> 1+1', answer: '<b>2</b>', choices: ['<b>2</b>', '3'], box: 1, due: td, added: td, misses: 1, hits: 0 }
      } }));
    });
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto('/repaso.html');
    await page.locator('#rp-go').click();
    await expect(page.locator('#rp-prompt')).toContainText('<img src=x');
    await page.locator('.rp-choice', { hasText: '3' }).click();
    await expect(page.locator('#rp-feedback')).toContainText('<b>2</b>');
    expect(await page.evaluate(() => (/** @type {any} */ (window)).__pwned)).toBeUndefined();
    expect(errors).toEqual([]);
  });
});

test.describe('Hooks in the apps', () => {
  test('Math Galaxy: a missed question is saved for review and a right one is not', async ({ page }) => {
    await injectMockProfile(page);
    await page.goto('/math-galaxy.html');
    await page.waitForFunction(() => !!window.Review);
    const out = await page.evaluate(() => {
      // @ts-ignore
      const fn = typeof reviewNote === 'function' ? reviewNote : null;
      if (!fn) return null;
      const q = { text: '2 + 2 = ?', options: [3, 4, 5], answer: 4 };
      fn(q, true);
      const none = localStorage.getItem('zs_review_test');
      fn(q, false);
      // @ts-ignore
      const d = JSON.parse(localStorage.getItem('zs_review_test'));
      const it = d.items[Object.keys(d.items)[0]];
      return { none, it };
    });
    expect(out).not.toBeNull();
    expect(out.none).toBeNull();
    expect(out.it).toMatchObject({ app: 'math', prompt: '2 + 2 = ?', answer: '4', box: 1 });
    expect(out.it.choices).toEqual(['3', '4', '5']);
  });

  test('World Atlas: a wrong capital is saved with its choices; a right answer to it moves it up', async ({ page }) => {
    await injectMockProfile(page);
    await page.goto('/world-atlas.html');
    await page.waitForFunction(() => !!window.Review && !!(/** @type {any} */ (window)).WorldAtlas);
    await page.evaluate(() => (/** @type {any} */ (window)).WorldAtlas.startQuiz());
    await page.waitForFunction(() => !!(/** @type {any} */ (window)).__waCurrentQuestion);
    const info = await page.evaluate(() => {
      const q = (/** @type {any} */ (window)).__waCurrentQuestion;
      return { type: q.type, right: q.labelOf(q.answer), text: q.text };
    });
    // The default quiz is the capitals quiz, whose question is plain text.
    expect(info.type).toBe('capital');
    await page.locator('.wa-option', { hasNotText: info.right }).first().click();
    const d = await read(page);
    const items = Object.values(d.items);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ app: 'atlas', prompt: info.text, answer: info.right, box: 1 });
    expect(items[0].choices).toContain(info.right);

    // Later that item is due and the same question is answered right.
    const moved = await page.evaluate(({ text, right }) => {
      // @ts-ignore
      const R = window.Review, id = R.idFor('atlas', text, right), td = R.dayNum();
      const d = JSON.parse(localStorage.getItem('zs_review_test')); d.items[id].due = td; localStorage.setItem('zs_review_test', JSON.stringify(d));
      return R.hit(null, id);
    }, info);
    expect(moved).toMatchObject({ was: 1, now: 2 });
  });

  test('Patrón de Lancha: a wrong answer is saved with its choices; a right answer is a hit', async ({ page }) => {
    await injectMockProfile(page);
    await page.goto('/patron-lancha.html');
    await page.waitForFunction(() => !!window.Review && !!(/** @type {any} */ (window)).PL);
    await page.locator('.pl-tab[data-view="practice"]').click();
    await page.locator('#practice-start').click();
    await page.waitForSelector('#pl-opts .pl-opt', { state: 'visible' });
    const q = await page.evaluate(() => {
      const PL = (/** @type {any} */ (window)).PL, cur = PL.quiz.qs[PL.quiz.i];
      return { id: cur.id, q: cur.q, a: cur.a, o: cur.o };
    });
    await page.locator('#pl-opts .pl-opt').nth((q.a + 1) % q.o.length).click();       // a wrong one
    const d = await read(page);
    expect(d.items['patron:' + q.id]).toMatchObject({ app: 'patron', prompt: q.q, answer: q.o[q.a], box: 1 });
    expect(d.items['patron:' + q.id].choices.sort()).toEqual(q.o.slice().sort());
  });

  test('Bible Explorer: a missed story question is saved with its choices', async ({ page }) => {
    await injectMockProfile(page);
    await page.goto('/bible-explorer.html');
    await page.waitForFunction(() => !!window.Review && typeof BibleExplorer !== 'undefined');
    await page.evaluate(() => BibleExplorer.openStories());
    await page.locator('.bx-story-card').first().click();
    await page.locator('[onclick*="startStoryQuiz"]').first().click();
    await page.waitForSelector('.bx-quiz-opt', { state: 'visible' });
    // Read-aloud may have added a 🔊 button to the question by now; it is not part of the text.
    const q = ((await page.locator('.bx-quiz-q').textContent()) || '').replace(/🔊/g, '').trim();
    const opts = (await page.locator('.bx-quiz-opt').allTextContents()).map(t => t.replace(/🔊/g, '').trim());
    // Click each option's turn until one is wrong (the first or second always is).
    await page.locator('.bx-quiz-opt').first().click();
    const wrong = await page.locator('.bx-quiz-opt.bx-wrong').count();
    const d = await read(page);
    const items = d ? Object.values(d.items) : [];
    if (wrong) {
      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({ app: 'bible', prompt: q });
      expect(items[0].choices.slice().sort()).toEqual(opts.slice().sort());
    } else {
      expect(items).toHaveLength(0);
    }
  });

  test('Vocabulario Vivo: a missed root question is saved; a right one is not', async ({ page }) => {
    await injectMockProfile(page);
    await page.goto('/vocabulario-vivo.html');
    await page.waitForFunction(() => !!window.Review && typeof VocabularioVivo !== 'undefined');
    await page.evaluate(() => VocabularioVivo.openMatch());
    await page.waitForSelector('.vv-match-opt', { state: 'visible' });
    const word = (await page.locator('#vv-match-word').textContent()) || '';
    await page.locator('.vv-match-opt').first().click();
    const wrong = await page.locator('.vv-match-opt.vv-wrong').count();
    const d = await read(page);
    const items = d ? Object.values(d.items) : [];
    if (wrong) {
      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({ app: 'vocab' });
      expect(items[0].prompt).toContain(word);
      expect(items[0].choices.length).toBeGreaterThanOrEqual(2);
      expect(items[0].choices).toContain(items[0].answer);
    } else {
      expect(items).toHaveLength(0);
    }
  });

  test('Chess Quest: a wrong first move in a puzzle saves it with its starting position', async ({ page }) => {
    await injectMockProfile(page);
    await page.addInitScript(() => localStorage.setItem('zs_chess_test', JSON.stringify({ puzzlesSolved: 5 })));   // the ladder opens one step at a time
    await page.goto('/chess-quest.html');
    await page.waitForFunction(() => !!window.Review && typeof openPuzzle === 'function');
    // "Win the Queen!": the knight on d3 should take on e5. Move it to f4 instead.
    await page.evaluate(() => { openPuzzle(2); });
    await page.waitForFunction(() => typeof PZ !== 'undefined' && PZ && !PZ.busy);
    await page.evaluate(async () => { await puzzleClick(5, 3); await puzzleClick(4, 5); });
    const d = await read(page);
    expect(Object.keys(d.items)).toEqual(['chess:p2']);
    expect(d.items['chess:p2']).toMatchObject({ app: 'chess', answer: 'Nxe5', fen: '4k3/8/8/4q3/8/3N4/8/6K1 w - - 0 1' });
    expect(d.items['chess:p2'].prompt).toContain('Win the Queen');
  });
});
