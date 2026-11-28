// The buy-in: a table needs 20 times its minimum bet in chips to sit (the 8-deck table only its minimum); a new player
// with $1,000 can sit at the 8- and 6-deck tables only; falling below a table's buy-in moves you down after the hand,
// with a "Cut off" message. Usage: node tools/buyin-test.js [shotsdir]
const { chromium } = require('playwright'); const fs = require('fs'); const dir = __dirname, shots = process.argv[2];
const HOOK = "window.__bj = { get S(){ return S; }, hideSheets, render, applyMotion, openTables, moveTo, tableNo, tablesAfterHand, canSit };\n";
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
  await p.click('#bankStart'); await p.waitForTimeout(400);
  await p.evaluate(() => { const S = __bj.S; S.settings.rules.motion = false; __bj.applyMotion(); S.fenceLast = 1e9; S.settings.rules.fence = false; __bj.hideSheets(); });
  // $1,000: only the 8- and 6-deck tables
  check('start', (await p.evaluate(() => [0, 1, 2, 3].map(i => __bj.canSit(i)))).join() === 'true,true,false,false', await p.evaluate(() => [0, 1, 2, 3].map(i => __bj.canSit(i))));
  await p.evaluate(() => __bj.openTables()); await p.waitForTimeout(300);
  const r1 = await rows();
  if (shots) await p.locator('#tablesSheet .panel').screenshot({ path: shots + '/bi-1-tables.png' });
  check('tablesScreen', /\$5 to \$500/.test(r1[0]) && /\$25 to \$5,000 · sit with \$500 \/ Move to this table/.test(r1[1]) && /sit with \$2,000 \/ You need \$2,000 to sit here/.test(r1[2]) && /sit with \$10,000 \/ You need \$10,000 to sit here/.test(r1[3]), r1);
  check('tablesNote', /To sit, you need 20 times the table’s minimum bet in chips\. If your chips fall below that, you’re moved down\./.test(await p.innerText('#tablesNote')), await p.innerText('#tablesNote'));
  // $10,000: the 1-deck table opens; sit there
  await p.evaluate(() => { __bj.hideSheets(); const S = __bj.S; S.bankroll = 10000; __bj.moveTo(3); __bj.render(); });
  check('sitOneDeck', (await p.evaluate(() => __bj.tableNo())) === 3, '');
  // lose below $10,000: cut off to the best table you can buy into
  await p.evaluate(() => { const S = __bj.S; S.bankroll = 9500; __bj.tablesAfterHand(); }); await p.waitForTimeout(1200);
  const cut = (await p.isVisible('#fenceSheet')) ? (await p.innerText('#fenceH')) + ' | ' + (await p.innerText('#fenceText')).replace(/\n+/g, ' / ') : null;
  if (shots && cut) await p.locator('#fenceSheet .panel').screenshot({ path: shots + '/bi-2-cut.png' });
  check('cutOff', (await p.evaluate(() => __bj.tableNo())) === 2 && /^Cut off \| The 1-deck table needs \$10,000 in chips, and you’re below that\. You’re now at the 2-deck table: bets \$100 to \$25,000\.$/.test(cut || ''), [await p.evaluate(() => __bj.tableNo()), cut]);
  // the 8-deck table never cuts you off
  await p.evaluate(() => { __bj.hideSheets(); const S = __bj.S; S.bankroll = 50; __bj.moveTo(0); __bj.tablesAfterHand(); });
  check('eightStays', (await p.evaluate(() => __bj.tableNo())) === 0, '');
  out.errors = errs; out.fails = fails; console.log(JSON.stringify(out, null, 1)); await b.close(); fs.unlinkSync(dir + '/bi-page.html');
  process.exit(fails.length || errs.length ? 1 : 0);
})();
