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
    expect(r.count).toBe(11);
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
    await expect(page.locator('#tr-money-label')).toHaveText('Saving & Giving · 3 of 11');
    await expect(page.locator('#tr-money-grid .tr-badge')).toHaveCount(11);
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
