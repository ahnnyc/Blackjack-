// Plays many hands (insurance, splits, doubles, surrender, dealer turns, out of chips) and records where
// the bottom rail and every button sit each time. Everything must stay put.
const { chromium } = require('playwright'); const fs = require('fs');
const dir = __dirname;
fs.writeFileSync(dir + '/page.html', '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>[hidden]{display:none!important}body{margin:0}</style></head><body>' + fs.readFileSync(dir + '/blackjack.html', 'utf8').replace('fence:true, sound:true };', 'fence:false, sound:true };') + '</body></html>');
const isChip = l => /^(5|25|100|500|1K)$/.test(l);
(async () => {
  const b = await chromium.launch(); const out = {};
  for (const [w, h] of [[390, 797], [320, 568]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + dir + '/page.html');
    await p.evaluate(() => { const r = JSON.parse(localStorage.getItem('cg.state.v2') || 'null'); });
    await p.click('#bankStart');
    const rail = new Set(), slots = {}, phasesSeen = new Set(); let shots = 0;
    const snap = async tag => {
      const m = await p.evaluate(() => {
        const r = e => { const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)].join(','); };
        const ctl = document.getElementById('ctl'), rows = [...document.querySelectorAll('#actions > *')];
        return { ctl: r(ctl), rows: rows.map(r).join(' | '), bank: r(document.getElementById('bank')),
          buttons: [...document.querySelectorAll('#actions button')].map(x => [x.textContent.replace(/\$[\d,.K]+/, '$'), r(x)]) };
      });
      rail.add(m.ctl + ' rows ' + m.rows + ' bank ' + m.bank);
      for (const [l, pos] of m.buttons) (slots[l] = slots[l] || new Set()).add(pos);
      phasesSeen.add(tag);
    };
    let bigBets = 0;
    for (let round = 0; round < 30; round++) {
      await snap('betting');
      const bank = Number((await p.textContent('#bankAmt')).replace(/[^0-9.]/g, ''));
      if (bank < 5) { await snap('out of chips'); await p.screenshot({ path: `${dir}/steady-out-${w}.png` }); break; }
      // every so often bet everything, so we run out of chips at the end
      if (round >= 24) { for (const c of ['1K', '500', '100', '25', '5']) { for (let k = 0; k < 8; k++) { const el = await p.$(`.chip:not([disabled]):text-is("${c}")`); if (!el) break; await el.click(); await p.waitForTimeout(60); } } }
      else { await p.click('.chip.c100'); await p.waitForTimeout(200); }
      await snap('bet placed');
      await p.click('#actions button:has-text("Deal")');
      for (let i = 0; i < 400; i++) {
        await snap(await p.evaluate(() => document.querySelector('#actions button:not([disabled])') ? 'live' : 'waiting'));
        const labels = await p.$$eval('#actions button:not([disabled])', bs => bs.map(x => x.textContent));
        if (labels.some(isChip) || labels.includes('Buy chips')) break;
        if (!labels.length) { await p.waitForTimeout(80); continue; }
        if (labels.some(l => /^Insure|Even money/.test(l))) { await snap('insurance'); if (!shots++) await p.screenshot({ path: `${dir}/steady-ins-${w}.png` }); }
        const pick = labels.includes('Split') ? 'Split' : labels.includes('Surrender') ? 'Surrender' : labels.includes('Double') && round % 3 === 0 ? 'Double' : labels.includes('Stand') ? 'Stand' : (['No insurance', 'No thanks'].find(l => labels.includes(l)) || labels[0]);
        if (pick === 'Stand' && round === 2) await p.screenshot({ path: `${dir}/steady-play-${w}.png` });
        await p.click(`#actions button:not([disabled]):text-is("${pick}")`);
        if (await p.isVisible('#warnGo')) await p.click('#warnGo');
      }
      await p.waitForTimeout(400); await snap('after hand');
      if (round === 1) await p.screenshot({ path: `${dir}/steady-bet-${w}.png` });
      await p.waitForTimeout(1200);
    }
    const moving = Object.fromEntries(Object.entries(slots).filter(([, v]) => v.size > 1).map(([k, v]) => [k, [...v]]));
    out[w + 'x' + h] = { railPositions: rail.size, rail: [...rail].slice(0, 4), buttonsThatMoved: moving, buttonsSeen: Object.keys(slots), errors: errs };
    await ctx.close();
  }
  console.log(JSON.stringify(out, null, 1)); await b.close();
})();
