// Big ranks and small tables: a Whale ($2,500 minimum) can't stay at the 8-deck table ($500 maximum), and a
// Super Whale ($10,000 minimum) can't stay at the 6-deck table ($5,000 maximum). Each is moved up after a hand,
// told why, and the table list says the smaller tables are too small. A Marlin ($250) still plays 8 decks.
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
  // a Marlin stays at 8 decks, $250 to $500
  await p.evaluate(() => { const S = __bj.S; S.playPres = 30000; S.bankroll = 20000; S.open = [true, true, true, true]; __bj.render(); });
  check('marlinLimits', (await p.evaluate(() => [__bj.rankNo(), __bj.tableNo(), __bj.minBet(), __bj.maxBet()])).join() === '4,0,250,500', await p.evaluate(() => [__bj.rankNo(), __bj.tableNo(), __bj.minBet(), __bj.maxBet()]));
  // a Whale at 8 decks: one hand, then moved up to 6 decks
  await p.evaluate(() => { const S = __bj.S; S.playPres = 260000; S.bankroll = 200000; __bj.render(); });
  await playHand();
  const w = await sheet();
  check('whaleMoved', (await p.evaluate(() => __bj.tableNo())) === 1 && /^Moved up \| A Whale’s minimum bet is \$2,500, above the \$500 maximum at the 8-deck table\. You’re now at the 6-deck table: your bets \$2,500 to \$5,000\.$/.test(w || ''), w);
  await p.evaluate(() => __bj.hideSheets());
  await p.evaluate(() => __bj.openTables()); await p.waitForTimeout(200);
  const rows = await p.$$eval('#tablesList .trow', rs => rs.map(r => r.innerText.replace(/\n+/g, ' / ')));
  check('whaleTableList', /Too small for a Whale \(\$2,500 minimum\)/.test(rows[0]) && /You’re here/i.test(rows[1]) && /Move to this table/.test(rows[2]), rows);
  await p.evaluate(() => __bj.hideSheets());
  // a Super Whale at 6 decks: moved up to 2 decks
  await p.evaluate(() => { const S = __bj.S; S.playPres = 5100000; S.bankroll = 2000000; __bj.render(); });
  await playHand();
  const sw = await sheet();
  check('superWhaleMoved', (await p.evaluate(() => __bj.tableNo())) === 2 && /^Moved up \| A Super Whale’s minimum bet is \$10,000, above the \$5,000 maximum at the 6-deck table\. You’re now at the 2-deck table: your bets \$10,000 to \$25,000\.$/.test(sw || ''), sw);
  await p.evaluate(() => __bj.hideSheets());
  await p.evaluate(() => __bj.openTables()); await p.waitForTimeout(200);
  await p.screenshot({ path: dir + '/wt-tables.png' });
  const rows2 = await p.$$eval('#tablesList .trow', rs => rs.map(r => r.innerText.replace(/\n+/g, ' / ')));
  check('superTableList', /Too small/.test(rows2[0]) && /Too small/.test(rows2[1]) && /Move to this table/.test(rows2[3]), rows2);
  out.errors = errs; out.fails = fails; console.log(JSON.stringify(out, null, 1)); await b.close(); fs.unlinkSync(dir + '/wt-page.html');
  process.exit(fails.length || errs.length ? 1 : 0);
})();
