// Debt costs prestige: after what your things are worth, every $2 owed costs $1. A Whale who borrows $100,000
// with nothing to their name drops to Marlin and is told why; paying it back brings Whale back. Things still
// cancel debt first. Usage: node tools/debt-rank-test.js   (reads tools/game.html)
const { chromium } = require('playwright'); const fs = require('fs'); const dir = __dirname;
const HOOK = "window.__bj = { get S(){ return S; }, prestige, rankNo, hideSheets, render, applyMotion, openCashier };\n";
fs.writeFileSync(dir + '/dr-page.html', '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>[hidden]{display:none!important}body{margin:0}</style></head><body>' +
  fs.readFileSync(dir + '/game.html', 'utf8').replace('/* ---------- boot ---------- */', HOOK + '/* ---------- boot ---------- */') + '</body></html>');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 797 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + dir + '/dr-page.html'); await p.waitForTimeout(1500);
  const out = {}, fails = []; const check = (n, ok, got) => { out[n] = got; if (!ok) fails.push(n); };
  const sheet = async () => (await p.isVisible('#fenceSheet')) ? (await p.textContent('#fenceH')) + ' | ' + (await p.innerText('#fenceText')).replace(/\n+/g, ' / ') : null;
  await p.click('#bankStart'); await p.waitForTimeout(400);
  await p.evaluate(() => { const S = __bj.S; S.settings.rules.motion = false; __bj.applyMotion(); S.fenceLast = 1e9;
    S.playPres = 300000; S.bankroll = 50000; S.open = [true, true, true, true]; S.table = 1; S.line = { id:'marker2', name:'a bigger casino marker', limit:1000000, rate:0.03 }; __bj.render(); });
  await p.waitForTimeout(400); await p.evaluate(() => __bj.hideSheets());
  check('whaleStart', (await p.evaluate(() => [__bj.prestige(), __bj.rankNo()])).join() === '300000,5', await p.evaluate(() => [__bj.prestige(), __bj.rankNo()]));
  // borrow $100,000 through the real cashier
  await p.evaluate(() => __bj.openCashier()); await p.waitForTimeout(200);
  await p.fill('#cardInput', '100000'); await p.dispatchEvent('#cardInput', 'input'); await p.click('#cardBorrow'); await p.waitForTimeout(400);
  await p.waitForTimeout(500); await p.evaluate(() => __bj.openCashier()); await p.waitForTimeout(200);
  check('cashierSays', /Your debts cost you \$50,000 of prestige\./.test(await p.textContent('#cardNote')), await p.textContent('#cardNote'));
  await p.evaluate(() => __bj.hideSheets());
  check('levelDown', (await p.evaluate(() => [__bj.prestige(), __bj.rankNo()])).join() === '250000,5', await p.evaluate(() => [__bj.prestige(), __bj.rankNo()]));
  // $200,000 owed: prestige 200,000, Marlin, and the message says why
  await p.evaluate(() => __bj.hideSheets());
  await p.evaluate(() => __bj.openCashier()); await p.waitForTimeout(200);
  await p.fill('#cardInput', '100000'); await p.dispatchEvent('#cardInput', 'input'); await p.click('#cardBorrow'); await p.waitForTimeout(400);
  await p.waitForTimeout(700);
  const d2 = await sheet();
  check('marlin', (await p.evaluate(() => [__bj.prestige(), __bj.rankNo()])).join() === '200000,4', await p.evaluate(() => [__bj.prestige(), __bj.rankNo()]));
  check('downMessage', /^Prestige level down \| You are now a Marlin \(prestige \$200,000\)\. What you owe costs you \$100,000 of prestige\. Pay it back to climb again\./.test(d2 || ''), d2);
  await p.evaluate(() => __bj.hideSheets());
  // things cancel debt first: $150,000 of things against $200,000 owed costs only $25,000
  await p.evaluate(() => { __bj.S.stash = [{ item:'a penthouse', paid:150000, oid:'penthouse' }]; __bj.render(); }); await p.waitForTimeout(300);
  check('thingsFirst', (await p.evaluate(() => __bj.prestige())) === 275000, await p.evaluate(() => __bj.prestige()));
  await p.evaluate(() => { __bj.S.stash = []; __bj.render(); }); await p.waitForTimeout(700); await p.evaluate(() => __bj.hideSheets()); await p.waitForTimeout(700); await p.evaluate(() => __bj.hideSheets());
  // pay it all back: Whale again
  await p.evaluate(() => __bj.openCashier()); await p.waitForTimeout(200);
  await p.fill('#cardInput', '200000'); await p.dispatchEvent('#cardInput', 'input'); await p.click('#cardPay'); await p.waitForTimeout(400);
  await p.waitForTimeout(700);
  const up = await sheet();
  check('backUp', (await p.evaluate(() => [__bj.prestige(), __bj.rankNo(), __bj.S.card])).join() === '300000,5,0' && /^New prestige level \| You are now a Whale/.test(up || ''), [await p.evaluate(() => [__bj.prestige(), __bj.rankNo(), __bj.S.card]), up]);
  out.errors = errs; out.fails = fails; console.log(JSON.stringify(out, null, 1)); await b.close(); fs.unlinkSync(dir + '/dr-page.html');
  process.exit(fails.length || errs.length ? 1 : 0);
})();
