// Pictures of the table at three phone sizes: betting, mid-hand, and the result.
const { chromium } = require('playwright');
const dir = __dirname;
(async () => {
  const b = await chromium.launch();
  const report = [];
  for (const [w, h] of [[390, 844], [375, 667], [320, 568]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + dir + '/page.html');
    await p.fill('#bankInput', '500'); await p.click('#bankStart');
    await p.click('.chip.c25'); await p.waitForTimeout(1200);
    await p.screenshot({ path: `${dir}/L-${w}-bet.png` });
    await p.click('#actions button:has-text("Deal")');
    let shotMid = false;
    for (let i = 0; i < 300; i++) {
      const labels = await p.$$eval('#actions button:not([disabled])', bs => bs.map(x => x.textContent));
      if (labels.some(l => l.startsWith('$'))) break;
      if (!labels.length) { await p.waitForTimeout(60); continue; }
      if (labels.includes('Stand') && !shotMid) { await p.waitForTimeout(700); await p.screenshot({ path: `${dir}/L-${w}-play.png` }); shotMid = true; }
      const pick = labels.includes('Stand') ? 'Stand' : (['No insurance', 'No thanks'].find(l => labels.includes(l)) || labels[0]);
      await p.click(`#actions button:not([disabled]):text-is("${pick}")`);
      if (await p.isVisible('#warnGo')) await p.click('#warnGo');
    }
    await p.waitForTimeout(4500);
    await p.screenshot({ path: `${dir}/L-${w}-result.png` });
    const m = await p.evaluate(() => {
      const r = s => document.querySelector(s).getBoundingClientRect();
      const t = document.querySelector('#table');
      const ban = r('#banner'), dc = r('#dealerCards'), hz = r('#hands');
      return { tableScrolls: t.scrollHeight > t.clientHeight + 1, pageScrolls: document.scrollingElement.scrollHeight > innerHeight,
        bannerHitsDealer: !document.querySelector('#banner').hidden && ban.top < dc.bottom - 2,
        bannerHitsHand: !document.querySelector('#banner').hidden && ban.bottom > hz.top + 2,
        cardWidth: getComputedStyle(document.documentElement).getPropertyValue('--cw').trim() };
    });
    report.push({ size: w + 'x' + h, ...m, errors: errs });
    await ctx.close();
  }
  console.log(JSON.stringify(report));
  await b.close();
})();
