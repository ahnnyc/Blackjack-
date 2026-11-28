// The Record screen keeps the list of every hand folded behind "Hands Played History" (Mike, 2026-11-28),
// and folds it again each time Record opens. Usage: node tools/history-test.js [shotsdir]
const { chromium } = require('playwright'); const fs = require('fs'); const dir = __dirname, shots = process.argv[2];
const HOOK = "window.__bj = { get S(){ return S; }, get history(){ return history; }, hideSheets, render, applyMotion };\n";
fs.writeFileSync(dir + '/hist-page.html', '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>[hidden]{display:none!important}body{margin:0}</style></head><body>' +
  fs.readFileSync(dir + '/game.html', 'utf8').replace('/* ---------- boot ---------- */', HOOK + '/* ---------- boot ---------- */') + '</body></html>');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + dir + '/hist-page.html'); await p.waitForTimeout(1500);
  const out = {}, fails = []; const check = (n, ok, got) => { out[n] = got; if (!ok) fails.push(n); };
  const rows = () => p.$$eval('#tablesList .trow', rs => rs.map(r => r.innerText.replace(/\n+/g, ' / ')));
  const sheet = async () => (await p.isVisible('#fenceSheet')) ? (await p.innerText('#fenceH')) + ' | ' + (await p.innerText('#fenceText')).replace(/\n+/g, ' / ') : null;
  // play one hand with a given bet (stand on everything), answering any pop-ups
  const isChip = l => /^(5|25|100|250|500|1K|5K|25K|100K)$/.test(l);
  const playHand = async (bet) => {
    await p.evaluate(b => { __bj.hideSheets(); const S = __bj.S; S.bet = b; __bj.render(); }, bet);
    await p.click('#actions button:has-text("Deal")');
    for (let i = 0; i < 300; i++) {
      const labels = await p.$$eval('#actions button:not([disabled])', bs => bs.map(x => x.textContent));
      if (labels.some(isChip) || labels.includes('Borrow')) break;
      if (!labels.length) { await p.waitForTimeout(40); continue; }
      const pick = ['No insurance', 'No thanks'].find(l => labels.includes(l)) || (labels.includes('Stand') ? 'Stand' : labels[0]);
      await p.click(`#actions button:not([disabled]):text-is("${pick}")`);
      if (await p.isVisible('#warnGo')) await p.click('#warnGo');
    }
    await p.waitForTimeout(500);
  };
  await p.click('#bankStart'); await p.waitForTimeout(400);
  await p.evaluate(() => { const S = __bj.S; S.settings.rules.motion = false; __bj.applyMotion(); S.fenceLast = 1e9; S.settings.rules.fence = false; S.settings.rules.stay = false; __bj.hideSheets(); });
  for (let i = 0; i < 3; i++) await playHand(25);
  await p.evaluate(() => { __bj.hideSheets(); document.getElementById('openRecord').click(); }); await p.waitForTimeout(500);
  const st = () => p.evaluate(() => ({ box: document.getElementById('histBox').hidden, label: document.getElementById('histBtn').textContent, exp: document.getElementById('histBtn').getAttribute('aria-expanded'), entries: document.querySelectorAll('#log .entry').length, seen: !!document.getElementById('log').offsetParent }));
  let s = await st(); check('foldedAtFirst', s.box && !s.seen && s.label === 'Hands Played History' && s.exp === 'false' && s.entries >= 3, s);
  if (shots) { await p.evaluate(() => document.getElementById('histBtn').scrollIntoView({ block:'center' })); await p.waitForTimeout(200); await p.screenshot({ path: shots + '/hist-1-folded.png' }); }
  await p.click('#histBtn'); await p.waitForTimeout(300);
  s = await st(); check('opens', !s.box && s.seen && s.label === 'Hide Hands Played History' && s.exp === 'true', s);
  if (shots) { await p.evaluate(() => document.getElementById('histBtn').scrollIntoView({ block:'start' })); await p.waitForTimeout(200); await p.screenshot({ path: shots + '/hist-2-open.png' }); }
  await p.click('#histBtn'); await p.waitForTimeout(300);
  s = await st(); check('closes', s.box && s.label === 'Hands Played History', s);
  await p.click('#histBtn'); await p.click('#recordSheet [data-close]'); await p.waitForTimeout(300);
  await p.evaluate(() => document.getElementById('openRecord').click()); await p.waitForTimeout(400);
  s = await st(); check('foldsAgainOnReopen', s.box && s.label === 'Hands Played History', s);
  console.log(JSON.stringify({ fails, errors: errs, ...out }, null, 1)); await b.close();
})();