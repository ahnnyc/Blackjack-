// A message that pops up while you're tapping can't be closed or answered by that tap: tapping the dimmed area
// (where Rebet and Deal sit) never closes a pop-up message, and its buttons ignore taps for a moment after it appears.
// Screens you open yourself (Loans) still close when you tap outside them.
// Usage: node tools/tap-guard-test.js   (reads tools/game.html)
const { chromium } = require('playwright'); const fs = require('fs'); const dir = __dirname;
const HOOK = "window.__bj = { get S(){ return S; }, OFFERS, fenceOffer, hideSheets, render, applyMotion, openCashier };\n";
fs.writeFileSync(dir + '/tg-page.html', '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>[hidden]{display:none!important}body{margin:0}</style></head><body>' +
  fs.readFileSync(dir + '/game.html', 'utf8').replace("function checkLevel(){", "function checkLevel(){ S.level = levelOf(prestige()); return;").replace('/* ---------- boot ---------- */', HOOK + '/* ---------- boot ---------- */') + '</body></html>');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + dir + '/tg-page.html'); await p.waitForTimeout(1500);
  const out = {}, fails = []; const check = (n, ok, got) => { out[n] = got; if (!ok) fails.push(n); };
  await p.click('#bankStart'); await p.waitForTimeout(400);
  await p.evaluate(() => { const S = __bj.S; S.settings.rules.motion = false; __bj.applyMotion(); S.fenceLast = 1e9; S.bankroll = 5000; S.playPres = 12000; __bj.hideSheets(); __bj.render(); });
  const shown = () => p.evaluate(() => !document.getElementById('fenceSheet').hidden);
  const rebet = await p.evaluate(() => { const r = [...document.querySelectorAll('#actions button')].find(x => /Rebet/.test(x.textContent)).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  // an offer appears; a tap where Rebet is, right away, leaves it open
  await p.evaluate(() => __bj.fenceOffer(__bj.OFFERS.find(o => o.id === 'carrental')));
  await p.mouse.click(rebet.x, rebet.y);
  check('rebetTapKeepsOffer', await shown(), await shown());
  // a tap on its own button in the first moment does nothing either
  const btnBox = await p.evaluate(() => { const r = document.querySelector('#fenceBtns button:last-child').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await p.mouse.click(btnBox.x, btnBox.y);
  check('earlyButtonTapIgnored', (await shown()) && (await p.evaluate(() => __bj.S.bankroll)) === 5000, [await shown(), await p.evaluate(() => __bj.S.bankroll)]);
  // after a moment, the dimmed area still doesn't close it, but its button works
  await p.waitForTimeout(900);
  await p.mouse.click(rebet.x, rebet.y);
  check('laterRebetTapStillKeepsOffer', await shown(), await shown());
  await p.mouse.click(btnBox.x, btnBox.y); await p.waitForTimeout(300);
  check('buttonWorksAfterMoment', !(await shown()) && (await p.evaluate(() => __bj.S.bankroll)) === 4100, [await shown(), await p.evaluate(() => __bj.S.bankroll)]);
  // Loans still closes with a tap outside it
  await p.evaluate(() => __bj.openCashier()); await p.waitForTimeout(300);
  await p.mouse.click(5, 5); await p.waitForTimeout(200);
  check('loansClosesOnOutsideTap', await p.evaluate(() => document.getElementById('cashSheet').hidden), await p.evaluate(() => document.getElementById('cashSheet').hidden));
  out.errors = errs; out.fails = fails; console.log(JSON.stringify(out, null, 1)); await b.close(); fs.unlinkSync(dir + '/tg-page.html');
  process.exit(fails.length || errs.length ? 1 : 0);
})();
