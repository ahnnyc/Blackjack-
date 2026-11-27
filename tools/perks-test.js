// Small regulars get rewarded: free chips the first time you reach Minnow ($100), Barracuda ($500) and Swordfish ($1,000),
// once per game, and the new-rank message never contradicts itself about the price; breakfast comped at Minnow; the room at half price at Barracuda and comped at Swordfish.
// Usage: node tools/perks-test.js [shotsdir]   (reads tools/game.html)
const { chromium } = require('playwright'); const fs = require('fs'); const dir = __dirname, shots = process.argv[2];
const HOOK = "window.__bj = { get S(){ return S; }, prestige, rankNo, hideSheets, render, applyMotion, stayBill, whoYouAre };\n";
fs.writeFileSync(dir + '/pk-page.html', '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>[hidden]{display:none!important}body{margin:0}</style></head><body>' +
  fs.readFileSync(dir + '/game.html', 'utf8').replace('/* ---------- boot ---------- */', HOOK + '/* ---------- boot ---------- */') + '</body></html>');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 797 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + dir + '/pk-page.html'); await p.waitForTimeout(1500);
  const out = {}, fails = []; const check = (n, ok, got) => { out[n] = got; if (!ok) fails.push(n); };
  const sheet = async () => (await p.isVisible('#fenceSheet')) ? (await p.textContent('#fenceH')) + ' | ' + (await p.innerText('#fenceText')).replace(/\n+/g, ' / ') : null;
  await p.click('#bankStart'); await p.waitForTimeout(400);
  await p.evaluate(() => { const S = __bj.S; S.settings.rules.motion = false; __bj.applyMotion(); S.fenceLast = 1e9; S.settings.rules.stay = true; S.bankroll = 5000; __bj.hideSheets(); __bj.render(); });
  const rankTo = async (pres, name) => { await p.evaluate(v => { __bj.S.playPres = v; __bj.render(); }, pres); await p.waitForTimeout(700);
    const s = await sheet(); if (shots && name) await p.screenshot({ path: shots + '/' + name + '.png' }); await p.evaluate(() => __bj.hideSheets()); await p.waitForTimeout(300); return s; };
  const bank = () => p.evaluate(() => __bj.S.bankroll);
  const bill = async (i) => { await p.evaluate(i => { __bj.S.day = { ok:0, all:0, bills:0 }; __bj.stayBill(i, 1); }, i); await p.waitForTimeout(300); const s = await sheet(); await p.evaluate(() => __bj.hideSheets()); await p.waitForTimeout(200); return s; };
  // Minnow: $100, breakfast comped
  let b0 = await bank();
  const m = await rankTo(1000, 'rank-minnow');
  check('minnowGift', /^New rank \| You are now a Minnow\. \/ Welcome gift from the casino: \$100 in free chips\. Your breakfast is comped from now on\. \/ You stay in a hostel bed, eat fast food \(breakfast comped\) and get around by the city bus: \$44 a day\./.test(m || '') && (await bank()) === b0 + 100, [m, await bank() - b0]);
  check('breakfastComped', /^Breakfast \| Breakfast at fast food: comped by the players’ club$/.test(await bill(0) || ''), await bill(0));
  check('lunchCharged', /^Lunch \| Lunch at fast food: \$8, taken from your chips\.$/.test(await bill(1) || ''), await bill(1));
  // Barracuda: $500, room half price
  b0 = await bank();
  const bc = await rankTo(5000, 'rank-barracuda');
  check('barracudaGift', /Welcome gift from the casino: \$500 in free chips\. The casino gives you its room rate: half price\. \/ You stay in a standard room at the casino \(half price\), eat at a diner and get around by the city bus: \$85 a day\./.test(bc || '') && (await bank()) === b0 + 500, [bc, await bank() - b0]);
  check('roomHalf', /A night in a standard room at the casino \(half price\): \$30/.test(await bill(3) || ''), await bill(3));
  // Swordfish: $1,000, room comped
  b0 = await bank();
  const sw = await rankTo(10000);
  check('swordfishGift', /Welcome gift from the casino: \$1,000 in free chips\. Your room is comped from now on\. \/ You stay in a deluxe room at the casino \(comped\), eat at a café and get around by taxis: \$131 a day\./.test(sw || '') && (await bank()) === b0 + 1000, [sw, await bank() - b0]);
  check('roomComped', /^End of day 1 \| A night in a deluxe room at the casino: comped by the casino \/ Getting around by taxis: \$36/.test(await bill(3) || ''), await bill(3));
  check('whoSwordfish', /You stay in a deluxe room at the casino \(comped\), eat at a café and get around by taxis: \$131 a day\./.test(await p.evaluate(() => __bj.whoYouAre())), await p.evaluate(() => __bj.whoYouAre()));
  // dropping back and climbing again gives no second gift
  await rankTo(5000); b0 = await bank();
  const again = await rankTo(10000);
  check('noSecondGift', !/Welcome gift/.test(again || '') && (await bank()) === b0, [again, await bank() - b0]);
  out.errors = errs; out.fails = fails; console.log(JSON.stringify(out, null, 1)); await b.close(); fs.unlinkSync(dir + '/pk-page.html');
  process.exit(fails.length || errs.length ? 1 : 0);
})();
