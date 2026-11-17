// @ts-check
// Sibling challenges on the hub: two profiles on one device, one sets a
// challenge and the other solves it, and both see the star. Invented kids only.
const { test, expect } = require('@playwright/test');

const ANA = { name: 'Ana', color: '#7C3AED', age: 11, avatar: '🦊' };
const BEN = { name: 'Ben', color: '#10B981', age: 7, avatar: '🐱' };
const CARLA = { name: 'Carla', color: '#EF4444', age: 4, avatar: '🐶' };
const NOON = new Date(2026, 10, 11, 12, 0, 0);

async function openHub(page, active = ANA, extra = {}) {
  await page.route(/tail57521e\.ts\.net/, r => r.abort());
  await page.clock.setFixedTime(NOON);
  await page.addInitScript(([profiles, active, extra]) => {
    // The device "says" words by writing them down.
    Object.defineProperty(window, 'speechSynthesis', { value: { getVoices: () => [], speak(u) { // @ts-ignore
      (window.__said = window.__said || []).push(u.text); }, cancel() {}, addEventListener() {} }, configurable: true });
    // @ts-ignore
    window.SpeechSynthesisUtterance = function (t) { this.text = t; };
    if (localStorage.getItem('zs_profiles')) return;
    localStorage.setItem('zs_profiles', JSON.stringify(profiles));
    localStorage.setItem('zs_active_user', JSON.stringify(active));
    Object.keys(extra).forEach(k => localStorage.setItem(k, JSON.stringify(extra[k])));
  }, [[ANA, BEN, CARLA], active, extra]);
  await page.goto('/');
  await page.waitForFunction(() => document.getElementById('hub-screen').classList.contains('active') && !!document.getElementById('hub-today'));
}

// Another kid picks up the same device.
async function switchTo(page, kid) {
  await page.evaluate((k) => { localStorage.setItem('zs_active_user', JSON.stringify(k)); }, kid);
  await page.reload();
  await page.waitForFunction(() => document.getElementById('hub-screen').classList.contains('active') && !!document.getElementById('hub-today'));
}

const stars = (page, name) => page.evaluate((n) => /** @type {any} */ (window).getPlayerStats(n).totalStars, name);
const log = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('zs_challenges') || '{"events":[]}').events);

async function sendQuestion(page, { to = 'Ben', text = 'What is 6 x 7?', answers = ['41', '42', '43'], right = 1, hint = '' } = {}) {
  await page.locator('#chl-open').click();
  await page.locator('.chl-modal .chl-pick', { hasText: to }).click();
  await page.locator('.chl-modal .chl-pick', { hasText: 'Question' }).click();
  await page.fill('#chl-text', text);
  for (let i = 2; i < answers.length; i++) await page.locator('#chl-add').click();
  for (let i = 0; i < answers.length; i++) await page.fill('#chl-ans-' + i, answers[i]);
  await page.locator('input[name="chl-right"][value="' + right + '"]').check();
  if (hint) await page.fill('#chl-hint', hint);
  await page.locator('#chl-send').click();
  await expect(page.locator('.chl-modal')).toHaveCount(0);
}

test.describe('Sibling challenges', () => {

  test('Ana challenges Ben, Ben solves it after the hint, and both see the star', async ({ page }) => {
    await openHub(page, ANA);
    await expect(page.locator('#hub-challenges')).toBeVisible();
    await sendQuestion(page, { hint: 'Think of 6 x 6, plus 6.' });
    expect(await stars(page, 'Ana')).toBe(0);

    // Ben's hub shows it; Ana's does not (it is not hers to solve).
    await expect(page.locator('#hub-challenges .chl-card')).toHaveCount(0);
    await switchTo(page, BEN);
    const card = page.locator('#hub-challenges .chl-card[data-ch]');
    await expect(card).toHaveCount(1);
    await expect(card).toContainText('Ana sent you a challenge');
    await card.click();

    const modal = page.locator('.chl-modal');
    await expect(modal.locator('.chl-q')).toContainText('What is 6 x 7?');
    await expect(modal.locator('.chl-opt')).toHaveCount(3);
    await expect(modal.locator('.chl-hint'), 'no hint yet').toHaveCount(0);

    // Two wrong tries open the hint.
    await modal.locator('.chl-opt', { hasText: '41' }).click();
    await expect(modal.locator('.chl-nudge')).toContainText('Not quite');
    await expect(modal.locator('.chl-hint')).toHaveCount(0);
    await modal.locator('.chl-opt', { hasText: '43' }).click();
    await expect(modal.locator('.chl-hint')).toContainText('Think of 6 x 6, plus 6.');
    await expect(modal.locator('.chl-opt:disabled')).toHaveCount(2);

    await modal.locator('.chl-opt', { hasText: '42' }).click();
    await expect(modal.locator('.chl-win')).toContainText('You solved it!');
    await expect(modal.locator('.chl-win')).toContainText('Ana did too');
    await modal.locator('#chl-done').click();

    await expect(page.locator('#hub-challenges .chl-card[data-ch]')).toHaveCount(0);
    expect(await stars(page, 'Ben')).toBe(1);
    await expect(page.locator('#ub-greeting')).toContainText('⭐ 1');

    // Ana sees the star, and that Ben solved it.
    await switchTo(page, ANA);
    expect(await stars(page, 'Ana')).toBe(1);
    await expect(page.locator('#ub-greeting')).toContainText('⭐ 1');
    const done = page.locator('#hub-challenges .chl-card.is-solved');
    await expect(done).toContainText('Ben solved your challenge');
    await done.click();
    await expect(page.locator('#hub-challenges .chl-card.is-solved')).toHaveCount(0);

    // The log holds create, two misses and one solve, and nothing else.
    expect((await log(page)).map(e => e.type).sort()).toEqual(['create', 'miss', 'miss', 'solve']);
  });

  test('a spelling challenge is read aloud and the word is never shown to the receiver', async ({ page }) => {
    await openHub(page, ANA);
    await page.locator('#chl-open').click();
    await page.locator('.chl-modal .chl-pick', { hasText: 'Ben' }).click();
    await page.locator('.chl-modal .chl-pick', { hasText: 'Spelling' }).click();
    await page.fill('#chl-word', 'ballena');
    await page.locator('.chl-modal .chl-pick', { hasText: 'Español' }).click();
    await page.locator('#chl-send').click();
    await expect(page.locator('.chl-modal')).toHaveCount(0);

    await switchTo(page, BEN);
    await page.locator('#hub-challenges .chl-card[data-ch]').click();
    const modal = page.locator('.chl-modal');
    await modal.locator('#chl-hear').click();
    expect(await page.evaluate(() => /** @type {any} */ (window).__said)).toContain('ballena');
    expect(await modal.innerText(), 'the word is not on the page').not.toContain('ballena');
    await expect(modal.locator('#chl-spell')).toHaveAttribute('spellcheck', 'false');

    await modal.locator('#chl-spell').fill('vallena');
    await modal.locator('#chl-check').click();
    await expect(modal.locator('.chl-nudge')).toContainText('Not quite');
    await modal.locator('#chl-spell').fill('Ballena');
    await modal.locator('#chl-check').click();
    await expect(modal.locator('.chl-win')).toBeVisible();
    await modal.locator('#chl-done').click();
    expect(await stars(page, 'Ben')).toBe(1);
  });

  test('a find-on-the-map challenge: a wrong country is a try, the right one wins', async ({ page }) => {
    await openHub(page, ANA);
    await page.locator('#chl-open').click();
    await page.locator('.chl-modal .chl-pick', { hasText: 'Ben' }).click();
    await page.locator('.chl-modal .chl-pick', { hasText: 'Find on the map' }).click();
    await expect(page.locator('#chl-country option').nth(1)).toBeAttached();
    expect(await page.locator('#chl-country option[value="vat"]').count(), 'a country too small to tap is not offered').toBe(0);
    await page.selectOption('#chl-country', 'chl');
    await page.locator('#chl-send').click();
    await expect(page.locator('.chl-modal')).toHaveCount(0);

    await switchTo(page, BEN);
    await page.locator('#hub-challenges .chl-card[data-ch]').click();
    const modal = page.locator('.chl-modal');
    await expect(modal.locator('#chl-map-q')).toContainText('Find Chile on the map');
    await expect(modal.locator('.chl-land').first()).toBeAttached();
    const tap = (code) => page.evaluate((code) => {
      const el = document.querySelector('#chl-map [data-code="' + code + '"]');
      const r = el.getBoundingClientRect();
      const opts = { bubbles: true, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2 };
      el.dispatchEvent(new PointerEvent('pointerdown', opts));
      el.dispatchEvent(new PointerEvent('pointerup', opts));
    }, code);

    await tap('arg');
    await expect(modal.locator('.chl-nudge')).toContainText('Not quite');
    await expect(modal.locator('.chl-land.miss')).toHaveCount(1);
    await tap('chl');
    await expect(modal.locator('.chl-win')).toBeVisible();
    await modal.locator('#chl-done').click();
    expect(await stars(page, 'Ben')).toBe(1);
  });

  test('younger siblings only, until a parent allows any sibling', async ({ page }) => {
    await openHub(page, CARLA);
    await expect(page.locator('#chl-open'), 'the youngest has nobody younger').toHaveCount(0);

    // Parents Corner: the toggle.
    await page.evaluate(() => { /** @type {any} */ (window).openParentsCorner(); });
    await page.locator('#chl-parents summary').click();
    await page.locator('#chl-anyone').check();
    await page.evaluate(() => document.getElementById('parents-overlay').classList.remove('active'));
    await expect(page.locator('#chl-open')).toBeVisible();
    await page.locator('#chl-open').click();
    await expect(page.locator('.chl-modal .chl-pick', { hasText: 'Ana' })).toBeVisible();
    await expect(page.locator('.chl-modal .chl-pick', { hasText: 'Ben' })).toBeVisible();
    await page.locator('#chl-cancel').click();

    await switchTo(page, ANA);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('zs_challenges')).events.filter(e => e.type === 'config'))).toHaveLength(1);
  });

  test('a parent sees every challenge in Parents Corner and can delete one', async ({ page }) => {
    await openHub(page, ANA);
    await sendQuestion(page, { text: 'Secret question words?', answers: ['yes', 'no'], right: 0 });
    await page.evaluate(() => { /** @type {any} */ (window).openParentsCorner(); });
    await page.locator('#chl-parents summary').click();
    const row = page.locator('#chl-parents .chl-prow');
    await expect(row).toHaveCount(1);
    await expect(row).toContainText('Ana → Ben');
    await expect(row).toContainText('Secret question words?');
    await expect(row).toContainText('waiting');

    await row.locator('.chl-del').click();
    await page.locator('.zsd-overlay').getByRole('button', { name: 'Delete' }).click();
    await expect(page.locator('#chl-parents .chl-prow')).toHaveCount(0);
    expect(JSON.stringify(await log(page)), 'the words are gone from this device').not.toContain('Secret question words');
    expect((await log(page)).map(e => e.type).sort()).toEqual(['create', 'remove']);

    await switchTo(page, BEN);
    await expect(page.locator('#hub-challenges .chl-card[data-ch]')).toHaveCount(0);
  });

  test('what a kid typed is shown as text and cut to 120 characters, even from the log', async ({ page }) => {
    const evil = '<img src=x onerror="window.__pwn=1">' + 'z'.repeat(300);
    const log0 = { v: 1, events: [
      { id: 'c_evil', type: 'create', ts: 1, from: '<i>Eve</i>', to: 'Ben', kind: 'q', text: evil, options: ['<b>a</b>' + 'y'.repeat(200), 'b'], answer: 1, hint: evil }
    ] };
    await openHub(page, BEN, { zs_challenges: log0 });
    const card = page.locator('#hub-challenges .chl-card[data-ch]');
    await expect(card).toContainText('<i>Eve</i> sent you a challenge');
    await expect(page.locator('#hub-challenges i')).toHaveCount(0);
    await card.click();
    const modal = page.locator('.chl-modal');
    const q = (await modal.locator('.chl-q').innerText()).replace('🔊', '').trim();
    expect(q.length).toBeLessThanOrEqual(120);
    expect(q.startsWith('<img src=x')).toBe(true);
    await expect(modal.locator('img')).toHaveCount(0);
    await expect(modal.locator('.chl-opt b')).toHaveCount(0);
    for (const t of await modal.locator('.chl-opt').allInnerTexts()) expect(t.length).toBeLessThanOrEqual(120);
    await modal.locator('.chl-opt').first().click();   // wrong, twice
    await modal.locator('.chl-opt:not(:disabled)').first().click().catch(() => {});
    expect(await page.evaluate(() => /** @type {any} */ (window).__pwn)).toBeUndefined();
    const hint = modal.locator('.chl-hint');
    if (await hint.count()) expect((await hint.innerText()).length).toBeLessThanOrEqual(135);   // "Hint: " + 120
  });

  test('the creator form never sends more than 120 characters', async ({ page }) => {
    await openHub(page, ANA);
    await sendQuestion(page, { text: 'q'.repeat(150), answers: ['a'.repeat(150), 'b'], right: 1, hint: 'h'.repeat(150) });
    const create = (await log(page)).find(e => e.type === 'create');
    expect(Array.from(create.text)).toHaveLength(120);
    expect(Array.from(create.options[0])).toHaveLength(120);
    expect(Array.from(create.hint)).toHaveLength(120);
  });

  test('the form explains a missing field in plain words and sends nothing', async ({ page }) => {
    await openHub(page, ANA);
    await page.locator('#chl-open').click();
    await page.locator('.chl-modal .chl-pick', { hasText: 'Ben' }).click();
    await page.locator('#chl-send').click();
    await expect(page.locator('#chl-err')).toContainText('Pick the kind of challenge');
    await page.locator('.chl-modal .chl-pick', { hasText: 'Question' }).click();
    await page.locator('#chl-send').click();
    await expect(page.locator('#chl-err')).toContainText('Write the question');
    await page.keyboard.press('Escape');
    await expect(page.locator('.chl-modal')).toHaveCount(0);
    expect(await log(page)).toEqual([]);
  });

  test('a guest has no challenges and no button', async ({ page }) => {
    await openHub(page, { name: 'Guest', age: 8, avatar: '🌟', color: '#7C3AED', isGuest: true });
    await expect(page.locator('#hub-challenges')).toHaveCount(0);
  });
});

// A Chess Quest puzzle as the challenge, the "Challenge a sibling" buttons
// inside World Explorer and Chess Quest, Today's 3 and Repaso.
test.describe('Sibling challenges in the apps', () => {
  // Puzzle 1 of the ladder: "Checkmate in 1 #1" (4k3/R7/8/8/8/8/8/4K2Q w), Qh8#.
  // Board rows run from rank 8 (row 0) to rank 1 (row 7).
  const move = (page, fr, fc, tr, tc) => page.evaluate(async ([a, b, c, d]) => {
    // @ts-ignore
    await puzzleClick(a, b); await puzzleClick(c, d);
  }, [fr, fc, tr, tc]);
  // @ts-ignore
  const idle = (page) => page.waitForFunction(() => typeof PZ !== 'undefined' && PZ && !PZ.busy, null, { timeout: 8000 });

  test('Ana sets a chess puzzle; Ben plays it on the Chess Quest board from Today\'s 3, and both get the star', async ({ page }) => {
    await openHub(page, ANA);
    await page.locator('#chl-open').click();
    await page.locator('.chl-modal .chl-pick', { hasText: 'Ben' }).click();
    await page.locator('.chl-modal .chl-pick', { hasText: 'Chess puzzle' }).click();
    await expect(page.locator('#chl-puzzle option[value="0"]')).toHaveText('1. Checkmate in 1 #1');
    await page.selectOption('#chl-puzzle', '0');
    await page.fill('#chl-hint', 'Use the queen in the corner.');
    await page.locator('#chl-send').click();
    await expect(page.locator('.chl-modal')).toHaveCount(0);
    const created = (await log(page)).find(e => e.type === 'create');
    expect(created).toMatchObject({ kind: 'chess', answer: 0, text: 'Checkmate in 1 #1', to: 'Ben' });

    // Ben: the challenge takes a place in Today's 3 (still 3 cards).
    await switchTo(page, BEN);
    const today = page.locator('#hub-today .hub-today-challenge');
    await expect(today).toContainText('Challenge from Ana');
    expect(await page.locator('#hub-today .hub-today-card').count()).toBeLessThanOrEqual(3);
    await today.click();
    const modal = page.locator('.chl-modal');
    await expect(modal.locator('.chl-puzzle')).toContainText('Checkmate in 1 #1');
    await modal.locator('#chl-chess-go').click();

    // The Chess Quest board, on that puzzle, with who sent it.
    await page.waitForURL(/chess-quest\.html/);
    await expect(page.locator('#screen-puzzle')).toHaveClass(/active/);
    await expect(page.locator('#pzChallenge')).toContainText('A challenge from Ana');
    await expect(page.locator('#pzChallengeBtn'), 'no challenging back from inside a challenge').toBeHidden();
    await expect(page.locator('#pzChallenge .chl-banner-hint')).toHaveCount(0);
    expect(page.url(), 'the link is used once').not.toContain('challenge=');
    await idle(page);

    // Two wrong moves are two tries, and open Ana's hint.
    await move(page, 7, 4, 6, 4);   // Ke2
    await idle(page);
    await move(page, 7, 4, 7, 3);   // Kd1 (the board went back to the start)
    await idle(page);
    await expect(page.locator('#pzChallenge .chl-banner-hint')).toContainText('Use the queen in the corner.');
    expect((await log(page)).filter(e => e.type === 'miss')).toHaveLength(2);

    await move(page, 7, 7, 0, 7);   // Qh8#
    await expect(page.locator('#pzChallenge')).toContainText('You both earn a star');
    await expect(page.locator('#nextPuzzleBtn')).toHaveText('Back to the hub');
    expect((await log(page)).filter(e => e.type === 'solve')).toHaveLength(1);
    await page.locator('#nextPuzzleBtn').click();
    await page.waitForURL(/index\.html/);
    await page.waitForFunction(() => !!document.getElementById('hub-screen') && document.getElementById('hub-screen').classList.contains('active') && !!document.getElementById('hub-today'));
    // Ben's challenge star (Chess Quest gives its own puzzle star as well).
    const benRec = await page.evaluate(() => JSON.parse(localStorage.getItem('zs_challenge_ben') || '{}'));
    expect(Object.keys(benRec.stars || {})).toEqual([created.id]);
    await expect(page.locator('#hub-today .hub-today-challenge.is-done')).toContainText('Challenge from Ana');
    await switchTo(page, ANA);
    expect(await stars(page, 'Ana')).toBe(1);
  });

  test('a locked puzzle opens for the challenge, and a stale link says so', async ({ page }) => {
    const log0 = { v: 1, events: [
      { id: 'c_chess', type: 'create', ts: Date.parse('2026-11-10T12:00:00'), from: 'Ana', to: 'Ben', kind: 'chess', answer: 21, text: 'Smothered Mate' }
    ] };
    await openHub(page, BEN, { zs_challenges: log0 });
    await page.goto('/chess-quest.html?challenge=c_chess');
    await expect(page.locator('#screen-puzzle')).toHaveClass(/active/);
    await expect(page.locator('#puzzleLabel')).toContainText('Puzzle 22');
    await expect(page.locator('#pzChallenge')).toContainText('A challenge from Ana');

    await page.goto('/chess-quest.html?challenge=c_nope');
    await expect(page.locator('.zsd-overlay')).toContainText('not waiting for you');
    await expect(page.locator('#screen-puzzle')).not.toHaveClass(/active/);
  });

  test('Chess Quest: "Challenge a sibling" opens the form with this puzzle picked', async ({ page }) => {
    await openHub(page, ANA);
    await page.goto('/chess-quest.html');
    // @ts-ignore
    await page.waitForFunction(() => typeof openPuzzle === 'function' && typeof Challenges !== 'undefined');
    // @ts-ignore
    await page.evaluate(() => openPuzzle(0));
    await expect(page.locator('#pzChallenge'), 'no challenge banner on an ordinary puzzle').toBeHidden();
    await page.locator('#pzChallengeBtn').click();
    const modal = page.locator('.chl-modal');
    await expect(modal.locator('.chl-pick', { hasText: 'Chess puzzle' })).toHaveAttribute('aria-pressed', 'true');
    await expect(modal.locator('#chl-puzzle')).toHaveValue('0');
    await modal.locator('.chl-pick', { hasText: 'Ben' }).click();
    await modal.locator('#chl-send').click();
    await expect(modal).toHaveCount(0);
    expect((await log(page)).find(e => e.type === 'create')).toMatchObject({ kind: 'chess', answer: 0, from: 'Ana', to: 'Ben' });

    // The youngest has nobody to challenge: no button.
    await page.evaluate((k) => localStorage.setItem('zs_active_user', JSON.stringify(k)), CARLA);
    await page.reload();
    // @ts-ignore
    await page.waitForFunction(() => typeof openPuzzle === 'function');
    // @ts-ignore
    await page.evaluate(() => openPuzzle(0));
    await expect(page.locator('#pzChallengeBtn')).toBeHidden();
  });

  test('World Explorer: "Challenge a sibling" on a country sends a find-on-the-map challenge', async ({ page }) => {
    await openHub(page, ANA);
    await page.goto('/world-explorer.html');
    // @ts-ignore
    await page.waitForFunction(() => typeof WorldExplorer !== 'undefined' && typeof Challenges !== 'undefined');
    // @ts-ignore
    await page.evaluate(() => WorldExplorer.openCountry('chile'));
    const btn = page.locator('#we-chl-btn');
    await expect(btn).toBeVisible();
    const box = await btn.boundingBox();
    expect(box && box.height).toBeGreaterThanOrEqual(44);
    await btn.click();
    const modal = page.locator('.chl-modal');
    await expect(modal.locator('.chl-pick', { hasText: 'Find on the map' })).toHaveAttribute('aria-pressed', 'true');
    await expect(modal.locator('#chl-country')).toHaveValue('chl');
    await modal.locator('.chl-pick', { hasText: 'Carla' }).click();
    await modal.locator('#chl-send').click();
    await expect(modal).toHaveCount(0);
    expect((await log(page)).find(e => e.type === 'create')).toMatchObject({ kind: 'map', answer: 'chl', to: 'Carla' });
  });

  test('a question Ben got wrong comes back in Repaso, and leaves it when a parent deletes the challenge', async ({ page }) => {
    await openHub(page, ANA);
    await sendQuestion(page, { text: 'Capital of Peru?', answers: ['Lima', 'Quito'], right: 0 });
    await switchTo(page, BEN);
    await page.locator('#hub-challenges .chl-card[data-ch]').click();
    await page.locator('.chl-modal .chl-opt', { hasText: 'Quito' }).click();
    await page.locator('.chl-modal .chl-opt', { hasText: 'Lima' }).click();
    await page.locator('#chl-done').click();
    const items = () => page.evaluate(() => Object.values(JSON.parse(localStorage.getItem('zs_review_ben') || '{"items":{}}').items));
    const it = (await items())[0];
    expect(it).toMatchObject({ app: 'challenge', prompt: 'Ana: Capital of Peru?', answer: 'Lima' });
    expect(it.choices.slice().sort()).toEqual(['Lima', 'Quito']);

    await page.evaluate(() => { /** @type {any} */ (window).openParentsCorner(); });
    await page.locator('#chl-parents summary').click();
    await page.locator('#chl-parents .chl-del').click();
    await page.locator('.zsd-overlay').getByRole('button', { name: 'Delete' }).click();
    expect(await items()).toEqual([]);
  });

  test('a removal synced from another device also clears Repaso', async ({ page }) => {
    const ts = Date.parse('2026-11-10T12:00:00');
    const log0 = { v: 1, events: [
      { id: 'c_q1', type: 'create', ts, from: 'Ana', to: 'Ben', kind: 'q', text: 'gone', options: ['a', 'b'], answer: 0 },
      { id: 'r_c_q1', type: 'remove', ts: ts + 5, ch: 'c_q1' }
    ] };
    const review = { v: 1, items: { 'challenge:c_q1': { id: 'challenge:c_q1', app: 'challenge', prompt: 'Ana: gone', answer: 'a', box: 1, due: 0, added: 0, misses: 1, hits: 0 } }, done: {}, retired: 0 };
    await openHub(page, BEN, { zs_challenges: log0, zs_review_ben: review });
    expect(await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('zs_review_ben')).items))).toEqual([]);
  });
});
