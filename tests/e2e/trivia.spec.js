// @ts-check
// Trivia Familiar, in the browser: setup, a whole game night (pass the
// iPad, the steal round, the final round, the podium), saved progress
// and stars for every kid who played, the little ones' read-aloud and no
// timer, map and picture questions, and the layout at phone width.
// Service workers are blocked, speech is stubbed and the sync server is
// never reached.
const { test, expect } = require('@playwright/test');

const KIDS = [
  { name: 'Sofía', age: 4, avatar: '🦊', color: 'pink' },
  { name: 'Tomás', age: 7, avatar: '🦁', color: 'blue' },
  { name: 'Clara', age: 10, avatar: '🐼', color: 'green' }
];

async function open(page, o = {}) {
  const { setup = null, speech = false, query = '?seed=11', width } = o;
  if (width) await page.setViewportSize({ width, height: 844 });
  await page.route(/tail57521e\.ts\.net/, r => r.abort());
  await page.addInitScript(([kids, setup, speech]) => {
    if (!localStorage.getItem('zs_profiles')) {
      localStorage.setItem('zs_profiles', JSON.stringify(kids));
      localStorage.setItem('zs_active_user', JSON.stringify(kids[1]));
      if (setup) localStorage.setItem('zs_triviafam', JSON.stringify({ setup }));
    }
    // @ts-ignore
    window.__said = [];
    if (speech) {
      const synth = { speaking: false, getVoices: () => [], speak(u) { // @ts-ignore
        window.__said.push(u.text); if (u.onend) setTimeout(() => u.onend({}), 0); }, cancel() {}, addEventListener() {} };
      Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
      // @ts-ignore
      window.SpeechSynthesisUtterance = function (t) { this.text = t; };
    }
  }, [KIDS, setup, speech]);
  await page.goto('/trivia-familiar.html' + query);
  await page.waitForSelector('#tv-main');
}
const state = (page) => page.evaluate(() => /** @type {any} */ (window).Trivia.state());
const saved = (page, name) => page.evaluate(n => JSON.parse(localStorage.getItem('zs_trivia_' + n) || 'null'), name);

// Answer whatever is on screen, right (or wrong when asked).
async function answer(page, right = true) {
  const st = await state(page);
  const c = st.current;
  if (c.type === 'ord') {
    const vals = await page.$$eval('.tv-ord-b', bs => bs.map(b => +(/** @type {HTMLElement} */ (b).dataset.v || 0)));
    const order = vals.slice().sort((a, b) => a - b);
    if (!right) order.reverse();
    for (const v of order) await page.click(`.tv-ord-b[data-v="${v}"]`);
    await page.click('#tv-ord-ok');
  } else {
    const i = right ? c.rightIndex : (c.rightIndex === 0 ? 1 : 0);
    await page.click(`.tv-opt[data-i="${i}"]`);
  }
}

// Play from wherever the game is to the podium. Everyone right, except the
// first steal-round question, which is missed and stolen.
async function playToEnd(page) {
  let stole = false;
  for (let guard = 0; guard < 80; guard++) {
    const st = await state(page);
    if (st.screen === 'end') return { stole };
    if (st.screen === 'pass') { await page.click('#tv-ready'); continue; }
    if (st.screen === 'final-intro') { await page.click('#tv-final-go'); continue; }
    if (st.screen === 'final') {
      if (await page.$('#tv-reveal')) await page.click('#tv-reveal');
      await page.click('.tv-win >> nth=0');
      await page.click('#tv-fin-next');
      continue;
    }
    if (st.screen === 'question') {
      const miss = st.kind === 'steal' && !stole && st.current.type !== 'tf' && st.current.type !== 'ord';
      await answer(page, !miss);
      if (miss) {
        await expect(page.locator('[data-steal]').first()).toBeVisible();
        await page.click('[data-steal]:not([data-steal="none"])');
        const s2 = await state(page);
        expect(s2.screen).toBe('steal');
        const left = await page.$$eval('.tv-opt', bs => bs.length);
        expect(left).toBe(st.current.choices - 1);
        // The right answer is still there; pick it.
        await page.click(`.tv-opt[data-i="${s2.current.rightIndex}"]`);
        await expect(page.locator('.tv-verdict.ok').last()).toBeVisible();
        stole = true;
      }
      await page.click('#tv-next');
      continue;
    }
    throw new Error('stuck on ' + st.screen);
  }
  throw new Error('game did not end');
}

test.describe('Trivia Familiar', () => {

  test('setup lists the kids youngest first plus Mamá and Papá, and remembers choices', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await open(page);
    const names = await page.$$eval('.tv-pl-n', els => els.map(e => e.textContent));
    expect(names).toEqual(['Sofía', 'Tomás', 'Clara', 'Mamá', 'Papá']);
    // The signed-in kid starts picked.
    await expect(page.locator('[data-pl="k:Tomás"]')).toHaveAttribute('aria-pressed', 'true');
    await page.click('[data-pl="papa"]');
    await page.click('[data-rounds="3"]');
    await page.click('[data-cat="deportes"]');
    const st = await state(page);
    expect(st.setup.players).toEqual(['k:Tomás', 'papa']);
    expect(st.setup.rounds).toBe(3);
    expect(st.setup.cats).not.toContain('deportes');
    expect(st.bank).toBeGreaterThanOrEqual(600);
    await page.reload();
    await page.waitForSelector('#tv-main');
    expect((await state(page)).setup.players).toEqual(['k:Tomás', 'papa']);
    expect(errors).toEqual([]);
  });

  test('a whole game night: turns, steal, final round, podium, stars for every kid', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await open(page, { setup: { players: ['k:Sofía', 'k:Clara', 'mama'], rounds: 3, lang: 'both' } });
    await page.click('#tv-start');
    let st = await state(page);
    expect(st.screen).toBe('pass');
    expect(st.sides.map(s => [s.id, s.tier, s.score])).toEqual([['p-k:Sofía', 1, 15], ['p-k:Clara', 3, 5], ['p-mama', 4, 0]]);
    await expect(page.locator('.tv-pass-n')).toContainText('Sofía');
    await page.click('#tv-ready');
    st = await state(page);
    // The 4-year-old: a question for her age, three choices, no timer.
    expect(st.current.tier).toBe(1);
    expect(st.current.timer).toBe(0);
    await expect(page.locator('#tv-timer')).toBeHidden();
    if (st.current.type !== 'tf' && st.current.type !== 'ord') expect(st.current.choices).toBe(3);
    await answer(page, true);
    await expect(page.locator('.tv-verdict.ok')).toBeVisible();
    await expect(page.locator('.tv-fact')).toContainText('¿Sabías que');
    await page.click('#tv-next');
    await page.click('#tv-ready');
    st = await state(page);
    // The 10-year-old gets a gentle timer.
    expect(st.current.tier).toBe(3);
    expect(st.current.timer).toBe(45);
    await expect(page.locator('#tv-timer')).toBeVisible();
    await answer(page, true);
    await page.click('#tv-next');
    const res = await playToEnd(page);
    expect(res.stole).toBe(true);
    st = await state(page);
    expect(st.screen).toBe('end');
    await expect(page.locator('.tv-podium')).toBeVisible();
    await expect(page.locator('.tv-table tbody tr')).toHaveCount(3);
    await expect(page.locator('.tv-stars')).toContainText('Sofía');
    // Saved for both kids (not only the one signed in), with what they saw.
    for (const n of ['sofía', 'clara']) {
      const d = await saved(page, n);
      expect(d.games, n).toBe(1);
      expect(d.asked, n).toBeGreaterThanOrEqual(2);
      expect(Object.keys(d.hist).length, n).toBeGreaterThanOrEqual(5);
    }
    expect(await saved(page, 'tomás')).toBeNull();
    // Mamá's history stays on the device, outside the kids' synced keys.
    const fam = await page.evaluate(() => JSON.parse(localStorage.getItem('zs_triviafam') || '{}'));
    expect(Object.keys(fam.hist.mama).length).toBeGreaterThanOrEqual(5);
    // The shared star rule counts the game.
    const stars = await page.evaluate(() => /** @type {any} */ (window).getAppStars('trivia', JSON.parse(localStorage.getItem('zs_trivia_clara') || '{}')));
    expect(stars).toBe(1);
    // Play again: a fresh game with the same players, and no repeats of tonight’s questions.
    await page.click('#tv-again');
    await page.click('#tv-ready');
    st = await state(page);
    expect(st.current.side).toBe('p-k:Sofía');
    expect(Object.keys((await saved(page, 'sofía')).hist)).not.toContain(st.current.id);
    expect(errors).toEqual([]);
  });

  test('teams answer at the youngest member’s level', async ({ page }) => {
    await open(page, { setup: { players: ['k:Sofía', 'k:Clara', 'papa', 'k:Tomás'], rounds: 3, teams: true, team: { 'k:Sofía': 'A', papa: 'A', 'k:Clara': 'B', 'k:Tomás': 'B' } } });
    await expect(page.locator('.tv-team')).toHaveCount(4);
    await page.click('#tv-start');
    const st = await state(page);
    expect(st.sides.map(s => [s.id, s.tier, s.members.length])).toEqual([['teamA', 1, 2], ['teamB', 2, 2]]);
    await expect(page.locator('.tv-pass-n')).toContainText('Equipo A');
  });

  test('the little ones hear the question read aloud', async ({ page }) => {
    await open(page, { speech: true, setup: { players: ['k:Sofía'], rounds: 3, lang: 'es' } });
    await page.click('#tv-start');
    await page.click('#tv-ready');
    const said = await page.evaluate(() => /** @type {any} */ (window).__said);
    const st = await state(page);
    expect(said.length).toBeGreaterThan(0);
    const q = await page.locator('#tv-qtext').textContent();
    expect(said[0]).toContain(String(q).trim().slice(0, 12));
    expect(st.current.tier).toBe(1);
    // A grown-up's turn is not read out on its own, but the 🔊 button works.
    await page.evaluate(() => { /** @type {any} */ (window).__said = []; });
    await answer(page, true);
    await page.click('#tv-next');
  });

  test('map, picture, order and tune questions render and can be answered', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await open(page, { setup: { players: ['k:Clara', 'papa'], rounds: 5 } });
    // Pick on the world map: tapping a highlighted country answers.
    expect(await page.evaluate(() => /** @type {any} */ (window).Trivia.show('ge-map-bra'))).toBe(true);
    await expect(page.locator('.tv-map path[data-pick]')).toHaveCount(4);
    let st = await state(page);
    await page.locator(`.tv-map path[data-pick="${st.current.rightIndex}"]`).dispatchEvent('click');
    await expect(page.locator('.tv-verdict.ok')).toBeVisible();
    await page.click('#tv-next');
    await page.click('#tv-ready');
    // Chile's regions.
    await page.evaluate(() => /** @type {any} */ (window).Trivia.show('cl-reg-ma'));
    await expect(page.locator('.tv-map-chile')).toBeVisible();
    await expect(page.locator('.tv-opt .tv-letter')).toHaveCount(4);
    await answer(page, false);
    await expect(page.locator('.tv-answer')).toContainText('Magallanes');
    await page.click('#tv-next');
    await page.click('#tv-ready');
    // A flag drawn by World Atlas's flag code.
    await page.evaluate(() => /** @type {any} */ (window).Trivia.show('ge-flag-jpn'));
    await expect(page.locator('.tv-pic > svg')).toBeVisible();
    await answer(page, true);
    await page.click('#tv-next');
    await page.click('#tv-ready');
    // Put in order.
    await page.evaluate(() => /** @type {any} */ (window).Trivia.show('hi-11'));
    await expect(page.locator('#tv-ord-ok')).toBeDisabled();
    await answer(page, true);
    await expect(page.locator('.tv-verdict.ok')).toBeVisible();
    await page.click('#tv-next');
    await page.click('#tv-ready');
    // Name that tune: a play button and four titles.
    await page.evaluate(() => /** @type {any} */ (window).Trivia.show('nv-tune-silentnightnoc'));
    await expect(page.locator('#tv-play')).toBeVisible();
    await page.click('#tv-play');
    await expect(page.locator('.tv-opt')).toHaveCount(4);
    await answer(page, true);
    await page.click('#tv-next');
    await page.click('#tv-ready');
    await page.evaluate(() => /** @type {any} */ (window).Trivia.show('nv-03'));
    const labels = await page.$$eval('.tv-opt', bs => bs.map(b => b.getAttribute('aria-label')));
    expect(labels.every(l => l && l.length > 2)).toBe(true);
    expect(errors).toEqual([]);
  });

  test('the melody parser reads Little Maestro’s notation', async ({ page }) => {
    await open(page);
    const notes = await page.evaluate(() => {
      const T = /** @type {any} */ (window).Trivia, S = /** @type {any} */ (window).LM_SONGS;
      return T.melody(S.find(s => s.title === 'Silent Night (Noche de Paz)'), 12);
    });
    // "Silent Night" starts G4 dotted quarter, A4 eighth, G4 quarter, E4 dotted half.
    expect(notes.slice(0, 4)).toEqual([{ midi: 67, beats: 1.5, tie: false }, { midi: 69, beats: 0.5, tie: false }, { midi: 67, beats: 1, tie: false }, { midi: 64, beats: 3, tie: false }]);
  });

  test('the Christmas special shows from mid-November to Epiphany', async ({ page }) => {
    await page.clock.setFixedTime(new Date(2026, 11, 10, 18, 0, 0));
    await open(page);
    await expect(page.locator('.tv-xmas')).toBeVisible();
    await page.click('.tv-xmas');
    expect((await state(page)).setup.cats).toEqual(['navidad', 'fe', 'biblia', 'musica']);
    const inMarch = await page.evaluate(() => /** @type {any} */ (window).Trivia.christmasSeason(new Date(2027, 2, 3)));
    const onEpiphany = await page.evaluate(() => /** @type {any} */ (window).Trivia.christmasSeason(new Date(2027, 0, 6)));
    expect([inMarch, onEpiphany]).toEqual([false, true]);
  });

  test('phone width: no sideways scroll, big touch targets, title clear of the profile pill', async ({ page }) => {
    await open(page, { width: 390, setup: { players: ['k:Sofía', 'k:Tomás', 'k:Clara', 'mama', 'papa'], rounds: 3 } });
    const check = async () => page.evaluate(() => {
      const small = [...document.querySelectorAll('#tv-wrap button')].filter(b => {
        const r = b.getBoundingClientRect();
        return r.width > 0 && (r.height < 44 || r.width < 44);
      }).map(b => b.className + ':' + (b.textContent || '').trim().slice(0, 20));
      return { scroll: document.documentElement.scrollWidth - innerWidth, small };
    });
    let r = await check();
    expect(r.scroll).toBeLessThanOrEqual(0);
    expect(r.small).toEqual([]);
    const overlap = await page.evaluate(() => {
      // The profile pill slides in; measure where it ends up.
      document.getAnimations().forEach(an => { try { an.finish(); } catch (e) {} });
      const t = document.querySelector('.tv-title')?.getBoundingClientRect();
      const b = document.querySelector('.user-badge, #zs-nav .user-badge, .zs-user')?.getBoundingClientRect();
      return t && b ? t.right > b.left && t.top < b.bottom && t.bottom > b.top : false;
    });
    expect(overlap).toBe(false);
    await page.click('#tv-start');
    await page.click('#tv-ready');
    r = await check();
    expect(r.scroll).toBeLessThanOrEqual(0);
    expect(r.small).toEqual([]);
    await playToEnd(page);
    r = await check();
    expect(r.scroll).toBeLessThanOrEqual(0);
  });

  test('a kid’s saved data from before keeps its fields and gains the new game', async ({ page }) => {
    await page.route(/tail57521e\.ts\.net/, r => r.abort());
    await page.addInitScript(() => {
      if (localStorage.getItem('zs_profiles')) return;
      const k = [{ name: 'Clara', age: 10, avatar: '🐼' }];
      localStorage.setItem('zs_profiles', JSON.stringify(k));
      localStorage.setItem('zs_active_user', JSON.stringify(k[0]));
      localStorage.setItem('zs_trivia_clara', JSON.stringify({ games: 4, wins: 1, hist: { 'ci-12': 3 }, extra: 'keep me' }));
      localStorage.setItem('zs_triviafam', JSON.stringify({ setup: { players: ['k:Clara'], rounds: 3 } }));
    });
    await page.goto('/trivia-familiar.html?seed=5');
    await page.waitForSelector('#tv-main');
    await page.click('#tv-start');
    await playToEnd(page);
    const d = await saved(page, 'clara');
    expect(d.games).toBe(5);
    expect(d.extra).toBe('keep me');
    expect(d.hist['ci-12']).toBe(3);
    expect(Object.keys(d.hist).length).toBeGreaterThan(1);
  });
});
