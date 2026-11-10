// @ts-check
const { test, expect } = require('@playwright/test');

const KIDS = [
  { name: 'Emilia', color: '#DB2777', age: 12, avatar: '🦋' },
  { name: 'Ignacio', color: '#2563EB', age: 10, avatar: '🦁' },
  { name: 'Pablo', color: '#059669', age: 8, avatar: '🐯' },
  { name: 'Rodrigo', color: '#F59E0B', age: 6, avatar: '🐻' }
];

let n = 0;
const ev = (o) => Object.assign({ id: 't' + (++n), ts: n, by: 'parent' }, o);
const BANK = { v: 1, events: [
  ev({ type: 'account', account: 'pablo', name: 'Pablo', kind: 'own', members: ['Pablo'], date: '2026-10-01' }),
  ev({ type: 'account', account: 'emilia', name: 'Emilia', kind: 'own', members: ['Emilia'], date: '2026-10-01' }),
  ev({ type: 'account', account: 'boys', name: 'Boys', kind: 'shared', members: ['Ignacio', 'Pablo', 'Rodrigo'], date: '2026-10-01' }),
  ev({ type: 'deposit', account: 'pablo', amount: 100, match: 10, source: 'lemonade', date: '2026-10-01' }),
  ev({ type: 'deposit', account: 'emilia', amount: 50, match: 5, source: 'chores', date: '2026-10-01' }),
  ev({ type: 'deposit', account: 'boys', amount: 30, match: 3, source: 'sales', date: '2026-10-01' })
] };
const PRICES = { '2026-10-01': 6000, '2026-11-06': 6600 };   // +10%

async function open(page, who, url) {
  await page.clock.setFixedTime(new Date(2026, 10, 7, 10, 0, 0));
  await page.addInitScript(([kids, who, bank, prices]) => {
    localStorage.setItem('zs_profiles', JSON.stringify(kids));
    localStorage.setItem('zs_active_user', JSON.stringify(kids.find(k => k.name === who)));
    if (!localStorage.getItem('zs_bank')) localStorage.setItem('zs_bank', JSON.stringify(bank));
    localStorage.setItem('zs_bank_spx', JSON.stringify({ prices }));
  }, [KIDS, who, BANK, PRICES]);
  await page.goto(url || '/banco.html');
}
const pin = async (page, value) => {
  await page.getByRole('button', { name: /Bank manager/ }).click();
  await page.fill('.zsd-input', value);
  await page.click('.zsd-ok');
};

test.describe('Banco Familia', () => {

  test('the numbers: match, bonds interest, the S&P 500, spending and undo', async ({ page }) => {
    await open(page, 'Pablo');
    const r = await page.evaluate(() => {
      const E = /** @type {any} */ (window).BankEngine;
      const evs = JSON.parse(localStorage.getItem('zs_bank')).events;
      const pr = { '2026-10-01': 6000, '2026-11-06': 6600 };
      const a = E.compute(evs, 'pablo', pr, '2026-11-07');
      const year = E.compute(evs, 'pablo', { '2026-10-01': 6000 }, '2027-10-01');
      const spent = evs.concat([{ id: 'w', ts: 99, type: 'withdraw', account: 'pablo', amount: 11, date: '2026-11-07' }]);
      const w = E.compute(spent, 'pablo', pr, '2026-11-07');
      const undone = E.compute(spent.concat([{ id: 'v', ts: 100, type: 'void', target: 'w', date: '2026-11-07' }]), 'pablo', pr, '2026-11-07');
      return { a: a.round, year: year.round, w: w.round, undone: undone.round.value, sources: a.bySource };
    });
    // $100 + $10 match, 50/50: S&P half up 10%, bonds half a month of 4%.
    expect(r.a.deposited).toBe(100);
    expect(r.a.matched).toBe(10);
    expect(r.a.sp).toBe(60.5);
    expect(r.a.bonds).toBeCloseTo(55 * Math.pow(1.04, 37 / 365), 2);
    expect(r.year.bonds).toBeCloseTo(57.2, 2);           // a year of bonds: +4%
    expect(r.w.withdrawn).toBe(11);
    expect(r.w.value).toBeCloseTo(r.a.value - 11, 2);
    expect(r.undone).toBe(r.a.value);
    expect(r.sources).toEqual({ lemonade: 100 });
  });

  test('a kid sees only their own and shared accounts, and money only moves with the PIN', async ({ page }) => {
    await open(page, 'Pablo');
    await expect(page.locator('.bk-acc-name')).toHaveText(['Pablo', 'Boys']);
    await expect(page.getByRole('button', { name: /Deposit/ })).toHaveCount(0);

    await pin(page, '0000');
    await expect(page.locator('#zsd-toast')).toContainText('Wrong PIN');
    await expect(page.getByRole('button', { name: /Deposit/ })).toHaveCount(0);

    await pin(page, '1234');
    await expect(page.locator('.bk-acc-name')).toHaveCount(3);
    await page.locator('.bk-actions').getByRole('button', { name: /Deposit/ }).click();
    await page.selectOption('#bk-f-acc', 'emilia');
    await page.fill('#bk-f-amt', '20');
    await page.locator('label.bk-chip', { hasText: 'Gifts' }).click();
    await page.getByRole('button', { name: 'Add to account' }).click();
    await expect(page.locator('.bk-hero-bal')).toContainText('$');
    const last = await page.evaluate(() => JSON.parse(localStorage.getItem('zs_bank')).events.slice(-1)[0]);
    expect(last).toMatchObject({ type: 'deposit', account: 'emilia', amount: 20, match: 2, source: 'gifts', by: 'parent' });
  });

  test('a shared mix changes only when every member agrees, and one "no" cancels it', async ({ page }) => {
    await open(page, 'Pablo');
    const r = await page.evaluate(() => {
      const E = /** @type {any} */ (window).BankEngine;
      const base = JSON.parse(localStorage.getItem('zs_bank')).events;
      const boys = E.accounts(base).find(a => a.id === 'boys');
      const p = { id: 'p1', ts: 50, type: 'proposal', account: 'boys', bonds: 100, by: 'Pablo', date: '2026-11-02' };
      const v = (by, yes, ts) => ({ id: 'v' + ts, ts, type: 'vote', proposal: 'p1', by, yes, date: '2026-11-03' });
      const mix = (evs) => E.compute(evs, 'boys', {}, '2026-11-07').bondsPct;
      const two = base.concat([p, v('Ignacio', true, 51)]);
      const all = two.concat([v('rodrigo', true, 52)]);
      const no = base.concat([p, v('Ignacio', false, 51), v('Rodrigo', true, 52)]);
      const outsider = base.concat([p, v('Ignacio', true, 51), v('Emilia', true, 52)]);
      return {
        afterTwo: mix(two), afterAll: mix(all), afterNo: mix(no), outsider: mix(outsider),
        status: E.proposals(no, boys)[0].status,
        again: E.canChangeMix(all, boys, '2026-11-20'), december: E.canChangeMix(all, boys, '2026-12-01').ok
      };
    });
    expect(r.afterTwo).toBe(50);
    expect(r.afterAll).toBe(100);
    expect(r.afterNo).toBe(50);
    expect(r.status).toBe('rejected');
    expect(r.outsider).toBe(50);
    expect(r.again).toEqual({ ok: false, next: '2026-12-01' });
    expect(r.december).toBe(true);
  });

  test('a kid picks a mix once a month; the whole balance moves to it', async ({ page }) => {
    await open(page, 'Pablo');
    await page.locator('.bk-acc', { hasText: 'Own account' }).click();
    await page.getByRole('button', { name: /Choose your mix/ }).click();
    await page.locator('.bk-preset', { hasText: 'Bold' }).click();
    await page.getByRole('button', { name: 'Save my mix' }).click();
    await expect(page.locator('.bk-mixline')).toContainText('20% bonds');
    await expect(page.getByText(/change the mix again on Dec 1, 2026/)).toBeVisible();
    const s = await page.evaluate(() => {
      const E = /** @type {any} */ (window).BankEngine;
      const st = E.compute(JSON.parse(localStorage.getItem('zs_bank')).events, 'pablo', { '2026-10-01': 6000, '2026-11-06': 6600 }, '2026-11-07');
      return { bonds: st.bonds, value: st.value };
    });
    expect(s.bonds / s.value).toBeCloseTo(0.2, 3);
  });

  test('giving: 10% of each deposit (match included) goes to the Giving jar, never below the minimum', async ({ page }) => {
    await open(page, 'Pablo');
    const r = await page.evaluate(() => {
      const E = /** @type {any} */ (window).BankEngine;
      const base = JSON.parse(localStorage.getItem('zs_bank')).events;
      const pablo = E.accounts(base).find(a => a.id === 'pablo');
      const boys = E.accounts(base).find(a => a.id === 'boys');
      const dep = { id: 'g1', ts: 60, type: 'deposit', account: 'pablo', amount: 50, match: 5, give: 5.5, source: 'lemonade', date: '2026-11-02' };
      const gift = { id: 'g2', ts: 61, type: 'give', account: 'pablo', amount: 4, cause: 'parish', date: '2026-11-08' };
      const before = E.compute(base, 'pablo', {}, '2026-11-08');
      const after = E.compute(base.concat([dep, gift]), 'pablo', {}, '2026-11-08');
      const lower = base.concat([{ id: 'p5', ts: 62, type: 'givePct', account: 'pablo', pct: 5, by: 'Pablo', date: '2026-11-02' }]);
      const higher = base.concat([{ id: 'p20', ts: 62, type: 'givePct', account: 'pablo', pct: 20, by: 'Pablo', date: '2026-11-02' }]);
      const vote = base.concat([
        { id: 'pc', ts: 63, type: 'proposal', account: 'boys', cause: 'animals', by: 'Pablo', date: '2026-11-03' },
        { id: 'v1', ts: 64, type: 'vote', proposal: 'pc', by: 'Ignacio', yes: true, date: '2026-11-03' }]);
      return {
        investedAdded: after.value - before.value, jar: after.giving, given: after.given, byCause: after.givenByCause,
        lower: E.givePctOf(lower, pablo), higher: E.givePctOf(higher, pablo), default: E.givePctOf(base, pablo),
        firstPlace: E.giveToOf(base, pablo).name,
        twoOfThree: E.giveToOf(vote, boys).id,
        allThree: E.giveToOf(vote.concat([{ id: 'v2', ts: 65, type: 'vote', proposal: 'pc', by: 'Rodrigo', yes: true, date: '2026-11-04' }]), boys).id,
        mixUntouched: E.mixChanges(vote, boys).length
      };
    });
    expect(r.investedAdded).toBeCloseTo(49.5, 1);   // 55 in, 5.50 to giving
    expect(r.jar).toBeCloseTo(1.5, 2);
    expect(r.given).toBe(4);
    expect(r.byCause).toEqual({ parish: 4 });
    expect(r.default).toBe(10);
    expect(r.lower).toBe(10);
    expect(r.higher).toBe(20);
    expect(r.firstPlace).toBe("St. Claire's parish");
    expect(r.twoOfThree).toBe('parish');
    expect(r.allThree).toBe('animals');
    expect(r.mixUntouched).toBe(0);
  });

  test('a parent deposit sets aside the giving share, and a gift comes out of the jar', async ({ page }) => {
    await open(page, 'Pablo');
    await pin(page, '1234');
    await page.locator('.bk-actions').getByRole('button', { name: /Deposit/ }).click();
    await page.selectOption('#bk-f-acc', 'pablo');
    await page.fill('#bk-f-amt', '20');
    await page.locator('#bk-f-amt').dispatchEvent('input');
    await expect(page.locator('#bk-f-give')).toContainText('$2.20 (10%)');
    await page.getByRole('button', { name: 'Add to account' }).click();
    const dep = await page.evaluate(() => JSON.parse(localStorage.getItem('zs_bank')).events.slice(-1)[0]);
    expect(dep).toMatchObject({ type: 'deposit', amount: 20, match: 2, give: 2.2 });

    await page.getByRole('button', { name: /Gift/ }).click();
    await expect(page.locator('#bk-g-amt')).toHaveValue('2.20');
    await page.fill('#bk-g-amt', '5');
    await page.getByRole('button', { name: 'Record gift' }).click();
    await expect(page.locator('#zsd-toast')).toContainText('Giving jar has $2.20');
    await page.fill('#bk-g-amt', '2.20');
    await page.getByRole('button', { name: 'Record gift' }).click();
    await expect(page.locator('.bk-given')).toContainText("St. Claire's parish: $2.20");
  });

  test('sync merges two devices\' entries instead of keeping one side', async ({ page }) => {
    await open(page, 'Pablo');
    const out = await page.evaluate(() => {
      const m = /** @type {any} */ (window).CloudSync._mergeBank;
      const phone = { v: 1, events: [{ id: 'a', ts: 1 }, { id: 'dep', ts: 5 }], _syncedAt: 10 };
      const ipad = { v: 1, events: [{ id: 'a', ts: 1 }, { id: 'vote', ts: 6 }], _syncedAt: 20 };
      return m(phone, ipad).events.map(e => e.id);
    });
    expect(out).toEqual(['a', 'dep', 'vote']);
  });

  // ── monthly statements ──
  // One own account, all in the S&P 500, with closes chosen so the
  // numbers come out round: +5% by Oct 31, then -5% by Nov 30.
  const STMT_EVENTS = [
    { id: 'a', ts: 1, type: 'account', account: 'x', name: 'Kid', kind: 'own', members: ['Kid'], date: '2026-09-30' },
    { id: 'm', ts: 2, type: 'mix', account: 'x', bonds: 0, date: '2026-10-01' },
    { id: 'd1', ts: 3, type: 'deposit', account: 'x', amount: 40, match: 4, give: 4.4, source: 'lemonade', date: '2026-10-05' },
    { id: 'd2', ts: 4, type: 'deposit', account: 'x', amount: 10, match: 1, give: 1.1, source: 'chores', date: '2026-10-20' },
    { id: 'g1', ts: 5, type: 'give', account: 'x', amount: 2, cause: 'parish', date: '2026-11-10' },
    { id: 'w1', ts: 6, type: 'withdraw', account: 'x', amount: 5, note: 'Lego', date: '2026-11-12' }
  ];
  const STMT_PRICES = { '2026-10-01': 6000, '2026-10-31': 6300, '2026-11-30': 5985 };

  test('statement: what came in, the match, giving, growth and the balances add up', async ({ page }) => {
    await open(page, 'Pablo');
    const r = await page.evaluate(([evs, pr]) => {
      const E = /** @type {any} */ (window).BankEngine;
      const oct = E.statement(evs, 'x', pr, '2026-10');
      const nov = E.statement(evs, 'x', pr, '2026-11');
      const voided = evs.concat([{ id: 'v', ts: 9, type: 'void', target: 'd2', date: '2026-10-21' }]);
      return {
        oct, nov,
        octVoid: E.statement(voided, 'x', pr, '2026-10'),
        early: E.statementMonths(evs, 'x', pr, '2026-11-07'),
        later: E.statementMonths(evs, 'x', pr, '2026-12-02'),
        sameMonth: E.statementMonths(evs, 'x', pr, '2026-10-31'),
        noDeposits: E.statementMonths(evs.slice(0, 2), 'x', pr, '2026-12-02')
      };
    }, [STMT_EVENTS, STMT_PRICES]);
    // October: $50 saved + $5 match, set aside 5.50; 49.50 invested grows 5%.
    expect(r.oct.start).toBe(0);
    expect(r.oct.saved).toBe(50);
    expect(r.oct.matched).toBe(5);
    expect(r.oct.bySource).toEqual({ lemonade: 40, chores: 10 });
    expect(r.oct.setAside).toBe(5.5);
    expect(r.oct.growth).toBeCloseTo(2.475, 2);
    expect(r.oct.end).toBeCloseTo(57.475, 2);
    expect(r.oct.given).toBe(0);
    // Every month: start + saved + match + growth - gave - spent = end.
    for (const st of [r.oct, r.nov]) {
      expect(st.start + st.saved + st.matched + st.growth - st.given - st.spent).toBeCloseTo(st.end, 1);
    }
    // November: a $2 gift and $5 spent, then the market falls 5%.
    expect(r.nov.start).toBeCloseTo(57.475, 2);
    expect(r.nov.given).toBe(2);
    expect(r.nov.givenByCause).toEqual({ parish: 2 });
    expect(r.nov.spent).toBe(5);
    expect(r.nov.saved).toBe(0);
    expect(r.nov.growth).toBeLessThan(0);
    expect(r.nov.end).toBeCloseTo(48.126, 2);
    // A cancelled deposit drops out of its month.
    expect(r.octVoid.saved).toBe(40);
    // Only finished months, from the first deposit.
    expect(r.early).toEqual(['2026-10']);
    expect(r.later).toEqual(['2026-11', '2026-10']);
    expect(r.sameMonth).toEqual([]);
    expect(r.noDeposits).toEqual([]);
  });

  test('statement card: shown once after the 1st, opens to the ledger, then lives in the archive', async ({ page }) => {
    await open(page, 'Pablo');
    const card = page.locator('.bk-stmt-card');
    await expect(card).toHaveCount(2);      // Pablo's own account and the shared one
    await expect(card.first()).toContainText('your October statement is here');
    await card.first().getByRole('button', { name: 'See it' }).click();
    await expect(page.locator('.bk-stmt h2')).toHaveText('October 2026');
    await expect(page.locator('.bk-lrow.total')).toContainText('End of October');
    await expect(page.locator('.bk-lrow').first()).toContainText('Start of October');
    await expect(page.locator('.bk-story')).toContainText('You saved $100.00');
    await expect(page.locator('.bk-story')).toContainText('by itself this month');

    // Opened = seen. The other account's card is still waiting; dismiss it.
    await page.getByRole('button', { name: /← Pablo/ }).click();
    await expect(page.locator('.bk-stmt-row')).toContainText('October 2026');
    await expect(page.locator('.bk-stmt-row .bk-new')).toHaveCount(0);
    await page.getByRole('button', { name: /All accounts/ }).click();
    await expect(card).toHaveCount(1);
    await page.getByRole('button', { name: /Dismiss the October 2026 statement/ }).click();
    await expect(card).toHaveCount(0);
    const seen = await page.evaluate(() => JSON.parse(localStorage.getItem('zs_bank_stmt_seen')));
    expect(seen).toEqual({ 'Pablo|pablo': '2026-10', 'Pablo|boys': '2026-10' });
  });

  test('a parent sees the statement archive without the kid card, and nothing else changes', async ({ page }) => {
    await open(page, 'Pablo');
    await pin(page, '1234');
    await expect(page.locator('.bk-stmt-card')).toHaveCount(0);
    await page.locator('.bk-acc', { hasText: 'Emilia' }).click();
    await page.locator('.bk-stmt-row').click();
    await expect(page.locator('.bk-stmt h2')).toHaveText('October 2026');
    await expect(page.locator('.bk-story')).toHaveCount(0);
    await expect(page.locator('.bk-lrow.total')).toContainText('End of October');
    const before = await page.evaluate(() => localStorage.getItem('zs_bank'));
    expect(JSON.parse(before).events.length).toBe(6);   // viewing wrote nothing
  });

  // ── badges ──
  test('badges: savings, months, gifts and holding steady, credited to every member of a shared account', async ({ page }) => {
    await open(page, 'Pablo');
    const r = await page.evaluate(() => {
      const E = /** @type {any} */ (window).BankEngine;
      let t = 0;
      const e = (o) => Object.assign({ id: 'e' + (++t), ts: t, by: 'parent' }, o);
      const base = [
        e({ type: 'account', account: 'pablo', name: 'Pablo', kind: 'own', members: ['Pablo'], date: '2026-08-01' }),
        e({ type: 'account', account: 'emilia', name: 'Emilia', kind: 'own', members: ['Emilia'], date: '2026-08-01' }),
        e({ type: 'account', account: 'boys', name: 'Boys', kind: 'shared', members: ['Pablo', 'Ignacio'], date: '2026-08-01' }),
        e({ type: 'deposit', account: 'pablo', amount: 20, match: 2, give: 2.2, source: 'lemonade', date: '2026-08-05' }),
        e({ type: 'deposit', account: 'pablo', amount: 20, match: 2, give: 2.2, source: 'chores', date: '2026-08-20' }),
        e({ type: 'deposit', account: 'boys', amount: 40, match: 4, give: 4.4, source: 'sales', date: '2026-09-05' }),
        e({ type: 'deposit', account: 'emilia', amount: 300, match: 30, give: 33, source: 'chores', date: '2026-09-05' }),
        e({ type: 'deposit', account: 'pablo', amount: 5, match: 0.5, give: 0.55, source: 'gifts', date: '2026-10-03' }),
        e({ type: 'give', account: 'pablo', amount: 1, cause: 'parish', date: '2026-10-04' }),
        e({ type: 'give', account: 'pablo', amount: 1, cause: 'parish', date: '2026-10-11' }),
        e({ type: 'give', account: 'boys', amount: 1, cause: 'foodbank', date: '2026-10-12' }),
        e({ type: 'give', account: 'pablo', amount: 1, cause: 'animals', date: '2026-10-18' }),
        e({ type: 'givePct', account: 'pablo', pct: 20, by: 'Pablo', date: '2026-10-19' }),
        e({ type: 'givePct', account: 'emilia', pct: 30, by: 'parent', date: '2026-10-19' })
      ];
      const pr = { '2026-08-01': 6000, '2026-09-30': 6000, '2026-10-31': 5600, '2026-11-30': 5600 };
      const got = (evs, who, prices, asOf) => {
        const o = {};
        E.badges(evs, who, prices || pr, asOf || '2026-11-05').forEach(b => { o[b.id] = b; });
        return o;
      };
      const pablo = got(base, 'Pablo');
      const ignacio = got(base, 'Ignacio');
      const emilia = got(base, 'Emilia');
      const early = got(base, 'Pablo', pr, '2026-08-25');
      const cancelled = got(base.concat([e({ type: 'void', target: base[6].id, date: '2026-09-06' })]), 'Emilia');
      // Held steady: October fell 6.7% while the account held S&P 500 money.
      const changed = base.concat([e({ type: 'mix', account: 'pablo', bonds: 100, by: 'Pablo', date: '2026-10-15' }),
        e({ type: 'mix', account: 'boys', bonds: 100, by: 'parent', date: '2026-10-16' })]);
      const bondsOnly = [base[0], base[2]].concat([e({ type: 'mix', account: 'pablo', bonds: 100, date: '2026-08-02' }),
        e({ type: 'mix', account: 'boys', bonds: 100, date: '2026-08-02' })], base.slice(3, 6));
      const smallDip = got(base, 'Pablo', { '2026-08-01': 6000, '2026-09-30': 6000, '2026-10-31': 5800 });
      const noPrices = got(base, 'Pablo', {});
      return {
        pablo, ignacio, emilia, early,
        cancelledSaved: cancelled.saved250.earned,
        steadyChanged: got(changed, 'Pablo').steady.earned,
        steadyBondsOnly: got(bondsOnly, 'Pablo').steady.earned,
        smallDip: smallDip.steady.earned, noPrices: noPrices.steady.earned,
        count: E.BADGES.length
      };
    });
    expect(r.count).toBe(12);
    // Pablo: $20 + $20 + $5 of his own + the shared $40 (every member is credited).
    expect(r.pablo.first).toMatchObject({ earned: true, date: '2026-08-05' });
    expect(r.pablo.saved50).toMatchObject({ earned: true, date: '2026-09-05' });
    expect(r.pablo.saved100.earned).toBe(false);
    expect(r.pablo.saved100.have).toBe(85);
    expect(r.pablo.months3).toMatchObject({ earned: true, date: '2026-10-03' });
    expect(r.pablo.months6).toMatchObject({ earned: false, have: 3 });
    expect(r.pablo.gift1).toMatchObject({ earned: true, date: '2026-10-04' });
    expect(r.pablo.places3).toMatchObject({ earned: true, date: '2026-10-18' });   // parish, food bank (shared), animals
    expect(r.pablo.giveMore).toMatchObject({ earned: true, date: '2026-10-19' });
    expect(r.pablo.steady).toMatchObject({ earned: true, date: '2026-10-31' });
    // The shared account's partner is credited for the shared deposit and gift only.
    expect(r.ignacio.first.earned).toBe(true);
    expect(r.ignacio.saved50.earned).toBe(false);
    expect(r.ignacio.saved50.have).toBe(40);
    expect(r.ignacio.gift1.earned).toBe(true);
    expect(r.ignacio.places3.have).toBe(1);
    // A parent's change to the giving % isn't a kid's choice.
    expect(r.emilia.giveMore.earned).toBe(false);
    expect(r.emilia.saved250.earned).toBe(true);
    expect(r.emilia.steady.earned).toBe(true);
    // Not earned yet on an earlier date; cancelling the deposit takes the badge back.
    expect(r.early.saved50.earned).toBe(false);
    expect(r.early.first.earned).toBe(true);
    expect(r.cancelledSaved).toBe(false);
    // Holding steady needs S&P 500 money, no change of mix that month, a 5% fall and real closes.
    expect(r.steadyChanged).toBe(false);
    expect(r.steadyBondsOnly).toBe(false);
    expect(r.smallDip).toBe(false);
    expect(r.noPrices).toBe(false);
  });

  test('Trophy Room: a Saving & Giving cabinet for kids with an account, and only for them', async ({ page }) => {
    await open(page, 'Pablo', '/trophy-room.html');
    await expect(page.locator('#tr-money-label')).toHaveText('Saving & Giving · 3 of 12');
    await expect(page.locator('#tr-money-grid .tr-badge')).toHaveCount(12);
    await expect(page.locator('#tr-money-grid .tr-badge.earned')).toHaveCount(3);
    await page.getByRole('button', { name: /^\$100 saved/ }).click();
    await expect(page.locator('.tr-pop h2')).toHaveText('$100 saved');
    await expect(page.locator('.tr-pop')).toContainText('Silver');
    await page.keyboard.press('Escape');
    await expect(page.locator('.tr-pop')).toHaveCount(0);
  });

  // Rodrigo with no account: the shared one is just Ignacio and Pablo here.
  const NO_RODRIGO = (page) => page.addInitScript((bank) => {
    bank.events[2].members = ['Ignacio', 'Pablo'];
    localStorage.setItem('zs_bank', JSON.stringify(bank));
  }, BANK);

  test('Trophy Room: no Saving & Giving cabinet for a kid without an account', async ({ page }) => {
    await NO_RODRIGO(page);
    await open(page, 'Rodrigo', '/trophy-room.html');
    await expect(page.locator('#tr-grid .tr-badge').first()).toBeVisible();
    await expect(page.locator('#tr-money-label')).toBeHidden();
    await expect(page.locator('#tr-money-cab')).toBeHidden();
  });

  test('Sunday Report: a kid with an account gets last month\'s Banco Familia line', async ({ page }) => {
    await NO_RODRIGO(page);
    await open(page, 'Pablo', '/sunday-report.html');
    const pablo = page.locator('.sr-kid', { hasText: 'Pablo' });
    await expect(pablo).toContainText('Banco Familia · October');
    await expect(pablo).toContainText('Saved $130.00');
    await expect(page.locator('.sr-kid', { hasText: 'Rodrigo' })).not.toContainText('Banco Familia');
  });

  // ── wishlist ──
  const WISH_BASE = [
    { id: 'a', ts: 1, type: 'account', account: 'x', name: 'Kid', kind: 'own', members: ['Kid'], date: '2026-09-01' },
    { id: 'm', ts: 2, type: 'mix', account: 'x', bonds: 100, date: '2026-09-01' },
    { id: 'd1', ts: 3, type: 'deposit', account: 'x', amount: 20, source: 'lemonade', date: '2026-09-05' },
    { id: 'd2', ts: 4, type: 'deposit', account: 'x', amount: 30, source: 'lemonade', date: '2026-10-03' },
    { id: 'd3', ts: 5, type: 'deposit', account: 'x', amount: 10, source: 'chores', date: '2026-10-10' },
    { id: 'w1', ts: 6, type: 'wish', account: 'x', name: 'Lego set', price: 30, emoji: '🧩', date: '2026-11-01', by: 'Kid' }
  ];

  test('wishlist: a decision only counts after 7 days, the first one stands, and a purchase closes it', async ({ page }) => {
    await open(page, 'Pablo');
    const r = await page.evaluate((base) => {
      const E = /** @type {any} */ (window).BankEngine;
      const st = (evs, asOf) => { const w = E.wishes(evs, 'x', asOf)[0]; return w && { status: w.status, daysLeft: w.daysLeft, readyOn: w.readyOn }; };
      const decide = (decision, date, id, ts) => ({ id: id || 'wd', ts: ts || 20, type: 'wishDecision', wish: 'w1', decision, date, by: 'Kid' });
      const early = base.concat([decide('keep', '2026-11-07')]);           // day 6: too soon
      const onTime = base.concat([decide('keep', '2026-11-08')]);          // day 7
      const twice = base.concat([decide('drop', '2026-11-08'), decide('keep', '2026-11-09', 'wd2', 21)]);
      const bought = onTime.concat([{ id: 'wb', ts: 30, type: 'withdraw', account: 'x', amount: 29.5, wish: 'w1', note: 'Lego set', date: '2026-11-10' }]);
      const wrongAcct = onTime.concat([{ id: 'wb', ts: 30, type: 'withdraw', account: 'other', amount: 5, wish: 'w1', date: '2026-11-10' }]);
      return {
        day0: st(base, '2026-11-01'), day1: st(base, '2026-11-02'), day6: st(base, '2026-11-07'), day7: st(base, '2026-11-08'), day9: st(base, '2026-11-10'),
        beforeAdded: E.wishes(base, 'x', '2026-10-31').length,
        early: st(early, '2026-11-20'), onTime: st(onTime, '2026-11-20'), onTimeButAsOfEarlier: st(onTime, '2026-11-08'),
        twice: st(twice, '2026-11-20'),
        bought: st(bought, '2026-11-20'), boughtThenCancelled: st(bought.concat([{ id: 'vv', ts: 40, type: 'void', target: 'wb', date: '2026-11-11' }]), '2026-11-20'),
        wrongAcct: st(wrongAcct, '2026-11-20'),
        removed: st(base.concat([{ id: 'we', ts: 22, type: 'wishEdit', wish: 'w1', removed: true, date: '2026-11-02' }]), '2026-11-20'),
        badgeNot: E.badges(onTime, 'Kid', {}, '2026-11-20').find(b => b.id === 'waited').earned,
        badgeYes: E.badges(base.concat([decide('drop', '2026-11-08')]), 'Kid', {}, '2026-11-20').find(b => b.id === 'waited'),
        badgeEarly: E.badges(base.concat([decide('drop', '2026-11-07')]), 'Kid', {}, '2026-11-20').find(b => b.id === 'waited').earned
      };
    }, WISH_BASE);
    expect(r.day0).toEqual({ status: 'waiting', daysLeft: 7, readyOn: '2026-11-08' });
    expect(r.day1).toMatchObject({ status: 'waiting', daysLeft: 6 });
    expect(r.day6).toMatchObject({ status: 'waiting', daysLeft: 1 });
    expect(r.day7).toMatchObject({ status: 'ready', daysLeft: 0 });
    expect(r.day9.status).toBe('ready');
    expect(r.beforeAdded).toBe(0);
    expect(r.early.status).toBe('ready');                 // the day-6 "keep" is ignored
    expect(r.onTime.status).toBe('keep');
    expect(r.onTimeButAsOfEarlier.status).toBe('keep');
    expect(r.twice.status).toBe('drop');                  // first valid decision stands
    expect(r.bought.status).toBe('bought');
    expect(r.boughtThenCancelled.status).toBe('keep');
    expect(r.wrongAcct.status).toBe('keep');
    expect(r.removed.status).toBe('removed');
    expect(r.badgeNot).toBe(false);
    expect(r.badgeYes).toMatchObject({ earned: true, date: '2026-11-08' });
    expect(r.badgeEarly).toBe(false);
  });

  test('wishlist: price as a share of savings, usual deposits and months of saving', async ({ page }) => {
    await open(page, 'Pablo');
    const r = await page.evaluate((base) => {
      const E = /** @type {any} */ (window).BankEngine;
      const own = E.compute(base, 'x', {}, '2026-11-08').value;
      return {
        own, small: E.wishCost(base, 'x', 30, {}, '2026-11-08'), big: E.wishCost(base, 'x', 500, {}, '2026-11-08'),
        none: E.wishCost(base.slice(0, 2), 'x', 30, {}, '2026-11-08'),
        noLemonade: E.wishCost(base.filter(e => e.source !== 'lemonade'), 'x', 30, {}, '2026-11-08'),
        oneMonth: E.wishCost(base.filter(e => e.date < '2026-10-01'), 'x', 10, {}, '2026-09-20')
      };
    }, WISH_BASE);
    // Usual lemonade stand = (20 + 30) / 2 = $25; $60 saved over Sep-Nov = $20 a month.
    expect(r.small.share).toBe(Math.round(30 / r.own * 100));
    expect(r.small).toMatchObject({ avgDeposit: 25, lemonade: true, stands: 2, perMonth: 20, months: 2, short: 0 });
    expect(r.big.share).toBeNull();
    expect(r.big.short).toBeCloseTo(500 - r.own, 1);
    expect(r.big.stands).toBe(20);
    expect(r.none).toMatchObject({ share: null, stands: null, months: null, short: 30 });
    expect(r.noLemonade).toMatchObject({ lemonade: false, avgDeposit: 10 });
    expect(r.oneMonth.months).toBeNull();                 // too little history for a monthly pace
  });

  test('wishlist: a kid adds an item, waits, decides; the parent sees it and records the purchase', async ({ page }) => {
    await open(page, 'Pablo');
    await page.locator('.bk-acc', { hasText: 'Own account' }).click();
    await page.getByRole('button', { name: /Add something I want/ }).click();
    await page.getByRole('button', { name: 'Add to my wishlist' }).click();
    await expect(page.locator('#zsd-toast')).toContainText('What do you want');
    await page.fill('#bk-w-name', 'Lego set');
    await page.fill('#bk-w-price', '24.99');
    await page.getByRole('button', { name: 'Picture 🧩' }).click();
    await expect(page.locator('#bk-w-name')).toHaveValue('Lego set');     // choosing a picture keeps what was typed
    await page.getByRole('button', { name: 'Add to my wishlist' }).click();
    const item = page.locator('.bk-wish').first();
    await expect(item).toContainText('Lego set');
    await expect(item).toContainText('$24.99');
    await expect(item).toContainText('7 more days to think 🤔');
    await expect(item).toContainText('% of your savings');
    await expect(item.getByRole('button', { name: 'Still want it' })).toHaveCount(0);
    const ev1 = await page.evaluate(() => JSON.parse(localStorage.getItem('zs_bank')).events.slice(-1)[0]);
    expect(ev1).toMatchObject({ type: 'wish', account: 'pablo', name: 'Lego set', price: 24.99, emoji: '🧩', date: '2026-11-07', by: 'Pablo' });

    // Day 6: still waiting. Day 7: the question appears.
    await page.clock.setFixedTime(new Date(2026, 10, 13, 10, 0, 0));
    await page.reload();
    await page.locator('.bk-acc', { hasText: 'Own account' }).click();
    await expect(page.locator('.bk-wish').first()).toContainText('1 more day to think');
    await page.clock.setFixedTime(new Date(2026, 10, 14, 10, 0, 0));
    await page.reload();
    await page.locator('.bk-acc', { hasText: 'Own account' }).click();
    await expect(page.locator('.bk-wish').first()).toContainText('Do you still want it?');
    await page.getByRole('button', { name: 'Still want it' }).click();
    await expect(page.locator('.bk-wish').first()).toContainText('Talk about it with Mom or Dad');
    const dec = await page.evaluate(() => JSON.parse(localStorage.getItem('zs_bank')).events.slice(-1)[0]);
    expect(dec).toMatchObject({ type: 'wishDecision', decision: 'keep', date: '2026-11-14' });

    // The parent's list, then the "Money spent" form filled in from the item.
    await page.getByRole('button', { name: /All accounts/ }).click();
    await expect(page.locator('.bk-wishinbox')).toHaveCount(0);           // not on a kid's screen
    await pin(page, '1234');
    await expect(page.locator('.bk-wishinbox')).toContainText('Lego set');
    await page.locator('.bk-wishinbox').getByRole('button', { name: 'Bought it' }).click();
    await expect(page.locator('#bk-f-amt')).toHaveValue('24.99');
    await expect(page.locator('#bk-f-note')).toHaveValue('Lego set');
    await page.getByRole('button', { name: 'Take it out' }).click();
    const buy = await page.evaluate(() => JSON.parse(localStorage.getItem('zs_bank')).events.slice(-1)[0]);
    expect(buy).toMatchObject({ type: 'withdraw', account: 'pablo', amount: 24.99, wish: dec.wish, by: 'parent' });
    await page.getByRole('button', { name: /All accounts/ }).click();
    await expect(page.locator('.bk-wishinbox')).toHaveCount(0);           // bought: off the list
  });

  test('wishlist: "Changed my mind" celebrates the saving and earns the badge; a photo is stored small', async ({ page }) => {
    await open(page, 'Pablo');
    await page.locator('.bk-acc', { hasText: 'Own account' }).click();
    await page.getByRole('button', { name: /Add something I want/ }).click();
    await page.fill('#bk-w-name', 'Scooter');
    await page.fill('#bk-w-price', '60');
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    await page.setInputFiles('#bk-w-photo', { name: 'p.png', mimeType: 'image/png', buffer: png });
    await expect(page.locator('.bk-wish-prev img')).toBeVisible();
    await expect(page.locator('#bk-w-name')).toHaveValue('Scooter');
    await page.getByRole('button', { name: 'Add to my wishlist' }).click();
    const w = await page.evaluate(() => JSON.parse(localStorage.getItem('zs_bank')).events.slice(-1)[0]);
    expect(w.photo).toMatch(/^data:image\/jpeg;base64,/);
    expect(w.photo.length).toBeLessThan(5000);
    await expect(page.locator('.bk-wish img.bk-wish-img')).toBeVisible();

    await page.clock.setFixedTime(new Date(2026, 10, 15, 10, 0, 0));
    await page.reload();
    await page.locator('.bk-acc', { hasText: 'Own account' }).click();
    await page.getByRole('button', { name: 'Changed my mind' }).click();
    await expect(page.locator('#zsd-toast')).toContainText('You saved $60.00');
    await expect(page.locator('#zsd-toast')).toContainText('Think it over');
    await expect(page.locator('.bk-wish-saved')).toContainText('$60.00');
    await page.goto('/trophy-room.html');
    await expect(page.locator('#tr-money-grid .tr-badge.earned', { hasText: 'Think it over' })).toHaveCount(1);
  });

  test('wishlist: shared accounts have none, and a stray early decision does not skip the wait', async ({ page }) => {
    await open(page, 'Pablo');
    await page.locator('.bk-acc', { hasText: 'Shared' }).click();
    await expect(page.locator('.bk-wishlist')).toHaveCount(0);
    await page.getByRole('button', { name: /All accounts/ }).click();
    await page.locator('.bk-acc', { hasText: 'Own account' }).click();
    await page.getByRole('button', { name: /Add something I want/ }).click();
    await page.fill('#bk-w-name', 'Kite');
    await page.fill('#bk-w-price', '12');
    await page.getByRole('button', { name: 'Add to my wishlist' }).click();
    const wishId = await page.evaluate(() => JSON.parse(localStorage.getItem('zs_bank')).events.slice(-1)[0].id);
    // A decision dated the same day (e.g. from another device) is ignored.
    await page.evaluate((id) => {
      const d = JSON.parse(localStorage.getItem('zs_bank'));
      d.events.push({ id: 'early', ts: Date.now() + 1, type: 'wishDecision', account: 'pablo', wish: id, decision: 'keep', date: '2026-11-07', by: 'Pablo' });
      localStorage.setItem('zs_bank', JSON.stringify(d));
    }, wishId);
    await page.reload();
    await page.locator('.bk-acc', { hasText: 'Own account' }).click();
    await expect(page.locator('.bk-wish').first()).toContainText('7 more days to think');
    await page.evaluate(() => window.Banco.wishDecide('pablo', JSON.parse(localStorage.getItem('zs_bank')).events.find(e => e.type === 'wish').id, true));
    await expect(page.locator('#zsd-toast')).toContainText('7 more days to think');
  });

  // ── payday for several kids, stand profit, what $10 bought ──
  const PAY_EVENTS = [
    { id: 'a1', ts: 1, type: 'account', account: 'a', name: 'Ana', kind: 'own', members: ['Ana'], date: '2026-10-01' },
    { id: 'a2', ts: 2, type: 'account', account: 'b', name: 'Beto', kind: 'own', members: ['Beto'], date: '2026-10-01' },
    { id: 'a3', ts: 3, type: 'account', account: 'c', name: 'Caro', kind: 'own', members: ['Caro'], date: '2026-10-01' },
    { id: 'gp', ts: 4, type: 'givePct', account: 'b', pct: 20, by: 'Beto', date: '2026-10-02' }
  ];

  test('payday: one deposit per account, odd cents shared out, match and giving applied to each', async ({ page }) => {
    await open(page, 'Pablo');
    const r = await page.evaluate((evs) => {
      const E = /** @type {any} */ (window).BankEngine;
      const sum = (a) => Math.round(a.reduce((t, x) => t + x, 0) * 100) / 100;
      const equal = E.payday(evs, { items: E.splitEqual(10, 3).map((amount, i) => ({ account: ['a', 'b', 'c'][i], amount })), date: '2026-11-07', source: 'lemonade', note: 'Joint stand', match: true });
      const custom = E.payday(evs, { items: [{ account: 'a', amount: 7.5 }, { account: 'b', amount: 2.5 }, { account: 'zzz', amount: 4 }, { account: 'c', amount: 0 }], date: '2026-11-07', source: 'chores', match: false });
      const single = E.payday(evs, { items: [{ account: 'a', amount: 4 }], date: '2026-11-07', match: true });
      // the bodies, made into real events, give the balances a parent's separate deposits would
      let t = 100;
      const made = equal.map(b => Object.assign({ id: 'p' + (++t), ts: t, type: 'deposit', by: 'parent' }, b));
      const after = E.compute(evs.concat(made), 'b', {}, '2026-11-07');
      return { split: [E.splitEqual(10, 3), E.splitEqual(10.01, 2), E.splitEqual(0.02, 3), E.splitEqual(9, 3)], equal, custom, single,
        total: sum(equal.map(b => b.amount)), groups: new Set(equal.map(b => b.group)).size,
        jarB: after.giving, bMatched: after.matched, bDeposited: after.deposited };
    }, PAY_EVENTS);
    expect(r.split).toEqual([[3.34, 3.33, 3.33], [5.01, 5], [0.01, 0.01, 0], [3, 3, 3]]);
    expect(r.total).toBe(10);
    expect(r.equal.map(b => b.account)).toEqual(['a', 'b', 'c']);
    expect(r.equal.map(b => b.match)).toEqual([0.33, 0.33, 0.33]);          // 10% of 3.34 / 3.33 / 3.33, to the cent
    // Giving: 10% minimum for Ana and Caro, Beto chose 20%, each on amount + match.
    expect(r.equal.map(b => b.give)).toEqual([0.37, 0.73, 0.37]);
    expect(r.equal.every(b => b.source === 'lemonade' && b.note === 'Joint stand' && b.date === '2026-11-07')).toBe(true);
    expect(r.groups).toBe(1);
    expect(r.jarB).toBeCloseTo(0.73, 2);
    expect(r.bMatched).toBeCloseTo(0.33, 2);
    expect(r.bDeposited).toBe(3.33);
    // Custom amounts; an unknown account and a zero amount are skipped; no match when off.
    expect(r.custom.map(b => [b.account, b.amount, b.match, b.give])).toEqual([['a', 7.5, 0, 0.75], ['b', 2.5, 0, 0.5]]);
    expect(r.single).toHaveLength(1);
    expect(r.single[0].group).toBeUndefined();
  });

  test('stand profit: only the profit is deposited, costs are reported, and a joint stand splits both', async ({ page }) => {
    await open(page, 'Pablo');
    const r = await page.evaluate((evs) => {
      const E = /** @type {any} */ (window).BankEngine;
      let t = 100;
      const mk = (b) => Object.assign({ id: 'p' + (++t), ts: t, type: 'deposit', by: 'parent' }, b);
      const solo = E.payday(evs, { items: [{ account: 'a', amount: 14 }], date: '2026-11-01', source: 'lemonade', match: false, stand: { sales: 20, costs: 6, hours: 2 } }).map(mk);
      const solo2 = E.payday(evs, { items: [{ account: 'a', amount: 9 }], date: '2026-11-05', source: 'lemonade', match: false, stand: { sales: 15, costs: 6 } }).map(mk);
      const plain = E.payday(evs, { items: [{ account: 'a', amount: 5 }], date: '2026-11-06', source: 'gifts', match: false }).map(mk);
      const joint = E.payday(evs, { items: [{ account: 'a', amount: 9 }, { account: 'b', amount: 9 }], date: '2026-11-07', source: 'lemonade', match: true, stand: { sales: 30, costs: 12, hours: 2 } }).map(mk);
      const all = evs.concat(solo, solo2, plain, joint);
      const stats = E.standStats(all, 'a', '2026-11-07');
      return {
        solo: solo[0].stand, joint: joint.map(b => [b.amount, b.stand]),
        stats: { count: stats.count, sales: stats.sales, costs: stats.costs, profit: stats.profit, hours: stats.hours, perHour: stats.perHour, newest: stats.items[0].date },
        value: E.compute(all, 'a', {}, '2026-11-07').deposited,
        none: E.standStats(evs, 'a', '2026-11-07').count,
        beforeDate: E.standStats(all, 'a', '2026-11-02').count,
        voided: E.standStats(all.concat([{ id: 'v1', ts: 999, type: 'void', target: solo[0].id, date: '2026-11-08' }]), 'a', '2026-11-08').count,
        noHours: E.standStats(all, 'a', '2026-11-05').perHour
      };
    }, PAY_EVENTS);
    expect(r.solo).toEqual({ sales: 20, costs: 6, hours: 2 });
    // A joint stand: $30 sales, $12 costs, $18 profit shared by two kids.
    expect(r.joint).toEqual([[9, { sales: 15, costs: 6, hours: 2 }], [9, { sales: 15, costs: 6, hours: 2 }]]);
    expect(r.stats).toMatchObject({ count: 3, sales: 20 + 15 + 15, costs: 18, profit: 14 + 9 + 9, hours: 4, newest: '2026-11-07' });
    expect(r.stats.perHour).toBe(Math.round(((14 + 9) / 4) * 100) / 100);     // 14 over 2 h and 9 over 2 h
    expect(r.value).toBe(14 + 9 + 5 + 9);                                      // profit and the gift in; costs never taken out
    expect(r.none).toBe(0);
    expect(r.beforeDate).toBe(1);
    expect(r.voided).toBe(2);
    expect(r.noHours).toBe(7);                                                 // only the 2-hour stand has hours on that date
  });

  test('"What did $10 buy?": every price point is sourced, rounded and in order', async ({ page }) => {
    await open(page, 'Pablo');
    const r = await page.evaluate(() => {
      const P = /** @type {any} */ (window).BancoPrices;
      return { pts: P.POINTS, counts: P.POINTS[0].rows.map(x => P.countFor(x.cents)) };
    });
    expect(r.pts.length).toBeGreaterThan(0);
    for (const pt of r.pts) {
      expect(pt.source).toMatch(/\S{5}/);
      expect(pt.rows.length).toBeGreaterThanOrEqual(3);
      const years = pt.rows.map(x => x.year);
      expect(years).toEqual([...years].sort((a, b) => a - b));
      expect(pt.rows.every(x => Number.isInteger(x.cents) && x.cents > 0)).toBe(true);
    }
    expect(r.counts).toEqual([66, 40, 30, 22, 12]);
    await page.locator('.bk-acc', { hasText: 'Own account' }).click();
    const card = page.locator('.bk-prices');
    await expect(card).toContainText('What did $10 buy?');
    await expect(card).toContainText('66 stamps · 15¢ each');
    await expect(card).toContainText('12 stamps · 78¢ each');
    await expect(card).toContainText('Source: U.S. Postal Service');
    await expect(card).toContainText('instead of only keeping it in a jar');
    await expect(card.locator('.bk-p10')).toHaveCount(5);
  });

  test('parent deposit form: payday split between accounts, then a stand with sales and costs', async ({ page }) => {
    await open(page, 'Pablo');
    await pin(page, '1234');
    await page.locator('.bk-actions').getByRole('button', { name: /Deposit/ }).click();
    await page.getByLabel(/Split between several accounts/).check();
    await expect(page.locator('#bk-f-accbox')).toBeHidden();
    await page.locator('label.bk-chip', { hasText: 'Pablo' }).first().click();
    await page.getByRole('button', { name: 'Add to account' }).click();
    await expect(page.locator('#zsd-toast')).toContainText('Pick at least two accounts');
    await page.locator('label.bk-chip', { hasText: 'Emilia' }).first().click();
    await page.fill('#bk-f-amt', '10.01');
    await page.locator('#bk-f-amt').dispatchEvent('input');
    await expect(page.locator('#bk-m-prev')).toContainText('Pablo: $5.01 + $0.50 match');
    await expect(page.locator('#bk-m-prev')).toContainText('Emilia: $5.00 + $0.50 match');
    await page.getByRole('button', { name: 'Add to account' }).click();
    const two = await page.evaluate(() => JSON.parse(localStorage.getItem('zs_bank')).events.slice(-2));
    expect(two.map(e => [e.type, e.account, e.amount, e.match, e.give, e.by])).toEqual([
      ['deposit', 'pablo', 5.01, 0.5, 0.55, 'parent'], ['deposit', 'emilia', 5, 0.5, 0.55, 'parent']]);
    expect(two[0].group).toBe(two[1].group);
    expect(two[0].group).toBeTruthy();
    await expect(page.locator('.bk-acc').first()).toBeVisible();          // back on the home page

    // A stand: only the profit is deposited.
    await page.locator('.bk-actions').getByRole('button', { name: /Deposit/ }).click();
    await page.selectOption('#bk-f-acc', 'pablo');
    await page.getByLabel(/Record the stand/).check();
    await page.fill('#bk-st-sales', '30');
    await page.fill('#bk-st-costs', '12');
    await page.fill('#bk-st-hours', '2');
    await page.locator('#bk-st-hours').dispatchEvent('input');
    await expect(page.locator('#bk-f-amt')).toHaveValue('18.00');
    await expect(page.locator('#bk-st-profit')).toContainText('Only the profit is deposited');
    await page.fill('#bk-st-costs', '31');
    await expect(page.locator('#bk-st-profit')).toContainText('No profit this time');
    await page.getByRole('button', { name: 'Add to account' }).click();
    await expect(page.locator('#zsd-toast')).toContainText('No profit');
    await page.fill('#bk-st-costs', '12');
    await page.getByRole('button', { name: 'Add to account' }).click();
    const dep = await page.evaluate(() => JSON.parse(localStorage.getItem('zs_bank')).events.slice(-1)[0]);
    expect(dep).toMatchObject({ type: 'deposit', account: 'pablo', amount: 18, match: 1.8, source: 'lemonade', stand: { sales: 30, costs: 12, hours: 2 } });
    // The parent sees the stands card; the costs were not taken out.
    await expect(page.locator('.bk-stands')).toContainText('Sales');
    await expect(page.locator('.bk-stands')).toContainText('$9.00');       // profit per hour
    await expect(page.locator('.bk-stands a')).toHaveAttribute('href', 'mi-negocio.html');
    const out = await page.evaluate(() => JSON.parse(localStorage.getItem('zs_bank')).events.filter(e => e.type === 'withdraw').length);
    expect(out).toBe(0);
  });

  test('a joint stand: custom amounts must add up to the profit', async ({ page }) => {
    await open(page, 'Pablo');
    await pin(page, '1234');
    await page.locator('.bk-actions').getByRole('button', { name: /Deposit/ }).click();
    await page.getByLabel(/Split between several accounts/).check();
    await page.locator('label.bk-chip', { hasText: 'Pablo' }).first().click();
    await page.locator('label.bk-chip', { hasText: 'Emilia' }).first().click();
    await page.locator('label.bk-chip', { hasText: 'Different amounts' }).click();
    await page.getByLabel(/Record the stand/).check();
    await page.fill('#bk-st-sales', '30');
    await page.fill('#bk-st-costs', '10');
    await page.fill('#bk-m-amt-pablo', '15');
    await page.fill('#bk-m-amt-emilia', '3');
    await page.locator('#bk-m-amt-emilia').dispatchEvent('input');
    await expect(page.locator('#bk-m-prev')).toContainText('add up to $18.00, but the profit is $20.00');
    await page.getByRole('button', { name: 'Add to account' }).click();
    await expect(page.locator('#zsd-toast')).toContainText('add up to $18.00');
    await page.fill('#bk-m-amt-emilia', '5');
    await page.getByRole('button', { name: 'Add to account' }).click();
    const two = await page.evaluate(() => JSON.parse(localStorage.getItem('zs_bank')).events.slice(-2));
    expect(two.map(e => [e.account, e.amount, e.stand])).toEqual([
      ['pablo', 15, { sales: 22.5, costs: 7.5 }], ['emilia', 5, { sales: 7.5, costs: 2.5 }]]);
  });

  // Stands are for kids 9 and up (Emilia is 12, Pablo is 8); a parent sees them for everyone.
  const STAND_BANK = (page) => page.addInitScript((bank) => {
    bank.events.push({ id: 'st1', ts: 70, type: 'deposit', account: 'emilia', amount: 14, match: 1.4, give: 1.54, source: 'lemonade', date: '2026-11-02', by: 'parent', stand: { sales: 20, costs: 6, hours: 2 } });
    bank.events.push({ id: 'st2', ts: 71, type: 'deposit', account: 'pablo', amount: 9, match: 0.9, give: 0.99, source: 'lemonade', date: '2026-11-02', by: 'parent', stand: { sales: 15, costs: 6 } });
    localStorage.setItem('zs_bank', JSON.stringify(bank));
  }, BANK);

  test('stand profit shows for a 12-year-old with Mi Negocio link, not for an 8-year-old', async ({ page }) => {
    await STAND_BANK(page);
    await open(page, 'Emilia');
    await page.locator('.bk-acc').first().click();
    const card = page.locator('.bk-stands');
    await expect(card).toContainText('Your stands');
    await expect(card.locator('.bk-tile').nth(0)).toContainText('$20.00');
    await expect(card.locator('.bk-tile').nth(1)).toContainText('−$6.00');
    await expect(card.locator('.bk-tile').nth(2)).toContainText('$14.00');
    await expect(card.locator('.bk-tile').nth(3)).toContainText('$7.00');          // $14 over 2 hours
    await expect(card.locator('a')).toHaveAttribute('href', 'mi-negocio.html');
  });
  test('stand profit is hidden from an 8-year-old', async ({ page }) => {
    await STAND_BANK(page);
    await open(page, 'Pablo');
    await page.locator('.bk-acc', { hasText: 'Own account' }).click();
    await expect(page.locator('.bk-hero-bal')).toBeVisible();
    await expect(page.locator('.bk-stands')).toHaveCount(0);
    await expect(page.locator('.bk-hist')).toContainText('Lemonade stand');
  });

  test('the hub card shows the kid\'s balance', async ({ page }) => {
    await page.addInitScript(([kids, bank, prices]) => {
      localStorage.setItem('zs_profiles', JSON.stringify(kids));
      localStorage.setItem('zs_active_user', JSON.stringify(kids[2]));
      localStorage.setItem('zs_bank', JSON.stringify(bank));
      localStorage.setItem('zs_bank_spx', JSON.stringify({ prices }));
    }, [KIDS, BANK, PRICES]);
    await page.goto('/');
    await expect(page.locator('#stats-bank')).toContainText('🐷 $');
  });
});

test('the Vacation Planner asks for the PIN on its own page', async ({ page }) => {
  await page.addInitScript((kid) => {
    localStorage.setItem('zs_profiles', JSON.stringify([kid]));
    localStorage.setItem('zs_active_user', JSON.stringify(kid));
  }, KIDS[2]);
  await page.goto('/vacation.html');
  await page.getByRole('button', { name: /Unlock to edit/ }).click();
  await page.fill('.zsd-input', '9999');
  await page.click('.zsd-ok');
  await expect(page.getByRole('button', { name: /New trip/ })).toHaveCount(0);
  await page.getByRole('button', { name: /Unlock to edit/ }).click();
  await page.fill('.zsd-input', '1234');
  await page.click('.zsd-ok');
  await expect(page.getByRole('button', { name: /New trip/ })).toBeVisible();
});
