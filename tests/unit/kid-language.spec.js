// @ts-check
// One language setting per kid: 'es', 'en' or 'both', on the profile.
// With nothing set everything reads as English, as it always did.
const { test, expect } = require('@playwright/test');

async function open(page, lang, path = '/') {
  await page.route(/tail57521e\.ts\.net/, r => r.abort());
  await page.addInitScript((lang) => {
    if (localStorage.getItem('zs_profiles')) return;     // a reload keeps what the test saved
    const p = { name: 'Test', color: 'blue', age: 8, avatar: '🦊' };
    if (lang) p.lang = lang;
    localStorage.setItem('zs_profiles', JSON.stringify([p]));
    localStorage.setItem('zs_active_user', JSON.stringify(p));
  }, lang);
  await page.goto(path);
}

async function openHub(page, lang) {
  await open(page, lang);
  await page.waitForFunction(() => document.getElementById('hub-screen').classList.contains('active'));
}

const desc = (page, href) => page.locator(`a.app-card[href="${href}"] .card-desc`);
const tag = (page, href) => page.locator(`a.app-card[href="${href}"] .card-tag`);

test.describe('Kid language', () => {

  test('a profile with no language reads as English and the hub is unchanged', async ({ page }) => {
    await openHub(page, null);
    expect(await page.evaluate(() => ({ lang: getKidLang(), choice: getKidLangChoice() }))).toEqual({ lang: 'en', choice: null });
    await expect(page.locator('.header p')).toHaveText('Fun learning adventures — pick an app!');
    await expect(desc(page, 'math-galaxy.html')).toHaveText('Master addition, multiplication, and more in a space adventure.');
    await expect(tag(page, 'math-galaxy.html')).toHaveText('🚀 Math');
    // A card that was written in Spanish is in English now, not before.
    await expect(desc(page, 'fe-explorador.html')).toHaveText('Prayers, saints and the Catholic heritage of Chile.');
    await expect(page.locator('.switch-btn')).toContainText('Switch');
  });

  test('Spanish puts the hub in Spanish, cards included', async ({ page }) => {
    await openHub(page, 'es');
    await expect(page.locator('.header p')).toHaveText('Aventuras de aprendizaje: ¡elige una app!');
    await expect(desc(page, 'math-galaxy.html')).toHaveText('Domina la suma, la multiplicación y más en una aventura espacial.');
    await expect(tag(page, 'math-galaxy.html')).toHaveText('🚀 Matemáticas');
    await expect(desc(page, 'fe-explorador.html')).toHaveText('Oraciones, santos y herencia católica de Chile.');
    await expect(page.locator('.switch-btn')).toContainText('Cambiar');
    await expect(page.locator('#ub-greeting')).toContainText(/¡Buen/);
    await expect(page.locator('#schedule-day')).toContainText('hoy');
    await expect(page.locator('.footer')).toContainText('Hecho con ♥ para los niños Zavala Serra');
  });

  test('both shows Spanish first with the English under it', async ({ page }) => {
    await openHub(page, 'both');
    const d = desc(page, 'math-galaxy.html');
    await expect(d).toContainText('Domina la suma');
    await expect(d.locator('.zs-sub')).toHaveText('Master addition, multiplication, and more in a space adventure.');
    await expect(tag(page, 'math-galaxy.html')).toHaveText('🚀 Matemáticas · 🚀 Math');
  });

  test('every hub card has both languages, and the English is what the page already said', async ({ page }) => {
    await openHub(page, null);
    const html = await (await page.request.get('/index.html')).text();
    const out = await page.evaluate((html) => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const bad = [];
      doc.querySelectorAll('a.app-card').forEach(a => {
        const href = a.getAttribute('href');
        // @ts-ignore
        const c = ZsLang.cards[href];
        if (!c) { bad.push(href + ': no entry'); return; }
        const d = a.querySelector('.card-desc').textContent.trim();
        const g = a.querySelector('.card-tag').textContent.trim();
        // Written in English or in Spanish, the page's own text is one of the two.
        if (d !== c.d[1] && d !== c.d[0]) bad.push(href + ': description is in neither');
        if (g !== c.g[1] && g !== c.g[0]) bad.push(href + ': tag is in neither');
        if (!c.d[0] || !c.d[1] || !c.g[0] || !c.g[1]) bad.push(href + ': empty string');
      });
      // @ts-ignore
      const extra = Object.keys(ZsLang.cards).filter(h => !doc.querySelector('a.app-card[href="' + h + '"]'));
      return { bad, extra, cards: doc.querySelectorAll('a.app-card').length };
    }, html);
    expect(out.cards).toBeGreaterThan(30);
    expect(out.bad).toEqual([]);
    expect(out.extra, 'dictionary entries for cards that are gone').toEqual([]);
  });

  test('the profile editor saves the language, pushes it, and leaves progress alone', async ({ page }) => {
    await openHub(page, null);
    await page.evaluate(() => {
      localStorage.setItem('zs_math_test', '{"stars":3}');
      // @ts-ignore
      window.__pushed = null;
      // @ts-ignore
      CloudSync.overwriteProfiles = (p) => { window.__pushed = JSON.parse(JSON.stringify(p)); };
      // @ts-ignore
      window.openEditModal(0);
    });
    await expect(page.locator('#edit-lang-picker button')).toHaveCount(3);
    await expect(page.locator('#edit-lang-picker button.selected')).toHaveAttribute('data-lang', 'en');
    await page.locator('#edit-lang-picker button[data-lang="es"]').click();
    await page.locator('#edit-modal .btn-create').click();

    const out = await page.evaluate(() => ({
      saved: JSON.parse(localStorage.getItem('zs_profiles'))[0].lang,
      active: JSON.parse(localStorage.getItem('zs_active_user')).lang,
      // @ts-ignore
      pushed: window.__pushed && window.__pushed[0].lang,
      progress: localStorage.getItem('zs_math_test')
    }));
    expect(out).toEqual({ saved: 'es', active: 'es', pushed: 'es', progress: '{"stars":3}' });
    await expect(page.locator('.header p')).toHaveText('Aventuras de aprendizaje: ¡elige una app!');
  });

  test('saving a profile without touching the language does not write one', async ({ page }) => {
    await openHub(page, null);
    await page.evaluate(() => { /* @ts-ignore */ window.openEditModal(0); });
    await page.locator('#edit-modal .btn-create').click();
    expect(await page.evaluate(() => 'lang' in JSON.parse(localStorage.getItem('zs_profiles'))[0])).toBe(false);
  });

  test('Parents Corner sets a kid\'s language and the hub follows', async ({ page }) => {
    await openHub(page, null);
    await page.evaluate(() => {
      // @ts-ignore
      window.__pushed = null;
      // @ts-ignore
      CloudSync.overwriteProfiles = (p) => { window.__pushed = JSON.parse(JSON.stringify(p)); };
      // @ts-ignore
      window.openParentsCorner();
    });
    await page.locator('select.pk-lang').selectOption('es');
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('zs_profiles'))[0].lang)).toBe('es');
    // @ts-ignore
    expect(await page.evaluate(() => window.__pushed[0].lang)).toBe('es');
    await expect(page.locator('.header p')).toHaveText('Aventuras de aprendizaje: ¡elige una app!');
  });

  test('a language that is not es, en or both is ignored', async ({ page }) => {
    await openHub(page, 'fr');
    const out = await page.evaluate(() => ({
      lang: getKidLang(), choice: getKidLangChoice(),
      rejects: setKidLang('Test', 'fr'), nobody: setKidLang('Nobody', 'es'),
      still: JSON.parse(localStorage.getItem('zs_profiles'))[0].lang
    }));
    expect(out).toEqual({ lang: 'en', choice: null, rejects: false, nobody: false, still: 'fr' });
  });

  test('zsT picks the text for the kid\'s language', async ({ page }) => {
    await open(page, 'es', '/menu.html');       // any page that loads auth.js
    expect(await page.evaluate(() => zsT('hola', 'hello'))).toBe('hola');
    await page.evaluate(() => setKidLang('Test', 'both'));
    expect(await page.evaluate(() => zsT('hola', 'hello'))).toBe('hola · hello');
    await page.evaluate(() => setKidLang('Test', 'en'));
    expect(await page.evaluate(() => zsT('hola', 'hello'))).toBe('hello');
  });

  test('dialogs say their own words in the kid\'s language', async ({ page }) => {
    await open(page, 'es', '/shopping-list.html');
    await page.waitForFunction(() => !!window.ZsDialog);
    await page.evaluate(() => { /* @ts-ignore */ window.ZsDialog.confirm({ message: 'x' }); });
    await expect(page.locator('.zsd-title')).toHaveText('¿Seguro?');
    await expect(page.locator('.zsd-cancel')).toHaveText('Cancelar');
    await expect(page.locator('.zsd-ok')).toHaveText('Aceptar');
  });

  test('the top bar of an app follows the language', async ({ page }) => {
    await open(page, 'es', '/math-galaxy.html');
    await expect(page.locator('#zs-nav .home-btn')).toHaveAttribute('title', 'Volver a las apps');
  });

  for (const [page_, label] of [['/world-atlas.html', 'World Atlas'], ['/vocabulario-vivo.html', 'Vocabulario Vivo'],
                                ['/civics-lab.html', 'Civics Lab'], ['/bible-explorer.html', 'Bible Explorer'],
                                ['/guess-quest.html', 'Guess Quest']]) {
    test(label + ' opens in the kid\'s language', async ({ page }) => {
      await open(page, 'es', page_);
      await page.waitForFunction(() => document.documentElement.lang === 'es');
    });
  }

  test('an app keeps its own saved language when the kid has none set, or both', async ({ browser }) => {
    for (const lang of [null, 'both']) {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      // The kid switched World Atlas to Spanish themselves, earlier.
      await page.addInitScript(() => localStorage.setItem('zs_atlas_test', JSON.stringify({ lang: 'es' })));
      await open(page, lang, '/world-atlas.html');
      await page.waitForFunction(() => document.documentElement.lang === 'es');
      await ctx.close();
    }
  });

  test('an explicit English beats the language the kid saved in an app', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('zs_atlas_test', JSON.stringify({ lang: 'es' })));
    await open(page, 'en', '/world-atlas.html');
    await page.waitForFunction(() => document.getElementById('wa-lang-label') && document.getElementById('wa-lang-label').textContent === 'EN');
    expect(await page.evaluate(() => document.documentElement.lang)).not.toBe('es');
  });
  test('the hub\'s widgets and counters follow the language', async ({ page }) => {
    await openHub(page, 'es');
    await expect(page.locator('#routines-widget')).toContainText('por hacer');
    await expect(page.locator('#timer-display')).toContainText('quedan');
    await expect(page.locator('#next-challenge-wrap')).toContainText(/¡Prueba algo nuevo!|¡Sigue practicando!/);
  });

  test('both keeps the counters short: Spanish only, not said twice', async ({ page }) => {
    await openHub(page, 'both');
    await expect(page.locator('#timer-display')).toHaveText(/^⏰ quedan \d+ min$/);
    await expect(page.locator('#schedule-day')).toContainText('apps hoy');
    await expect(page.locator('#schedule-day')).not.toContainText('apps today');
  });

  test('English keeps the widgets as they were', async ({ page }) => {
    await openHub(page, null);
    await expect(page.locator('#routines-widget')).toContainText('to do');
    await expect(page.locator('#timer-display')).toContainText('min left');
  });
});
