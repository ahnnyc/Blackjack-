// Plays like a real person in a hurry: animations on (the default), Guy on (the default),
// and Rebet + Deal tapped as soon as the buttons come back. Counts Guy's visits.
const { chromium } = require('playwright'); const dir = __dirname;
const tap = (p, sel) => p.click(sel, { timeout: 1500 }).then(() => true, () => false);
const isChip = l => /^(5|25|100|500|1K|5K|25K|100K)$/.test(l);
(async () => { const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 797 }, isMobile: true, hasTouch: true })).newPage();
  await p.route(/fonts/, r => r.abort()); await p.goto('file://' + dir + '/' + (process.argv[2] || 'real-page.html')); await p.waitForTimeout(1600); await p.click('#bankStart'); if (process.env.BUY) await p.evaluate(() => { __bj.S.bankroll = 200000; __bj.render(); });
  const HANDS = Number(process.env.HANDS || 25); let visits = 0, hands = 0;
  await p.click('.chip.c25');
  let lastHands = 0, since = Date.now();
  while (hands < HANDS) {
    if (hands !== lastHands) { lastHands = hands; since = Date.now(); }
    if (Date.now() - since > 20000) { console.log('STUCK', JSON.stringify(await p.evaluate(() => ({ sheets: [...document.querySelectorAll('.sheet')].filter(s => !s.hidden).map(s => s.id + ': ' + s.innerText.slice(0, 160)), buttons: [...document.querySelectorAll('#actions button')].map(b => b.textContent + (b.disabled ? '(off)' : '')), bank: __bj.S.bankroll, bet: __bj.S.bet, round: !!__bj.S.round })))); break; }
    if (await p.isVisible('#fenceSheet')) { visits++; await p.click(process.env.BUY ? '#fenceBtns button:last-child' : '#fenceBtns button:first-child'); await p.waitForTimeout(400); while (await p.isVisible('#fenceSheet')) { await p.click('#fenceBtns button:first-child'); await p.waitForTimeout(200); } continue; }
    const labels = await p.$$eval('#actions button:not([disabled])', bs => bs.map(x => x.textContent));
    if (!labels.length) { await p.waitForTimeout(30); continue; }
    if (labels.some(l => l.startsWith('Deal')) && !labels.some(l => l === 'Deal')) {
      if (await tap(p, '#actions button:has-text("Deal")')) { await p.waitForTimeout(60); if (await p.evaluate(() => !!__bj.S.round)) hands++; } continue; }
    if (labels.some(l => l.startsWith('Rebet'))) { await tap(p, '#actions button:has-text("Rebet")'); continue; }
    if (labels.some(isChip)) { await tap(p, '.chip.c25'); continue; }
    const pick = labels.includes('Stand') ? 'Stand' : (['No insurance', 'No thanks'].find(l => labels.includes(l)) || labels[0]);
    await tap(p, `#actions button:not([disabled]):text-is("${pick}")`); if (await p.isVisible('#warnGo')) await tap(p, '#warnGo');
  }
  const g = await p.evaluate(() => ({ fenceOn: __bj.S.settings.rules.fence, fenceLast: __bj.S.fenceLast, handsPlayed: __bj.history.length }));
  console.log(JSON.stringify({ hands: HANDS, guyVisits: visits, ...g })); await b.close(); })();
