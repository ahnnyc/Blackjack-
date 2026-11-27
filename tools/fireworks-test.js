// Rank-up fireworks: with Animations on, ranking up shows the fireworks first and the message after (a tap shows it at
// once); with Animations off there are none. Every message box is centered and fits on screen.
// Usage: node tools/fireworks-test.js [shotsdir]   (reads tools/game.html)
const { chromium } = require('playwright'); const fs = require('fs'); const dir = __dirname, shots = process.argv[2];
const HOOK = "window.__bj = { get S(){ return S; }, hideSheets, render, applyMotion, openCashier, openTables, openStuff, welcomeBack };\n";
fs.writeFileSync(dir + '/fw-page.html', '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>[hidden]{display:none!important}body{margin:0}</style></head><body>' +
  fs.readFileSync(dir + '/game.html', 'utf8').replace('/* ---------- boot ---------- */', HOOK + '/* ---------- boot ---------- */') + '</body></html>');
(async () => {
  const b = await chromium.launch(); const out = {}, fails = []; const check = (n, ok, got) => { out[n] = got; if (!ok) fails.push(n); };
  for (const [w, h] of [[390, 844], [320, 568]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
    await p.goto('file://' + dir + '/fw-page.html'); await p.waitForTimeout(1500);
    await p.click('#bankStart'); await p.waitForTimeout(400);
    await p.evaluate(() => { const S = __bj.S; S.settings.rules.motion = true; __bj.applyMotion(); S.fenceLast = 1e9; S.bankroll = 5000; __bj.hideSheets(); __bj.render(); });
    const panelBox = () => p.evaluate(() => { const s = [...document.querySelectorAll('.sheet')].find(x => !x.hidden); if (!s) return null; const r = s.querySelector('.panel').getBoundingClientRect();
      return { top: Math.round(r.top), bottom: Math.round(r.bottom), mid: Math.round((r.top + r.bottom) / 2), vh: innerHeight, left: Math.round(r.left), right: Math.round(r.right), vw: innerWidth, op: getComputedStyle(s.querySelector('.panel')).opacity }; });
    const fits = bx => bx && bx.top >= 0 && bx.bottom <= bx.vh && bx.left >= 0 && bx.right <= bx.vw && Math.abs(bx.mid - bx.vh / 2) <= 24;
    // rank up to Swordfish with fireworks
    await p.evaluate(() => { __bj.S.playPres = 10000; __bj.render(); }); await p.waitForTimeout(500);
    const early = await p.evaluate(() => ({ wait: document.getElementById('fenceSheet').classList.contains('fw-wait'), shown: !document.getElementById('fenceSheet').hidden }));
    if (shots && w === 390) await p.screenshot({ path: shots + '/fw-early.png' });
    await p.waitForTimeout(1900);
    const late = await p.evaluate(() => document.getElementById('fenceSheet').classList.contains('fw-wait'));
    await p.waitForTimeout(400);
    if (shots) await p.screenshot({ path: shots + '/fw-' + w + '.png' });
    check('fireworksThenMessage' + w, early.wait && early.shown && !late, { early, late });
    check('rankMsgCentered' + w, fits(await panelBox()), await panelBox());
    await p.evaluate(() => __bj.hideSheets());
    // a tap during the fireworks shows the message at once
    await p.evaluate(() => { __bj.S.playPres = 25000; __bj.render(); }); await p.waitForTimeout(500);
    await p.mouse.click(10, 10); await p.waitForTimeout(100);
    check('tapShowsMessage' + w, !(await p.evaluate(() => document.getElementById('fenceSheet').classList.contains('fw-wait'))) && /Shark/.test(await p.textContent('#fenceText')), await p.textContent('#fenceText'));
    await p.evaluate(() => __bj.hideSheets());
    // every other box centered and on screen
    for (const [name, fn] of [['cashier', '__bj.openCashier()'], ['tables', '__bj.openTables()'], ['stuff', '__bj.openStuff()'], ['welcome', '__bj.welcomeBack()']]) {
      await p.evaluate(fn); await p.waitForTimeout(400);
      const bx = await panelBox(); check(name + 'Fits' + w, bx && bx.top >= 0 && bx.bottom <= bx.vh && bx.left >= 0 && bx.right <= bx.vw, bx);
      if (shots) await p.screenshot({ path: shots + '/box-' + name + '-' + w + '.png' });
      await p.evaluate(() => __bj.hideSheets()); await p.waitForTimeout(200);
    }
    // Animations off: no fireworks
    await p.evaluate(() => { const S = __bj.S; S.settings.rules.motion = false; __bj.applyMotion(); S.playPres = 250000; __bj.render(); }); await p.waitForTimeout(500);
    check('noFireworksWhenOff' + w, !(await p.evaluate(() => document.getElementById('fenceSheet').classList.contains('fw-wait'))) && /Whale/.test(await p.textContent('#fenceText')), await p.textContent('#fenceText'));
    out['errors' + w] = errs; if (errs.length) fails.push('errors' + w);
    await ctx.close();
  }
  out.fails = fails; console.log(JSON.stringify(out, null, 1)); await b.close(); fs.unlinkSync(dir + '/fw-page.html');
  process.exit(fails.length ? 1 : 0);
})();
