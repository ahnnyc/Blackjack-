// Both charts must show winnings/losses (not bankroll), ignore the cashier, and agree with the hands.
const { chromium, devices } = require('playwright');
const dir = __dirname;
const isChip = l => /^(5|25|100|500|1K)$/.test(l);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'], reducedMotion: 'reduce' });
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + dir + '/page.html');
  await p.click('#bankStart');
  const playHands = async n => {
    for (let k = 0; k < n; k++) {
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
      await p.waitForTimeout(2200);
    }
  };
  const nets = () => p.evaluate(() => { const S = JSON.parse(localStorage.getItem('cg.state.v2')); const H = JSON.parse(localStorage.getItem('cg.history.v2') || '[]');
    const r2 = v => Math.round(v * 100) / 100;
    return { session: r2(H.filter(r => r.s === S.session).reduce((a, r) => a + r.n, 0)), all: r2(H.reduce((a, r) => a + r.n, 0)), hands: H.length }; });
  const words = v => v > 0 ? 'up $' + v.toLocaleString('en-US', { minimumFractionDigits: v % 1 ? 2 : 0 }) : v < 0 ? 'down $' + (-v).toLocaleString('en-US', { minimumFractionDigits: v % 1 ? 2 : 0 }) : 'even';
  const out = {};
  await playHands(6);
  await p.click('#openCashier'); await p.click('#cardPresets button:text-is("+$1,000")'); await p.click('#cardBorrow'); await p.waitForTimeout(1500);
  await playHands(2);
  await p.click('#openCashier'); await p.fill('#cardInput', '200'); await p.dispatchEvent('#cardInput', 'input'); await p.click('#cardPay'); await p.waitForTimeout(1500);
  let n = await nets();
  await p.click('#openRecord'); await p.waitForTimeout(400);
  let r1 = await p.textContent('#chartRead1'), r2 = await p.textContent('#chartRead2');
  out.firstBankroll = { net: n.session, currentChartSays: r1, matches: r1.startsWith('Now ' + words(n.session)) };
  await p.screenshot({ path: dir + '/chart-updown.png' });
  await p.click('#recordSheet [data-close]');
  // a second bankroll
  await p.click('#openRecord'); await p.click('#newBankBtn'); await p.click('#bankStart');
  await playHands(3);
  n = await nets();
  await p.click('#openRecord'); await p.waitForTimeout(400);
  r1 = await p.textContent('#chartRead1'); r2 = await p.textContent('#chartRead2');
  out.secondBankroll = { sessionNet: n.session, lifetimeNet: n.all, currentChartSays: r1, lifetimeChartSays: r2,
    currentMatches: r1.startsWith('Now ' + words(n.session)), lifetimeMatches: r2.startsWith('Now ' + words(n.all)) };
  out.yLabels = await p.$$eval('#chart1 svg text', ts => ts.map(t => t.textContent));
  out.errors = errs;
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})();
