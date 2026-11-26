// Guy's claimed worth: right about half the time, otherwise off; the card shows it; selling back follows the real value.
const { chromium } = require('playwright'); const dir = __dirname;
(async () => { const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 797 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
  await p.route(/fonts/, r => r.abort()); await p.goto('file://' + dir + '/cg-page.html'); await p.waitForTimeout(1600); await p.click('#bankStart');
  const out = {};
  out.claims = await p.evaluate(() => { let right = 0, over = 0, under = 0, belowPrice = 0; const N = 2000;
    for (let i = 0; i < N; i++) { const price = [50, 450, 3200, 65000, 2400000][i % 5]; const a = __bj.appraise(price);
      if (a.said === a.worth) right++; else if (a.said > a.worth) over++; else under++; if (a.said < price) belowPrice++; }
    return { right: right / N, over: over / N, under: under / N, saidBelowHisPrice: belowPrice }; });
  await p.evaluate(() => { __bj.S.settings.rules.motion = false; __bj.applyMotion(); __bj.S.bankroll = 20000; __bj.render(); __bj.fenceOffer(); });
  out.pitch = await p.textContent('#fenceText'); out.offer = await p.evaluate(() => __bj.lastOffer);
  await p.screenshot({ path: dir + '/w-pitch.png' });
  await p.click('#fenceBtns button:last-child'); await p.waitForTimeout(300);
  await p.click('#openStuff'); await p.waitForTimeout(300);
  out.card = await p.textContent('#stuffCard'); await p.screenshot({ path: dir + '/w-card.png' });
  await p.click('#stuffSell'); await p.waitForTimeout(200);
  out.sellBack = await p.evaluate(() => { const x = __bj.stashList()[0]; return { worth: x.worth, said: x.said, paid: x.paid, offer: x.offer, inRange: x.offer >= Math.floor(x.worth * 0.4) - 10 && x.offer <= x.worth * 1.2 }; });
  out.errors = [];
  console.log(JSON.stringify(out, null, 1)); await b.close(); })();
