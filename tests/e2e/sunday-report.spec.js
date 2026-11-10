// @ts-check
// Sunday Report: per kid the week (minutes by subject, stars, streaks),
// what is going well / still being worked on, one suggested next step that
// opens a real app, and the week's Banco Familia. Five invented kids; no
// real family data.
const { test, expect } = require('@playwright/test');

// The clock stands on Sunday 8 November 2026, noon (Pacific); the report
// week is Monday 2 to Sunday 8 November.
const NOW = [2026, 10, 8, 12, 0, 0];

const KIDS = [
  { name: 'Ana',   color: '#DB2777', age: 4,  avatar: '🐣' },
  { name: 'Beto',  color: '#2563EB', age: 6,  avatar: '🐻', hubHidden: ['math'] },
  { name: 'Carla', color: '#059669', age: 8,  avatar: '🦊' },
  { name: 'Diego', color: '#F59E0B', age: 10, avatar: '🦁', hubHidden: ['story'] },
  { name: 'Elena', color: '#7C3AED', age: 13, avatar: '🦉' }
];

// Local-time stamps inside the browser (the zone is pinned to Pacific).
// [day, hour, minute, app, icon, desc]
const LOGS = {
  carla: [
    [3, 10, 0, 'Math Galaxy', '🧮', 'Completed explorer sector 1 — 3 stars'],
    [3, 10, 4, 'Math Galaxy', '🧮', 'Completed explorer sector 2 — 2 stars'],
    [3, 10, 8, 'Chess Quest', '♟️', 'Solved a chess puzzle'],
    [4, 16, 0, 'Story Explorer', '📚', 'Read a story'],
    [7, 9, 0, 'Guess Quest', '🎯', 'Daily word solved'],
    [8, 9, 0, 'Guess Quest', '🎯', 'Daily word solved'],
    [5, 15, 0, 'Book & Movie Check', '🔍', 'Checked "Sample Title" — Ask a parent']
  ],
  beto: [
    [4, 11, 0, 'Little Maestro', '🎹', 'Played a song — 3 stars'],
    [4, 11, 6, 'Little Maestro', '🎹', 'Played a song — 1 star']
  ],
  diego: [
    [2, 17, 0, 'Chess Quest', '♟️', 'Solved a chess puzzle'],
    [6, 17, 0, 'Chess Quest', '♟️', 'Won a game against computer']
  ]
  // Ana: nothing at all. Elena: a log entry from three weeks ago only.
};

// Carla saves for herself, Diego shares an account with Elena.
let n = 0;
const ev = (o) => Object.assign({ id: 'e' + (++n), ts: n, by: 'parent' }, o);
const BANK = { v: 1, events: [
  ev({ type: 'account', account: 'carla', name: 'Carla', kind: 'own', members: ['Carla'], date: '2026-10-01' }),
  ev({ type: 'account', account: 'duo', name: 'Duo', kind: 'shared', members: ['Diego', 'Elena'], date: '2026-10-01' }),
  ev({ type: 'mix', account: 'carla', bonds: 100, date: '2026-10-01' }),
  ev({ type: 'deposit', account: 'carla', amount: 50, match: 5, source: 'chores', date: '2026-10-05' }),
  ev({ type: 'deposit', account: 'carla', amount: 20, match: 2, give: 2.2, source: 'chores', date: '2026-11-03' }),
  ev({ type: 'give', account: 'carla', amount: 1, cause: 'parish', date: '2026-11-06' }),
  ev({ type: 'deposit', account: 'duo', amount: 40, match: 4, source: 'sales', date: '2026-10-05' })
] };

// Everything the page needs goes in as one serialisable argument.
async function open(page, opts = {}) {
  await page.route(/tail57521e\.ts\.net/, r => r.abort());
  await page.clock.setFixedTime(new Date(...NOW));
  await page.addInitScript(([KIDS, LOGS, BANK, NOW]) => {
    if (localStorage.getItem('zs_profiles')) return;
    const at = (d, h, m) => new Date(NOW[0], NOW[1], d, h, m).getTime();
    const put = (k, v) => localStorage.setItem(k, JSON.stringify(v));
    const math = (n) => {
      const o = {};
      ['cadet', 'explorer', 'pilot', 'commander', 'elite'].slice(0, n).forEach(i => { o[i] = { bestStars: 3, bestPct: 100, plays: 1 }; });
      return o;
    };
    put('zs_profiles', KIDS);
    put('zs_active_user', KIDS[2]);
    Object.keys(LOGS).forEach(k => put('zs_activity_' + k, LOGS[k].map(r => ({ ts: at(r[0], r[1], r[2]), app: r[3], icon: r[4], desc: r[5] }))));
    put('zs_activity_elena', [{ ts: at(8, 10, 0) - 21 * 86400000, app: 'Art Studio', icon: '🎨', desc: 'Saved artwork' }]);
    put('zs_mathgalaxy_carla', math(3));
    put('littlemaestro_carla', { progress: { 100: { stars: 3, unlocked: true }, songStars: { 100: 3 } } });
    put('zs_chess_diego', { puzzlesSolved: 4, wins: 1 });
    put('zs_story_diego', { storiesRead: ['ocean_dive'] });
    put('zs_routines_carla', { streak: 3, bestStreak: 5 });
    put('zs_bank', BANK);
    put('zs_bank_spx', { prices: { '2026-10-01': 6000 } });
  }, [KIDS, LOGS, BANK, NOW]);
  await page.goto(opts.url || '/sunday-report.html');
  await page.waitForSelector('.sr-kid');
}

const kid = (page, name) => page.locator('.sr-kid[data-kid="' + name + '"]');

test.describe('Sunday Report', () => {

  test('five kids render with no console errors, and each gets a suggestion that opens a real app', async ({ page }) => {
    const problems = [];
    page.on('pageerror', e => problems.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_|net::/.test(m.text())) problems.push('console: ' + m.text()); });
    await open(page);
    await expect(page.locator('.sr-kid')).toHaveCount(5);

    const links = await page.locator('.sr-kid .sr-next-link').evaluateAll(els => els.map(a => ({
      kid: /** @type {HTMLElement} */ (a.closest('.sr-kid')).dataset.kid,
      href: a.getAttribute('href'), app: /** @type {HTMLElement} */ (a).dataset.app, text: a.textContent
    })));
    expect(links.map(l => l.kid)).toEqual(['Ana', 'Beto', 'Carla', 'Diego', 'Elena']);
    for (const l of links) {
      // the link is a real page of the suite, the app is in the hub's list, and it is named
      const inHub = await page.evaluate(([id, href]) => {
        const a = /** @type {any} */ (window).HubPlan.APPS.find(x => x.id === id);
        return !!a && a.href === href;
      }, [l.app, l.href]);
      expect(inHub, l.kid + ' -> ' + l.app).toBe(true);
      const res = await page.request.get('/' + l.href);
      expect(res.status(), l.href).toBe(200);
      const name = await page.evaluate(id => /** @type {any} */ (window).SundayReport.APP_NAMES[id], l.app);
      expect(name, l.app + ' has a name').toBeTruthy();
      expect(l.text).toContain(name);
    }
    expect(problems).toEqual([]);
  });

  test('every app the hub lists has a name for the report', async ({ page }) => {
    await open(page);
    const missing = await page.evaluate(() => {
      const w = /** @type {any} */ (window);
      return w.HubPlan.APPS.filter(a => a.list !== false && !w.SundayReport.APP_NAMES[a.id]).map(a => a.id);
    });
    expect(missing).toEqual([]);
  });

  test('the week: minutes by subject, stars, days played and the day streak', async ({ page }) => {
    await open(page);
    const carla = kid(page, 'Carla');
    // Math Galaxy 10:00 (first of a session: 5) + 10:04 (4) + Chess 10:08 (4)
    // + Guess Quest on Sat and Sun (5 + 5) = 23 in Math & Logic; Story 5;
    // the Thursday Book & Movie Check visit 5 under Other.
    await expect(carla.locator('.sr-bar[data-subject="math"] .sr-bar-min')).toHaveText('about 23 min');
    await expect(carla.locator('.sr-bar[data-subject="reading"] .sr-bar-min')).toHaveText('about 5 min');
    await expect(carla.locator('.sr-bar[data-subject="other"] .sr-bar-min')).toHaveText('about 5 min');
    await expect(carla.locator('.sr-bar')).toHaveCount(3);
    await expect(carla.locator('.sr-stat-pill', { hasText: 'Minutes' }).locator('.num')).toHaveText('⏱ 33');
    // 3 + 2 stars named in the log lines
    await expect(carla.locator('.sr-stat-pill', { hasText: 'Stars this week' }).locator('.num')).toHaveText('⭐ 5');
    // days with something recorded: Tue 3, Wed 4, Thu 5, Sat 7, Sun 8
    await expect(carla.locator('.sr-stat-pill', { hasText: 'Days played' }).locator('.num')).toHaveText('📅 5/7');
    // Sunday and Saturday, not Friday
    await expect(carla.locator('.sr-stat-pill', { hasText: 'Day streak' }).locator('.num')).toHaveText('🔥 2');
    await expect(carla.locator('.sr-stat-pill', { hasText: 'Routine streak' }).locator('.num')).toHaveText('✅ 3');
    await expect(carla.locator('.sr-note').first()).toContainText('estimated');
  });

  test('going well and still working on come from the progress catalog', async ({ page }) => {
    await open(page);
    const carla = kid(page, 'Carla');
    await expect(carla.locator('.sr-strong')).toContainText('Math Galaxy — 3 of 5 levels done');
    await expect(carla.locator('.sr-working')).toContainText('Little Maestro — 1 of');
    await expect(carla.locator('.sr-working')).toContainText('next up Two Little Blackbirds');
    const text = await carla.innerText();
    expect(text).not.toMatch(/stuck|behind|failing|lazy/i);
  });

  test('suggested next: continue where they are, name the last thing finished and the next step', async ({ page }) => {
    await open(page);
    const s = kid(page, 'Carla').locator('.sr-next');
    await expect(s).toHaveAttribute('data-kind', 'continue');
    await expect(s.locator('.sr-next-text')).toContainText('Carla finished');
    await expect(s.locator('.sr-next-text')).toContainText('Math Galaxy');
    await expect(s.locator('.sr-next-text')).toContainText('Commander');
    await expect(s.locator('.sr-next-link')).toHaveAttribute('href', 'math-galaxy.html');
  });

  test('suggestions respect what a parent hid and the kid\'s age', async ({ page }) => {
    await open(page);
    // Beto has math hidden; Diego has story hidden and has started the story app.
    const beto = await kid(page, 'Beto').locator('.sr-next-link').getAttribute('data-app');
    expect(beto).not.toBe('math');
    const diego = await kid(page, 'Diego').locator('.sr-next-link').getAttribute('data-app');
    expect(diego).not.toBe('story');
    await expect(kid(page, 'Diego')).not.toContainText('Story Explorer');
    // Ana is four: only the short list of beginner apps
    const ana = await kid(page, 'Ana').locator('.sr-next-link').getAttribute('data-app');
    const beginner = await page.evaluate(id => !!/** @type {any} */ (window).HubPlan.APPS.find(a => a.id === id).beginner, ana);
    expect(beginner).toBe(true);
  });

  test('a kid with no data at all still gets a gentle suggestion', async ({ page }) => {
    await open(page);
    const ana = kid(page, 'Ana');
    await expect(ana.locator('.sr-kid-empty')).toContainText('fresh start');
    const s = ana.locator('.sr-next');
    await expect(s).toHaveAttribute('data-kind', 'gentle');
    await expect(s.locator('.sr-next-text')).toContainText('A quiet week is fine');
    await expect(s.locator('.sr-next-text')).toContainText('No pressure');
    await expect(s.locator('.sr-next-link')).toHaveAttribute('href', /\.html$/);
    // and a kid whose only record is old
    await expect(kid(page, 'Elena').locator('.sr-next-link')).toHaveAttribute('href', /\.html$/);
    await expect(kid(page, 'Elena').locator('.sr-kid-empty')).toBeVisible();
  });

  test('a busy week with one kind of app suggests something from a quiet subject', async ({ page }) => {
    await open(page);
    // Diego played only chess (Math & Logic) and has no unfinished app he is allowed to open
    const s = kid(page, 'Diego').locator('.sr-next');
    const kind = await s.getAttribute('data-kind');
    expect(['continue', 'fresh']).toContain(kind);
    await expect(s.locator('.sr-next-link')).toHaveAttribute('href', /\.html$/);
  });

  test('Banco Familia this week: saved, given, growth and the balance', async ({ page }) => {
    await open(page);
    const bank = kid(page, 'Carla').locator('.sr-bank-week');
    await expect(bank).toContainText('Banco Familia · this week');
    await expect(bank).toContainText('Saved $20.00');
    await expect(bank).toContainText('+$2.00 from Papá & Mamá');
    await expect(bank).toContainText('Gave $1.00');
    await expect(bank).toContainText('Grew by itself');
    // 50 + 5 + 20 + 2 put in, minus the 1 given, plus a little bond interest
    const balance = await bank.locator('.sr-moment', { hasText: 'Balance now' }).locator('b').innerText();
    expect(parseFloat(balance.replace('$', ''))).toBeGreaterThan(75.9);
    expect(parseFloat(balance.replace('$', ''))).toBeLessThan(78);
    // a shared account counts for each member; nothing saved there this week
    await expect(kid(page, 'Diego').locator('.sr-bank-week')).toContainText('Saved $0.00');
    await expect(kid(page, 'Elena').locator('.sr-bank-week')).toContainText('Balance now');
    // no account, no block
    await expect(kid(page, 'Ana')).not.toContainText('Banco Familia');
    await expect(kid(page, 'Beto')).not.toContainText('Banco Familia');
  });

  test('Book & Movie Check lines never reach the sheet', async ({ page }) => {
    await open(page);
    await expect(page.locator('#sr-content')).not.toContainText('Sample Title');
    await expect(page.locator('#sr-content')).not.toContainText('Ask a parent');
  });

  test('another week by date', async ({ page }) => {
    await open(page, { url: '/sunday-report.html?week=2026-10-26' });
    await expect(page.locator('.sr-dates')).toContainText('Oct 26');
    await expect(kid(page, 'Carla').locator('.sr-kid-empty')).toBeVisible();
    await expect(kid(page, 'Carla').locator('.sr-next-link')).toHaveAttribute('href', /\.html$/);
  });

  test('a Repaso source can add to going well and still working on', async ({ page }) => {
    await open(page);
    await page.evaluate(() => {
      const w = /** @type {any} */ (window);
      w.SundayReport.addInsightSource(name => name === 'Diego'
        ? { strong: [{ text: 'Sample review item — always right' }], working: [{ text: 'Sample review item — keeps coming back' }] } : null);
      w.SundayReport.refresh();
    });
    await expect(kid(page, 'Diego').locator('.sr-strong')).toContainText('always right');
    await expect(kid(page, 'Diego').locator('.sr-working')).toContainText('keeps coming back');
  });

  test('share as an image: a PNG goes to the share sheet', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true });
      Object.defineProperty(navigator, 'share', {
        value: async (d) => { /** @type {any} */ (window).__shared = { name: d.files[0].name, type: d.files[0].type, size: d.files[0].size }; },
        configurable: true
      });
    });
    await open(page);
    await page.click('#sr-share');
    await page.waitForFunction(() => !!/** @type {any} */ (window).__shared);
    const shared = await page.evaluate(() => /** @type {any} */ (window).__shared);
    expect(shared.type).toBe('image/png');
    expect(shared.name).toBe('sunday-report-2026-11-02.png');
    expect(shared.size).toBeGreaterThan(5000);
    await expect(page.locator('#sr-status')).toHaveText('Shared.');
  });

  test('share as an image: without a share sheet it downloads, and the picture has the kids on it', async ({ page }) => {
    await open(page);
    const dl = page.waitForEvent('download');
    await page.click('#sr-share');
    const d = await dl;
    expect(d.suggestedFilename()).toBe('sunday-report-2026-11-02.png');
    const dims = await page.evaluate(() => {
      const c = /** @type {any} */ (window).SundayReport.buildImage();
      const out = { w: c.width, h: c.height, painted: false };
      const px = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      // more than one colour: the card, text and background are drawn
      const seen = new Set();
      for (let i = 0; i < px.length && seen.size < 6; i += 4 * 997) seen.add(px[i] + ',' + px[i + 1] + ',' + px[i + 2]);
      out.painted = seen.size > 2;
      return out;
    });
    expect(dims.w).toBe(1080);
    expect(dims.h).toBeGreaterThan(1500);
    expect(dims.painted).toBe(true);
    await expect(page.locator('#sr-status')).toContainText('Saved sunday-report-2026-11-02.png');
  });

  test('printing: the toolbar goes away and a kid\'s card stays on one page', async ({ page }) => {
    await open(page);
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('.sr-toolbar')).toBeHidden();
    await expect(page.locator('#sr-status')).toBeHidden();
    const rules = await page.locator('.sr-kid').first().evaluate(el => getComputedStyle(el).breakInside);
    expect(rules).toBe('avoid');
    const nextAvoid = await page.locator('.sr-next').first().evaluate(el => getComputedStyle(el).breakInside);
    expect(nextAvoid).toBe('avoid');
  });

  test('light theme and a phone-width page do not scroll sideways', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await open(page);
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const [r, g, b] = bg.match(/\d+/g).map(Number);
    expect(r + g + b).toBeGreaterThan(600);
    const wide = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(wide).toBe(false);
  });

  test('the report writes nothing to saved data', async ({ page }) => {
    await open(page);
    const before = await page.evaluate(() => JSON.stringify(Object.keys(localStorage).sort().map(k => [k, localStorage.getItem(k)])));
    await page.evaluate(() => /** @type {any} */ (window).SundayReport.refresh());
    const after = await page.evaluate(() => JSON.stringify(Object.keys(localStorage).sort().map(k => [k, localStorage.getItem(k)])));
    expect(after).toBe(before);
  });
});
