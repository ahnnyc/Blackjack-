// Real play with Guy on: how many hands between his sales visits, at a steady mood (neutral, keen, sore).
const { chromium } = require('playwright'); const dir = __dirname;
const isChip = l => /^(5|25|100|500|1K)$/.test(l);
(async () => { const b = await chromium.launch(); const res = {};
  for (const [name, lvl] of [['neutral', 0], ['keen (after buying)', 4], ['sore (after saying no)', -4]]) {
    const p = await (await b.newContext({ viewport: { width: 390, height: 797 }, isMobile: true, hasTouch: true })).newPage();
    await p.route(/fonts/, r => r.abort()); await p.goto('file://' + dir + '/cg-page.html'); await p.waitForTimeout(1600); await p.click('#bankStart');
    await p.evaluate(() => { const S = __bj.S; S.settings.rules.motion = false; __bj.applyMotion(); S.settings.rules.fence = true; __bj.render(); });
    const at = []; const HANDS = 50;
    for (let h = 1; h <= HANDS; h++) {
      await p.evaluate(lvl => { __bj.guy().lvl = lvl; }, lvl);
      await p.click('.chip.c5'); await p.click('#actions button:has-text("Deal")');
      for (let i = 0; i < 300; i++) { const labels = await p.$$eval('#actions button:not([disabled])', bs => bs.map(x => x.textContent));
        if (labels.some(isChip)) break; if (!labels.length) { await p.waitForTimeout(30); continue; }
        const pick = labels.includes('Stand') ? 'Stand' : (['No insurance', 'No thanks'].find(l => labels.includes(l)) || labels[0]);
        await p.click(`#actions button:not([disabled]):text-is("${pick}")`); if (await p.isVisible('#warnGo')) await p.click('#warnGo'); }
      await p.waitForTimeout(1050);
      if (await p.isVisible('#fenceSheet')) { if ((await p.textContent('#fenceH')) === 'Guy') at.push(h); await p.click('#fenceBtns button:first-child'); }
    }
    res[name] = { hands: HANDS, visits: at.length, aboutEvery: at.length ? +(HANDS / at.length).toFixed(1) : null, hands_he_came: at.join(',') };
    await p.context().close();
  }
  console.log(JSON.stringify(res, null, 1)); await b.close(); })();
