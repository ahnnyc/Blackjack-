// Fakes a home-screen app on an iPhone 13 (clock bar 47) that reports its height one clock-bar short,
// and a normal one, and checks the correction fires only in the first case.
const { chromium } = require('playwright');
const fs = require('fs');
const src = process.argv[2], out = process.argv[3];
const html = fs.readFileSync(src, 'utf8')
  .replace(/env\(safe-area-inset-top, ?0px\)/g, '47px')
  .replace(/env\(safe-area-inset-bottom, ?0px\)/g, '34px')
  .replace("navigator.serviceWorker.register('sw.js')", 'Promise.resolve()');
fs.writeFileSync(out, html);
(async () => {
  const b = await chromium.launch();
  const res = {};
  for (const [name, h] of [['reports short', 797], ['reports full', 844]]) {
    const ctx = await b.newContext({ viewport: { width: 390, height: h }, screen: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await ctx.addInitScript(() => Object.defineProperty(navigator, 'standalone', { get: () => true }));
    const p = await ctx.newPage();
    await p.goto('file://' + out);
    await p.waitForTimeout(300);
    res[name] = await p.evaluate(() => ({ innerHeight, bodyHeight: Math.round(document.body.getBoundingClientRect().height), correctionOn: document.body.style.height !== '' }));
    await ctx.close();
  }
  console.log(JSON.stringify(res));
  await b.close();
})();
