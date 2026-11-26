// Real play from a fresh game, $100 a hand, no tricks: how many hands until the 4-deck invitation?
const { chromium } = require('playwright'); const dir = __dirname;
const isChip = l => /^(5|25|100|500|1K|5K|25K|100K)$/.test(l);
(async () => { const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 797 }, isMobile: true, hasTouch: true })).newPage();
  await p.route(/fonts/, r => r.abort()); await p.goto('file://' + dir + '/cg-page.html'); await p.waitForTimeout(1600); await p.click('#bankStart');
  await p.evaluate(() => { __bj.S.settings.rules.motion = false; __bj.applyMotion(); });
  let at = null;
  for (let h = 1; h <= 30 && !at; h++) {
    await p.click('.chip.c100'); await p.click('#actions button:has-text("Deal")');
    for (let i = 0; i < 300; i++) { const labels = await p.$$eval('#actions button:not([disabled])', bs => bs.map(x => x.textContent));
      if (labels.some(isChip)) break; if (!labels.length) { await p.waitForTimeout(40); continue; }
      const pick = labels.includes('Stand') ? 'Stand' : (['No insurance', 'No thanks'].find(l => labels.includes(l)) || labels[0]); await p.click(`#actions button:not([disabled]):text-is("${pick}")`); if (await p.isVisible('#warnGo')) await p.click('#warnGo'); }
    await p.waitForTimeout(1200);
    if (await p.isVisible('#fenceSheet') && (await p.textContent('#fenceH')) === 'An invitation') at = h;
  }
  const st = await p.evaluate(() => ({ betAt6: __bj.S.betAt[0], chips: __bj.S.bankroll, open: __bj.S.open }));
  console.log(JSON.stringify({ invitedAfterHand: at, ...st })); await b.close(); })();
