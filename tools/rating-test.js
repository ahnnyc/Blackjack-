// The casino rates your bets: no minimum by rank, but a day whose average bet is under what your rank is expected to bet
// costs the sponsor's pay, comps, and eye candy and the entourage, and the end-of-day message says why. Nobody is warned
// beforehand. Ranking up mid-day is rated against the lower level. A table needs 20 times its minimum bet in chips to sit (the 8-deck table only its minimum).
// Usage: node tools/rating-test.js   (reads tools/game.html)
const { chromium } = require('playwright'); const fs = require('fs'); const dir = __dirname;
const HOOK = "window.__bj = { get S(){ return S; }, get history(){ return history; }, prestige, minBet, maxBet, rankNo, hideSheets, render, applyMotion, openTables, tableNo, moveTo }; FEATURES.sponsors = true;   /* these checks cover the sponsor, which is on hold in the game */\n";
fs.writeFileSync(dir + '/rt-page.html', '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>[hidden]{display:none!important}body{margin:0}</style></head><body>' +
  fs.readFileSync(dir + '/game.html', 'utf8').replace("function checkLevel(){", "function checkLevel(){ S.level = levelOf(prestige()); return;").replace('/* ---------- boot ---------- */', HOOK + '/* ---------- boot ---------- */') + '</body></html>');
const isChip = l => /^(5|25|100|500|1K|5K|25K|100K)$/.test(l);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 797 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + dir + '/rt-page.html'); await p.waitForTimeout(1500);
  const out = {}, fails = []; const check = (n, ok, got) => { out[n] = got; if (!ok) fails.push(n); };
  const shots = process.argv[2];
  const sheet = async () => (await p.isVisible('#fenceSheet')) ? (await p.textContent('#fenceH')) + ' | ' + (await p.innerText('#fenceText')).replace(/\n+/g, ' / ') : null;
  const sheets = async (shotName) => { const all = []; for (let k = 0; k < 12; k++){ await p.waitForTimeout(400); const s = await sheet(); if (!s) { if (k > 2) break; continue; }
    if (shots && shotName && /^Low bets/.test(s)) await p.screenshot({ path: shots + '/' + shotName + '.png' }); all.push(s); await p.evaluate(() => __bj.hideSheets()); } return all; };
  const playHand = async (bet) => {
    await p.evaluate(b => { const S = __bj.S, m = b || __bj.minBet(); S.bankroll -= m - S.bet; S.bet = m; __bj.render(); }, bet);
    await p.click('#actions button:has-text("Deal")');
    for (let i = 0; i < 300; i++) {
      const labels = await p.$$eval('#actions button:not([disabled])', bs => bs.map(x => x.textContent));
      if (labels.some(isChip) || labels.includes('Borrow')) break;
      if (!labels.length) { await p.waitForTimeout(40); continue; }
      const pick = ['No insurance', 'No thanks'].find(l => labels.includes(l)) || (labels.includes('Stand') ? 'Stand' : labels[0]);
      await p.click(`#actions button:not([disabled]):text-is("${pick}")`);
      if (await p.isVisible('#warnGo')) await p.click('#warnGo');
    }
  };
  // the last hand of a day, with the day so far already played
  const endOfDay = (day) => p.evaluate(day => { const S = __bj.S, H = __bj.history; const last = H[H.length - 1];
    while (H.filter(r => r.s === S.session).length < 149) H.push({ ...last, t: Date.now() }); S.staySeen = 149; S.day = day; }, day);
  await p.click('#bankStart'); await p.waitForTimeout(400);
  await p.evaluate(() => { const S = __bj.S; S.settings.rules.motion = false; __bj.applyMotion(); S.fenceLast = 1e9; S.settings.rules.fence = false; });
  // every table open from the start; nothing says what a rank must bet
  await p.evaluate(() => __bj.openTables()); await p.waitForTimeout(200);
  const rows = await p.$$eval('#tablesList .trow', rs => rs.map(r => r.innerText.replace(/\n+/g, ' / ')));
  check('allOpen', /You’re here/i.test(rows[0]) && /Move to this table/.test(rows[1]) && /You need \$2,000 to sit here/.test(rows[2]) && /You need \$10,000 to sit here/.test(rows[3]), rows);
  await p.evaluate(() => __bj.hideSheets());
  await playHand(); await sheets();
  // a Whale may sit at the 8-deck table and bet $5
  await p.evaluate(() => { const S = __bj.S; S.playPres = 300000; S.bankroll = 200000; S.people = { candy:true, crew:true }; __bj.render(); });
  check('whaleAnyBet', (await p.evaluate(() => [__bj.rankNo(), __bj.tableNo(), __bj.minBet(), __bj.maxBet()])).join() === '5,0,5,500', await p.evaluate(() => [__bj.rankNo(), __bj.tableNo(), __bj.minBet(), __bj.maxBet()]));
  // a low day: averaging $500 as a Whale
  await endOfDay({ ok:149, all:149, bills:1000, bet:149 * 500, hands:149, lvl:2500 });
  await playHand(500);
  const low = await sheets('low-whale');
  const lowMsg = low.find(s => /^Low bets/.test(s)) || '';
  check('lowDay', /Your average bet today was \$500, under what the casino expects from a Whale \(\$2,500\)\. \/ Your sponsor, a watch brand, paid nothing \(\$[\d,]+ missed\)\. \/ Your eye candy and entourage left\.$/.test(lowMsg), low);
  check('peopleGone', JSON.stringify(await p.evaluate(() => __bj.S.people)) === '{}', await p.evaluate(() => __bj.S.people));
  check('noWarningBefore', !low.some(s => /expects|average bet/.test(s) && !/^Low bets/.test(s)), low);
  // a good day at the Whale's level: the sponsor pays
  await p.evaluate(() => { __bj.moveTo(1); __bj.render(); });
  await endOfDay({ ok:149, all:149, bills:1000, bet:149 * 2500, hands:149, lvl:2500 });
  await playHand(2500);
  const good = await sheets();
  check('ratedDay', good.some(s => /^Your sponsor \| .*pays/.test(s)) && !good.some(s => /^Low bets/.test(s)), good);
  // ranked up to Whale this afternoon, after a morning as a Shark at $250: rated against the Shark's $250
  await endOfDay({ ok:149, all:149, bills:1000, bet:149 * 260, hands:149, lvl:250 });
  await playHand(2500);
  const up = await sheets();
  check('rankUpMidDay', !up.some(s => /^Low bets/.test(s)), up);
  // a Super Whale betting $100 loses the comps: today's comped room, meals and car are charged
  await p.evaluate(() => { const S = __bj.S; S.playPres = 6000000; S.bankroll = 2000000; __bj.moveTo(2); __bj.render(); });
  await endOfDay({ ok:149, all:149, bills:0, bet:149 * 100, hands:149, lvl:10000, comped:2500 });
  const before = await p.evaluate(() => __bj.S.bankroll);
  await playHand(100);
  const sw = await sheets('low-super');
  const swMsg = sw.find(s => /^Low bets/.test(s)) || '';
  check('superLosesComps', /under what the casino expects from a Super Whale \(\$10,000\)\. \/ The casino stopped comping you: \$9,000 for today’s room, meals and travel, taken from your chips\.$/.test(swMsg), sw);
  out.errors = errs; out.fails = fails; console.log(JSON.stringify(out, null, 1)); await b.close(); fs.unlinkSync(dir + '/rt-page.html');
  process.exit(fails.length || errs.length ? 1 : 0);
})();
