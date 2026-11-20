// @ts-check
// vps/routines-merge.js: the server keeps the last EDITED checklist
// (templatesTs), not the copy that reached it last.
const { test, expect } = require('@playwright/test');
const merge = require('../../vps/routines-merge.js');

const list = (id) => ({ evening: [{ id, label: id }] });

test('the last edited list wins, whichever copy arrives later', () => {
  const edited = { templates: list('new'), templatesTs: 2000, _syncedAt: '2026-11-19T10:00:00Z' };
  const stale = { templates: list('old'), templatesTs: 1000, _syncedAt: '2026-11-19T12:00:00Z' };
  expect(merge(edited, stale).templates.evening[0].id).toBe('new');
  expect(merge(edited, stale).templatesTs).toBe(2000);
  expect(merge(stale, edited).templates.evening[0].id).toBe('new');
});

test('an edited list beats a copy from before edit times existed', () => {
  const legacy = { templates: list('old'), _syncedAt: '2026-11-19T12:00:00Z' };
  const edited = { templates: list('new'), templatesTs: 5, _syncedAt: '2026-11-19T10:00:00Z' };
  expect(merge(legacy, edited).templates.evening[0].id).toBe('new');
  expect(merge(edited, legacy).templates.evening[0].id).toBe('new');
});

test('two copies without edit times: the incoming one wins, as before', () => {
  const a = { templates: list('a'), _syncedAt: '2026-11-19T10:00:00Z' };
  const b = { templates: list('b'), _syncedAt: '2026-11-19T10:00:00Z' };
  expect(merge(a, b).templates.evening[0].id).toBe('b');
  expect(merge(a, b).templatesTs).toBeUndefined();
});
