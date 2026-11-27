// The money side, after the rank rework: the $1,000 start, prestige from play, Guy's rank offers (a thing, a deal,
// a home, a credit line), borrowing on a line, interest once a day, the daily bills and the sponsor, the loan shark
// (cut, taking stuff, the grave), out of chips, leaving town, the Stuff cards, and the books adding up.
// Usage: node tools/cg-test.js   (reads tools/game.html)
const { chromium } = require('playwright'); const fs = require('fs'); const dir = __dirname;
const HOOK = "window.__bj = { get S(){ return S; }, get history(){ return history; }, OFFERS, fenceOffer, stayBill, sponsorDay, prestige, minBet, rankNo, availableOffers, hideSheets, openStuff, render, applyMotion, stayAfterHand, debtsAfterHand };\n";
fs.writeFileSync(dir + '/cg-page.html', '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>[hidden]{display:none!important}body{margin:0}</style></head><body>' +
  fs.readFileSync(dir + '/game.html', 'utf8').replace("function checkLevel(){", "function checkLevel(){ S.level = levelOf(prestige()); return;").replace('/* ---------- boot ---------- */', HOOK + '/* ---------- boot ---------- */') + '</body></html>');
const isChip = l => /^(5|25|100|500|1K|5K|25K|100K)$/.test(l);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 797 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + dir + '/cg-page.html'); await p.waitForTimeout(1500);
  const out = {}; const fails = [];
  const check = (name, ok, got) => { out[name] = got; if (!ok) fails.push(name); };
  const sheet = async () => (await p.isVisible('#fenceSheet')) ? (await p.textContent('#fenceH')) + ' | ' + (await p.innerText('#fenceText')).replace(/\n+/g, ' / ') : null;
  const closeAll = async () => { for (let k = 0; k < 8; k++) { await p.waitForTimeout(350); if (!(await p.isVisible('#fenceSheet'))) break; await p.evaluate(() => __bj.hideSheets()); } };
  const books = () => p.evaluate(() => { const S = __bj.S, H = __bj.history.filter(r => r.s === S.session), sess = S.sessions.find(x => x.s === S.session);
    const sum = sess.start + H.reduce((a, r) => a + r.n, 0) + S.cash.filter(c => c.s === S.session).reduce((a, c) => a + c.a, 0); return Math.abs(sum - S.bankroll) < 0.01; });
  const playHand = async () => {
    for (let k = 0; k < 20 && await p.evaluate(() => __bj.S.bet < __bj.minBet()); k++){ await p.click('#actions .chip:not([disabled])'); await p.waitForTimeout(40); }
    await p.click('#actions button:has-text("Deal")');
    for (let i = 0; i < 300; i++) {
      const labels = await p.$$eval('#actions button:not([disabled])', bs => bs.map(x => x.textContent));
      if (labels.some(isChip) || labels.includes('Borrow') || labels.includes('Start over')) break;
      if (!labels.length) { await p.waitForTimeout(40); continue; }
      const pick = ['No insurance', 'No thanks'].find(l => labels.includes(l)) || (labels.includes('Stand') ? 'Stand' : labels[0]);
      await p.click(`#actions button:not([disabled]):text-is("${pick}")`);
      if (await p.isVisible('#warnGo')) await p.click('#warnGo');
    }
    await p.waitForTimeout(900);
  };
  // 1) the start
  check('welcome', /\$1,000/.test(await p.textContent('#bankNote')), await p.textContent('#bankNote'));
  await p.click('#bankStart'); await p.waitForTimeout(300);
  await p.evaluate(() => { __bj.S.settings.rules.motion = false; __bj.applyMotion(); __bj.S.fenceLast = 1e9; });
  await playHand(); await closeAll();
  const s1 = await p.evaluate(() => ({ bank: __bj.S.bankroll, pres: __bj.S.playPres, min: __bj.minBet(), level: document.getElementById('levelBtn').textContent }));
  check('prestigeFromPlay', s1.pres === 1.25 && s1.min === 5 && s1.level === 'Guppy', s1);
  // 2) a store card from Guy, then borrowing on it through the real cashier
  await p.evaluate(() => __bj.fenceOffer(__bj.OFFERS.find(o => o.id === 'storecard'))); await p.waitForTimeout(200);
  check('creditOffer', /^Store card \| A line of credit/.test(await sheet() || ''), await sheet());
  await p.click('#fenceBtns button:last-child'); await p.waitForTimeout(300);
  // taking the line opens the cashier with the whole line filled in, and only amounts you can borrow on offer
  check('cashierOpensFilled', (await p.isVisible('#cashSheet')) && (await p.inputValue('#cardInput')) === '2000' && (await p.textContent('#cardH')) === 'Store card'
    && JSON.stringify(await p.$$eval('#cardPresets button', bs => bs.map(x => x.textContent))) === '["+$1,000","All $2,000"]',
    { open: await p.isVisible('#cashSheet'), filled: await p.inputValue('#cardInput'), head: await p.textContent('#cardH'), presets: await p.$$eval('#cardPresets button', bs => bs.map(x => x.textContent)) });
  await p.fill('#cardInput', '1000'); await p.dispatchEvent('#cardInput', 'input'); await p.click('#cardBorrow'); await p.waitForTimeout(500); await closeAll();
  const s2 = await p.evaluate(() => ({ bank: __bj.S.bankroll, owed: __bj.S.card }));
  check('borrowed', s2.owed === 1000, s2);
  // 3) things bought while owing don't count until the debt is paid
  await p.evaluate(() => __bj.fenceOffer(__bj.OFFERS.find(o => o.id === 'shirt'))); await p.waitForTimeout(200);
  check('shirtOffer', /^Sharp shirt \| Price: \$150/.test(await sheet() || '') && /Prestige \+\$150/.test(await sheet() || '') && /once your debts are paid/.test(await sheet() || ''), await sheet());
  await p.click('#fenceBtns button:last-child'); await p.waitForTimeout(500); await closeAll();
  const s3 = await p.evaluate(() => ({ prestige: __bj.prestige(), stash: __bj.S.stash.map(x => x.item) }));
  check('shirtCountsLater', s3.prestige === 0 &&   // $1,000 owed: the $150 shirt cancels $150 of it, the other $850 costs $425, so 0
    s3.stash.includes('a sharp shirt'), s3);
  await p.click('#openCashier'); await p.waitForTimeout(200); await p.click('#cardPresets button:text-is("+$1,000")'); await p.click('#cardPay'); await p.waitForTimeout(500); await closeAll();
  check('books', await books(), await books());   // start + hands + borrowing, paying back and buying (before the test sets any amounts by hand)
  check('shirtCountsWhenPaid', (await p.evaluate(() => __bj.prestige())) === 151, await p.evaluate(() => __bj.prestige()));
  // 4) a deal: the weekly motel rate makes the room free for a week
  await p.evaluate(() => { __bj.S.bankroll = 2000; __bj.fenceOffer(__bj.OFFERS.find(o => o.id === 'motelweek')); }); await p.waitForTimeout(200);
  check('dealOffer', /saving \$93/.test(await sheet() || ''), await sheet());
  await p.click('#fenceBtns button:last-child'); await p.waitForTimeout(300); await closeAll();
  await p.evaluate(() => { __bj.S.settings.rules.stay = true; __bj.S.day = { ok: 0, all: 0, bills: 0 }; __bj.stayBill(3, 1); }); await p.waitForTimeout(200);
  check('roomFree', /free \(your weekly motel rate\)/.test(await sheet() || ''), await sheet());
  await closeAll();
  // 5) a meal is charged and counted toward the sponsor; good play pays 75%, bad play nothing
  await p.evaluate(() => { __bj.S.day = { ok: 0, all: 0, bills: 0 }; __bj.stayBill(2, 1); }); await p.waitForTimeout(200);
  const billed = await p.evaluate(() => __bj.S.day.bills);
  check('mealBilled', billed === 11, billed); await closeAll();
  await p.evaluate(() => { __bj.S.day = { ok: 98, all: 100, bills: 100 }; __bj.sponsorDay(1); }); await p.waitForTimeout(300);
  check('sponsorPays', /pays \$75/.test(await sheet() || ''), await sheet()); await closeAll();
  await p.evaluate(() => { __bj.S.day = { ok: 80, all: 100, bills: 100 }; __bj.sponsorDay(2); }); await p.waitForTimeout(300);
  check('sponsorWithholds', /nothing today/.test(await sheet() || ''), await sheet()); await closeAll();
  // 6) interest once a day on what you owe
  await p.evaluate(() => { const S = __bj.S, H = __bj.history; S.card = 1000; const last = H[H.length - 1]; while (H.filter(r => r.s === S.session).length < 149) H.push({ ...last, t: Date.now() }); S.staySeen = 149; S.settings.rules.stay = false; });
  await playHand(); await closeAll();
  check('dailyInterest', (await p.evaluate(() => __bj.S.card)) === 1050, await p.evaluate(() => __bj.S.card));
  // 7) no minimum by rank: a Barracuda at the 8-deck table can bet the table's $5
  await p.evaluate(() => { __bj.S.card = 0; __bj.S.playPres = 5000; __bj.render(); }); await closeAll();
  check('rankMinimum', (await p.evaluate(() => [__bj.rankNo(), __bj.minBet()])).join() === '2,5', await p.evaluate(() => [__bj.rankNo(), __bj.minBet()]));
  check('limitsSign', /\$5–\$500/.test(await p.textContent('#limitsV')), await p.textContent('#limitsV'));
  // 8) the loan shark: takes stuff when you can't pay, the grave when stuff can't cover it
  await p.evaluate(() => { const S = __bj.S; S.card = S.line.limit; S.shark = 2000; S.sharkNext = __bj.history.filter(x => x.s === S.session).length + 1; S.bankroll = 60; S.stash.push({ id: 'z', oid: 'watch', item: 'a gold watch', art: '⌚', paid: 2500 }); __bj.render(); });
  await playHand(); await p.waitForTimeout(500);
  check('sharkTookStuff', /took .*gold watch/.test(await sheet() || ''), await sheet()); await closeAll();
  await p.evaluate(() => { const S = __bj.S; S.stash = []; S.sharkNext = __bj.history.filter(x => x.s === S.session).length + 1; S.bankroll = 60; __bj.render(); });
  await playHand(); await p.waitForTimeout(2500);
  check('grave', /shallow grave/.test(await p.textContent('#deadText')) && await p.isVisible('#deadSheet'), await p.textContent('#deadText'));
  // 9) start over from game over: the opening message, everything wiped
  await p.click('#deadStart'); await p.waitForTimeout(400); await p.click('#bankStart'); await p.waitForTimeout(300);
  const s9 = await p.evaluate(() => ({ bank: __bj.S.bankroll, owed: __bj.S.card + __bj.S.shark, line: __bj.S.line, stash: __bj.S.stash.length, pres: __bj.prestige(), session: __bj.S.session }));
  check('freshGame', s9.bank === 1000 && s9.owed === 0 && !s9.line && s9.stash === 0 && s9.pres === 0 && s9.session === 2, s9);
  // 10) out of chips with no credit: leave town or borrow from the shark
  await p.evaluate(() => { __bj.S.settings.rules.motion = false; __bj.applyMotion(); __bj.S.fenceLast = 1e9; });
  for (let k = 0; k < 30; k++) { await p.evaluate(() => { __bj.S.bankroll = 5; __bj.render(); }); await playHand(); if (await p.isVisible('#fenceSheet')) break; }
  check('outOfChips', /no credit yet/i.test(await sheet() || ''), await sheet());
  out.errors = errs; out.fails = fails;
  console.log(JSON.stringify(out, null, 1)); await b.close();
  if (fails.length || errs.length) process.exit(1);
})();
