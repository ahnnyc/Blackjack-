// Real play: own a speedboat, play 60 hands with Guy on, count how often he comes back with a buyer (always keeping it).
const { chromium } = require('playwright'); const dir = __dirname;
const isChip = l => /^(5|25|100|500|1K)$/.test(l);
(async () => { const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 797 }, isMobile: true, hasTouch: true })).newPage();
  await p.route(/fonts/, r => r.abort()); await p.goto('file://' + dir + '/cg-page.html'); await p.waitForTimeout(1600); await p.click('#bankStart');
  await p.evaluate(() => { const S = __bj.S; S.settings.rules.motion = false; __bj.applyMotion(); S.settings.rules.fence = true;
    __bj.stashList().push({ id: 'x', item: 'a speedboat', art: '🚤', paid: 60000, worth: 90000, said: 90000, t: Date.now(), hand: 0 }); __bj.render(); });
  let buybacks = 0, offers = 0, security = 0, hands = 40, firstAt = null;
  for (let h = 1; h <= hands; h++) {
    await p.click('.chip.c5'); await p.click('#actions button:has-text("Deal")');
    for (let i = 0; i < 300; i++) { const labels = await p.$$eval('#actions button:not([disabled])', bs => bs.map(x => x.textContent));
      if (labels.some(isChip)) break; if (!labels.length) { await p.waitForTimeout(30); continue; }
      const pick = labels.includes('Stand') ? 'Stand' : (['No insurance', 'No thanks'].find(l => labels.includes(l)) || labels[0]);
      await p.click(`#actions button:not([disabled]):text-is("${pick}")`); if (await p.isVisible('#warnGo')) await p.click('#warnGo'); }
    await p.waitForTimeout(1000);
    if (await p.isVisible('#fenceSheet')) { const t = await p.textContent('#fenceText');
      if (/buyer/.test(t)) { buybacks++; (global.at = global.at || []).push(h); if (!firstAt) firstAt = h; } else if (/security|dark suits/.test(t)) security++; else offers++;
      await p.click('#fenceBtns button:first-child'); await p.waitForTimeout(100);
      if (await p.isVisible('#fenceSheet')) await p.click('#fenceBtns button:first-child'); }
    if (!(await p.evaluate(() => __bj.stashList().length))) { await p.evaluate(() => __bj.stashList().push({ id: 'x', item: 'a speedboat', art: '🚤', paid: 60000, worth: 90000, said: 90000, t: Date.now(), hand: 0 })); }
  }
  console.log(JSON.stringify({ hands, buyerOffers: buybacks, firstBuyerAfterHand: firstAt, guySellingOffers: offers, securityVisits: security, buyerHands: global.at })); await b.close(); })();
