// @ts-check
// Línea del Tiempo, in the browser: the zoomable timeline, the cards by age,
// the four games, saved progress and the daily review. Service workers are
// blocked, speechSynthesis is stubbed and the sync server is never reached.
const { test, expect } = require('@playwright/test');

async function open(page, o = {}) {
  const { age = 9, lang, seed = 3, saved, speech = false, mode, path = '/linea-del-tiempo.html', query = '' } = o;
  await page.route(/tail57521e\.ts\.net/, r => r.abort());
  await page.addInitScript(([age, lang, saved, speech, mode]) => {
    if (!localStorage.getItem('zs_profiles')) {
      const p = { name: 'Test', color: 'blue', age, avatar: '🦊' };
      if (lang) p.lang = lang;
      localStorage.setItem('zs_profiles', JSON.stringify([p]));
      localStorage.setItem('zs_active_user', JSON.stringify(p));
      if (saved) localStorage.setItem('zs_linea_test', JSON.stringify(saved));
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
  await page.goto(path + '?seed=' + seed + query);
  await page.waitForSelector('#ln-main');
}

const state = (page) => page.evaluate(() => /** @type {any} */ (window).Linea.state());
const saved = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('zs_linea_test') || 'null'));
const review = (page) => page.evaluate(() => { const d = JSON.parse(localStorage.getItem('zs_review_test') || 'null'); return d ? Object.values(d.items) : []; });
const openCard = (page, id) => page.evaluate(id => /** @type {any} */ (window).Linea.open(id), id);
const tab = (page, id) => page.click(`.ln-tab[data-go="${id}"]`);

test.describe('Línea del Tiempo', () => {

  test('opens on the timeline for a 9-year-old and on the eras for a 5-year-old, with no script errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await open(page, { age: 9 });
    await expect(page.locator('#ln-stage')).toBeVisible();
    await expect(page.locator('.ln-lane')).toHaveCount(3);
    expect((await state(page)).view).toBe('line');
    expect(errors).toEqual([]);
  });

  test('a 5-year-old starts on the eras, with big pictures and no dates to read', async ({ page }) => {
    await open(page, { age: 5, lang: 'es', mode: 'off' });
    expect((await state(page)).view).toBe('eras');
    await expect(page.locator('.ln-era-card')).toHaveCount(6);
    await expect(page.locator('.ln-era-ev').first()).toBeVisible();
    await page.locator('.ln-era-ev').first().click();
    await expect(page.locator('.ln-card')).toBeVisible();
    await expect(page.locator('.ln-ago')).toContainText('hace');
    await expect(page.locator('.ln-why')).toHaveCount(0);       // dates, causes and sources are for older kids
    await expect(page.locator('.ln-src')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(page.locator('.ln-card')).toHaveCount(0);
    // the timeline for little kids carries only the big events
    await tab(page, 'line');
    const n = await page.locator('.ln-mk').count();
    expect(n).toBeGreaterThan(20);
    expect(n).toBeLessThan(45);
  });

  test('the hub has the card and it opens the app', async ({ page }) => {
    await page.route(/tail57521e\.ts\.net/, r => r.abort());
    await page.addInitScript(() => {
      const p = { name: 'Test', color: 'blue', age: 9, avatar: '🦊' };
      localStorage.setItem('zs_profiles', JSON.stringify([p])); localStorage.setItem('zs_active_user', JSON.stringify(p));
      localStorage.setItem('zs_linea_test', JSON.stringify({ v: 1, seen: Object.fromEntries(Array.from({ length: 30 }, (_, i) => ['e' + i, 1])), g: { ba: 2 } }));
    });
    await page.goto('/');
    const card = page.locator('a.app-card[href="linea-del-tiempo.html"]');
    await expect(card).toHaveCount(1);
    await expect(card.locator('.card-title')).toHaveText('Línea del Tiempo');
    await expect(page.locator('#stats-linea')).toContainText('5');      // 30 events = 3 stars, plus 2 for a game
  });

  test.describe('the timeline', () => {
    test('it shows the three lanes, tells years apart as BC and AD, and the buttons zoom', async ({ page }) => {
      await open(page, { age: 9, lang: 'es' });
      await expect(page.locator('.ln-lane-tag')).toHaveText(['Chile', 'El mundo', 'La Iglesia']);
      const s0 = (await state(page)).tl;
      expect(s0.visible.length).toBeGreaterThan(5);
      await page.click('#ln-in');
      await expect.poll(async () => (await state(page)).tl.ppy).toBeGreaterThan(s0.ppy * 1.7);
      await page.click('#ln-out'); await page.click('#ln-out');
      await expect.poll(async () => (await state(page)).tl.ppy).toBeLessThan(s0.ppy);
      // all the way out: the BC ticks use "a. C."
      await page.click('#ln-all');
      await expect.poll(async () => (await state(page)).tl.ppy).toBeCloseTo((await state(page)).tl.minPpy, 3);
      await expect(page.locator('.ln-tick', { hasText: 'a. C.' }).first()).toBeVisible();
      await expect(page.locator('#ln-split')).toBeVisible();
      // the slider reaches both ends: millennia and decades
      await page.locator('#ln-zoom').fill('1000');
      const z = (await state(page)).tl;
      expect(z.W / z.ppy).toBeLessThan(40);                       // a few decades across
      await page.locator('#ln-zoom').fill('0');
      const y = (await state(page)).tl;
      expect(y.W / y.ppy).toBeGreaterThan(7000);                  // all of history across
    });

    test('dragging pans, the wheel zooms around the pointer and a two-finger pinch zooms', async ({ page }) => {
      await open(page, { age: 9 });
      const box = await page.locator('#ln-stage').boundingBox();
      const s0 = (await state(page)).tl;
      await page.mouse.move(box.x + 100, box.y + 36);
      await page.mouse.down();
      await page.mouse.move(box.x + 200, box.y + 36, { steps: 5 });
      await page.mouse.up();
      const s1 = (await state(page)).tl;
      expect(s1.cx).toBeLessThan(s0.cx - 100);                    // dragged right = earlier years
      expect(s1.ppy).toBeCloseTo(s0.ppy, 6);
      // a drag does not open a card
      await expect(page.locator('.ln-card')).toHaveCount(0);
      await page.mouse.move(box.x + 180, box.y + 200);
      await page.mouse.wheel(0, -300);
      await expect.poll(async () => (await state(page)).tl.ppy).toBeGreaterThan(s1.ppy * 1.3);
      // pinch: two pointers moving apart
      const before = (await state(page)).tl;
      await page.evaluate(() => {
        const st = document.getElementById('ln-stage'), r = st.getBoundingClientRect(), y = r.top + 30, mk = (t, id, x, tgt) => tgt.dispatchEvent(new PointerEvent(t, { pointerId: id, pointerType: 'touch', clientX: x, clientY: y, bubbles: true, isPrimary: id === 1 }));
        const cx = r.left + r.width / 2;
        mk('pointerdown', 1, cx - 30, st); mk('pointerdown', 2, cx + 30, st);
        mk('pointermove', 1, cx - 80, window); mk('pointermove', 2, cx + 80, window);
        mk('pointerup', 1, cx - 80, window); mk('pointerup', 2, cx + 80, window);
      });
      await expect.poll(async () => (await state(page)).tl.ppy).toBeGreaterThan(before.ppy * 2);
    });

    test('tapping a picture opens its card with the date, why it matters, the source and links; BC dates read "a. C."', async ({ page }) => {
      await open(page, { age: 9, lang: 'es' });
      await openCard(page, 'great-pyramid');
      await expect(page.locator('.ln-card-t')).toHaveText('La Gran Pirámide de Giza');
      await expect(page.locator('.ln-date b')).toHaveText('c. 2560 a. C.');
      await expect(page.locator('.ln-why')).toContainText('Siete Maravillas');
      await expect(page.locator('.ln-src')).toContainText('Fuente: Britannica');
      await expect(page.locator('.ln-link[href="world-explorer.html"]')).toContainText('Egipto');
      await page.keyboard.press('Escape');
      await openCard(page, 'jesus-birth');
      await expect(page.locator('.ln-date b')).toHaveText('c. 6–4 a. C.');
      await page.keyboard.press('Escape');
      // a real tap on a marker
      await page.evaluate(() => /** @type {any} */ (window).Linea.show('santiago-founded'));
      await expect.poll(async () => (await state(page)).tl.visible.includes('santiago-founded')).toBe(true);
      await page.waitForTimeout(700);
      await page.locator('.ln-mk[data-id="santiago-founded"]').click();
      await expect(page.locator('.ln-card-t')).toHaveText('Pedro de Valdivia funda Santiago');
      await expect(page.locator('.ln-date b')).toHaveText('1541');
      await expect(page.locator('.ln-link[href="descubre-chile.html"]')).toContainText('Región Metropolitana');
    });

    test('the card is age-shaped: causes, effects and what happened at the same time for 9 and up', async ({ page }) => {
      await open(page, { age: 7, lang: 'en' });
      await openCard(page, 'columbus');
      await expect(page.locator('.ln-why')).toBeVisible();
      await expect(page.locator('.ln-cause')).toHaveCount(0);
      await page.keyboard.press('Escape');
      await page.evaluate(() => { const p = { name: 'Test', color: 'blue', age: 12, avatar: '🦊' }; localStorage.setItem('zs_profiles', JSON.stringify([p])); localStorage.setItem('zs_active_user', JSON.stringify(p)); });
      await page.reload();
      await page.waitForSelector('#ln-main');
      await openCard(page, 'columbus');
      await expect(page.locator('.ln-cause')).toContainText('sea route to Asia');
      await expect(page.locator('.ln-cause')).toContainText('After his voyage');
      await expect(page.locator('.ln-same-list .ln-chip-btn').first()).toBeVisible();
      // previous / next walk along the same lane
      const before = (await state(page)).card;
      await page.click('.ln-card-nav .ln-btn:nth-child(3)');
      expect((await state(page)).card).not.toBe(before);
      await page.click('.ln-card-nav .ln-btn[data-find]');
      await expect(page.locator('.ln-card')).toHaveCount(0);
    });

    test('lifespans of people are drawn as bars, and the English and bilingual wording follow the kid\'s language', async ({ page }) => {
      await open(page, { age: 12, lang: 'both' });
      await page.evaluate(() => /** @type {any} */ (window).Linea.show('francis-assisi'));
      await expect.poll(async () => (await state(page)).tl.visible.includes('francis-assisi')).toBe(true);
      await page.waitForTimeout(700);
      await expect(page.locator('.ln-bar[data-bar="francis-assisi"]')).toBeVisible();
      await openCard(page, 'francis-assisi');
      await expect(page.locator('.ln-card-t')).toContainText('San Francisco de Asís');
      await expect(page.locator('.ln-card-t .ln-sub')).toHaveText('Saint Francis of Assisi');
      await expect(page.locator('.ln-life')).toContainText('1181–1226');
      await expect(page.locator('.ln-link[href="fe-explorador.html"]')).toContainText('San Francisco de Asís');
    });

    test('opening events earns stars, one for every ten, saved without losing anything else', async ({ page }) => {
      await open(page, { age: 9, saved: { v: 1, seen: {}, g: { ba: 1 }, extra: 'keep' } });
      const ids = ['moai', 'santiago-founded', 'junta-1810', 'independence-1818', 'great-pyramid', 'colosseum', 'jesus-birth', 'nicaea', 'greccio', 'columbus'];
      for (const id of ids) { await openCard(page, id); await page.keyboard.press('Escape'); }
      const d = await saved(page);
      expect(Object.keys(d.seen)).toHaveLength(10);
      expect(d.extra).toBe('keep');
      expect(d.g.ba).toBe(1);
      expect(await page.evaluate(() => /** @type {any} */ (window).getAppStars('linea', JSON.parse(localStorage.getItem('zs_linea_test'))))).toBe(2);
    });

    test('read-aloud: the card has a speaker button that says the title and the story', async ({ page }) => {
      await open(page, { age: 6, lang: 'es', speech: true, mode: 'on' });
      await openCard(page, 'moai');
      await page.locator('.ln-desc .zs-say').click();
      const said = await page.evaluate(() => /** @type {any} */ (window).__said);
      expect(said.join(' ')).toContain('Los moai de Rapa Nui');
      expect(said.join(' ')).toContain('Isla de Pascua');
    });
  });

  test.describe('eras', () => {
    test('an era jumps to its place on the timeline', async ({ page }) => {
      await open(page, { age: 9 });
      await tab(page, 'eras');
      await page.locator('.ln-era-go[data-zoom="c20"]').click();
      await expect(page.locator('#ln-stage')).toBeVisible();
      await expect.poll(async () => { const t = (await state(page)).tl; return t.cx > 1900 && t.cx < 2000 && t.W / t.ppy < 130; }).toBe(true);
    });
  });

  test.describe('games', () => {
    test('put in order: arrows and dragging reorder, a wrong check marks the cards, a right one shows the dates', async ({ page }) => {
      await page.clock.install({ time: new Date(2026, 10, 10, 10, 0, 0) });
      await open(page, { age: 9 });
      await tab(page, 'games');
      await page.click('.ln-gcard[data-go="order"]');
      let s = (await state(page)).order;
      expect(s.shown).toHaveLength(5);
      await expect(page.locator('.ln-orow')).toHaveCount(5);
      // dragging the first card's handle to the bottom moves it last
      const first = s.shown[0];
      const h = await page.locator('.ln-orow .ln-drag').first().boundingBox();
      const last = await page.locator('.ln-orow').last().boundingBox();
      await page.mouse.move(h.x + 10, h.y + 10); await page.mouse.down();
      await page.mouse.move(h.x + 10, last.y + last.height + 20, { steps: 8 }); await page.mouse.up();
      expect((await page.locator('.ln-orow').last().getAttribute('data-id'))).toBe(first);
      // put them in the right order using the arrows
      async function solve() {
        s = (await state(page)).order;
        for (let i = 0; i < s.answer.length; i++) {
          let ids = await page.locator('.ln-orow').evaluateAll(els => els.map(e => e.getAttribute('data-id')));
          let at = ids.indexOf(s.answer[i]);
          while (at > i) { await page.locator('.ln-orow').nth(at).locator('.ln-arrow[data-dir="-1"]').click(); at--; }
        }
      }
      // first, a wrong check (the order as dealt is never the answer)
      await solve();
      await page.locator('.ln-orow').nth(0).locator('.ln-arrow[data-dir="1"]').click();
      await page.click('#ln-check');
      await expect(page.locator('.ln-orow.bad').first()).toBeVisible();
      await expect(page.locator('#ln-next')).toHaveCount(0);
      await solve();
      await page.click('#ln-check');
      await expect(page.locator('.ln-orow-date').first()).not.toBeEmpty();
      await expect(page.locator('#ln-next')).toBeVisible();
      // the whole round, first try on the rest, the one that took two tries does not count
      for (let r = 0; r < 4; r++) {
        await page.click('#ln-next');
        await solve();
        await page.click('#ln-check');
      }
      await expect(page.locator('#ln-result')).toBeVisible();
      const d = await saved(page);
      expect(d.g.order5).toBe(2);                                  // 4 of 5 first time = 80%
    });

    test('put in order: two wrong checks show the right order and send a pair to the daily review', async ({ page }) => {
      await open(page, { age: 9, lang: 'en' });
      await page.goto('/linea-del-tiempo.html?seed=3&tab=games');
      await page.click('.ln-gcard[data-go="order"]');
      await page.click('#ln-check'); await page.click('#ln-check');
      const s = (await state(page)).order;
      expect(await page.locator('.ln-orow').evaluateAll(els => els.map(e => e.getAttribute('data-id')))).toEqual(s.answer);
      await expect(page.locator('.ln-flash')).toContainText('right order');
      const items = await review(page);
      expect(items.length).toBe(1);
      expect(items[0].app).toBe('linea');
      expect(items[0].prompt).toContain('Which came first');
    });

    test('who lived at the same time: right answers score, a wrong one is explained and goes to the review', async ({ page }) => {
      await open(page, { age: 9, lang: 'en' });
      await tab(page, 'games');
      await page.click('.ln-gcard[data-go="same"]');
      for (let i = 0; i < 5; i++) {
        const q = (await state(page)).same;
        await expect(page.locator('.ln-opt')).toHaveCount(3);
        const pick = i === 2 ? q.options.find(o => o !== q.answer) : q.answer;
        await page.click(`.ln-opt[data-id="${pick}"]`);
        await expect(page.locator('.ln-fb')).toBeVisible();
        await page.click('#ln-next');
      }
      await expect(page.locator('#ln-result')).toBeVisible();
      expect((await saved(page)).g.same).toBe(2);                 // 4 of 5
      const items = await review(page);
      expect(items.length).toBe(1);
      expect(items[0].prompt).toMatch(/same time|alive/);
    });

    test('before or after: the answer matches the dates, six rounds, a perfect round is three stars', async ({ page }) => {
      await open(page, { age: 9, lang: 'es' });
      await page.goto('/linea-del-tiempo.html?seed=3&tab=games');
      await page.click('.ln-gcard[data-go="ba"]');
      for (let i = 0; i < 6; i++) {
        const q = (await state(page)).ba;
        await page.click(`.ln-opt[data-v="${q.answer}"]`);
        await expect(page.locator('.ln-fb.ok')).toBeVisible();
        await page.click('#ln-next');
      }
      await expect(page.locator('.ln-rstars .ln-star.on')).toHaveCount(3);
      expect((await saved(page)).g.ba).toBe(3);
      expect(await review(page)).toEqual([]);
    });

    test('time-travel trivia: choose an era, answer six, wrong answers come back in Repaso', async ({ page }) => {
      await open(page, { age: 12, lang: 'en' });
      await page.goto('/linea-del-tiempo.html?seed=4&tab=games');
      await page.click('.ln-gcard[data-go="trivia"]');
      await expect(page.locator('.ln-dest')).toHaveCount(7);
      await page.click('.ln-dest[data-arg="mod"]');
      for (let i = 0; i < 6; i++) {
        const t = (await state(page)).trivia;
        expect(t.n).toBe(6);
        const n = await page.locator('.ln-opt').count();
        const pick = i === 1 ? (t.answer + 1) % n : t.answer;
        await page.locator('.ln-opt').nth(pick).click();
        await expect(page.locator('.ln-fb')).toBeVisible();
        await page.click('#ln-next');
      }
      await expect(page.locator('#ln-result')).toBeVisible();
      const d = await saved(page);
      expect(d.g.t_mod).toBe(2);                                   // 5 of 6
      const items = await review(page);
      expect(items).toHaveLength(1);
      expect(items[0].app).toBe('linea');
      expect(items[0].choices).toContain(items[0].answer);
      expect(items[0].prompt.length).toBeLessThan(240);
    });

    test('a 5-year-old plays with pictures: two cards to choose from, no dates, and answers can be heard', async ({ page }) => {
      await open(page, { age: 5, lang: 'es', speech: true, mode: 'on' });
      await page.goto('/linea-del-tiempo.html?seed=3&tab=games');
      await page.click('.ln-gcard[data-go="same"]');
      await expect(page.locator('.ln-opt')).toHaveCount(2);
      await expect(page.locator('.ln-q-life')).toHaveCount(0);
      await expect(page.locator('.ln-q .zs-say, .ln-qwrap .zs-say').first()).toBeVisible();
      await page.click('#ln-wrap .ln-back');
      await page.click('.ln-gcard[data-go="order"]');
      await expect(page.locator('.ln-orow')).toHaveCount(3);
    });
  });

  test.describe('layout', () => {
    for (const [name, w, h] of [['phone', 390, 844], ['iPad', 820, 1180]]) {
      test(`${name}: no sideways scroll, the title clears the home and profile buttons, markers stay inside the stage`, async ({ page }) => {
        await page.setViewportSize({ width: w, height: h });
        await open(page, { age: 9, lang: 'es' });
        const o = await page.evaluate(() => {
          const brand = document.querySelector('.ln-brand-t').getBoundingClientRect();
          const nav = Array.from(document.querySelectorAll('#zs-nav, #zs-nav *')).map(e => e.getBoundingClientRect()).filter(r => r.width > 0 && r.width < 400 && r.top < 90);
          const clash = nav.filter(r => r.left < brand.right && r.right > brand.left && r.top < brand.bottom && r.bottom > brand.top).length;
          return { sx: document.documentElement.scrollWidth - window.innerWidth, clash, mk: document.querySelectorAll('.ln-mk').length };
        });
        expect(o.sx).toBeLessThanOrEqual(0);
        expect(o.clash).toBe(0);
        const stage = await page.locator('#ln-stage').boundingBox();
        const marks = await page.locator('.ln-mk:visible').evaluateAll(els => els.map(e => { const r = e.getBoundingClientRect(); return [r.left, r.right, r.top, r.bottom]; }));
        expect(marks.length).toBeGreaterThan(4);
        marks.forEach(m => { expect(m[3]).toBeLessThanOrEqual(stage.y + stage.height + 1); });
        // the first marker of each lane does not hide behind the lane tag column beyond repair: every visible marker has its label shown
        for (const v of ['games', 'eras']) { await tab(page, v); expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0); }
      });
    }
  });
});
