// The top row (Count, Cashier, Rules, Record) must fit on one line, without overlap, at every phone width.
const { chromium } = require('playwright'); const fs = require('fs');
const src = process.argv[2], out = process.argv[3];
(async () => {
  const b = await chromium.launch(); const res = {};
  for (const [w, h, top, bot] of [[390, 797, 47, 34], [375, 667, 20, 0], [320, 568, 20, 0], [430, 932, 59, 34]]) {
    fs.writeFileSync(out + '.html', fs.readFileSync(src, 'utf8').replace(/env\(safe-area-inset-top, 0px\)/g, top + 'px').replace(/env\(safe-area-inset-bottom, 0px\)/g, bot + 'px').replace("navigator.serviceWorker.register('sw.js')", 'Promise.resolve()'));
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + out + '.html'); await p.click('#bankStart');
    await p.click('.chip.c25'); await p.waitForTimeout(300); await p.click('#actions button:has-text("Deal")'); await p.waitForTimeout(3500);
    const m = await p.evaluate(() => {
      const bs = ['#countBtn', '#openCashier', '#openStuff', '#openRules', '#openRecord'].map(s => document.querySelector(s).getBoundingClientRect());
      const overlap = bs.some((a, i) => bs.slice(i + 1).some(c => a.right > c.left + 0.5 && c.right > a.left + 0.5));
      const R = bs.map(r => [Math.round(r.left), Math.round(r.right)]); return { R, oneLine: new Set(bs.map(r => Math.round(r.top))).size === 1, overlap, inside: bs.every(r => r.left >= 15 && r.right <= innerWidth - 15), labelsWrap: bs.some(r => r.height > 50), pageWider: document.documentElement.scrollWidth > innerWidth };
    });
    res[w + 'x' + h] = { ...m, errors: errs };
    await p.screenshot({ path: `${out}-${w}.png` }); await ctx.close();
  }
  console.log(JSON.stringify(res)); await b.close();
})();
