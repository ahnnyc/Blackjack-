// Homes, cars and a chef are monthly rentals below Whale (say "Rent", count nothing toward rank, keep working after a
// rank change until they run out); at Whale a penthouse and a limo are real purchases at real prices. Retired offers
// (the old cheap apartment, condo, cars and chef) are never offered again but keep working for anyone who has them.
// Usage: node tools/rentals-test.js [shotsdir]   (reads tools/game.html)
const { chromium } = require('playwright'); const fs = require('fs'); const dir = __dirname, shots = process.argv[2];
const HOOK = "window.__bj = { get S(){ return S; }, OFFERS, fenceOffer, fenceBuy, availableOffers, hideSheets, render, applyMotion, whoYouAre, prestige, stayBill };\n";
fs.writeFileSync(dir + '/rn-page.html', '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>[hidden]{display:none!important}body{margin:0}</style></head><body>' +
  fs.readFileSync(dir + '/game.html', 'utf8').replace("function checkLevel(){", "function checkLevel(){ S.level = levelOf(prestige()); return;").replace('/* ---------- boot ---------- */', HOOK + '/* ---------- boot ---------- */') + '</body></html>');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + dir + '/rn-page.html'); await p.waitForTimeout(1500);
  const out = {}, fails = []; const check = (n, ok, got) => { out[n] = got; if (!ok) fails.push(n); };
  const sheet = async () => (await p.isVisible('#fenceSheet')) ? (await p.textContent('#fenceH')) + ' | ' + (await p.innerText('#fenceText')).replace(/\n+/g, ' / ') : null;
  const offer = async (id, shot) => { await p.evaluate(id => __bj.fenceOffer(__bj.OFFERS.find(o => o.id === id)), id); await p.waitForTimeout(300); const s = await sheet(); if (shots && shot) await p.screenshot({ path: shots + '/' + shot + '.png' }); return s; };
  await p.click('#bankStart'); await p.waitForTimeout(400);
  await p.evaluate(() => { const S = __bj.S; S.settings.rules.motion = false; __bj.applyMotion(); S.fenceLast = 1e9; S.bankroll = 5000000; S.settings.rules.stay = true; __bj.hideSheets(); });
  // Swordfish: rent a car
  await p.evaluate(() => { __bj.S.playPres = 12000; __bj.render(); __bj.hideSheets(); });
  check('carRental', /^Rent a car for a month \| Price: \$900 for 30 days\. \/ • Covers getting around for 30 days: \$1,080 of bills for \$900, saving \$180\.$/.test(await offer('carrental') || ''), await sheet());
  await p.evaluate(() => __bj.hideSheets());
  // Shark: rent a condo, which counts nothing toward rank
  await p.evaluate(() => { __bj.S.playPres = 30000; __bj.render(); __bj.hideSheets(); });
  const pres0 = await p.evaluate(() => __bj.prestige());
  check('condoRent', /^Rent a condo for a month \| Price: \$3,750 for 30 days\. \/ • A condo tells the casino you’re a big player, so it may offer you more credit at a better rate\. \/ • Covers your room for 30 days: \$6,000 of bills for \$3,750, saving \$2,250\.$/.test(await offer('condorent', 'offer-condo') || ''), await sheet());
  check('rentButton', (await p.textContent('#fenceBtns button:last-child')) === 'Rent for $3,750', await p.textContent('#fenceBtns button:last-child'));
  await p.click('#fenceBtns button:last-child'); await p.waitForTimeout(300);
  check('rentSaid', (await p.textContent('#msg')) === 'You rented a condo for 30 days.', await p.textContent('#msg'));
  await p.evaluate(() => __bj.hideSheets());
  check('rentNoRank', (await p.evaluate(() => __bj.prestige())) === pres0, [pres0, await p.evaluate(() => __bj.prestige())]);
  check('chefHire', /^Hire a personal chef for a month \| Price: \$2,250 for 30 days/.test(await offer('chefhire') || '') && (await p.textContent('#fenceBtns button:last-child')) === 'Hire for $2,250', await sheet()); await p.evaluate(() => __bj.hideSheets());
  check('carLease', /^Lease a luxury car for a month \| Price: \$1,500 for 30 days/.test(await offer('carlease') || '') && (await p.textContent('#fenceBtns button:last-child')) === 'Lease for $1,500', await sheet()); await p.evaluate(() => __bj.hideSheets());
  // up to Whale: the rented condo still covers the room, and life says so
  await p.evaluate(() => { __bj.S.playPres = 300000; __bj.render(); __bj.hideSheets(); });
  check('condoStillCovers', /You rent a condo, /.test(await p.evaluate(() => __bj.whoYouAre())), await p.evaluate(() => __bj.whoYouAre()));
  // Whale: buy a penthouse at a real price, which counts toward rank
  await p.evaluate(() => { __bj.S.deals = {}; });   // the condo rental ended
  const pent = await offer('penthouse', 'offer-penthouse');
  check('penthouseBuy', /^Buy a penthouse \| Price: \$3,000,000\. \/ • Impresses the casino: gets you \d+% closer to Super Whale, where you can get everything comped[^/]*\/ • A penthouse tells the casino you’re a big player, so it may offer you more credit at a better rate\. \/ • Also: no more paying for your room \(\$375 a day now\)\.$/.test(pent || '') && (await p.textContent('#fenceBtns button:last-child')) === 'Buy for $3,000,000', pent);
  await p.evaluate(() => __bj.hideSheets());
  check('limoBuy', /^Buy your own limo \| Price: \$400,000\. \/ • Impresses the casino: gets you 8% closer to Super Whale/.test(await offer('limo') || ''), await sheet()); await p.evaluate(() => __bj.hideSheets());
  // a rental skipped at Shark comes back at Whale, re-priced for a Whale's villa: two thirds of $45,000
  await p.evaluate(() => { __bj.S.deals = {}; __bj.S.stash = []; });
  const back = await p.evaluate(() => __bj.availableOffers().filter(x => x.o.kind === 'save').map(x => x.o.id + ':' + x.o.price));
  check('rentalsBackRepriced', back.includes('condorent:7300') && back.includes('carlease:3900') && back.includes('chefhire:4900') && !back.some(x => /^carrental/.test(x)), back);
  const cond = await p.evaluate(() => { const x = __bj.availableOffers().find(x => x.o.id === 'condorent'); __bj.fenceOffer(x.o); return 1; }); await p.waitForTimeout(300);
  check('repricedOfferText', /^Rent a condo for a month \| Price: \$7,300 for 30 days\. \/ • A condo tells the casino you’re a big player, so it may offer you more credit at a better rate\. \/ • Covers your room for 30 days: \$11,250 of bills for \$7,300, saving \$3,950\.$/.test(await sheet() || ''), await sheet());
  await p.evaluate(() => __bj.hideSheets());
  // nothing to rent once everything is comped
  await p.evaluate(() => { __bj.S.playPres = 6000000; __bj.render(); __bj.hideSheets(); });
  check('noRentalsWhenComped', !(await p.evaluate(() => __bj.availableOffers().some(x => x.o.days))), await p.evaluate(() => __bj.availableOffers().map(x => x.o.id)));
  // retired offers never come up
  check('retiredNotOffered', !(await p.evaluate(() => __bj.availableOffers().some(x => ['apartment','usedcar','condo','newcar','chef','luxcar'].includes(x.o.id)))), await p.evaluate(() => __bj.availableOffers().map(x => x.o.id)));
  out.errors = errs; out.fails = fails; console.log(JSON.stringify(out, null, 1)); await b.close(); fs.unlinkSync(dir + '/rn-page.html');
  process.exit(fails.length || errs.length ? 1 : 0);
})();
