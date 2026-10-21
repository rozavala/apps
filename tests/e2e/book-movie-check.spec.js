// @ts-check
const { test, expect } = require('@playwright/test');
const { injectMockProfile } = require('../helpers/utils');

const FLAGS_NONE = { lgbtq_content: 'none', crt_ideology: 'none', sexual_content: 'none', violence: 'none', scary_content: 'none',
  profanity: 'none', occult_aspirational: 'none', anti_religious: 'none', moral_relativism: 'none', disrespect_authority: 'none' };

// Like the Heroes of Olympus check: the parent-facing reasoning names the topic.
const CAUTION = {
  canonical_id: 'test-caution', title: 'The Lost Hero', type: 'book', author_or_director: 'Rick Riordan', year: 2010,
  summary: 'Three demigod teenagers embark on a dangerous quest to rescue the captured goddess Hera.',
  minimum_age: 10, ideal_age_range: '10-12', verdict: 'caution', confidence: 'high',
  verdict_reasoning: 'While this book contains no LGBTQ content, later books introduce same-sex romance and gender ideology.',
  content_flags: Object.assign({}, FLAGS_NONE, { violence: 'moderate', moral_relativism: 'mild' }),
  positive_flags: { virtue_modeled: true },
  specific_concerns: ['Later books in the series feature a same-sex romance.', 'Frequent monster battles.'],
  parent_notes: 'Read ahead before letting them continue the series.',
};

const APPROVED = Object.assign({}, CAUTION, {
  canonical_id: 'test-approved', title: 'A Quiet Classic', verdict: 'approved', minimum_age: 6,
  verdict_reasoning: 'Free of sexual content and racial ideology; models courage.',
  content_flags: Object.assign({}, FLAGS_NONE, { scary_content: 'mild', sexual_content: 'mild' }),
  specific_concerns: ['A brief kiss between married adults.', 'One scary storm scene.'],
});

async function open(page) {
  await page.route(/tail57521e\.ts\.net/, r => r.abort());
  await injectMockProfile(page);
  await page.goto('/book-movie-check.html');
  await page.waitForFunction(() => typeof BMC !== 'undefined' && !!document.getElementById('bmc-result'));
  await page.waitForLoadState('networkidle');   // the library fetch settles and the home screen renders
}

// Show a result the way a lookup does, and read what's on screen.
async function show(page, e) {
  await page.evaluate((e) => { BMC.showResult(e); BMC.showTab('result'); }, e);
  await expect(page.locator('#bmc-result')).toBeVisible();
  return page.locator('#bmc-result').innerText();
}

test.describe('Book & Movie Check — what kids read', () => {
  test('a "needs care" result shows a plain message, not the evaluator\'s reasoning', async ({ page }) => {
    await open(page);
    const text = await show(page, CAUTION);
    expect(text).toContain('Needs care');
    expect(text).toContain('Ask Mom or Dad about this one before you start.');
    expect(text).toContain('Three demigod teenagers');            // the plot is fine to read
    expect(text).not.toMatch(/LGBTQ|same-sex|gender|romance|later books/i);
    expect(text).not.toContain('Read ahead');                      // parent notes stay hidden
  });

  test('an approved result shows no content commentary beyond practical chips', async ({ page }) => {
    await open(page);
    const text = await show(page, APPROVED);
    expect(text).toContain('This one is a good fit for our family. Enjoy!');
    expect(text).toContain('Scary · mild');
    expect(text).not.toMatch(/Sexual|racial|kiss|Things to know/i);
  });

  test('a summary that touches the topic is hidden from kids', async ({ page }) => {
    await open(page);
    const text = await show(page, Object.assign({}, CAUTION, { summary: 'A girl with two moms moves to a new town.' }));
    expect(text).toContain('Needs care');
    expect(text).not.toContain('two moms');
  });

  test('parents still see everything after the PIN', async ({ page }) => {
    await open(page);
    await show(page, CAUTION);
    await page.evaluate(() => {
      ZsDialog.prompt = () => Promise.resolve('1234');
      BMC.unlockParent();
    });
    await expect(page.locator('#bmc-result')).toContainText('later books introduce same-sex romance');
    const text = await page.locator('#bmc-result').innerText();
    expect(text).toContain('Later books in the series feature a same-sex romance.');
    expect(text).toContain('Read ahead before letting them continue the series.');
    expect(text).toContain('Moral relativism · mild');
  });
});
