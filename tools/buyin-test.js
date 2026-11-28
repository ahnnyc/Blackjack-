// Tables open as you play: bet $5,000 in all this game to open 4 decks, $25,000 for 2 decks, $100,000 for 1 deck. Only
// bets of up to 5% of your chips count; starting over resets it. You also need a table's minimum in chips to sit, and
// falling below it moves you down. The 6-deck table is $5 to $250. Usage: node tools/buyin-test.js [shotsdir]
const { chromium } = require('playwright'); const fs = require('fs'); const dir = __dirname, shots = process.argv[2];
const HOOK = "window.__bj = { get S(){ return S; }, hideSheets, render, applyMotion, openTables, moveTo, tableNo, tablesAfterHand, canSit, migrate, TABLES, newGame, maxBet };\n";
fs.writeFileSync(dir + '/bi-page.html', '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>[hidden]{display:none!important}body{margin:0}</style></head><body>' +
  fs.readFileSync(dir + '/game.html', 'utf8').replace('/* ---------- boot ---------- */', HOOK + '/* ---------- boot ---------- */') + '</body></html>');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + dir + '/bi-page.html'); await p.waitForTimeout(1500);
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
  await p.evaluate(() => { const S = __bj.S; S.settings.rules.motion = false; __bj.applyMotion(); S.fenceLast = 1e9; S.settings.rules.fence = false; S.settings.rules.stay = false; __bj.hideSheets(); });
  // a new game: only the 6-deck table, $5 to $250
  check('start', (await p.evaluate(() => [0, 1, 2, 3].map(i => __bj.canSit(i)))).join() === 'true,false,false,false' && (await p.evaluate(() => __bj.maxBet())) === 250, await p.evaluate(() => [[0, 1, 2, 3].map(i => __bj.canSit(i)), __bj.maxBet()]));
  // a $25 bet from $1,000 counts; a $100 bet (10%) does not
  await playHand(25); const a1 = await p.evaluate(() => __bj.S.action);
  await p.evaluate(() => { __bj.S.bankroll = 1000; }); await playHand(100); const a2 = await p.evaluate(() => __bj.S.action);
  check('onlySensibleBetsCount', a1 === 25 && a2 === 25, [a1, a2]);
  // the Tables screen shows progress
  await p.evaluate(() => { const S = __bj.S; S.action = 3200; S.bankroll = 1000; __bj.openTables(); }); await p.waitForTimeout(300);
  const r1 = await rows();
  if (shots) await p.locator('#tablesSheet .panel').screenshot({ path: shots + '/bi-1-tables.png' });
  check('tablesScreen', /^6 decks \/ \$5 to \$250 \/ ✓ YOU’RE HERE$/i.test(r1[0]) && r1[1] === '4 decks / $25 to $5,000 / 🔒 Opens after $5,000 in bets. You’ve bet $3,200.' && /Opens after \$25,000 in bets\. You’ve bet \$3,200\./.test(r1[2]) && /Opens after \$100,000 in bets/.test(r1[3]), r1);
  check('progressBar', (await p.evaluate(() => document.querySelector('#tablesList .trow:nth-child(2) .prog').getAttribute('aria-valuenow'))) === '3200', '');
  check('tablesNote', /Tables open as you play: only bets of 5% of your chips or less count, and starting over starts again from zero\./.test(await p.innerText('#tablesNote')), await p.innerText('#tablesNote'));
  // crossing $5,000 opens the 4-deck table, with a message
  await p.evaluate(() => { __bj.hideSheets(); const S = __bj.S; S.action = 4990; S.bankroll = 1000; });
  await playHand(25); await p.waitForTimeout(800);
  const opened = await sheet();
  if (shots && opened) await p.locator('#fenceSheet .panel').screenshot({ path: shots + '/bi-2-opened.png' });
  check('openedMessage', /^A new table is open \| You’ve bet \$5,000 this game, so the 4-deck table is open to you: bets \$25 to \$5,000\./.test(opened || '') && (await p.evaluate(() => __bj.canSit(1))), opened);
  await p.evaluate(() => { __bj.hideSheets(); __bj.openTables(); }); await p.waitForTimeout(300);
  if (shots) await p.locator('#tablesSheet .panel').screenshot({ path: shots + '/bi-3-tables-open.png' });
  check('moveRow', /Move to this table/.test((await rows())[1]), await rows());
  // the 1-deck table: opened by play, then losing below $2,500 moves you down to the best table you can afford
  await p.evaluate(() => { __bj.hideSheets(); const S = __bj.S; S.action = 100000; S.bankroll = 2500; __bj.moveTo(3); __bj.render(); });
  check('sitOneDeck', (await p.evaluate(() => __bj.tableNo())) === 3, '');
  await p.evaluate(() => { const S = __bj.S; S.bankroll = 2000; __bj.tablesAfterHand(); }); await p.waitForTimeout(1200);
  const cut = await sheet();
  check('cutOff', (await p.evaluate(() => __bj.tableNo())) === 2 && /^Cut off \| The 1-deck table’s minimum bet is \$2,500, and you have less than that\. You’re now at the 2-deck table/.test(cut || ''), [await p.evaluate(() => __bj.tableNo()), cut]);
  await p.evaluate(() => __bj.hideSheets());
  // starting over starts from zero
  await p.evaluate(() => { __bj.newGame(false); }); await p.waitForTimeout(400);
  check('startOverResets', (await p.evaluate(() => [__bj.S.action, __bj.tableNo(), __bj.canSit(1)])).join() === '0,0,false', await p.evaluate(() => [__bj.S.action, __bj.tableNo(), __bj.canSit(1)]));
  // a game saved before this keeps the table it was at; the tables are 6, 4, 2 and 1 deck
  await p.evaluate(() => { const S = __bj.S; S.table = 2; delete S.action; S.settings.decks = 8; __bj.migrate(); });
  check('oldSave', (await p.evaluate(() => [__bj.S.action, __bj.S.settings.decks, __bj.TABLES.map(t => t.d).join('')])).join() === '25000,2,6421', await p.evaluate(() => [__bj.S.action, __bj.S.settings.decks, __bj.TABLES.map(t => t.d).join('')]));
  out.errors = errs; out.fails = fails; console.log(JSON.stringify(out, null, 1)); await b.close(); fs.unlinkSync(dir + '/bi-page.html');
  process.exit(fails.length || errs.length ? 1 : 0);
})();
