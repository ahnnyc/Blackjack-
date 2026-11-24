// Publishes a change while the app is installed and checks ONE reopen shows it,
// then checks the app still opens with the connection off.
const { chromium, devices } = require('playwright');
const fs = require('fs');
const url = process.argv[2], file = process.argv[3];
(async () => {
  const original = fs.readFileSync(file, 'utf8');
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'] });
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await ctx.newPage();
  await p.goto(url);
  await p.evaluate(() => navigator.serviceWorker.ready);
  await p.reload();                                     // now running from the installed copy
  const before = await p.evaluate(() => document.body.innerHTML.includes('UPDATE-MARKER'));
  fs.writeFileSync(file, original.replace('<title>Blackjack Table</title>', '<title>Blackjack Table</title><!-- UPDATE-MARKER -->'));
  await p.reload();                                     // one reopen
  const afterOne = await p.evaluate(() => document.documentElement.outerHTML.includes('UPDATE-MARKER'));
  await ctx.setOffline(true);
  await p.reload();
  const offlineOpens = await p.evaluate(() => !!document.querySelector('#table'));
  const offlineHasUpdate = await p.evaluate(() => document.documentElement.outerHTML.includes('UPDATE-MARKER'));
  fs.writeFileSync(file, original);
  console.log(JSON.stringify({ markerBefore: before, updateShownAfterOneReopen: afterOne, opensOffline: offlineOpens, offlineCopyIsNewest: offlineHasUpdate }));
  await b.close();
})();
