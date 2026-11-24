// Counts every card seen on screen independently and compares with the Count button.
const { chromium, devices } = require('playwright');
const dir = __dirname;
const val = l => { const r = l.split(' of ')[0]; return ['2','3','4','5','6'].includes(r) ? 1 : ['10','J','Q','K','A'].includes(r) ? -1 : 0; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone SE'] });
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + dir + '/page.html');
  await p.fill('#bankInput', '5000'); await p.click('#bankStart');
  await p.click('#countBtn');
  const shown = async () => Number((await p.textContent('#rcV')).replace('−', '-').replace('+', ''));
  const onScreen = async () => p.$$eval('#table .card:not(.back)', es => es.map(e => e.getAttribute('aria-label')));
  let past = 0; const checks = []; let midShot = false;
  for (let round = 0; round < 14; round++) {
    await p.click('.chip.c25'); await p.waitForTimeout(300);
    await p.click('#actions button:has-text("Deal")');
    for (let i = 0; i < 300; i++) {
      const labels = await p.$$eval('#actions button:not([disabled])', bs => bs.map(x => x.textContent));
      if (labels.some(l => l.startsWith('$'))) break;
      if (!labels.length) { await p.waitForTimeout(40); continue; }
      if (labels.includes('Stand')) {
        const mid = (await onScreen()).reduce((a, l) => a + val(l), 0);
        checks.push({ when: 'mid-hand ' + round, expected: past + mid, shown: await shown() });
        if (!midShot) { await p.screenshot({ path: dir + '/count-open.png' }); midShot = true; }
      }
      const pick = ['Stand', 'No insurance', 'No thanks'].find(l => labels.includes(l)) || labels[0];
      await p.click(`#actions button:not([disabled]):text-is("${pick}")`); if (await p.isVisible('#warnGo')) await p.click('#warnGo');
    }
    await p.waitForTimeout(1500);
    past += (await onScreen()).reduce((a, l) => a + val(l), 0);
    checks.push({ when: 'after hand ' + round, expected: past, shown: await shown() });
  }
  const bad = checks.filter(c => c.expected !== c.shown);
  console.log(JSON.stringify({ checks: checks.length, mismatches: bad, decks: await p.textContent('#decksV'), tc: await p.textContent('#tcV'), errors: errs }));
  await b.close();
})();
