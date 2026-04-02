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
    await new Promise(r => setTimeout(r, 1000)); //(1000);

    const countBefore = await page.evaluate(() => window._parseCount);

    // Trigger export
    await page.evaluate(() => {
        if(typeof exportProgress === 'function') {
            exportProgress();
        } else {
            console.error("exportProgress not found");
        }
    });

    const countAfter = await page.evaluate(() => window._parseCount);
    console.log(`JSON parses before export: ${countBefore}`);
    console.log(`JSON parses after export: ${countAfter}`);
    console.log(`Parses during export: ${countAfter - countBefore}`);

    await browser.close();
})();
