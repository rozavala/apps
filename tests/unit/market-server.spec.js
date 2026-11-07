// @ts-check
// The S&P 500 closes Banco Familia uses: vps/market.js with a fake
// fetch, so no request leaves the machine.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const os = require('os');
const path = require('path');
const market = require('../../vps/market.js');

const CSV = 'Date,Open,High,Low,Close,Volume\n' +
  '2019-12-31,1,1,1,3230.78,1\n' +
  ['2026-11-02,1,1,1,6700.10,1', '2026-11-03,1,1,1,6712.55,1', '2026-11-04,1,1,1,6690.00,1',
   '2026-11-05,1,1,1,6720.25,1', '2026-11-06,1,1,1,6731.80,1'].join('\n');

function yahoo(closes) {
  // 14:30 UTC = 9:30 New York, the session open Yahoo stamps.
  const t0 = Date.UTC(2026, 10, 2, 14, 30) / 1000;
  return JSON.stringify({ chart: { result: [{
    timestamp: closes.map((_, i) => t0 + i * 86400),
    indicators: { quote: [{ close: closes }] } }] } });
}


test('Stooq CSV parses, keeping only real closes from 2020 on', () => {
  const p = market.parseStooq(CSV);
  expect(Object.keys(p)).toEqual(['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06']);
  expect(p['2026-11-06']).toBe(6731.8);
  expect(market.parseStooq('Exceeded the daily hits limit')).toEqual({});
});

test('Yahoo JSON parses to New York trading dates and skips gaps', () => {
  const p = market.parseYahoo(JSON.parse(yahoo([6700, null, 6712.5])));
  expect(p).toEqual({ '2026-11-02': 6700, '2026-11-04': 6712.5 });
});

test('falls back to Yahoo, keeps history, and survives a restart', async () => {
  const warn = console.warn; console.warn = () => {};
  try {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'market-test-'));
  const calls = [];
  const fakeFetch = async (url) => {
    calls.push(url);
    if (url.includes('stooq')) return { ok: true, text: async () => 'Exceeded the daily hits limit' };
    return { ok: true, text: async () => yahoo([6700, 6710, 6720, 6730, 6740]) };
  };
  const m = market.create(dir, fakeFetch);
  expect(m.stale()).toBe(true);
  expect(await m.refresh()).toBe(true);
  expect(calls.map(u => new URL(u).hostname)).toEqual(['stooq.com', 'query1.finance.yahoo.com']);
  const r = m.read();
  expect(r.source).toBe('yahoo');
  expect(Object.keys(r.prices).length).toBe(5);
  expect(m.read('2026-11-05').prices).toEqual({ '2026-11-05': 6730, '2026-11-06': 6740 });

  // Both sources down: the table on disk is still served.
  const down = market.create(dir, async () => { throw new Error('offline'); });
  expect(Object.keys(down.read().prices).length).toBe(5);
  expect(await down.refresh()).toBe(false);
  expect(Object.keys(down.read().prices).length).toBe(5);
  } finally { console.warn = warn; }
});
