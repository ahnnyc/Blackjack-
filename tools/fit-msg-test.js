// Plays real hands at three phone sizes; checks every result message stays on screen and is short.
const { chromium } = require('playwright');
const dir = __dirname;
const isChip = l => /^(5|25|100|500|1K)$/.test(l);
(async () => {
  const b = await chromium.launch(); const out = {};
  for (const [w, h] of [[390, 797], [375, 667], [320, 568]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + dir + '/page.html');
    await p.fill('#bankInput', '100000'); await p.click('#bankStart');
    const seen = new Set(), bad = []; let shot = 0, splitSeen = 0;
    for (let round = 0; round < 12; round++) {
      for (const c of ['.chip.c1000','.chip.c1000','.chip.c500','.chip.c25']) { await p.click(c); await p.waitForTimeout(80); }
      await p.click('#actions button:has-text("Deal")');
      for (let i = 0; i < 300; i++) {
        const labels = await p.$$eval('#actions button:not([disabled])', bs => bs.map(x => x.textContent));
        if (labels.some(isChip)) break;
        if (!labels.length) { await p.waitForTimeout(50); continue; }
        const pick = labels.includes('Split') ? 'Split' : labels.includes('Stand') ? 'Stand' : (['No insurance', 'No thanks'].find(l => labels.includes(l)) || labels[0]);
        await p.click(`#actions button:not([disabled]):text-is("${pick}")`);
        if (await p.isVisible('#warnGo')) await p.click('#warnGo');
      }
      await p.waitForTimeout(2000);
      const r = await p.evaluate(() => {
        const vw = innerWidth, out = [];
        const chk = el => { const b = el.getBoundingClientRect(); return { text: el.textContent.trim(), off: b.left < -0.5 || b.right > vw + 0.5, lines: Math.round(b.height / parseFloat(getComputedStyle(el).lineHeight || 20)) }; };
        const ban = document.getElementById('banner'); if (!ban.hidden) out.push({ kind: 'banner', ...chk(ban) });
        document.querySelectorAll('.res').forEach(e => out.push({ kind: 'hand', ...chk(e) }));
        return out;
      });
      for (const m of r) { seen.add(m.kind + ': ' + m.text); if (m.off) bad.push(m); if (m.kind === 'hand') splitSeen++; }
      if (r.some(m => m.kind === 'hand') && shot < 1) { shot++; await p.screenshot({ path: `${dir}/msg-split-${w}.png` }); }
      if (round === 0) await p.screenshot({ path: `${dir}/msg-${w}.png` });
    }
    out[w + 'x' + h] = { offScreen: bad, splitTagsSeen: splitSeen, messages: [...seen].slice(0, 25), pageWider: await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), errors: errs };
    await ctx.close();
  }
  console.log(JSON.stringify(out, null, 1)); await b.close();
})();
