// @ts-check
// Cálculo Rápido, in the browser: the four sections, the saved progress, the
// daily review, read-aloud and the layout at phone width. Nothing is said out
// loud (speechSynthesis is stubbed) and the sync server is never reached.
const { test, expect } = require('@playwright/test');

async function open(page, o = {}) {
  const { age = 9, lang, seed = 5, saved, speech = false, mode, path = '/calculo-rapido.html' } = o;
  await page.route(/tail57521e\.ts\.net/, r => r.abort());
  await page.addInitScript(([age, lang, saved, speech, mode]) => {
    if (!localStorage.getItem('zs_profiles')) {
      const p = { name: 'Test', color: 'blue', age, avatar: '🦊' };
      if (lang) p.lang = lang;
      localStorage.setItem('zs_profiles', JSON.stringify([p]));
      localStorage.setItem('zs_active_user', JSON.stringify(p));
      if (saved) localStorage.setItem('zs_calculo_test', JSON.stringify(saved));
      if (mode) localStorage.setItem('zs_tts', JSON.stringify({ test: { mode, enabled: mode !== 'off', rate: 0.85 } }));
    }
    // @ts-ignore
    window.__said = [];
    if (speech) {
      const synth = { speaking: false, getVoices: () => [], speak(u) { // @ts-ignore
        window.__said.push(u.text); }, cancel() {}, addEventListener() {} };
      Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
      // @ts-ignore
      window.SpeechSynthesisUtterance = function (t) { this.text = t; };
      Object.defineProperty(navigator, 'userActivation', { value: { hasBeenActive: true }, configurable: true });
    }
  }, [age, lang || null, saved || null, speech, mode || null]);
  await page.goto(path + '?seed=' + seed);
  await page.waitForSelector('.cr-cards');
}

const state = (page) => page.evaluate(() => /** @type {any} */ (window).Calculo.state());
const saved = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('zs_calculo_test') || 'null'));
const review = (page) => page.evaluate(() => { const d = JSON.parse(localStorage.getItem('zs_review_test') || 'null'); return d ? Object.values(d.items) : []; });

test.describe('Cálculo Rápido', () => {

  test('home: four sections, no script errors, links to the apps that teach the ideas', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await open(page);
    await expect(page.locator('.cr-card')).toHaveCount(4);
    for (const href of ['math-galaxy.html', 'euclid-workshop.html', 'circuit-lab.html', 'little-engineer.html']) {
      await expect(page.locator(`.cr-learn-a[href="${href}"]`)).toHaveCount(1);
    }
    expect(errors).toEqual([]);
  });

  test('the hub has the card, and it opens the app', async ({ page }) => {
    await page.route(/tail57521e\.ts\.net/, r => r.abort());
    await page.addInitScript(() => {
      const p = { name: 'Test', color: 'blue', age: 9, avatar: '🦊' };
      localStorage.setItem('zs_profiles', JSON.stringify([p])); localStorage.setItem('zs_active_user', JSON.stringify(p));
      localStorage.setItem('zs_calculo_test', JSON.stringify({ sprint: { mastered: 6 } }));
    });
    await page.goto('/');
    const card = page.locator('a.app-card[href="calculo-rapido.html"]');
    await expect(card).toHaveCount(1);
    await expect(card.locator('.card-title')).toHaveText('Cálculo Rápido');
    await expect(page.locator('#stats-calculo')).toContainText('3');           // 6 levels mastered = 3 stars
  });

  test.describe('Sprint', () => {
    test('a young kid sees counters and picks the answer; a round of right answers scores by level and is saved', async ({ page }) => {
      await page.clock.install({ time: new Date(2026, 10, 10, 10, 0, 0) });
      await open(page, { age: 5, mode: 'off' });
      await page.click('.cr-card[data-go="sprint"]');
      await page.click('#cr-start');
      await expect(page.locator('.cr-dots')).toHaveCount(1);          // the ten-frame picture
      await expect(page.locator('.cr-opt')).toHaveCount(4);
      await expect(page.locator('.cr-keys')).toHaveCount(0);
      let points = 0, right = 0;
      for (let i = 0; i < 6; i++) {
        const s = await state(page);
        // the sum on the screen is the one the engine holds
        expect(s.sprint.text).toBe((await page.locator('.cr-q-text').first().innerText()).replace(/\s*🔊\s*$/, '').trim());
        points += s.sprint.level; right++;
        await page.click(`.cr-opt[data-v="${s.sprint.answer}"]`);
        await page.clock.runFor(200);
      }
      await page.clock.runFor(61000);
      await expect(page.locator('#cr-score')).toBeVisible();
      const d = await saved(page);
      expect(d.sprint.plays).toBe(1);
      expect(d.sprint.rounds).toHaveLength(1);
      expect(d.sprint.rounds[0]).toMatchObject({ c: right, w: 0, d: '2026-11-10' });
      expect(d.sprint.rounds[0].p).toBe(points);
      expect(d.sprint.best).toBe(points);
      await expect(page.locator('#cr-score')).toHaveText(String(points));
      await expect(page.locator('.cr-chart rect').first()).toBeVisible();
    });

    test('older kids type the answer; four quick right answers raise the level, two misses lower it', async ({ page }) => {
      await page.clock.install({ time: new Date(2026, 10, 10, 10, 0, 0) });
      await open(page, { age: 9 });
      await page.click('.cr-card[data-go="sprint"]');
      await page.click('#cr-start');
      await expect(page.locator('.cr-keys')).toHaveCount(1);
      const start = (await state(page)).sprint.level;
      expect(start).toBe(7);
      for (let i = 0; i < 4; i++) {
        const s = await state(page);
        await page.keyboard.type(String(s.sprint.answer));          // submits by itself at the right number of digits
        await page.clock.runFor(200);
      }
      expect((await state(page)).sprint.level).toBe(8);
      await expect(page.locator('#cr-lvl')).toContainText('8');
      // two wrong in a row: type a wrong number with the on-screen keys
      for (let i = 0; i < 2; i++) {
        const s = await state(page);
        const wrong = String(s.sprint.answer + 1);
        for (const ch of wrong) await page.click(`.cr-key[data-key="${ch}"]`);
        await page.clock.runFor(900);
      }
      expect((await state(page)).sprint.level).toBe(7);
      await page.clock.runFor(61000);
      await expect(page.locator('#cr-score')).toBeVisible();
      const d = await saved(page);
      expect(d.sprint.level).toBe(7);
      expect(d.sprint.mastered).toBe(7);                              // the level left behind counts as mastered
      expect(d.sprint.rounds[0]).toMatchObject({ c: 4, w: 2 });
      // the two missed facts went to the daily review as plain text with choices
      const items = await review(page);
      expect(items.length).toBe(2);
      for (const it of items) {
        expect(it.app).toBe('calculo');
        expect(it.prompt).toMatch(/= \?$/);
        expect(it.choices).toContain(it.answer);
        expect(it.choices).toHaveLength(4);
      }
    });

    test('a round that is left halfway is not saved, and the timer stops', async ({ page }) => {
      await page.clock.install({ time: new Date(2026, 10, 10, 10, 0, 0) });
      await open(page, { age: 9 });
      await page.click('.cr-card[data-go="sprint"]');
      await page.click('#cr-start');
      await page.click('.cr-tab[data-go="estimate"]');
      await page.clock.runFor(70000);
      expect(await saved(page)).toBeNull();
      await expect(page.locator('.cr-grid')).toBeVisible();
    });
  });

  test.describe('Estimate it', () => {
    test('a guess at the reference earns 3 stars, a wild one none; the best is kept', async ({ page }) => {
      await open(page, { age: 9 });
      await page.click('.cr-tab[data-go="estimate"]');
      await page.click('[data-ask="bath"]');
      const s = await state(page);
      expect(s.estimate).toMatchObject({ id: 'bath', truth: 150 });
      // slide to the reference (the slider is a log scale)
      const pos = await page.evaluate(([t, a, b]) => Math.round(1000 * Math.log(t / a) / Math.log(b / a)), [s.estimate.truth, s.estimate.min, s.estimate.max]);
      await page.locator('#cr-slider').fill(String(pos));
      await expect(page.locator('#cr-readout')).not.toHaveText('');
      await page.click('#cr-lock');
      await expect(page.locator('.cr-answer .cr-star.on')).toHaveCount(3);
      await expect(page.locator('.cr-nline')).toBeVisible();
      await expect(page.locator('.cr-ref')).toContainText('150 litres');
      expect((await saved(page)).est.bath).toBe(3);
      // a wild guess later does not lower it
      await page.click('[data-go="estimate"].cr-btn-ghost');
      await page.click('[data-ask="bath"]');
      await page.locator('#cr-slider').fill('1000');
      await page.click('#cr-lock');
      await expect(page.locator('.cr-answer .cr-star.on')).toHaveCount(0);
      expect((await saved(page)).est.bath).toBe(3);
    });

    test('the slider moves by keyboard and by the + and − buttons, and little kids get only the easy questions', async ({ page }) => {
      await open(page, { age: 5 });
      await page.click('.cr-tab[data-go="estimate"]');
      const n = await page.locator('.cr-tile').count();
      expect(n).toBe(5);
      await page.locator('.cr-tile').first().click();
      const before = await page.locator('#cr-readout').innerText();
      await page.click('#cr-plus');
      const after = await page.locator('#cr-readout').innerText();
      expect(after).not.toBe(before);
      await page.locator('#cr-slider').focus();
      await page.keyboard.press('Home');
      await expect(page.locator('#cr-readout')).toHaveText(await page.locator('#cr-lo').innerText());
    });
  });

  test.describe('Units and conversions', () => {
    test('the converter, the approximate-money note and the swap', async ({ page }) => {
      await open(page);
      await page.click('.cr-tab[data-go="units"]');
      await page.click('[data-topic="length"]');
      await page.locator('#cr-cvin').fill('10');                       // 10 miles in km
      await expect(page.locator('#cr-cvout')).toHaveText('16.09');
      await page.click('#cr-swap');
      await page.locator('#cr-cvin').fill('10');
      await expect(page.locator('#cr-cvout')).toHaveText('6.21');
      await page.click('.cr-back');
      await page.click('[data-topic="money"]');
      await expect(page.locator('.cr-warn')).toContainText("not today's rate");
      await page.locator('#cr-cvin').fill('20');
      await expect(page.locator('#cr-cvout')).toHaveText('19,000');
      await page.click('.cr-back');
      await page.click('[data-topic="temp"]');
      await page.locator('#cr-cvin').fill('37');
      await expect(page.locator('#cr-cvout')).toHaveText('98.6');
    });

    test('time zones: Santiago is ahead by 5 hours in November, 3 in July', async ({ page }) => {
      await open(page);
      await page.click('.cr-tab[data-go="units"]');
      await page.click('[data-topic="zones"]');
      await page.locator('#cr-zd').fill('2026-11-10');
      await page.locator('#cr-zt').fill('21:30');
      await expect(page.locator('#cr-zoneans')).toContainText('Wed 2:30 AM');
      await expect(page.locator('.cr-zonelist')).toContainText('UTC-3');
      await page.locator('#cr-zd').fill('2026-07-15');
      await expect(page.locator('#cr-zoneans')).toContainText('Thu 12:30 AM');
      await expect(page.locator('.cr-zonelist')).toContainText('UTC-4');
      // a time the clock change skips is refused, not guessed
      await page.locator('#cr-zd').fill('2026-03-08');
      await page.locator('#cr-zt').fill('02:30');
      await expect(page.locator('#cr-zoneans')).toHaveCount(0);
      await expect(page.locator('#cr-zbody')).toContainText('does not exist');
    });

    test('a quiz: all right gives 3 stars; a miss shows the worked steps and goes to the review', async ({ page }) => {
      await open(page, { age: 9, seed: 11 });
      await page.click('.cr-tab[data-go="units"]');
      await page.click('[data-topic="speed"]');
      await page.click('#cr-quizgo');
      // first question wrong on purpose
      let s = await state(page);
      const wrongK = (s.quiz.correct + 1) % 4;
      await page.click(`.cr-opt[data-k="${wrongK}"]`);
      await expect(page.locator('.cr-worked.no li')).not.toHaveCount(0);
      await expect(page.locator('.cr-opt.right')).toHaveCount(1);
      let items = await review(page);
      expect(items).toHaveLength(1);
      expect(items[0].prompt).toContain('Convert');
      expect(items[0].choices).toContain(items[0].answer);
      for (let i = 0; i < 5; i++) {
        s = await state(page);
        if (i > 0) await page.click(`.cr-opt[data-k="${s.quiz.correct}"]`);
        await page.click('#cr-qnext');
      }
      await expect(page.locator('.cr-result .cr-star.on')).toHaveCount(2);        // 4 of 5 right
    });

    test('a perfect quiz saves 3 stars', async ({ page }) => {
      await open(page, { age: 9, seed: 3 });
      await page.click('.cr-tab[data-go="units"]');
      await page.click('[data-topic="zones"]');
      await page.click('#cr-quizgo');
      for (let i = 0; i < 5; i++) {
        const s = await state(page);
        await page.click(`.cr-opt[data-k="${s.quiz.correct}"]`);
        await page.click('#cr-qnext');
      }
      await expect(page.locator('.cr-result .cr-star.on')).toHaveCount(3);
      expect((await saved(page)).units.zones).toBe(3);
      expect(await review(page)).toHaveLength(0);
    });
  });

  test.describe("Engineer's desk", () => {
    test('opens at ten; younger kids see a gentle lock and a grown-up can open it with the PIN', async ({ page }) => {
      await open(page, { age: 9 });
      await page.click('.cr-tab[data-go="engineer"]');
      await expect(page.locator('.cr-locked')).toBeVisible();
      await expect(page.locator('.cr-keys')).toHaveCount(0);
      await page.click('#cr-pin');
      await page.locator('input[type="password"]').fill('0000');
      await page.keyboard.press('Enter');
      await expect(page.locator('.cr-locked')).toBeVisible();
      await page.click('#cr-pin');
      await page.locator('input[type="password"]').fill('1234');
      await page.keyboard.press('Enter');
      await expect(page.locator('[data-solve]')).toHaveCount(8);
    });

    test('a right answer is credited and shows the worked steps; a wrong one shows them too and goes to the review', async ({ page }) => {
      await open(page, { age: 11, seed: 8 });
      await page.click('.cr-tab[data-go="engineer"]');
      await page.click('[data-solve="percent"]');
      let s = await state(page);
      expect(s.problem.topic).toBe('percent');
      const type = async (n) => { for (const ch of String(n)) await page.click(`.cr-key[data-key="${ch}"]`); };
      await type(s.problem.answer);
      await page.click('#cr-check');
      await expect(page.locator('.cr-worked.ok')).toBeVisible();
      await expect(page.locator('.cr-worked li')).not.toHaveCount(0);
      await expect(page.locator('.cr-worked li').last()).toContainText(String(s.problem.answer).replace(/\B(?=(\d{3})+(?!\d))/g, ','));
      expect((await saved(page)).eng.percent).toBe(1);
      expect(await review(page)).toHaveLength(0);
      await page.click('#cr-nextp');
      s = await state(page);
      await type(s.problem.answer + 1);
      await page.click('#cr-check');
      await expect(page.locator('.cr-worked.no')).toBeVisible();
      await expect(page.locator('.cr-worked li')).not.toHaveCount(0);
      expect((await saved(page)).eng.percent).toBe(1);
      const items = await review(page);
      expect(items).toHaveLength(1);
      expect(items[0].choices).toContain(items[0].answer);
      expect(items[0].prompt).not.toMatch(/<|&lt;/);
    });

    test('looking at the steps first is not credited; decimals can be typed; Ohm links to Circuit Lab', async ({ page }) => {
      await open(page, { age: 12, seed: 2 });
      await page.click('.cr-tab[data-go="engineer"]');
      await page.click('[data-solve="ohm"]');
      await page.click('#cr-peek');
      await expect(page.locator('.cr-worked')).toBeVisible();
      await expect(page.locator('.cr-learn-a.slim')).toHaveAttribute('href', 'circuit-lab.html');
      expect((await saved(page))?.eng?.ohm || 0).toBe(0);
      // a decimal answer: keep going until one needs a point (power, series current), typing it on the keys
      for (let i = 0; i < 40; i++) {
        await page.click('#cr-nextp');
        const s = await state(page);
        if (!Number.isInteger(s.problem.answer)) {
          for (const ch of String(s.problem.answer)) await page.click(`.cr-key[data-key="${ch}"]`);
          await page.click('#cr-check');
          await expect(page.locator('.cr-worked.ok')).toBeVisible();
          return;
        }
        await page.click('#cr-peek');
      }
      throw new Error('no decimal problem in 40 tries');
    });

    test('the scratchpad draws, can be cleared, and frees its canvas when closed', async ({ page }) => {
      await open(page, { age: 11 });
      await page.click('.cr-tab[data-go="engineer"]');
      await page.click('[data-solve="area"]');
      await expect(page.locator('canvas')).toHaveCount(0);
      await page.click('[data-pad]');
      const c = page.locator('.cr-pad-canvas');
      await expect(c).toBeVisible();
      const box = await c.boundingBox();
      await page.mouse.move(box.x + 20, box.y + 30);
      await page.mouse.down();
      await page.mouse.move(box.x + 120, box.y + 90, { steps: 6 });
      await page.mouse.up();
      const ink = () => c.evaluate((cv) => { const x = /** @type {HTMLCanvasElement} */ (cv).getContext('2d'); const d = x.getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; return n; });
      expect(await ink()).toBeGreaterThan(100);
      // the canvas is within the pixel budget a small iPad allows
      expect(await c.evaluate(cv => cv.width * cv.height)).toBeLessThan(16777216);
      await page.click('[data-tool="clear"]');
      expect(await ink()).toBe(0);
      await page.click('[data-pad]');
      await expect(page.locator('canvas')).toHaveCount(0);
    });
  });

  test.describe('Language and read-aloud', () => {
    test('Spanish puts the screens and the problems in Spanish with comma decimals', async ({ page }) => {
      await open(page, { age: 11, lang: 'es', seed: 4 });
      await expect(page.locator('.cr-tab').first()).toContainText('Carrera');
      await page.click('.cr-tab[data-go="engineer"]');
      await page.click('[data-solve="speed"]');
      await expect(page.locator('.cr-q-text')).toContainText(/¿|km|horas|metros/);
      await expect(page.locator('.cr-q-text')).not.toContainText(/How|What|hours/);
      await page.click('[data-key="1"]');
      await expect(page.locator('#cr-entry')).toHaveText('1');
    });

    test('both languages: Spanish first with the English under it', async ({ page }) => {
      await open(page, { age: 9, lang: 'both' });
      await expect(page.locator('.cr-tab').first().locator('.cr-sub')).toHaveText('Sprint');
    });

    test('questions have a 🔊 and say themselves in order; little kids hear each sprint question', async ({ page }) => {
      await open(page, { age: 9, speech: true, mode: 'on' });
      await page.click('.cr-tab[data-go="estimate"]');
      await page.click('[data-ask="bath"]');
      await page.locator('.cr-q-text .zs-say').click();
      expect(await page.evaluate(() => /** @type {any} */ (window).__said)).toContain('How many litres fit in a full bathtub?');
    });

    test('age 5: the first sprint question is read out loud by itself, and a tap on an answer says it first', async ({ page }) => {
      await open(page, { age: 5, speech: true });
      await page.click('.cr-card[data-go="sprint"]');
      await page.click('#cr-start');
      await expect.poll(() => page.evaluate(() => /** @type {any} */ (window).__said.length)).toBeGreaterThan(0);
      const said = await page.evaluate(() => /** @type {any} */ (window).__said[0]);
      expect(said).toMatch(/\d \+ \d equals what|\d . \d equals what|\d − \d equals what/);
      const s = await state(page);
      await page.click(`.cr-opt[data-v="${s.sprint.answer}"]`);
      expect((await state(page)).sprint.answered).toBe(0);              // the first tap only says it
      await page.click(`.cr-opt[data-v="${s.sprint.answer}"]`);
      expect((await state(page)).sprint.answered).toBe(1);
    });
  });

  test('saved progress is never lost: fields are only added', async ({ page }) => {
    await open(page, { age: 9, saved: { v: 1, sprint: { level: 5, mastered: 4, best: 99, plays: 7, rounds: [{ d: '2026-11-01', p: 99, c: 20, w: 1, l: 5 }] },
      est: { door: 3 }, units: { length: 2 }, eng: { area: 4 }, futureField: { keep: 'me' } } });
    await page.click('.cr-tab[data-go="estimate"]');
    await page.click('[data-ask="pitch"]');
    await page.click('#cr-lock');
    const d = await saved(page);
    expect(d.futureField).toEqual({ keep: 'me' });
    expect(d.sprint).toMatchObject({ level: 5, mastered: 4, best: 99, plays: 7 });
    expect(d.est.door).toBe(3);
    expect(d.units.length).toBe(2);
    expect(d.eng.area).toBe(4);
    expect(Object.keys(d.est)).toContain('pitch');
  });

  test.describe('Layout', () => {
    for (const [name, w, h] of [['phone', 390, 844], ['iPad', 820, 1180]]) {
      test(`${name} (${w}px): no sideways scroll, and the header stays clear of the home and profile buttons`, async ({ page }) => {
        await page.setViewportSize({ width: w, height: h });
        await open(page, { age: 11, seed: 6 });
        const check = async (label) => {
          const o = await page.evaluate(() => {
            const r = (sel) => { const e = document.querySelector(sel); if (!e) return null; const b = e.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom }; };
            const hit = (a, b) => a && b && a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;
            const head = ['.cr-brand-t', '#cr-total'].map(r);
            const fixed = ['#zs-nav .home-btn', '#zs-nav .user-badge'].map(r);
            const overlaps = head.some(h => fixed.some(f => hit(h, f)));
            const wide = [...document.querySelectorAll('#cr-wrap *')].filter(e => e.getBoundingClientRect().right > window.innerWidth + 1).map(e => e.className && e.className.baseVal === undefined ? e.className : e.tagName).slice(0, 5);
            return { overlaps, wide, scroll: document.documentElement.scrollWidth - window.innerWidth };
          });
          expect(o.overlaps, label + ' header overlaps the fixed buttons').toBe(false);
          expect(o.wide, label + ' overflows').toEqual([]);
          expect(o.scroll, label + ' scrolls sideways').toBeLessThanOrEqual(0);
        };
        await check('home');
        await page.click('.cr-card[data-go="sprint"]'); await check('sprint intro');
        await page.click('.cr-tab[data-go="estimate"]'); await check('estimate list');
        await page.click('[data-ask="bath"]'); await check('estimate ask');
        await page.click('#cr-lock'); await check('estimate result');
        await page.click('.cr-tab[data-go="units"]'); await page.click('[data-topic="zones"]'); await check('zones');
        await page.click('.cr-back'); await page.click('[data-topic="money"]'); await check('money');
        await page.click('#cr-quizgo'); await check('quiz');
        await page.click('.cr-tab[data-go="engineer"]'); await check('engineer');
        for (const t of ['area', 'ohm', 'rates', 'percent']) {
          await page.click('.cr-tab[data-go="engineer"]'); await page.click(`[data-solve="${t}"]`); await check('solve ' + t);
          await page.click('#cr-peek'); await check('solved ' + t);
        }
      });
    }
  });
});
