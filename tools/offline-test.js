// Proves the game installs its offline copy and then plays with the connection off.
// Usage: node tools/offline-test.js http://localhost:8765/blackjack-/
const { chromium, devices } = require('playwright');
const url = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'] });
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto(url);
  await p.evaluate(() => navigator.serviceWorker.ready);
  await p.reload();
  const controlled = await p.evaluate(() => !!navigator.serviceWorker.controller);
  await p.click('#bankStart');

  await ctx.setOffline(true);
  await p.reload();
  const title = await p.title();
  const bank = await p.textContent('#bankAmt');
  // play three hands offline
  let played = 0;
  for (let i = 0; i < 400 && played < 3; i++) {
    const labels = await p.$$eval('#actions button:not([disabled])', bs => bs.map(x => x.textContent));
    if (!labels.length) { await p.waitForTimeout(80); continue; }
    if (labels.some(l => l.startsWith('Deal'))) { await p.click('#actions button:has-text("Deal")'); played++; continue; }
    if (labels.some(l => /^(5|25|100|500|1K)$/.test(l))) { await p.click('#actions .chip:not([disabled])'); continue; }
    const pick = ['Stand', 'No insurance', 'No thanks'].find(l => labels.includes(l)) || labels[0];
    await p.click(`#actions button:not([disabled]):text-is("${pick}")`); if (await p.isVisible('#warnGo')) await p.click('#warnGo');
  }
  await p.waitForTimeout(3000);
  await p.reload();
  const hist = await p.evaluate(() => JSON.parse(localStorage.getItem('cg.history.v2') || '[]').length);
  await p.screenshot({ path: process.argv[3] || 'offline.png' });
  console.log(JSON.stringify({ controlled, offlineTitle: title, bankAfterOfflineReload: bank, handsRecordedOffline: hist, errors: errs }));
  await b.close();
})();
