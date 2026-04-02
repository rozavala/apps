const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();

    // Inject mock data
    await page.evaluateOnNewDocument(() => {
        window.localStorage.setItem('zs_profiles', JSON.stringify([
            {name: 'Alice', age: 8},
            {name: 'Bob', age: 6}
        ]));

        // Add some mock app data to trigger parsing
        window.localStorage.setItem('zs_mathgalaxy_alice', '{"L1":{"bestStars":3}}');
        window.localStorage.setItem('zs_mathgalaxy_bob', '{"L1":{"bestStars":2}}');

        // Count parses
        window._parseCount = 0;
        const _origParse = JSON.parse;
        JSON.parse = function(str) {
            window._parseCount++;
            return _origParse(str);
        };
    });

    await page.goto('http://localhost:8000/index.html');

    // Wait for load
    await new Promise(r => setTimeout(r, 1000));

    const countBefore = await page.evaluate(() => window._parseCount);

    // Trigger export
    await page.evaluate(() => {
        if(typeof exportProgress === 'function') {
            // override the blob creation so we don't trigger download
            const oldCreateObjectURL = URL.createObjectURL;
            URL.createObjectURL = () => "blob:mock";
            exportProgress();
            URL.createObjectURL = oldCreateObjectURL;
        } else {
            console.error("exportProgress not found");
        }
    });

    const countAfter = await page.evaluate(() => window._parseCount);
    console.log(`JSON parses before export: ${countBefore}`);
    console.log(`JSON parses after export: ${countAfter}`);
    console.log(`Parses during export: ${countAfter - countBefore}`);

    const exportDataStr = await page.evaluate(() => {
        const _profiles = window.getProfiles();
        const testData = {
          profiles: _profiles.map(p => {
            const key = p.name.toLowerCase().replace(/\s+/g, '_');
            const stats = typeof getPlayerStats === 'function' ? getPlayerStats(p.name) : { appStats: {} };
            const appStats = stats.appStats || {};
            return {
              name: p.name,
              apps: {
                math: appStats.math || JSON.parse(localStorage.getItem(`zs_mathgalaxy_${key}`) || '{}'),
              }
            }
          })
        };
        return JSON.stringify(testData);
    });
    console.log(`Export data: ${exportDataStr}`);

    await browser.close();
})();
