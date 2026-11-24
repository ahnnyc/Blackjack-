// Captures frames while chips are bet, cards dealt, and a hand is paid out.
const { chromium, devices } = require('playwright');
const fs = require('fs');
const dir = __dirname;
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone SE'], reducedMotion: process.env.REDUCE ? 'reduce' : 'no-preference' });
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + dir + '/page.html');
  await p.fill('#bankInput', '500'); await p.click('#bankStart');
  await p.click('.chip.c25'); await p.waitForTimeout(170); await p.screenshot({ path: dir + '/f1-chip-flying.png' });
  await p.waitForTimeout(700);
  await p.click('#actions button:has-text("Deal")'); await p.waitForTimeout(1300); console.log('reduce motion on:', await p.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), '| moving now:', await p.evaluate(() => document.getAnimations().length)); await p.waitForTimeout(100); await p.screenshot({ path: dir + '/f2-dealing.png' });
  // play hands until one is won, then capture the payout
  for (let round = 0; round < 40; round++) {
    for (let i = 0; i < 200; i++) {
      const labels = await p.$$eval('#actions button:not([disabled])', bs => bs.map(x => x.textContent));
      if (labels.some(l => /^(5|25|100|500|1K)$/.test(l))) break;
      if (!labels.length) { await p.waitForTimeout(40); continue; }
      const pick = ['Stand', 'No insurance', 'No thanks'].find(l => labels.includes(l)) || labels[0];
      const net0 = null;
      await p.click(`#actions button:not([disabled]):text-is("${pick}")`); if (await p.isVisible('#warnGo')) await p.click('#warnGo');
      // catch the moment the dealer pays
      for (let k = 0; k < 40; k++) {
        const flying = await p.$$eval('#fx .fly-chip', e => e.length);
        const win = await p.$$eval('#banner.good, .res.good', e => e.length);
        if (flying && win) { await p.waitForTimeout(120); await p.screenshot({ path: dir + '/f3-payout.png' }); round = 99; break; }
        await p.waitForTimeout(30);
      }
      if (round === 99) break;
    }
    if (round === 99) break;
    await p.click('#actions button:has-text("Rebet")'); await p.waitForTimeout(500);
    await p.click('#actions button:has-text("Deal")');
  }
  await p.waitForTimeout(1500);
  await p.screenshot({ path: dir + '/f4-after.png' });
  const wide = await p.evaluate(() => ({ doc: document.documentElement.scrollWidth, win: innerWidth, table: document.querySelector('#table').scrollWidth - document.querySelector('#table').clientWidth }));
  console.log('width', JSON.stringify(wide));
  console.log(JSON.stringify({ errors: errs, gotPayout: fs.existsSync(dir + '/f3-payout.png') }));
  await b.close();
})();
