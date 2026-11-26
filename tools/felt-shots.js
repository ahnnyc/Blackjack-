// A picture of each table mid-hand, and the invitation when a new table opens.
const { chromium } = require('playwright'); const dir = __dirname;
const isChip = l => /^(5|25|100|500|1K|5K|25K|100K)$/.test(l);
(async () => { const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 797 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route(/fonts/, r => r.abort()); await p.goto('file://' + dir + '/cg-page.html'); await p.waitForTimeout(1600); await p.click('#bankStart');
  await p.evaluate(() => { __bj.S.settings.rules.motion = false; __bj.applyMotion(); __bj.S.open = [true, true, true, true]; __bj.S.bankroll = 600000; __bj.render(); });
  for (let t = 0; t < 4; t++) {
    await p.evaluate(t => { __bj.moveTo(t); __bj.render(); }, t);
    const first = await p.$('#actions .chip:not([disabled])'); await first.click(); await p.waitForTimeout(80);
    await p.click('#actions button:has-text("Deal")'); await p.waitForTimeout(1500);
    for (const l of ['No insurance', 'No thanks']) { const x = await p.$(`#actions button:not([disabled]):text-is("${l}")`); if (x) { await x.click(); await p.waitForTimeout(600); } }
    await p.screenshot({ path: `${dir}/felt-${t}.png` });
    for (let i = 0; i < 300; i++) { const labels = await p.$$eval('#actions button:not([disabled])', bs => bs.map(x => x.textContent));
      if (labels.some(isChip)) break; if (!labels.length) { await p.waitForTimeout(40); continue; }
      const pick = labels.includes('Stand') ? 'Stand' : labels[0]; await p.click(`#actions button:not([disabled]):text-is("${pick}")`); if (await p.isVisible('#warnGo')) await p.click('#warnGo'); }
    await p.waitForTimeout(900); if (await p.isVisible('#fenceSheet')) await p.click('#fenceBtns button:first-child');
  }
  // the invitation, for the 4-deck table and for the high-roller table
  for (const [t, name] of [[1, 'inv-4'], [3, 'inv-1']]) {
    await p.evaluate(t => { const S = __bj.S; __bj.moveTo(t - 1); S.open = [true, t > 1, t > 2, false]; S.open[t] = false; S.bankroll = [0, 30000, 150000, 600000][t]; S.card = 0; S.shark = 0; __bj.render(); }, t);
    const first = await p.$('#actions .chip:not([disabled])'); await first.click(); await p.click('#actions button:has-text("Deal")');
    for (let i = 0; i < 300; i++) { const labels = await p.$$eval('#actions button:not([disabled])', bs => bs.map(x => x.textContent));
      if (labels.some(isChip)) break; if (!labels.length) { await p.waitForTimeout(40); continue; }
      const pick = labels.includes('Stand') ? 'Stand' : (['No insurance', 'No thanks'].find(l => labels.includes(l)) || labels[0]); await p.click(`#actions button:not([disabled]):text-is("${pick}")`); if (await p.isVisible('#warnGo')) await p.click('#warnGo'); }
    await p.waitForTimeout(1300);
    console.log(name, await p.isVisible('#fenceSheet') ? await p.textContent('#fenceText') : 'NO SHEET');
    await p.screenshot({ path: `${dir}/felt-${name}.png` });
    if (await p.isVisible('#fenceSheet')) await p.click('#fenceBtns button:last-child'); await p.waitForTimeout(200);
    console.log(' after Accept: table', await p.evaluate(() => __bj.S.table));
  }
  console.log('errors', JSON.stringify(errs)); await b.close(); })();
