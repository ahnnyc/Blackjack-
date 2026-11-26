// Stand-in for the owner's iPhone 13 home-screen app (drawn under the 47pt clock bar,
// screen reported 797 instead of 844) and for a normal one, and checks the layout.
const { chromium } = require('playwright');
const fs = require('fs');
const src = process.argv[2], out = process.argv[3];
fs.writeFileSync(out + '.html', fs.readFileSync(src, 'utf8')
  .replace(/env\(safe-area-inset-top, ?0px\)/g, '47px')
  .replace(/env\(safe-area-inset-bottom, ?0px\)/g, '34px')
  .replace("navigator.serviceWorker.register('sw.js')", 'Promise.resolve()'));
(async () => {
  const b = await chromium.launch();
  const res = {};
  for (const [name, h] of [['iPhone 13 as reported (797)', 797], ['normal iPhone (844)', 844]]) {
    const ctx = await b.newContext({ viewport: { width: 390, height: h }, screen: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    await ctx.addInitScript(() => Object.defineProperty(navigator, 'standalone', { get: () => true }));
    await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
    const p = await ctx.newPage();
    await p.goto('file://' + out + '.html');
    await p.click('#bankStart');
    await p.click('.chip.c25'); await p.waitForTimeout(400);
    await p.click('#actions button:has-text("Deal")'); await p.waitForTimeout(4500);
    res[name] = await p.evaluate(() => {
      const r = s => document.querySelector(s).getBoundingClientRect();
      const low = Math.max(...[...document.querySelectorAll('#actions button')].map(b => b.getBoundingClientRect().bottom));
      return { homeBarMargin: getComputedStyle(document.querySelector('#ctl')).paddingBottom, topButtons: Math.round(r('#openRules').top),
        lowestButton: Math.round(low), visibleBottom: innerHeight, cutOff: low > innerHeight, scrolls: document.scrollingElement.scrollHeight > innerHeight };
    });
    await p.screenshot({ path: out + '-' + h + '.png' });
    await ctx.close();
  }
  console.log(JSON.stringify(res));
  await b.close();
})();
