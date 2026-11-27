// Tapping a daily expense on the Expenses screen: choose a cheaper room, meals or way of getting around from the ranks
// below (at their full price, never a free one), or move back up to your rank's own; send eye candy or the entourage
// home. Bills follow the choice; the rank doesn't change. Usage: node tools/choice-test.js [shotsdir]
const { chromium } = require('playwright'); const fs = require('fs'); const dir = __dirname, shots = process.argv[2];
const HOOK = "window.__bj = { get S(){ return S; }, hideSheets, render, applyMotion, openCashier, stayBill, rankNo, lifeLine };\n";
fs.writeFileSync(dir + '/ch-page.html', '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>[hidden]{display:none!important}body{margin:0}</style></head><body>' +
  fs.readFileSync(dir + '/game.html', 'utf8').replace("function checkLevel(){", "function checkLevel(){ S.level = levelOf(prestige()); return;").replace('/* ---------- boot ---------- */', HOOK + '/* ---------- boot ---------- */') + '</body></html>');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + dir + '/ch-page.html'); await p.waitForTimeout(1500);
  const out = {}, fails = []; const check = (n, ok, got) => { out[n] = got; if (!ok) fails.push(n); };
  const rows = () => p.$$eval('#expList .er', rs => rs.map(r => (r.tagName === 'BUTTON' ? '[tap] ' : '') + r.innerText.replace(/\n+/g, ' | ')));
  await p.click('#bankStart'); await p.waitForTimeout(400);
  await p.evaluate(() => { const S = __bj.S; S.settings.rules.motion = false; __bj.applyMotion(); S.fenceLast = 1e9; S.settings.rules.stay = true; S.playPres = 300000; S.bankroll = 50000; S.people = { crew: true }; __bj.hideSheets(); __bj.render(); __bj.hideSheets(); __bj.openCashier(); });
  await p.waitForTimeout(300);
  const r0 = await rows();
  check('tappableRows', r0.filter(x => x.startsWith('[tap]')).length === 4 && !/Lower/.test(r0.join(' ')), r0);
  if (shots) await p.locator('#cashSheet .panel').screenshot({ path: shots + '/choice-1-list.png' });
  await p.locator('#expList button.er', { hasText: 'Room' }).click(); await p.waitForTimeout(900);
  const opts = await p.$$eval('#fenceText .opt .btn', bs => bs.map(b => b.innerText.replace(/\n+/g, ' | ')));
  check('roomChoices', /^Room|Your room/.test(await p.textContent('#fenceH')) && opts.some(x => /^A villa \| ✓ Now \| \$1,500 a night, a Whale’s$/.test(x)) && opts.some(x => /^A tower suite \| \$799 a night$/.test(x)) && !opts.some(x => /couch/.test(x)), opts);
  if (shots) await p.locator('#fenceSheet .panel').screenshot({ path: shots + '/choice-2-room.png' });
  await p.locator('#fenceText .opt .btn', { hasText: 'A tower suite' }).click(); await p.waitForTimeout(400);
  const r1 = await rows();
  check('roomChanged', r1.some(x => /^\[tap\] Room \| A tower suite \| \$799 ›$/.test(x)) && (await p.evaluate(() => __bj.rankNo())) === 5, r1);
  await p.evaluate(() => { __bj.hideSheets(); __bj.S.day = { ok:0, all:0, bills:0 }; __bj.stayBill(3, 1); }); await p.waitForTimeout(300);
  check('billFollows', /A night in a tower suite: \$799/.test(await p.innerText('#fenceText')), await p.innerText('#fenceText'));
  check('lifeFollows', /You pay \$799 a night for a tower suite/.test(await p.evaluate(() => __bj.lifeLine(__bj.rankNo()))), await p.evaluate(() => __bj.lifeLine(__bj.rankNo())));
  // and back up
  await p.evaluate(() => { __bj.hideSheets(); __bj.openCashier(); }); await p.waitForTimeout(300);
  await p.locator('#expList button.er', { hasText: 'Room' }).click(); await p.waitForTimeout(900);
  await p.locator('#fenceText .opt .btn', { hasText: 'A villa' }).click(); await p.waitForTimeout(400);
  check('backUp', (await rows()).some(x => /^\[tap\] Room \| A villa \| \$1,500 ›$/.test(x)), await rows());
  // send the entourage home
  await p.locator('#expList button.er', { hasText: 'Entourage' }).click(); await p.waitForTimeout(900);
  if (shots) await p.locator('#fenceSheet .panel').screenshot({ path: shots + '/choice-3-crew.png' });
  await p.click('#fenceBtns button:last-child'); await p.waitForTimeout(300);
  check('sentHome', !(await p.evaluate(() => !!__bj.S.people.crew)) && !(await rows()).some(x => /Entourage/.test(x)), await rows());
  // Super Whale: nothing to change
  await p.evaluate(() => { __bj.hideSheets(); __bj.S.playPres = 6000000; __bj.render(); __bj.hideSheets(); __bj.openCashier(); }); await p.waitForTimeout(300);
  check('superNoChoices', !(await rows()).some(x => x.startsWith('[tap]')), await rows());
  out.errors = errs; out.fails = fails; console.log(JSON.stringify(out, null, 1)); await b.close(); fs.unlinkSync(dir + '/ch-page.html');
  process.exit(fails.length || errs.length ? 1 : 0);
})();
