const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 797 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
  await p.route(/fonts/, r => r.abort()); await p.goto('http://localhost:8765/blackjack-/'); await p.waitForTimeout(2500);
  console.log(JSON.stringify({ title: await p.title(), heading: await p.textContent('#bankH'), homeLabel: await p.$eval('meta[name="apple-mobile-web-app-title"]', m => m.content) }));
  await p.screenshot({ path: process.argv[2] }); await b.close(); })();
