// Recreates the iPhone fault: the normal save loses everything after the starting bankroll.
const { chromium, devices } = require('playwright');
const url = process.argv[2];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'] });
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() !== 'log' && !m.text().includes('ERR_FAILED')) errs.push(m.type() + ': ' + m.text()); });
  await p.goto(url);
  await p.fill('#bankInput', '600'); await p.click('#bankStart');
  await p.waitForTimeout(300);
  const oldState = await p.evaluate(() => localStorage.getItem('bj.state.v1'));   // what the iPhone kept
  let played = 0;
  for (let i = 0; i < 600 && played < 5; i++) {
    const labels = await p.$$eval('#actions button:not([disabled])', bs => bs.map(x => x.textContent));
    if (!labels.length) { await p.waitForTimeout(80); continue; }
    if (labels.some(l => l.startsWith('Deal'))) { await p.click('#actions button:has-text("Deal")'); played++; continue; }
    if (labels.some(l => l.startsWith('Rebet'))) { await p.click('#actions button:has-text("Rebet")'); continue; }
    if (labels.some(l => /^(5|25|100|500|1K)$/.test(l))) { await p.click('#actions .chip:not([disabled])'); continue; }
    const pick = ['Stand', 'No insurance', 'No thanks'].find(l => labels.includes(l)) || labels[0];
    await p.click(`#actions button:not([disabled]):text-is("${pick}")`); if (await p.isVisible('#warnGo')) await p.click('#warnGo');
  }
  // finish the last hand
  for (let i = 0; i < 100; i++) {
    const labels = await p.$$eval('#actions button:not([disabled])', bs => bs.map(x => x.textContent));
    if (labels.some(l => /^(5|25|100|500|1K)$/.test(l) || l.startsWith('Deal') || l.startsWith('Rebet'))) break;
    if (!labels.length) { await p.waitForTimeout(80); continue; }
    const pick = ['Stand', 'No insurance', 'No thanks'].find(l => labels.includes(l)) || labels[0];
    await p.click(`#actions button:not([disabled]):text-is("${pick}")`); if (await p.isVisible('#warnGo')) await p.click('#warnGo');
  }
  await p.waitForTimeout(800);
  const before = await p.evaluate(() => ({ bank: document.querySelector('#bankAmt').textContent, hands: JSON.parse(localStorage.getItem('bj.history.v1') || '[]').length }));
  before.idb = await p.evaluate(() => new Promise(res => { const r = indexedDB.open('blackjack'); r.onsuccess = () => { const t = r.result.transaction(['kv','rounds']); const c = t.objectStore('rounds').count(); const k = t.objectStore('rounds').getAllKeys(); t.oncomplete = () => { res({ rounds: c.result, keys: k.result }); r.result.close(); }; }; }));
  // the fault: normal save rolls back to just after choosing the bankroll
  await p.close();
  const p2 = await ctx.newPage(); p2.on('pageerror', e => errs.push(e.message));
  await p2.addInitScript(s => { localStorage.setItem('bj.state.v1', s); localStorage.removeItem('bj.history.v1'); }, oldState);
  await p2.goto(url); await p2.waitForTimeout(1500);
  const rolledBack = oldState;
  const after = await p2.evaluate(() => ({ bank: document.querySelector('#bankAmt').textContent, hands: JSON.parse(localStorage.getItem('bj.history.v1') || '[]').length, bankSheetOpen: !document.querySelector('#bankSheet').hidden }));
  await p2.click('#openRecord'); await p2.waitForTimeout(300);
  const listed = await p2.$$eval('#log .entry', es => es.length);
  console.log(JSON.stringify({ before, after, listedInRecord: listed, errors: errs }));
  await b.close();
})();
