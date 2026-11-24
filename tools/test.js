const { chromium, devices } = require('playwright');
const fs = require('fs');
const dir = __dirname;
const body = fs.readFileSync(dir + '/blackjack.html', 'utf8');
fs.writeFileSync(dir + '/page.html', '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>[hidden]{display:none!important}body{margin:0}</style></head><body>' + body + '</body></html>');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone SE'] });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  await p.goto('file://' + dir + '/page.html');
  await p.waitForTimeout(300);
  await p.screenshot({ path: dir + '/shot-first.png' });
  await p.fill('#bankInput', '500'); await p.click('#bankStart');
  let rounds = 0, shotTaken = false;
  for (let step = 0; step < 8000 && rounds < Number(process.argv[2] || 300); step++) {
    const labels = await p.$$eval('#actions button:not([disabled])', bs => bs.map(b => b.textContent));
    if (!labels.length) { await p.waitForTimeout(50); continue; }
    if (labels.some(l => l.startsWith('Start a new'))) { await p.click('#actions button'); await p.fill('#bankInput', '300'); await p.click('#bankStart'); continue; }
    if (labels.includes('Hit') && !shotTaken && rounds > 3) { await p.screenshot({ path: dir + '/shot-play.png' }); shotTaken = true; }
    if (labels.includes('Hit') && !global.s3) { const n = await p.$$eval('#hands .hand', hs => Math.max(...hs.map(h => h.querySelectorAll('.card').length), 0)); if (n >= 3) { await p.screenshot({ path: dir + '/shot-3cards.png' }); global.s3 = 1; } }
    if (labels.includes('Hit') && !global.s2) { const n = await p.$$eval('#hands .hand', hs => hs.length); if (n >= 2) { await p.screenshot({ path: dir + '/shot-split.png' }); global.s2 = 1; } }
    if (labels.some(l => l.startsWith('Deal'))) { await p.click('#actions button:has-text("Deal")'); rounds++; continue; }
    if (labels.some(l => l.startsWith('Rebet'))) { await p.click('#actions button:has-text("Rebet")'); continue; }
    if (labels.some(l => /^(5|25|100|500|1K)$/.test(l))) { const chips = await p.$$('#actions .chip:not([disabled])'); await chips[Math.floor(Math.random() * Math.min(2, chips.length))].click(); continue; }
    const pick = labels[Math.floor(Math.random() * labels.length)];
    await p.click(`#actions button:not([disabled]):text-is("${pick}")`); if (await p.isVisible('#warnGo')) await p.click('#warnGo');
  }
  await p.waitForTimeout(1500);
  const check = await p.evaluate(() => {
    const S = JSON.parse(localStorage.getItem('bj.state.v1')); const H = JSON.parse(localStorage.getItem('bj.history.v1'));
    const sess = S.sessions.find(x => x.s === S.session);
    const sum = H.filter(r => r.s === S.session).reduce((a, r) => a + r.n, 0);
    const kinds = {}; H.forEach(r => r.h.forEach(h => kinds[h.r] = (kinds[h.r] || 0) + 1));
    let chainOk = true; for (let i = 1; i < H.length; i++) { if (H[i].s === H[i - 1].s && Math.abs(H[i - 1].b + H[i].n - H[i].b) > 0.001) chainOk = false; }
    return { rounds: H.length, bankroll: S.bankroll, expected: Math.round((sess.start + sum) * 100) / 100, inRound: !!S.round,
      kinds, splits: H.filter(r => r.h.length > 1).length, maxHands: Math.max(...H.map(r => r.h.length)), ins: H.filter(r => r.ins).length, doubles: H.filter(r=>r.h.some(h=>h.dbl)).length, chainOk, sessions: S.sessions.length };
  });
  console.log(JSON.stringify(check));
  await p.screenshot({ path: dir + '/shot-done.png' });
  await p.setViewportSize({ width: 375, height: 1330 }); await p.click('#openRecord'); await p.waitForTimeout(200); await p.screenshot({ path: dir + '/shot-record.png' }); const bx = await p.$eval('#chart2 svg', e => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; }); await p.mouse.click(bx[0] + bx[2]*0.4, bx[1] + bx[3]/2); await p.screenshot({ path: dir + '/shot-record-tap.png' }); console.log('readouts', await p.textContent('#chartRead1'), '|', await p.textContent('#chartRead2'));
  await p.click('#recordSheet [data-close]');
  await p.click('#openRules'); await p.waitForTimeout(200); await p.screenshot({ path: dir + '/shot-rules.png' });
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  console.log('errors', JSON.stringify(errs), 'hscroll', overflow);
  await b.close();
})();
