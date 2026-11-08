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

async function open(page, who) {
  await page.clock.setFixedTime(new Date(2026, 10, 7, 10, 0, 0));
  await page.addInitScript(([kids, who, bank, prices]) => {
    localStorage.setItem('zs_profiles', JSON.stringify(kids));
    localStorage.setItem('zs_active_user', JSON.stringify(kids.find(k => k.name === who)));
    if (!localStorage.getItem('zs_bank')) localStorage.setItem('zs_bank', JSON.stringify(bank));
    localStorage.setItem('zs_bank_spx', JSON.stringify({ prices }));
  }, [KIDS, who, BANK, PRICES]);
  await page.goto('/banco.html');
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
