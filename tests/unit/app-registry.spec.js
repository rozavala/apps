// @ts-check
// Every app has to be wired into the same lists: the hub, the weekly
// schedule (the allocator in Parents Corner), the Parent Dashboard, the
// Sunday Report, the Trophy Room, the Progress Manager and sync. A new app
// that forgets one of them is easy to miss by hand, so this reads the
// source files and checks them all. Older gaps that are on purpose are
// listed in EXCEPTIONS with the reason; anything else fails.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

const hubPlan = read('js/hub-plan.js');
const schedule = read('js/schedule.js');
const indexHtml = read('index.html');
const indexJs = read('js/index.js');
const auth = read('js/auth.js');
const sync = read('js/sync.js');
const sunday = read('js/sunday-report.js');
const trophy = read('js/trophy-room.js');
const progressAdmin = read('js/progress-admin.js');

// HubPlan.APPS: one row per hub card. list: false marks pages that are not
// activities (Trophy Room, Book & Movie Check, Banco Familia, Patrón).
const APPS = [...hubPlan.matchAll(/\{ id: '(\w+)',\s+href: '([^']+)',[^\n]*/g)]
  .map(m => ({ id: m[1], href: m[2], list: !/list: false/.test(m[0]) }));
const STAR_PREFIX = {};
for (const m of auth.matchAll(/\{ id: '(\w+)',\s*prefix: '([^']+)'/g)) STAR_PREFIX[m[1]] = m[2];
const SCHEDULED = [...schedule.matchAll(/id: '(\w+)',\s*card: '([^']+)'([^}]*)/g)]
  .map(m => ({ id: m[1], card: m[2], always: /alwaysVisible/.test(m[3]) }));
const smartPart = schedule.split('var SMART_SCHEDULE')[1] || '';

// Checks an app can skip, and why. Keep this short: new apps go everywhere.
const EXCEPTIONS = {
  // Always on the hub, not rotated by the weekly schedule.
  schedule: ['code', 'vocab', 'civics', 'faith', 'bible', 'invest', 'sports', 'worldcup', 'review'],
  // Pages, not activities: no star rule of their own.
  starRule: ['code' /* stars under 'codecadet' */],
  // The Trophy Room lists these under other pages or not at all.
  trophy: ['quest', 'atlas', 'move'],
  // Progress Manager: Repaso is the review queue of other apps.
  progressAdmin: ['review'],
  // "What to do next" on the hub has hand-written progress checks for these
  // older apps; they are left out of it on purpose.
  nextChallenge: ['guess', 'vocab', 'quest', 'civics', 'bible', 'money', 'invest', 'worldcup', 'review', 'code'],
};
const skip = (check, id) => (EXCEPTIONS[check] || []).includes(id);

const learning = APPS.filter(a => a.list);

test('HubPlan has the apps', () => {
  expect(APPS.length).toBeGreaterThan(40);
});

for (const a of learning) {
  test(`${a.id} is wired into every list`, () => {
    const missing = [];
    if (!indexHtml.includes(`href="${a.href}"`)) missing.push('hub card (index.html)');
    if (!new RegExp(`\\b${a.id}: ['"]`).test(sunday)) missing.push('Sunday Report APP_NAMES');
    if (!skip('trophy', a.id) && !trophy.includes(`'${a.href}'`)) missing.push('Trophy Room');
    if (!skip('progressAdmin', a.id) && !progressAdmin.includes(`'${a.href}'`)) missing.push('Progress Manager');
    const sch = SCHEDULED.find(s => s.id === a.id);
    if (!skip('schedule', a.id)) {
      if (!sch) missing.push('weekly schedule ALL_APPS');
      else if (!sch.always && !new RegExp(`'${a.id}'`).test(smartPart)) missing.push('a day in SMART_SCHEDULE');
    }
    const prefix = STAR_PREFIX[a.id];
    if (!skip('starRule', a.id)) {
      if (!prefix) missing.push('star rule (APP_STAR_CONFIGS)');
      else {
        if (!sync.includes(`'${prefix}'`)) missing.push('sync KEY_MAP');
        if (!skip('nextChallenge', a.id) && !indexJs.includes(`schedId: '${a.id}'`)) missing.push('hub "next challenge" list');
      }
    }
    expect(missing, `${a.id} (${a.href}) is missing from`).toEqual([]);
  });
}

test('every scheduled app has a hub card and a HubPlan row', () => {
  for (const s of SCHEDULED) {
    expect(indexHtml.includes(s.card.slice(1)), s.id + ' card ' + s.card).toBe(true);
    expect(APPS.some(a => a.id === s.id), s.id + ' in HubPlan.APPS').toBe(true);
  }
});

test('the exceptions only name apps that exist', () => {
  const ids = APPS.map(a => a.id);
  for (const k of Object.keys(EXCEPTIONS)) {
    for (const id of EXCEPTIONS[k]) expect(ids, `${k}: ${id}`).toContain(id);
  }
});
