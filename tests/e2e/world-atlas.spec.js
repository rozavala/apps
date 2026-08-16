// @ts-check
const { test, expect } = require('@playwright/test');
const { injectMockProfile } = require('../helpers/utils');

test.describe('World Atlas', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await injectMockProfile(page);
    await page.goto('/world-atlas.html');
  });

  test('loads the home screen with all three modes', async ({ page }) => {
    await expect(page.locator('#wa-title')).toHaveText('World Atlas');
    await expect(page.locator('#wa-mode-browse')).toBeVisible();
    await expect(page.locator('#wa-mode-study')).toBeVisible();
    await expect(page.locator('#wa-mode-quiz')).toBeVisible();
  });

  test('ships data for all 195 countries with complete facts', async ({ page }) => {
    const report = await page.evaluate(() => {
      const data = window.WORLD_ATLAS_DATA;
      return {
        count: data.length,
        missingCapital: data.filter(c => !c.capital).map(c => c.id),
        missingCurrency: data.filter(c => !c.currency || !c.currencyName).map(c => c.id),
        missingPopulation: data.filter(c => !c.population).map(c => c.id),
        missingSpanish: data.filter(c => !c.nameEs || !c.capitalEs || !c.currencyNameEs).map(c => c.id),
        duplicateIds: data.length - new Set(data.map(c => c.id)).size,
        regions: [...new Set(data.map(c => c.region))].sort()
      };
    });

    expect(report.count).toBe(195);
    expect(report.missingCapital).toEqual([]);
    expect(report.missingCurrency).toEqual([]);
    expect(report.missingPopulation).toEqual([]);
    expect(report.missingSpanish).toEqual([]);
    expect(report.duplicateIds).toBe(0);
    expect(report.regions).toEqual(['Africa', 'Americas', 'Asia', 'Europe', 'Oceania']);
  });

  test('browse mode lists every country and filters by search and region', async ({ page }) => {
    await page.click('#wa-mode-browse');
    await expect(page.locator('#wa-browse-count')).toHaveText('195 countries');

    await page.fill('#wa-search', 'chile');
    await expect(page.locator('.wa-row')).toHaveCount(1);
    await expect(page.locator('.wa-row-name')).toHaveText('Chile');

    // Searching by capital works too.
    await page.fill('#wa-search', 'Nairobi');
    await expect(page.locator('.wa-row-name')).toHaveText('Kenya');

    await page.fill('#wa-search', '');
    await page.click('#wa-region-chips .wa-chip[data-region="Oceania"]');
    await expect(page.locator('#wa-browse-count')).toHaveText('14 countries');
  });

  test('country detail shows capital, currency and population', async ({ page }) => {
    await page.click('#wa-mode-browse');
    await page.fill('#wa-search', 'Japan');
    await page.click('.wa-row');

    const detail = page.locator('#wa-detail');
    await expect(detail).toContainText('Japan');
    await expect(detail).toContainText('Tokyo');
    await expect(detail).toContainText('Japanese yen');
    await expect(detail).toContainText('123 million');
    await expect(detail).toContainText('123,100,000');
  });

  test('sorting by population puts India and China on top', async ({ page }) => {
    await page.click('#wa-mode-browse');
    await page.click('#wa-sort-chips .wa-chip[data-sort="pop"]');
    const names = await page.locator('.wa-row-name').allTextContents();
    expect(names.slice(0, 2)).toEqual(['India', 'China']);
  });

  test('study cards flip and record what the child knows', async ({ page }) => {
    await page.click('#wa-mode-study');
    await page.click('.wa-deck[data-deck="Europe"]');

    await expect(page.locator('#wa-card-progress')).toHaveText('1/15');
    await expect(page.locator('#wa-card-btns')).toBeHidden();

    await page.click('#wa-card');
    await expect(page.locator('#wa-card')).toHaveClass(/flipped/);
    await expect(page.locator('#wa-card-btns')).toBeVisible();
    await expect(page.locator('#wa-card-backface')).toContainText('Capital');

    await page.click('#wa-card-know');
    await expect(page.locator('#wa-card-progress')).toHaveText('2/15');

    const stored = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('zs_atlas_test') || '{}'));
    expect(Object.keys(stored.countries || {}).length).toBe(1);
    expect(stored.cardsStudied).toBe(1);
  });

  test('quiz runs ten questions and awards stars', async ({ page }) => {
    await page.click('#wa-mode-quiz');
    await page.click('.wa-deck[data-type="capital"]');
    await page.click('#wa-quiz-start');

    for (let i = 1; i <= 10; i++) {
      await expect(page.locator('#wa-quiz-qnum')).toHaveText(`Question ${i}/10`);
      await expect(page.locator('.wa-option')).toHaveCount(4);

      // Answer correctly by reading the question's own answer from the DOM order.
      const correctIndex = await page.evaluate(() => {
        const q = window.__waCurrentQuestion;
        return q ? q.options.indexOf(q.answer) : 0;
      });
      await page.locator('.wa-option').nth(correctIndex).click();
      await expect(page.locator('.wa-explain')).toBeVisible();
      await page.click('#wa-next');
    }

    await expect(page.locator('.wa-results-score')).toHaveText('10 / 10');
    await expect(page.locator('.wa-results-stars')).toHaveText('⭐⭐⭐');

    const stored = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('zs_atlas_test') || '{}'));
    expect(stored.totalStars).toBe(3);
    expect(stored.quizzes.capital).toBe(10);
  });

  test('every quiz type builds valid questions in every region', async ({ page }) => {
    const problems = await page.evaluate(() => {
      const types = ['capital', 'country', 'currency', 'population', 'flag', 'mixed'];
      const regions = ['all', 'Africa', 'Americas', 'Asia', 'Europe', 'Oceania'];
      const found = [];
      for (const type of types) {
        for (const region of regions) {
          for (let n = 0; n < 5; n++) {
            const qs = window.WorldAtlas._debugBuildQuiz(type, region);
            if (qs.length !== 10) { found.push(`${type}/${region}: ${qs.length} questions`); continue; }
            for (const q of qs) {
              if (q.options.length !== 4) found.push(`${type}/${region}: ${q.options.length} options`);
              if (q.options.indexOf(q.answer) === -1) found.push(`${type}/${region}: answer missing`);
              const labels = q.options.map(o => q.labelOf(o));
              if (new Set(labels).size !== labels.length) {
                found.push(`${type}/${region}: duplicate options (${labels.join(' | ')})`);
              }
            }
          }
        }
      }
      return [...new Set(found)];
    });

    expect(problems).toEqual([]);
  });

  test('switches the whole interface to Spanish', async ({ page }) => {
    await page.click('#wa-lang-toggle');
    await expect(page.locator('#wa-title')).toHaveText('Atlas Mundial');
    await expect(page.locator('#wa-mode-browse-title')).toHaveText('Todos los Países');

    await page.click('#wa-mode-browse');
    await page.fill('#wa-search', 'Alemania');
    await page.click('.wa-row');
    await expect(page.locator('#wa-detail')).toContainText('Berlín');
    await expect(page.locator('#wa-detail')).toContainText('euro');
  });

});
