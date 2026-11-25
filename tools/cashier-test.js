// Buys chips mid-hand, doubles with them, cashes some in, cashes in all, and checks the books.
const { chromium, devices } = require('playwright');
const dir = __dirname;
const isChip = l => /^(5|25|100|500|1K)$/.test(l);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'], reducedMotion: 'reduce' });
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + dir + '/page.html');
  await p.fill('#bankInput', '100'); await p.click('#bankStart');
  const bank = async () => Number((await p.textContent('#bankAmt')).replace(/[^0-9.]/g, ''));
  const out = {};
  // bet everything, so a double is impossible until more chips are bought
  for (let i = 0; i < 4; i++) { await p.click('.chip.c25'); await p.waitForTimeout(150); }
  await p.click('#actions button:has-text("Deal")');
  let doubled = false;
  for (let tries = 0; tries < 60 && !doubled; tries++) {
    const labels = await p.$$eval('#actions button:not([disabled])', bs => bs.map(x => x.textContent));
    if (labels.includes('Stand')) {
      out.doubleBeforeBuying = await p.$eval('#actions button:has-text("Double")', x => !x.disabled).catch(() => 'no button');
      await p.click('#openCashier'); await p.waitForTimeout(200);
      out.cashierNote = await p.textContent('#cashNow');
      await p.screenshot({ path: dir + '/cashier.png' });
      await p.click('#buyPresets button:has-text("$500")'); await p.click('#buyBtn'); await p.waitForTimeout(1600);
      out.bankAfterBuyingMidHand = await bank();
      out.doubleAfterBuying = await p.$eval('#actions button:has-text("Double")', x => !x.disabled).catch(() => 'no button');
      if (out.doubleAfterBuying === true) { await p.click('#actions button:has-text("Double")'); if (await p.isVisible('#warnGo')) await p.click('#warnGo'); doubled = true; }
      else { await p.click('#actions button:has-text("Stand")'); if (await p.isVisible('#warnGo')) await p.click('#warnGo'); break; }
    } else if (labels.length && !labels.some(isChip)) {
      await p.click(`#actions button:not([disabled]):text-is("${['No insurance','No thanks'].find(l => labels.includes(l)) || labels[0]}")`);
    } else await p.waitForTimeout(100);
  }
  for (let i = 0; i < 200; i++) { const labels = await p.$$eval('#actions button:not([disabled])', bs => bs.map(x => x.textContent)); if (labels.some(isChip) || labels.includes('Buy chips')) break; await p.waitForTimeout(100); }
  await p.waitForTimeout(3000);
  out.doubledWithBoughtChips = doubled;
  // cash in $100, then everything
  await p.click('#openCashier'); await p.waitForTimeout(200);
  await p.fill('#cashInput', '100'); await p.dispatchEvent('#cashInput', 'input'); await p.click('#cashBtn'); await p.waitForTimeout(1600);
  out.bankAfterCashing100 = await bank();
  await p.click('#openCashier'); await p.waitForTimeout(200);
  await p.click('#cashPresets button:has-text("All")'); await p.click('#cashBtn'); await p.waitForTimeout(1600);
  out.bankAfterCashingAll = await bank();
  out.outOfChipsButtons = await p.$$eval('#actions button', bs => bs.map(x => x.textContent));
  // the books
  out.books = await p.evaluate(() => {
    const S = JSON.parse(localStorage.getItem('bj.state.v1')), H = JSON.parse(localStorage.getItem('bj.history.v1'));
    const sess = S.sessions.find(x => x.s === S.session);
    const hands = H.filter(r => r.s === S.session).reduce((a, r) => a + r.n, 0);
    const cash = (S.cash || []).filter(c => c.s === S.session);
    return { start: sess.start, handsNet: hands, cashMoves: cash.map(c => c.a), bankroll: S.bankroll, adds: Math.abs(sess.start + hands + cash.reduce((a, c) => a + c.a, 0) - S.bankroll) < 0.001 };
  });
  await p.click('#openRecord'); await p.waitForTimeout(400);
  out.recordFirstEntries = await p.$$eval('#log .entry .when', es => es.slice(0, 4).map(e => e.textContent.split(' · ')[0]));
  out.recordTotals = await p.$$eval('#stats .stat', ss => ss.slice(-3).map(s => s.textContent));
  out.chartReadout = await p.textContent('#chartRead1');
  await p.screenshot({ path: dir + '/cashier-record.png', fullPage: false });
  out.errors = errs;
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})();
