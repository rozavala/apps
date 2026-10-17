// @ts-check
const { test, expect } = require('@playwright/test');
const { injectMockProfile } = require('../helpers/utils');

// A My Book piece that is also on this week's practice list
const PIECE = {
  id: 9001, title: 'Test Piece', composer: 'From my lesson book', world: 90, difficulty: 3,
  custom: true, alwaysUnlocked: true, isBonus: false, funFact: '', concept: '',
  bpm: { turtle: 56, normal: 80, rabbit: 96, rocket: 112 },
  score: { time: '4/4', key: 'C', rh: 'C4q:1 D4q E4q F4q | G4w', lh: 'C3w | C3w' },
};

async function openWithPiece(page) {
  await page.route(/tail57521e\.ts\.net/, r => r.abort());
  await injectMockProfile(page);
  await page.goto('/little-maestro.html');
  await page.waitForFunction(() => typeof UserManager !== 'undefined' && UserManager.getCurrentUser());
  await page.evaluate((piece) => {
    const key = 'littlemaestro_' + UserManager.getCurrentUser().profile.name.toLowerCase().replace(/\s+/g, '_');
    const data = JSON.parse(localStorage.getItem(key) || '{}');
    data.customSongs = [piece];
    data.assignments = { week: '', note: '', minutesGoal: 15, items: [{ kind: 'song', ref: piece.id, hands: null, text: '' }] };
    localStorage.setItem(key, JSON.stringify(data));
    LMBuilder.syncSongs();
  }, PIECE);
}

test.describe('Little Maestro — deleted My Book pieces', () => {
  test('deleting a piece takes it off the week\'s practice list', async ({ page }) => {
    await openWithPiece(page);
    await page.evaluate(() => LMBuilder.open(9001));
    await page.getByRole('button', { name: 'Delete piece' }).click();
    await page.locator('.zsd-ok').click();
    await expect.poll(() => page.evaluate(() => LMPractice.hasSong(9001))).toBe(false);
    expect(await page.evaluate(() => SONGS.some(s => s.id === 9001))).toBe(false);
  });

  test('a stale list entry or song id does not open an empty lesson', async ({ page }) => {
    await openWithPiece(page);
    // The piece goes away without the list being updated (e.g. deleted before this fix)
    await page.evaluate(() => {
      const key = 'littlemaestro_' + UserManager.getCurrentUser().profile.name.toLowerCase().replace(/\s+/g, '_');
      const data = JSON.parse(localStorage.getItem(key));
      data.customSongs = [];
      localStorage.setItem(key, JSON.stringify(data));
      LMBuilder.syncSongs();
      LMPractice.playItem(0);
    });
    await expect(page.locator('#zsd-toast')).toContainText('isn’t in My Book');
    await expect(page.locator('#screen-lesson')).not.toHaveClass(/active/);

    await page.evaluate(() => { showScreen('lesson'); LessonEngine.startLesson(9999); });
    await expect.poll(() => page.evaluate(() => document.querySelector('.screen.active')?.id)).toMatch(/home/);
  });
});
