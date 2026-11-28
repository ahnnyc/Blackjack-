// The welcome-back message says who you are: rank, prestige, and the life at that rank, with homes,
// cars, a chef and deals counted in. Usage: node tools/who-test.js [outdir]   (reads tools/game.html)
const { chromium } = require('playwright'); const fs = require('fs'); const dir = __dirname, shots = process.argv[2];
const HOOK = "window.__bj = { get S(){ return S; }, welcomeBack, hideSheets, render, applyMotion, OFFERS };\n";
fs.writeFileSync(dir + '/who-page.html', '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>[hidden]{display:none!important}body{margin:0}</style></head><body>' +
  fs.readFileSync(dir + '/game.html', 'utf8').replace("function checkLevel(){", "function checkLevel(){ S.level = levelOf(prestige()); return;").replace('/* ---------- boot ---------- */', HOOK + '/* ---------- boot ---------- */') + '</body></html>');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 797 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + dir + '/who-page.html'); await p.waitForTimeout(1500);
  await p.click('#bankStart'); await p.waitForTimeout(400);
  await p.evaluate(() => { __bj.S.settings.rules.motion = false; __bj.applyMotion(); __bj.hideSheets(); });
  const out = {}, fails = []; const check = (n, re, got) => { out[n] = got; if (!re.test(got || '')) fails.push(n); };
  const show = async (name, set) => { await p.evaluate(set); await p.evaluate(() => { __bj.hideSheets(); __bj.render(); __bj.welcomeBack(); }); await p.waitForTimeout(300);
    if (shots) await p.screenshot({ path: shots + '/who-' + name + '.png' });
    return (await p.textContent('#fenceH')) + ' | ' + (await p.innerText('#fenceText')).replace(/\n+/g, ' / '); };
  check('guppy', /^Welcome back \| You’re a Guppy, 0% of the way to Minnow\. \/ You sleep on a friend’s couch for free, eat at the casino food court and walk everywhere: \$25 a day in all\. \/ Chips: \$1,000$/, await show('guppy', () => {}));
  check('barracuda', /You’re a Barracuda, 60% of the way to Swordfish.*You live in the apartment you own, eat at the casino’s diner and ride in the used car you own: \$45 a day in all\. \/ Chips: \$20,000\. You owe \$3,000\./,
    await show('barracuda', () => { const S = __bj.S; S.playPres = 2000; S.bankroll = 20000; S.card = 3000; S.line = { id:'card2', name:'a gold card', limit:25000, rate:0.05 };
      S.stash = [{ item:'an apartment', paid:2500, oid:'apartment' }, { item:'a used car', paid:4000, oid:'usedcar' }, { item:'a gold watch', paid:2500, oid:'watch' }]; }));
  check('whale', /You’re a Whale.*You pay \$375 a night for a villa \(75% comped\), have the personal chef you employ cook for you and get around by limo with a driver: \$575 a day in all\. With you: eye candy and an entourage\./,
    await show('whale', () => { const S = __bj.S; S.card = 0; S.playPres = 250000; S.stash = [{ item:'a personal chef', paid:15000, oid:'chef' }]; S.people = { candy:true, crew:true }; S.bankroll = 400000; }));
  check('super', /You’re a Super Whale\. \/ You stay in the penthouse, eat anywhere you like and get around in your private car and driver, all comped\./,
    await show('super', () => { const S = __bj.S; S.playPres = 6000000; S.stash = []; S.people = {}; }));
  out.errors = errs; out.fails = fails; console.log(JSON.stringify(out, null, 1)); await b.close(); fs.unlinkSync(dir + '/who-page.html');
  process.exit(fails.length || errs.length ? 1 : 0);
})();
