// Cashier: tapping amounts adds them up (buy and cash in), Clear resets, cash-in never exceeds your chips,
// and the page refuses double-tap zoom.
const { chromium } = require('playwright'); const fs = require('fs'); const dir = __dirname;
fs.writeFileSync(dir + '/page.html', '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>[hidden]{display:none!important}body{margin:0}</style></head><body>' + fs.readFileSync(dir + '/blackjack.html', 'utf8') + '</body></html>');
(async () => {
  const b = await chromium.launch(); const out = {};
  for (const [w, h] of [[390, 797], [320, 568]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + dir + '/page.html');
    await p.fill('#bankInput', '1000'); await p.click('#bankStart');
    const bank = async () => (await p.textContent('#bankAmt')).trim();
    const r = { w };
    await p.click('#openCashier'); await p.waitForTimeout(200);
    r.opensAt = [await p.inputValue('#buyInput'), await p.inputValue('#cashInput'), await p.textContent('#buyBtn'), await p.isDisabled('#buyBtn')];
    for (const t of ['+$100', '+$100', '+$500', '+$1,000']) await p.tap(`#buyPresets button:text-is("${t}")`);
    r.buyAfter100_100_500_1000 = [await p.inputValue('#buyInput'), await p.textContent('#buyBtn')];
    await p.screenshot({ path: `${dir}/cashier-add-${w}.png` });
    await p.tap('#buyClear'); r.buyAfterClear = await p.inputValue('#buyInput');
    for (const t of ['+$500', '+$500']) await p.tap(`#buyPresets button:text-is("${t}")`);
    await p.tap('#buyBtn'); await p.waitForTimeout(1500); r.bankAfterBuying1000 = await bank();
    await p.click('#openCashier'); await p.waitForTimeout(200);
    for (const t of ['+$500', '+$500', '+$100']) await p.tap(`#cashPresets button:text-is("${t}")`);
    r.cashAfter500_500_100 = [await p.inputValue('#cashInput'), await p.textContent('#cashBtn')];
    for (let k = 0; k < 3; k++) { const el = await p.$('#cashPresets button:not([disabled]):text-is("+$1,000")'); if (el) await el.tap(); }
    r.cashCappedAtChips = [await p.inputValue('#cashInput'), await p.isDisabled('#cashPresets button:text-is("+$1,000")')];
    await p.tap('#cashClear'); await p.tap('#cashPresets button:text-is("+$100")'); await p.tap('#cashPresets button:text-is("+$100")');
    await p.tap('#cashBtn'); await p.waitForTimeout(1500); r.bankAfterCashing200 = await bank();
    r.touchAction = await p.evaluate(() => getComputedStyle(document.documentElement).touchAction);
    // two quick taps on the felt: the page must not scale
    const before = await p.evaluate(() => visualViewport.scale);
    await p.touchscreen.tap(w / 2, h * 0.4); await p.waitForTimeout(60); await p.touchscreen.tap(w / 2, h * 0.4); await p.waitForTimeout(600);
    r.zoomAfterDoubleTap = [before, await p.evaluate(() => visualViewport.scale)];
    r.errors = errs; out[w] = r; await ctx.close();
  }
  console.log(JSON.stringify(out, null, 1)); await b.close();
})();
