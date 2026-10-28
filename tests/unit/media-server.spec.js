// @ts-check
// Server-side Book & Movie Check: runs vps/media.js in Node with a fake
// Gemini, so no request leaves the machine.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const os = require('os');
const path = require('path');

const EVALUATION = {
  title: 'The Lost Hero', type: 'book', author_or_director: 'Rick Riordan', year: 2010,
  summary: 'Three demigods go on a quest.', minimum_age: 10, ideal_age_range: '10-12', verdict: 'caution',
  verdict_reasoning: 'Mythological violence.', content_flags: { lgbtq_content: 'none' }, positive_flags: {},
  specific_concerns: [], parent_notes: '', confidence: 'high',
};

function loadMedia() {
  process.env.AI_PROVIDER = 'gemini';
  process.env.GEMINI_API_KEY = 'test-key';
  const file = require.resolve('../../vps/media.js');
  delete require.cache[file];
  const media = require(file);
  const routes = {};
  const app = { get: (p, h) => { routes['GET ' + p] = h; }, post: (p, h) => { routes['POST ' + p] = h; }, delete: () => {} };
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'media-test-'));
  const log = console.log; console.log = () => {};
  try { media.init(app, dir); } finally { console.log = log; }
  return { routes, dir };
}

function call(handler, body) {
  return new Promise((resolve) => {
    const res = {
      statusCode: 200,
      status(c) { this.statusCode = c; return this; },
      json(b) { resolve({ status: this.statusCode, body: b }); },
    };
    handler({ body, ip: '127.0.0.1' }, res);
  });
}

test('evaluations use Argon and read a reply split into thought and answer parts', async () => {
  const { routes } = loadMedia();
  const calls = [];
  const realFetch = global.fetch;
  // @ts-ignore
  global.fetch = async (url) => {
    const u = String(url);
    calls.push(u);
    if (u.includes('wikipedia.org')) return { ok: false, status: 404, json: async () => ({}) };
    return {
      ok: true, status: 200,
      json: async () => ({ candidates: [{ content: { parts: [
        { text: 'Let me think about the series…', thought: true },
        { text: '```json\n' + JSON.stringify(EVALUATION).slice(0, 40) },
        { text: JSON.stringify(EVALUATION).slice(40) + '\n```' },
      ] } }] }),
    };
  };
  try {
    const out = await call(routes['POST /api/media/evaluate'], {
      canonical_id: 'title:the-lost-hero-2010-rick-riordan',
      metadata: { title: 'The Lost Hero', author_or_director: 'Rick Riordan', year: 2010, type: 'book' },
    });
    expect(out.status).toBe(200);
    expect(out.body).toMatchObject({ title: 'The Lost Hero', verdict: 'caution' });
    expect(out.body._debug.model).toBe('gemini-4-argon');
    expect(calls.find(u => u.includes('generativelanguage'))).toContain('/models/gemini-4-argon:generateContent');
  } finally {
    global.fetch = realFetch;
  }
});
