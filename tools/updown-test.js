// Checks the "Up / Down" line matches the hands' net result, ignores the cashier, and fits.
const { chromium } = require('playwright');
const dir = __dirname;
const isChip = l => /^(5|25|100|500|1K)$/.test(l);
(async () => {
  const b = await chromium.launch();
  const out = {};
  for (const [w, h] of [[390, 797], [320, 568]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + dir + '/page.html');
    await p.fill('#bankInput', '1000'); await p.click('#bankStart');
    const checks = [];
    const compare = async when => {
      const shown = await p.textContent('#plTag');
      const net = await p.evaluate(() => { const S = JSON.parse(localStorage.getItem('bj.state.v1')); const H = JSON.parse(localStorage.getItem('bj.history.v1') || '[]'); return Math.round(H.filter(r => r.s === S.session).reduce((a, r) => a + r.n, 0) * 100) / 100; });
      const expect = net > 0 ? '▲ Up $' : net < 0 ? '▼ Down $' : 'Even';
      const amt = Math.abs(net);
      const ok = net === 0 ? shown === 'Even' : shown.startsWith(expect) && Number(shown.replace(/[^0-9.]/g, '')) === amt;
      checks.push({ when, shown, net, ok });
    };
    await compare('start');
    for (let round = 0; round < 6; round++) {
      await p.click('.chip.c25'); await p.waitForTimeout(300);
      await p.click('#actions button:has-text("Deal")');
      for (let i = 0; i < 300; i++) {
        const labels = await p.$$eval('#actions button:not([disabled])', bs => bs.map(x => x.textContent));
        if (labels.some(isChip)) break;
        if (!labels.length) { await p.waitForTimeout(50); continue; }
        const pick = labels.includes('Stand') ? 'Stand' : (['No insurance', 'No thanks'].find(l => labels.includes(l)) || labels[0]);
        await p.click(`#actions button:not([disabled]):text-is("${pick}")`);
        if (await p.isVisible('#warnGo')) await p.click('#warnGo');
      }
      await p.waitForTimeout(2500);
      await compare('after hand ' + (round + 1));
    }
    await p.click('#openCashier'); await p.click('#buyPresets button:has-text("$500")'); await p.click('#buyBtn'); await p.waitForTimeout(1500);
    await compare('after buying $500');
    await p.click('#openCashier'); await p.fill('#cashInput', '200'); await p.dispatchEvent('#cashInput', 'input'); await p.click('#cashBtn'); await p.waitForTimeout(1500);
    await compare('after cashing in $200');
    const fit = await p.evaluate(() => ({ pageScrolls: document.scrollingElement.scrollHeight > innerHeight, sideways: document.documentElement.scrollWidth > innerWidth }));
    await p.screenshot({ path: `${dir}/updown-${w}.png` });
    out[w + 'x' + h] = { allMatch: checks.every(c => c.ok), checks: checks.map(c => c.when + ': ' + c.shown + (c.ok ? '' : ' (MISMATCH, net ' + c.net + ')')), ...fit, errors: errs };
    await ctx.close();
  }
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})();
