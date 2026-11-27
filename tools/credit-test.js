// Luxury keeps the casino's credit open: a Shark's marker is offered only with a luxury rental or a home, car or chef
// owned; a Whale's bigger marker the same way. Giving them up cuts the marker's limit in
// half and raises interest to 5%, with a message that says why; getting one back reopens it. Selling the last one
// warns first, and a rental that runs out is offered again. Usage: node tools/credit-test.js [shotsdir]
const { chromium } = require('playwright'); const fs = require('fs'); const dir = __dirname, shots = process.argv[2];
const HOOK = "window.__bj = { get S(){ return S; }, hideSheets, render, applyMotion, openCashier, availableOffers, creditWatch, fenceOffer, OFFERS, cardLimit, cardRate, fenceSellOffer, handsThisGame };\n";
fs.writeFileSync(dir + '/cr-page.html', '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>[hidden]{display:none!important}body{margin:0}</style></head><body>' +
  fs.readFileSync(dir + '/game.html', 'utf8').replace("function checkLevel(){", "function checkLevel(){ S.level = levelOf(prestige()); return;").replace('/* ---------- boot ---------- */', HOOK + '/* ---------- boot ---------- */') + '</body></html>');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + dir + '/cr-page.html'); await p.waitForTimeout(1500);
  const out = {}, fails = []; const check = (n, ok, got) => { out[n] = got; if (!ok) fails.push(n); };
  const sheet = async () => (await p.isVisible('#fenceSheet')) ? (await p.innerText('#fenceH')) + ' | ' + (await p.innerText('#fenceText')).replace(/\n+/g, ' / ') : null;
  const shot = async n => { if (shots && await p.isVisible('#fenceSheet')) await p.locator('#fenceSheet .panel').screenshot({ path: shots + '/cr-' + n + '.png' }); };
  const offerIds = () => p.evaluate(() => __bj.availableOffers().map(x => x.o.id));
  await p.click('#bankStart'); await p.waitForTimeout(400);
  await p.evaluate(() => { const S = __bj.S; S.settings.rules.motion = false; __bj.applyMotion(); S.fenceLast = 1e9; S.settings.rules.fence = true; S.playPres = 40000; S.bankroll = 30000; S.line = { id:'gold', name:'a gold card', limit:50000, rate:0.04 }; S.card = 0; S.deals = {}; S.stash = []; __bj.hideSheets(); __bj.render(); __bj.hideSheets(); });
  // 1. a Shark with no luxury gets no marker offer
  check('noMarkerWithout', !(await offerIds()).includes('marker'), await offerIds());
  // 2. the lease offer says what it does for credit
  await p.evaluate(() => __bj.fenceOffer(__bj.OFFERS.find(o => o.id === 'carlease'))); await p.waitForTimeout(900);
  const lease = await sheet(); await shot('1-lease');
  check('leaseSaysCredit', /^Lease a luxury car for a month \| Price: \$6,000 for 30 days\. \/ • Gets you a \$100,000 casino marker at 3% a day\. \/ • Let it go and the casino cuts the marker in half and charges 5%\. \/ • Pays for getting around for 30 days \(\$9,000\)\. Your sponsor already covers 75% on days you play well\.$/.test(lease || ''), lease);
  await p.click('#fenceBtns button:last-child'); await p.waitForTimeout(400);
  check('markerOffered', (await offerIds()).includes('marker'), await offerIds());
  await p.evaluate(() => { __bj.hideSheets(); __bj.fenceOffer(__bj.OFFERS.find(o => o.id === 'marker')); }); await p.waitForTimeout(900);
  const mk = await sheet(); await shot('2-marker');
  check('markerSaysWhy', /^Casino marker \| Offered because you have a leased luxury car\. \/ • Borrow up to \$100,000 at 3% a day\. \/ • Lose your luxury items and it drops to \$50,000 at 5%\./.test(mk || ''), mk);
  await p.click('#fenceBtns button:last-child'); await p.waitForTimeout(500);
  await p.evaluate(() => { __bj.hideSheets(); const S = __bj.S; S.card = 40000; __bj.creditWatch(); });
  check('openAt3', (await p.evaluate(() => [__bj.cardLimit(), __bj.cardRate()])).join() === '100000,0.03', await p.evaluate(() => [__bj.cardLimit(), __bj.cardRate()]));
  // 3. the lease runs out: the casino freezes the marker and says why, then offers the lease again
  await p.evaluate(() => { const S = __bj.S; S.deals.carlease = __bj.handsThisGame(); __bj.creditWatch(); }); await p.waitForTimeout(900);
  const cut = await sheet(); await shot('3-cut');
  check('cutMessage', /^The casino noticed \| You no longer have a leased luxury car\. To the casino that looks like a player running out of money/.test(cut || '') && /cut in half: from \$100,000 to \$50,000\./.test(cut || '') && /from 3% to 5% a day on the \$40,000 you owe/.test(cut || ''), cut);
  check('halvedNumbers', (await p.evaluate(() => [__bj.cardLimit(), __bj.cardRate()])).join() === '50000,0.05', await p.evaluate(() => [__bj.cardLimit(), __bj.cardRate()]));
  await p.click('#fenceBtns button:last-child'); await p.waitForTimeout(900);
  const again = await sheet(); await shot('4-renew');
  check('renewOffered', /^Lease a luxury car for a month/.test(again || '') && /Restores your casino marker to \$100,000 at 3% a day\./.test(again || ''), again);
  await p.evaluate(() => __bj.hideSheets());
  await p.evaluate(() => __bj.openCashier()); await p.waitForTimeout(400);
  const note = await p.innerText('#cardNote');
  if (shots) { await p.evaluate(() => { const pn = document.querySelector('#cashSheet .panel'); pn.scrollTop = 380; }); await p.waitForTimeout(200); await p.locator('#cashSheet .panel').screenshot({ path: shots + '/cr-5-expenses.png' }); }
  check('expensesSaysFrozen', /^Cut back: the casino halved your limit to \$50,000 and raised interest to 5% a day, because you no longer have a luxury rental/.test(note), note);
  check('canBorrowHalf', (await p.evaluate(() => __bj.cardLimit() - __bj.S.card)) === 10000, '');
  await p.evaluate(() => __bj.hideSheets());
  // 4. lease again: the casino reopens it
  await p.evaluate(() => { const S = __bj.S; S.deals.carlease = __bj.handsThisGame() + 4500; __bj.creditWatch(); }); await p.waitForTimeout(900);
  const back = await sheet();
  check('reopened', /^The casino is happy again \| You have a leased luxury car, so the casino restores your casino marker: borrow up to \$100,000 again, at 3% a day\.$/.test(back || '') && (await p.evaluate(() => __bj.cardRate())) === 0.03, back);
  await p.evaluate(() => __bj.hideSheets());
  // 5. a Whale with the bigger marker: selling the limo warns, then freezes it
  await p.evaluate(() => { const S = __bj.S; S.playPres = 300000; S.deals = {}; S.stash = [{ id:'l1', oid:'limo', item:'your own limo', art:'🚘', paid:400000 }]; S.line = { id:'marker2', name:'a bigger casino marker', limit:1000000, rate:0.03 }; S.card = 0; S.lineCutSeen = 0; S.luxSeen = ['your own limo']; __bj.render(); __bj.hideSheets(); __bj.fenceSellOffer(S.stash[0]); }); await p.waitForTimeout(900);
  const sell = await sheet(); await shot('6-sell');
  check('sellWarns', /The casino will notice\. Without it, the casino cuts your bigger casino marker in half, to \$500,000, and raises interest to 5% a day\./.test(sell || ''), sell);
  await p.click('#fenceBtns button:last-child'); await p.waitForTimeout(1200);
  const sold = await sheet();
  check('sellFreezes', /^The casino noticed \| You no longer have your own limo\./.test(sold || '') && (await p.evaluate(() => __bj.cardLimit())) === 500000, sold);
  await p.evaluate(() => __bj.hideSheets());
  // 6. an old game holding a marker with nothing: the message explains the rule instead of naming something lost
  await p.evaluate(() => { const S = __bj.S; S.playPres = 40000; S.stash = []; S.deals = {}; S.line = { id:'marker', name:'a casino marker', limit:100000, rate:0.03 }; S.lineCutSeen = 0; delete S.luxSeen; __bj.render(); __bj.hideSheets(); __bj.creditWatch(); }); await p.waitForTimeout(900);
  const old = await sheet();
  check('oldSave', /^The casino noticed \| The casino gives its full marker only to players who live the part, and you don’t have a luxury rental/.test(old || ''), old);
  // 7. ordinary cards and the open marker never freeze
  await p.evaluate(() => { __bj.hideSheets(); const S = __bj.S; S.line = { id:'gold', name:'a gold card', limit:50000, rate:0.04 }; S.card = 0; });
  check('cardsUnaffected', (await p.evaluate(() => [__bj.cardLimit(), __bj.cardRate()])).join() === '50000,0.04', '');
  out.errors = errs; out.fails = fails; console.log(JSON.stringify(out, null, 1)); await b.close(); fs.unlinkSync(dir + '/cr-page.html');
  process.exit(fails.length || errs.length ? 1 : 0);
})();
