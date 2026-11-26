// Compulsive Gambler: the $1,000 start, the credit card, the loan shark (cut, warning, death), starting over,
// Guy (buying, turning him down, the card that flies to Stuff), the Stuff cards, and the books adding up.
const { chromium } = require('playwright'); const fs = require('fs'); const dir = __dirname;
const HOOK = "window.__bj = { get S(){ return S; }, get history(){ return history; }, fenceOffer, fenceBuyback, guyDecline, appraise, get lastOffer(){ return lastOffer; }, fenceAfterHand, debtsAfterHand, tablesAfterHand, stashList, guy, guyOdds, applyMotion, render, saveLocal };\n";
fs.writeFileSync(dir + '/cg-page.html', '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>[hidden]{display:none!important}body{margin:0}</style></head><body>' +
  fs.readFileSync(dir + '/blackjack.html', 'utf8').replace('fence:true, sound:true };', 'fence:false, sound:true };').replace('/* ---------- boot ---------- */', HOOK + '/* ---------- boot ---------- */') + '</body></html>');
const isChip = l => /^(5|25|100|500|1K)$/.test(l);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: Number(process.env.W || 390), height: Number(process.env.H || 797) }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + dir + '/cg-page.html'); await p.waitForTimeout(1800);
  const out = {}; const shot = n => p.screenshot({ path: `${dir}/cg-${n}${process.env.W ? '-' + process.env.W : ''}.png` });
  const bank = async () => Number((await p.textContent('#bankAmt')).replace(/[^0-9.]/g, ''));
  const st = () => p.evaluate(() => { const S = __bj.S; return { bank: S.bankroll, card: S.card, shark: S.shark, sharkNext: S.sharkNext, hands: __bj.history.filter(r => r.s === S.session).length, dead: !!S.dead, game: S.session, stash: __bj.stashList().length }; });
  const books = () => p.evaluate(() => { const S = __bj.S, H = __bj.history.filter(r => r.s === S.session), sess = S.sessions.find(x => x.s === S.session);
    const sum = sess.start + H.reduce((a, r) => a + r.n, 0) + S.cash.filter(c => c.s === S.session).reduce((a, c) => a + c.a, 0); return Math.abs(sum - S.bankroll) < 0.001; });
  const playHand = async (chip = '.chip.c5') => {
    if (await p.isVisible('#fenceSheet')) { console.error('POPUP BEFORE HAND:', await p.textContent('#fenceH'), '|', await p.textContent('#fenceText')); await p.click('#fenceBtns button:first-child'); await p.waitForTimeout(200); }
    await p.click(chip); await p.waitForTimeout(80);
    await p.click('#actions button:has-text("Deal")');
    for (let i = 0; i < 300; i++) {
      const labels = await p.$$eval('#actions button:not([disabled])', bs => bs.map(x => x.textContent));
      if (labels.some(isChip) || labels.includes('Start over')) break;
      if (!labels.length) { await p.waitForTimeout(40); continue; }
      const pick = labels.includes('Stand') ? 'Stand' : (['No insurance', 'No thanks'].find(l => labels.includes(l)) || labels[0]);
      await p.click(`#actions button:not([disabled]):text-is("${pick}")`);
      if (await p.isVisible('#warnGo')) await p.click('#warnGo');
    }
    await p.waitForTimeout(700);
  };
  // 1) welcome
  out.welcome = { title: await p.textContent('#bankH'), button: await p.textContent('#bankStart'), cancelHidden: await p.isHidden('#bankCancel') };
  await shot('welcome');
  await p.click('#bankStart'); await p.waitForTimeout(300);
  await p.evaluate(() => { __bj.S.settings.rules.motion = false; __bj.applyMotion(); });
  out.startBank = await bank();
  out.topRow = await p.evaluate(() => { const bs = ['#countBtn', '#openCashier', '#openStuff', '#openRules', '#openRecord'].map(s => document.querySelector(s).getBoundingClientRect());
    return { oneLine: new Set(bs.map(r => Math.round(r.top))).size === 1, inside: bs.every(r => r.left >= 8 && r.right <= innerWidth - 8), noOverlap: bs.every((a, i) => i === 0 || a.left >= bs[i - 1].right) }; });
  // 2) credit card
  await p.click('#openCashier'); await p.waitForTimeout(200);
  out.sharkLockedNote = await p.textContent('#sharkNote');
  out.sharkCtlHidden = await p.isHidden('#sharkCtl');
  await p.click('#cardPresets button:text-is("+$5,000")'); await p.click('#cardBorrow'); await p.waitForTimeout(500);
  out.afterBorrow5000 = { ...(await st()), owe: await p.textContent('#oweV') };
  await p.click('#openCashier'); await p.click('#cardPresets button:text-is("+$1,000")'); await p.click('#cardPresets button:text-is("+$1,000")');
  out.payLabel = await p.textContent('#cardPay'); await p.click('#cardPay'); await p.waitForTimeout(500);
  out.afterPay2000 = await st();
  await p.click('#openCashier'); for (let k = 0; k < 2; k++) await p.click('#cardPresets button:text-is("+$25,000")');
  out.borrowLabelCapped = await p.textContent('#cardBorrow'); await p.click('#cardBorrow'); await p.waitForTimeout(500);
  out.cardMaxed = await st();
  // 3) loan shark
  await p.click('#openCashier'); await p.waitForTimeout(200);
  out.sharkOpenNote = await p.textContent('#sharkNote');
  await p.click('#sharkPresets button:text-is("+$10,000")'); await p.click('#sharkBorrow'); await p.waitForTimeout(500);
  out.afterShark = { ...(await st()), owe: await p.textContent('#oweV') };
  await p.click('#openCashier'); await p.waitForTimeout(200);
  await p.$eval('#cashSheet .panel', e => e.scrollTop = 1e5); await shot('cashier');
  await p.click('#cashSheet [data-close]');
  // 4) hands: the shark's cut after 5, card interest after 8
  const before = await st();
  for (let h = 0; h < 10; h++) await playHand();
  out.after10Hands = { before, after: await st() };
  out.logKinds = await p.evaluate(() => __bj.S.cash.map(c => c.k));
  out.booksAfterDebts = await books();
  // 5) Guy: buy three things, see them as cards
  for (const r of [0.99, 0.5, 0.1]) {
    await p.evaluate(r => { if (__bj.S.bankroll < 5000) { __bj.S.bankroll = 20000; __bj.render(); } const m = Math.random; Math.random = () => r; (__bj.S.settings.rules.fence = true, __bj.fenceOffer(), __bj.S.settings.rules.fence = false); Math.random = m; }, r);
    if (r === 0.99) { out.guyOffer = await p.textContent('#fenceText'); await shot('guy-offer'); }
    if (r === 0.1) { await p.evaluate(() => { __bj.S.settings.rules.motion = true; __bj.applyMotion(); }); }
    await p.click('#fenceBtns button:last-child'); await p.waitForTimeout(r === 0.1 ? 600 : 300);
    if (r === 0.1) { out.flyingCard = await p.$$eval('.scard.fly', e => e.length); await shot('buy-fly'); await p.waitForTimeout(2000); out.flyingCardGone = (await p.$$eval('.scard.fly', e => e.length)) === 0; }
  }
  out.guyAfterBuys = await p.evaluate(() => ({ ...__bj.guy(), odds: __bj.guyOdds() }));
  await p.click('#openStuff'); await p.waitForTimeout(300);
  out.stuff = { note: await p.textContent('#stuffNote'), pos: await p.textContent('#stuffPos'), card: await p.textContent('#stuffCard'), prevDisabled: await p.isDisabled('#stuffPrev') };
  await shot('stuff');
  await p.click('#stuffNext'); await p.waitForTimeout(500);
  out.stuffNext = { pos: await p.textContent('#stuffPos'), card: await p.textContent('#stuffCard') };
  const box = await p.$eval('#stuffCard', e => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
  await p.mouse.move(box[0] + 60, box[1]); await p.mouse.down(); await p.mouse.move(box[0] - 60, box[1], { steps: 5 }); await p.mouse.up(); await p.waitForTimeout(600);
  out.stuffAfterSwipeLeft = await p.textContent('#stuffPos');
  await p.click('#stuffSheet [data-close]');
  await p.evaluate(() => { __bj.S.settings.rules.motion = false; __bj.applyMotion(); });
  // 5b) Guy comes back for the big one with a buyer
  out.buyback = await p.evaluate(async () => { const big = __bj.stashList().find(x => x.paid > 10000); if (!big) return 'no big item';
    const b0 = __bj.S.bankroll; (__bj.S.settings.rules.fence = true, __bj.fenceBuyback(big), __bj.S.settings.rules.fence = false); const text = document.getElementById('fenceText').textContent;
    const offer = Number(document.querySelector('#fenceBtns button:last-child').textContent.replace(/[^0-9]/g, ''));
    document.querySelector('#fenceBtns button:last-child').click(); await new Promise(r => setTimeout(r, 300));
    return { text, paid: big.paid, offer, moreThanPaid: offer > big.paid, chipsUpBy: __bj.S.bankroll - b0, stillOwned: __bj.stashList().includes(big) }; });
  // 6) turn Guy down five times
  out.bankBeforeDeclines = await bank();
  await p.evaluate(() => { __bj.S.bankroll = 5000; __bj.render(); });
  for (let k = 0; k < 5; k++) { await p.evaluate(() => (__bj.S.settings.rules.fence = true, __bj.fenceOffer(), __bj.S.settings.rules.fence = false)); await p.click('#fenceBtns button:first-child'); await p.waitForTimeout(150); }
  out.guyAfterFiveNos = await p.evaluate(() => ({ ...__bj.guy(), odds: __bj.guyOdds() }));
  out.soreOffers = [];
  for (let k = 0; k < 4; k++) { await p.evaluate(() => (__bj.S.settings.rules.fence = true, __bj.fenceOffer(), __bj.S.settings.rules.fence = false)); out.soreOffers.push(await p.textContent('#fenceText')); if (k === 0) await shot('guy-sore'); await p.click('#fenceBtns button:first-child'); }
  await p.evaluate(() => { __bj.S.settings.rules.fence = true; __bj.guy().lvl = -4; __bj.stashList().length = 0; const m = Math.random; Math.random = () => 0.001; __bj.S.fenceSeen = -1; __bj.S.fenceLast = -99; __bj.fenceAfterHand(); Math.random = m; });
  await p.waitForTimeout(1500); out.stillComesWhenSore = await p.isVisible('#fenceSheet') ? await p.textContent('#fenceH') : 'did not come';
  if (await p.isVisible('#fenceSheet')) await p.click('#fenceBtns button:first-child');
  await p.evaluate(() => { __bj.S.settings.rules.fence = false; __bj.guy().lvl = 4; __bj.S.bankroll = 3000000; __bj.render(); });
  out.keenOffers = [];
  for (let k = 0; k < 4; k++) { await p.evaluate(() => (__bj.S.settings.rules.fence = true, __bj.fenceOffer(), __bj.S.settings.rules.fence = false)); out.keenOffers.push(await p.textContent('#fenceBtns button:last-child')); await p.click('#fenceBtns button:first-child'); }
  // 7) the warning, then death
  await p.evaluate(() => { const S = __bj.S; const n = __bj.history.filter(r => r.s === S.session).length; S.bankroll = 300; S.shark = 100000; S.sharkNext = n + 2; __bj.saveLocal(); __bj.render(); });
  await playHand(); await p.waitForTimeout(1600);
  out.warning = await p.isVisible('#fenceSheet') ? await p.textContent('#fenceText') : null;
  await shot('warning');
  if (await p.isVisible('#fenceSheet')) await p.click('#fenceBtns button:last-child');
  await playHand(); await p.waitForTimeout(1800);
  out.dead = { sheet: await p.isVisible('#deadSheet'), text: await p.textContent('#deadText'), state: await st(), buttons: await p.$$eval('#actions button', bs => bs.map(x => x.textContent)) };
  await shot('dead');
  await p.mouse.click(10, 10); await p.waitForTimeout(200);
  out.deadSheetStaysOnTapOutside = await p.isVisible('#deadSheet');
  await p.reload(); await p.waitForTimeout(2200);
  out.deadAfterReload = await p.isVisible('#deadSheet');
  await p.click('#deadStart'); await p.waitForTimeout(400);
  out.newGame = { ...(await st()), owe: await p.isHidden('#oweV'), guy: await p.evaluate(() => __bj.guy()) };
  // 8) out of chips -> Borrow
  await p.evaluate(() => { __bj.S.bankroll = 0; __bj.render(); });
  out.outOfChipsButtons = await p.$$eval('#actions button', bs => bs.map(x => x.textContent + (x.disabled ? ' (off)' : '')));
  out.booksNewGame = await books();
  await p.click('#openRecord'); await p.waitForTimeout(300);
  out.record = { note: await p.textContent('#sessionNote'), stats: await p.$$eval('#stats .stat', ss => ss.slice(-6).map(s => s.textContent)) };
  await p.click('#scopeSeg button[data-scope="all"]'); await p.waitForTimeout(200);
  out.recordLifetime = await p.textContent('#sessionNote');
  out.errors = errs;
  console.log(JSON.stringify(out, null, 1)); await b.close();
})();
