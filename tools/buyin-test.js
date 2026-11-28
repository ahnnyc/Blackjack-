// Minimum bets: a table needs its minimum bet in chips to sit (2 decks $500, 1 deck $2,500); a new player with $1,000
// can sit at the 8-, 6- and 2-deck tables; falling below a table's buy-in moves you down after the hand,
// with a "Cut off" message. Usage: node tools/buyin-test.js [shotsdir]
const { chromium } = require('playwright'); const fs = require('fs'); const dir = __dirname, shots = process.argv[2];
const HOOK = "window.__bj = { get S(){ return S; }, hideSheets, render, applyMotion, openTables, moveTo, tableNo, tablesAfterHand, canSit, migrate, TABLES };\n";
fs.writeFileSync(dir + '/bi-page.html', '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>[hidden]{display:none!important}body{margin:0}</style></head><body>' +
  fs.readFileSync(dir + '/game.html', 'utf8').replace('/* ---------- boot ---------- */', HOOK + '/* ---------- boot ---------- */') + '</body></html>');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + dir + '/bi-page.html'); await p.waitForTimeout(1500);
  const out = {}, fails = []; const check = (n, ok, got) => { out[n] = got; if (!ok) fails.push(n); };
  const rows = () => p.$$eval('#tablesList [data-t]', rs => rs.map(r => r.getAttribute('aria-label')));
  await p.click('#bankStart'); await p.waitForTimeout(400);
  await p.evaluate(() => { const S = __bj.S; S.settings.rules.motion = false; __bj.applyMotion(); S.fenceLast = 1e9; S.settings.rules.fence = false; __bj.hideSheets(); });
  // $1,000: the 8-, 6- and 2-deck tables
  check('start', (await p.evaluate(() => [0, 1, 2, 3].map(i => __bj.canSit(i)))).join() === 'true,true,true,false', await p.evaluate(() => [0, 1, 2, 3].map(i => __bj.canSit(i))));
  await p.evaluate(() => __bj.openTables()); await p.waitForTimeout(300);
  const r1 = await rows();
  if (shots) await p.locator('#tablesSheet .panel').screenshot({ path: shots + '/bi-1-tables.png' });
  check('tablesScreen', r1[0] === '6 decks, $5 to $500. You’re here.' && r1[1] === '4 decks, $25 to $5,000. Tap to sit here.' && r1[2] === '2 decks, $500 to $25,000. Tap to sit here.' && r1[3] === '1 deck, $2,500 to $100,000. Need $2,500 in chips.', r1);
  // tap a locked table: it says why; tap an open one: Sit here moves you
  await p.locator('#tablesList [data-t="3"]').click(); await p.waitForTimeout(900);
  const lockCard = (await p.innerText('#fenceH')) + ' | ' + (await p.innerText('#fenceText'));
  check('lockedCard', /^1-deck table \| Bets \$2,500 to \$100,000\. You need \$2,500 in chips to sit here, and you have \$1,000\.$/.test(lockCard), lockCard);
  await p.click('#fenceBtns button:last-child'); await p.waitForTimeout(400);
  check('backToFloor', await p.isVisible('#tablesSheet'), '');
  await p.locator('#tablesList [data-t="1"]').click(); await p.waitForTimeout(900);
  const sitCard = (await p.innerText('#fenceH')) + ' | ' + (await p.innerText('#fenceText'));
  check('sitCard', /^4-deck table \| Bets \$25 to \$5,000\. You have \$1,000, so you can sit here\.$/.test(sitCard), sitCard);
  if (shots) await p.locator('#fenceSheet .panel').screenshot({ path: shots + '/bi-3-card.png' });
  await p.click('#fenceBtns button:last-child'); await p.waitForTimeout(400);
  check('satDown', (await p.evaluate(() => __bj.tableNo())) === 1, await p.evaluate(() => __bj.tableNo()));
  await p.evaluate(() => { __bj.moveTo(0); __bj.render(); });
  check('tablesNote', /Tap the table you want\. Fewer decks, better odds\. You can sit at any table whose minimum bet you have in chips\./.test(await p.innerText('#tablesNote')), await p.innerText('#tablesNote'));
  // $2,500: the 1-deck table opens; sit there
  await p.evaluate(() => { __bj.hideSheets(); const S = __bj.S; S.bankroll = 2500; __bj.moveTo(3); __bj.render(); });
  check('sitOneDeck', (await p.evaluate(() => __bj.tableNo())) === 3, '');
  // lose below $2,500: cut off to the best table you can buy into
  await p.evaluate(() => { const S = __bj.S; S.bankroll = 2000; __bj.tablesAfterHand(); }); await p.waitForTimeout(1200);
  const cut = (await p.isVisible('#fenceSheet')) ? (await p.innerText('#fenceH')) + ' | ' + (await p.innerText('#fenceText')).replace(/\n+/g, ' / ') : null;
  if (shots && cut) await p.locator('#fenceSheet .panel').screenshot({ path: shots + '/bi-2-cut.png' });
  check('cutOff', (await p.evaluate(() => __bj.tableNo())) === 2 && /^Cut off \| The 1-deck table’s minimum bet is \$2,500, and you have less than that\. You’re now at the 2-deck table: bets \$500 to \$25,000\.$/.test(cut || ''), [await p.evaluate(() => __bj.tableNo()), cut]);
  // the 6-deck table never cuts you off
  await p.evaluate(() => { __bj.hideSheets(); const S = __bj.S; S.bankroll = 50; __bj.moveTo(0); __bj.tablesAfterHand(); });
  check('eightStays', (await p.evaluate(() => __bj.tableNo())) === 0, '');
  // a game saved at the old 8-deck table is now at the 6-deck table; the tables are 6, 4, 2 and 1 deck
  await p.evaluate(() => { const S = __bj.S; S.table = 0; S.settings.decks = 8; __bj.migrate(); });
  check('oldEightDeck', (await p.evaluate(() => __bj.S.settings.decks)) === 6 && (await p.evaluate(() => __bj.TABLES.map(t => t.d).join()))  === '6,4,2,1', await p.evaluate(() => [__bj.S.settings.decks, __bj.TABLES.map(t => t.d)]));
  out.errors = errs; out.fails = fails; console.log(JSON.stringify(out, null, 1)); await b.close(); fs.unlinkSync(dir + '/bi-page.html');
  process.exit(fails.length || errs.length ? 1 : 0);
})();
