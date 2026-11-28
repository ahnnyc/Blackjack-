// Everything offered is sold by the casino (Mike, 2026-11-28); shows and treats are used once and only count toward
// opening tables; Liberace's piano replaces the jet. Usage: node tools/treats-test.js [shotsdir]
const { chromium } = require('playwright'); const fs = require('fs'); const dir = __dirname, shots = process.argv[2];
const HOOK = "window.__bj = { get S(){ return S; }, get history(){ return history; }, hideSheets, render, applyMotion, fenceOffer, OFFERS, availableOffers, boughtHands, openTables, stashList, newGame };\n";
fs.writeFileSync(dir + '/treat-page.html', '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>[hidden]{display:none!important}body{margin:0}</style></head><body>' +
  fs.readFileSync(dir + '/game.html', 'utf8').replace('/* ---------- boot ---------- */', HOOK + '/* ---------- boot ---------- */') + '</body></html>');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + dir + '/treat-page.html'); await p.waitForTimeout(1500);
  const out = {}, fails = []; const check = (n, ok, got) => { out[n] = got; if (!ok) fails.push(n); };
  const rows = () => p.$$eval('#tablesList .trow', rs => rs.map(r => r.innerText.replace(/\n+/g, ' / ')));
  const sheet = async () => (await p.isVisible('#fenceSheet')) ? (await p.innerText('#fenceH')) + ' | ' + (await p.innerText('#fenceText')).replace(/\n+/g, ' / ') : null;
  // play one hand with a given bet (stand on everything), answering any pop-ups
  const isChip = l => /^(5|25|100|250|500|1K|5K|25K|100K)$/.test(l);
  const playHand = async (bet) => {
    await p.evaluate(b => { __bj.hideSheets(); const S = __bj.S; S.bet = b; __bj.render(); }, bet);
    await p.click('#actions button:has-text("Deal")');
    for (let i = 0; i < 300; i++) {
      const labels = await p.$$eval('#actions button:not([disabled])', bs => bs.map(x => x.textContent));
      if (labels.some(isChip) || labels.includes('Borrow')) break;
      if (!labels.length) { await p.waitForTimeout(40); continue; }
      const pick = ['No insurance', 'No thanks'].find(l => labels.includes(l)) || (labels.includes('Stand') ? 'Stand' : labels[0]);
      await p.click(`#actions button:not([disabled]):text-is("${pick}")`);
      if (await p.isVisible('#warnGo')) await p.click('#warnGo');
    }
    await p.waitForTimeout(500);
  };
  await p.click('#bankStart'); await p.waitForTimeout(400);
  await p.evaluate(() => { const S = __bj.S; S.settings.rules.motion = false; __bj.applyMotion(); S.fenceLast = 1e9; S.settings.rules.stay = false; __bj.hideSheets(); });
  // every offer is sold by the casino
  const noFrom = await p.evaluate(() => __bj.OFFERS.filter(o => !o.retired && o.kind !== 'people' && !o.from).map(o => o.id));
  check('everyOfferFromCasino', noFrom.length === 0, noFrom);
  check('pianoNotJet', await p.evaluate(() => { const r6 = __bj.OFFERS.filter(o => o.rank === 6 && !o.retired).map(o => o.name); return r6.includes('Liberace’s piano') && !r6.includes('a private jet'); }), await p.evaluate(() => __bj.OFFERS.filter(o => o.rank === 6).map(o => o.name + (o.retired ? ' (retired)' : ''))));
  // a Guppy is offered its own shows and treats
  const g = await p.evaluate(() => __bj.availableOffers().map(x => x.o.id));
  check('guppyTreats', g.includes('comedy') && g.includes('cigar') && !g.includes('magic'), g);
  // the offer screen
  await p.evaluate(() => __bj.fenceOffer(__bj.OFFERS.find(o => o.id === 'comedy'))); await p.waitForTimeout(700);
  const t = await sheet();
  check('treatOffer', t === 'Ticket to the comedy club | From the casino’s comedy club. / Price: $40. / • Used once: it doesn’t raise your rank and can’t be sold back. / • Counts as 4 hands toward opening the 4-deck table.', t);
  if (shots) await p.locator('#fenceSheet .panel').screenshot({ path: shots + '/treat-1-comedy.png' });
  await p.click('#fenceBtns button:last-child'); await p.waitForTimeout(600);
  const after = await p.evaluate(() => ({ bank: __bj.S.bankroll, spent: __bj.S.spent, bought: __bj.boughtHands(), stash: __bj.stashList().length }));
  check('treatBought', after.bank === 960 && after.spent === 40 && after.bought === 4 && after.stash === 0, after);
  // the shirt says who sells it
  await p.evaluate(() => { __bj.hideSheets(); __bj.fenceOffer(__bj.OFFERS.find(o => o.id === 'shirt')); }); await p.waitForTimeout(700);
  const sh = await sheet();
  check('shirtFrom', /^Sharp shirt \| From the casino’s boutique\. \/ Price: \$150\./.test(sh || ''), sh);
  if (shots) await p.locator('#fenceSheet .panel').screenshot({ path: shots + '/treat-2-shirt.png' });
  // a Super Whale sees Liberace's piano
  await p.evaluate(() => { __bj.hideSheets(); __bj.S.bankroll = 6000000; __bj.fenceOffer(__bj.OFFERS.find(o => o.id === 'piano')); }); await p.waitForTimeout(700);
  const pi = await sheet();
  check('pianoOffer', /^Liberace’s piano \| From the casino’s auction\. \/ Price: \$5,000,000\..*\/ • Opens the 4-deck, 2-deck and 1-deck tables straight away\.$/.test(pi || ''), pi);
  if (shots) await p.locator('#fenceSheet .panel').screenshot({ path: shots + '/treat-3-piano.png' });
  // once every table is open, shows and treats stop coming (they would only cost money)
  await p.evaluate(() => { __bj.hideSheets(); __bj.S.bankroll = 1000; __bj.S.spent = 60000; });
  const g2 = await p.evaluate(() => __bj.availableOffers().map(x => x.o.id));
  check('noTreatsWhenAllOpen', !g2.includes('comedy') && !g2.includes('cigar'), g2);
  console.log(JSON.stringify({ fails, errors: errs, ...out }, null, 1)); await b.close();
})();