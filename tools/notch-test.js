// Loads the home-screen build as an iPhone would show it (clock bar on top, home bar below)
// and checks nothing is pushed off the screen.
const { chromium } = require('playwright');
const fs = require('fs');
const src = process.argv[2], out = process.argv[3];
const TOP = Number(process.env.TOP || 59), BOTTOM = Number(process.env.BOTTOM || 34);
(async () => {
  let html = fs.readFileSync(src, 'utf8')
    .replace(/env\(safe-area-inset-top, 0px\)/g, TOP + 'px')
    .replace(/env\(safe-area-inset-bottom, 0px\)/g, BOTTOM + 'px')
    .replace("navigator.serviceWorker.register('sw.js')", 'Promise.resolve()');
  fs.writeFileSync(out + '.html', html);
  const b = await chromium.launch();
  const results = [];
  for (const [w, h] of (process.env.SIZES ? JSON.parse(process.env.SIZES) : [[390, 844], [375, 667], [430, 932], [320, 568]])) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
    const p = await ctx.newPage();
    await p.goto('file://' + out + '.html');
    await p.click('#bankStart');
    await p.click('.chip.c25'); await p.waitForTimeout(400);
    await p.click('#actions button:has-text("Deal")'); await p.waitForTimeout(4500);
    const m = await p.evaluate(() => {
      const r = s => document.querySelector(s).getBoundingClientRect();
      const se = document.scrollingElement;
      return { scrolledDown: se.scrollTop, pageTaller: se.scrollHeight > innerHeight,
        topButtons: Math.round(r('#openRules').top), lowestButton: Math.round(Math.max(...[...document.querySelectorAll('#actions button')].map(b => b.getBoundingClientRect().bottom))), screen: innerHeight };
    });
    m.topClear = m.topButtons >= TOP; m.bottomClear = m.lowestButton <= m.screen - BOTTOM;
    results.push({ size: w + 'x' + h, ...m });
    if (w === 390) await p.screenshot({ path: out + '-390.png' });
    await ctx.close();
  }
  console.log(JSON.stringify(results));
  await b.close();
})();
