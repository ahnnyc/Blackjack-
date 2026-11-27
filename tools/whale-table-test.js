// Every table open to anyone who can cover its minimum (no unlocking). Big ranks and small tables: a Whale ($2,500 minimum) can't stay at the 8-deck table ($500 maximum), and a
// Super Whale ($10,000 minimum) can't stay at the 6-deck table ($5,000 maximum). Each is moved up after a hand,
// told why once the shoe runs out (not mid-shoe), and the table list says the smaller tables are too small. A Marlin ($250) still plays 8 decks.
// Usage: node tools/whale-table-test.js   (reads tools/game.html)
const { chromium } = require('playwright'); const fs = require('fs'); const dir = __dirname;
const HOOK = "window.__bj = { get S(){ return S; }, prestige, minBet, maxBet, rankNo, hideSheets, render, applyMotion, moveTo, openTables, tableNo };\n";
fs.writeFileSync(dir + '/wt-page.html', '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>[hidden]{display:none!important}body{margin:0}</style></head><body>' +
  fs.readFileSync(dir + '/game.html', 'utf8').replace("function checkLevel(){", "function checkLevel(){ S.level = levelOf(prestige()); return;").replace('/* ---------- boot ---------- */', HOOK + '/* ---------- boot ---------- */') + '</body></html>');
const isChip = l => /^(5|25|100|500|1K|5K|25K|100K)$/.test(l);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 797 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + dir + '/wt-page.html'); await p.waitForTimeout(1500);
  const out = {}, fails = []; const check = (n, ok, got) => { out[n] = got; if (!ok) fails.push(n); };
  const sheet = async () => (await p.isVisible('#fenceSheet')) ? (await p.textContent('#fenceH')) + ' | ' + (await p.innerText('#fenceText')).replace(/\n+/g, ' / ') : null;
  const playHand = async () => {
    await p.evaluate(() => { const S = __bj.S, m = __bj.minBet(); S.bankroll -= m - S.bet; S.bet = m; __bj.render(); });
    await p.click('#actions button:has-text("Deal")');
    for (let i = 0; i < 300; i++) {
      const labels = await p.$$eval('#actions button:not([disabled])', bs => bs.map(x => x.textContent));
      if (labels.some(isChip) || labels.includes('Borrow')) break;
      if (!labels.length) { await p.waitForTimeout(40); continue; }
      const pick = ['No insurance', 'No thanks'].find(l => labels.includes(l)) || (labels.includes('Stand') ? 'Stand' : labels[0]);
      await p.click(`#actions button:not([disabled]):text-is("${pick}")`);
      if (await p.isVisible('#warnGo')) await p.click('#warnGo');
    }
    await p.waitForTimeout(1200);
  };
  await p.click('#bankStart'); await p.waitForTimeout(300);
  await p.evaluate(() => { const S = __bj.S; S.settings.rules.motion = false; __bj.applyMotion(); S.fenceLast = 1e9; S.settings.rules.stay = false; S.settings.rules.fence = false; S.settings.rules.host = false; });
  // every table is open from the start to anyone who can cover its minimum, and nothing is announced at the end of a shoe
  await p.evaluate(() => __bj.openTables()); await p.waitForTimeout(200);
  const start = await p.$$eval('#tablesList .trow', rs => rs.map(r => r.innerText.replace(/\n+/g, ' / ')));
  check('allOpen', /You’re here/i.test(start[0]) && start.slice(1).every(r => /Move to this table/.test(r)) && !start.some(r => /Locked|Opens at/.test(r)), start);
  await p.evaluate(() => __bj.hideSheets());
  await playHand();
  await p.evaluate(() => { const S = __bj.S; S.pos = S.shoe.length - Math.ceil(Math.max(20, S.shoe.length * 0.25)) - 2; });
  await playHand();
  check('noTableMessage', (await sheet()) === null, await sheet());
  // a Guppy with $80 can't sit at the $100 table
  await p.evaluate(() => { __bj.S.bankroll = 80; __bj.openTables(); }); await p.waitForTimeout(200);
  const poor = await p.$$eval('#tablesList .trow', rs => rs.map(r => r.innerText.replace(/\n+/g, ' / ')));
  check('needMinimum', /Move to this table/.test(poor[1]) && /You need \$100 to sit here/.test(poor[2]) && /You need \$500 to sit here/.test(poor[3]), poor);
  await p.evaluate(() => __bj.hideSheets());
  // a Marlin stays at 8 decks, $250 to $500
  await p.evaluate(() => { const S = __bj.S; S.playPres = 30000; S.bankroll = 20000; S.open = [true, true, true, true]; __bj.render(); });
  check('marlinLimits', (await p.evaluate(() => [__bj.rankNo(), __bj.tableNo(), __bj.minBet(), __bj.maxBet()])).join() === '4,0,250,500', await p.evaluate(() => [__bj.rankNo(), __bj.tableNo(), __bj.minBet(), __bj.maxBet()]));
  // a Whale at 8 decks: one hand, then moved up to 6 decks
  await p.evaluate(() => { const S = __bj.S; S.playPres = 260000; S.bankroll = 200000; __bj.render(); });
  await playHand();
  // mid-shoe: no move yet, and the bet is this table's $500 maximum
  check('whaleWaitsForShoe', (await p.evaluate(() => [__bj.tableNo(), __bj.minBet(), document.getElementById('fenceSheet').hidden])).join() === '0,500,true', await p.evaluate(() => [__bj.tableNo(), __bj.minBet(), document.getElementById('fenceSheet').hidden]));
  await p.evaluate(() => { const S = __bj.S; S.pos = S.shoe.length - Math.ceil(Math.max(20, S.shoe.length * 0.25)) - 2; /* this hand reaches the cut card */ });
  await playHand();
  const w = await sheet();
  check('whaleMoved', (await p.evaluate(() => __bj.tableNo())) === 1 && /^New table \| Whales bet at least \$2,500 a hand\. The 8-deck table only goes up to \$500, so you’re now at the 6-deck table\.$/.test(w || ''), w);
  await p.evaluate(() => __bj.hideSheets());
  await p.evaluate(() => __bj.openTables()); await p.waitForTimeout(200);
  const rows = await p.$$eval('#tablesList .trow', rs => rs.map(r => r.innerText.replace(/\n+/g, ' / ')));
  check('whaleTableList', /Too small for a Whale \(\$2,500 minimum\)/.test(rows[0]) && /You’re here/i.test(rows[1]) && /Move to this table/.test(rows[2]), rows);
  await p.evaluate(() => __bj.hideSheets());
  // a Super Whale at 6 decks: moved up to 2 decks
  await p.evaluate(() => { const S = __bj.S; S.playPres = 5100000; S.bankroll = 2000000; __bj.render(); });
  await playHand();
  check('superWaitsForShoe', (await p.evaluate(() => __bj.tableNo())) === 1, await p.evaluate(() => __bj.tableNo()));
  await p.evaluate(() => { const S = __bj.S; S.pos = S.shoe.length - Math.ceil(Math.max(20, S.shoe.length * 0.25)) - 2; /* this hand reaches the cut card */ });
  await playHand();
  const sw = await sheet();
  check('superWhaleMoved', (await p.evaluate(() => __bj.tableNo())) === 2 && /^New table \| Super Whales bet at least \$10,000 a hand\. The 6-deck table only goes up to \$5,000, so you’re now at the 2-deck table\.$/.test(sw || ''), sw);
  await p.evaluate(() => __bj.hideSheets());
  await p.evaluate(() => __bj.openTables()); await p.waitForTimeout(200);
  await p.screenshot({ path: dir + '/wt-tables.png' });
  const rows2 = await p.$$eval('#tablesList .trow', rs => rs.map(r => r.innerText.replace(/\n+/g, ' / ')));
  check('superTableList', /Too small/.test(rows2[0]) && /Too small/.test(rows2[1]) && /Move to this table/.test(rows2[3]), rows2);
  out.errors = errs; out.fails = fails; console.log(JSON.stringify(out, null, 1)); await b.close(); fs.unlinkSync(dir + '/wt-page.html');
  process.exit(fails.length || errs.length ? 1 : 0);
})();
