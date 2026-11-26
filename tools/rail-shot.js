// Picture of the owner's iPhone 13: the game gets the top 797pt (drawn under the 47pt clock),
// and the 47pt below is iPhone's cut-off strip, which shows the page background.
const { chromium } = require('playwright');
const fs = require('fs');
const src = process.argv[2], out = process.argv[3];
fs.writeFileSync(out + '.html', fs.readFileSync(src, 'utf8')
  .replace(/env\(safe-area-inset-top, ?0px\)/g, '47px')
  .replace(/env\(safe-area-inset-bottom, ?0px\)/g, '34px')
  .replace("navigator.serviceWorker.register('sw.js')", 'Promise.resolve()'));
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await ctx.newPage();
  await p.goto('file://' + out + '.html');
  await p.addStyleTag({ content: 'body{bottom:auto!important;height:797px!important} :root{--home-bar:0px}' });
  await p.evaluate(() => dispatchEvent(new Event('resize')));
  await p.click('#bankStart');
  await p.click('.chip.c25'); await p.waitForTimeout(600);
  await p.click('#actions button:has-text("Deal")'); await p.waitForTimeout(4500);
  await p.screenshot({ path: out + '.png' });
  await b.close();
})();
