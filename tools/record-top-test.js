// Opens the Record screen on the home-screen build as an iPhone draws it and checks its top clears the clock.
const { chromium } = require('playwright'); const fs = require('fs');
const src = process.argv[2], out = process.argv[3];
(async () => {
  const b = await chromium.launch(); const res = [];
  for (const [w, h, top, bot] of [[390, 797, 47, 34], [390, 844, 47, 34], [375, 667, 20, 0], [320, 568, 20, 0]]) {
    const html = fs.readFileSync(src, 'utf8').replace(/env\(safe-area-inset-top, 0px\)/g, top + 'px').replace(/env\(safe-area-inset-bottom, 0px\)/g, bot + 'px').replace("navigator.serviceWorker.register('sw.js')", 'Promise.resolve()');
    fs.writeFileSync(out + '.html', html);
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('file://' + out + '.html');
    await p.click('#bankStart');
    for (const id of ['#openRecord', '#openRules', '#openCashier']) {
      await p.click(id); await p.waitForTimeout(500);
      const m = await p.evaluate(() => { const s = [...document.querySelectorAll('.sheet')].find(x => !x.hidden); const pn = s.querySelector('.panel').getBoundingClientRect(); const d = s.querySelector('[data-close]'); return { panelTop: Math.round(pn.top), doneTop: d ? Math.round(d.getBoundingClientRect().top) : null }; });
      res.push({ size: w + 'x' + h, screen: id.slice(5), ...m, clear: m.panelTop >= top + 44 });
      if (w === 390 && h === 797 && id === '#openRecord') await p.screenshot({ path: out + '-record.png' });
      await p.click('.sheet:not([hidden]) [data-close]').catch(() => p.keyboard.press('Escape')); await p.waitForTimeout(300);
    }
    await ctx.close();
  }
  console.log(JSON.stringify(res, null, 0).replace(/\},/g, '},\n')); await b.close();
})();
