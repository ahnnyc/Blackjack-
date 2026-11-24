// Pictures of the "Are you sure?" box and the big result banner.
const { chromium, devices } = require('playwright');
const dir = __dirname;
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'], reducedMotion: 'reduce' });
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + dir + '/page.html');
  await p.fill('#bankInput', '1000'); await p.click('#bankStart');
  let warned = false, bannered = false, warnText = '', bannerText = '';
  for (let round = 0; round < 25 && !(warned && bannered); round++) {
    await p.click('.chip.c25'); await p.waitForTimeout(900);
    await p.click('#actions button:has-text("Deal")');
    for (let i = 0; i < 300; i++) {
      const labels = await p.$$eval('#actions button:not([disabled])', bs => bs.map(x => x.textContent));
      if (labels.some(l => /^(5|25|100|500|1K)$/.test(l))) break;
      if (!labels.length) { await p.waitForTimeout(50); continue; }
      const pick = (labels.includes('Double') && !global.dbl) ? (global.dbl = 'Double') : labels.includes('Stand') ? 'Stand' : (['No insurance', 'No thanks'].find(l => labels.includes(l)) || labels[0]);
      await p.click(`#actions button:not([disabled]):text-is("${pick}")`);
      if (await p.isVisible('#warnGo')) {
        if (!warned) { warned = true; warnText = await p.textContent('#warnText'); await p.screenshot({ path: dir + '/w-warning.png' }); }
        await p.click(pick === 'Double' ? '#warnGo' : '#warnBest');
      }
      if (pick === 'Double' && !global.dshot) { await p.waitForTimeout(1200); if (await p.$$eval('#hands .card.side', e => e.length)) { global.dshot = 1; await p.screenshot({ path: dir + '/w-double.png' }); } }
    }
    await p.waitForTimeout(4500);
    if (!bannered && await p.isVisible('#banner')) { bannered = true; bannerText = (await p.textContent('#banner')).trim(); await p.screenshot({ path: dir + '/w-banner.png' }); }
  }
  console.log(JSON.stringify({ warned, warnText, bannered, bannerText, decks: await p.textContent('#shoeLabel'), errors: errs }));
  await b.close();
})();
