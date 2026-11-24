// Plays with Reduce Motion on and confirms each real-table motion shows up.
const { chromium, devices } = require('playwright');
const dir = __dirname;
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'], reducedMotion: 'reduce' });
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + dir + '/page.html');
  await p.fill('#bankInput', '5000'); await p.click('#bankStart');
  const seen = { shuffle: false, sweep: false, sideways: false, insurance: false, bustTaken: false, slide: false };
  const count = sel => p.$$eval(sel, e => e.length);
  for (let round = 0; round < 60 && Object.values(seen).some(v => !v); round++) {
    if (round === 0) { await p.click('.chip.c25'); }
    else {
      await p.click('.chip.c25');                       // starting the next bet sweeps the old cards
      await p.waitForTimeout(120);
      if (await count('#fx .fly-card')) { if (!seen.sweep) await p.screenshot({ path: dir + '/m-sweep.png' }); seen.sweep = true; }
      await p.waitForTimeout(600);
    }
    await p.click('#actions button:has-text("Deal")');
    await p.waitForTimeout(300);
    if (await count('#fx .fly-back')) { if (!seen.shuffle) await p.screenshot({ path: dir + '/m-shuffle.png' }); seen.shuffle = true; }
    for (let i = 0; i < 300; i++) {
      const labels = await p.$$eval('#actions button:not([disabled])', bs => bs.map(x => x.textContent));
      if (labels.some(l => /^(5|25|100|500|1K)$/.test(l))) break;
      if (!labels.length) {
        if (await count('#fx .fly-chip') && await p.$$eval('.hand', hs => hs.some(h => /Bust/.test(h.textContent)))) seen.bustTaken = true;
        await p.waitForTimeout(40); continue;
      }
      let pick;
      if (labels.some(l => l.startsWith('Insure'))) pick = labels.find(l => l.startsWith('Insure'));
      else if (labels.includes('Split') && !seen.slide) pick = 'Split';
      else if (labels.includes('Double') && !seen.sideways) pick = 'Double';
      else if (labels.includes('Hit') && !seen.bustTaken && Math.random() < .7) pick = 'Hit';
      else pick = ['Stand', 'No thanks'].find(l => labels.includes(l)) || labels[0];
      await p.click(`#actions button:not([disabled]):text-is("${pick}")`); if (await p.isVisible('#warnGo')) await p.click('#warnGo');
      if (pick.startsWith('Insure')) { await p.waitForTimeout(500); if (await p.isVisible('#insSpot')) { seen.insurance = true; await p.screenshot({ path: dir + '/m-insurance.png' }); } }
      if (pick === 'Split') { await p.waitForTimeout(150); if (await p.evaluate(() => document.getAnimations().some(a => a.effect && a.effect.target && a.effect.target.classList && a.effect.target.classList.contains('card')))) seen.slide = true; }
      if (pick === 'Double') { await p.waitForTimeout(900); if (await count('#hands .card.side')) { seen.sideways = true; await p.screenshot({ path: dir + '/m-double.png' }); } }
    }
    await p.waitForTimeout(2600);
  }
  console.log(JSON.stringify({ seen, errors: errs }));
  await b.close();
})();
