// Tracks winning chips frame by frame on their way to the bankroll: they must never rise.
const { chromium, devices } = require('playwright');
const dir = __dirname;
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'], reducedMotion: 'reduce' });
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await ctx.newPage();
  await p.goto('file://' + dir + '/page.html');
  await p.fill('#bankInput', '1000'); await p.click('#bankStart');
  for (let round = 0; round < 30; round++) {
    await p.click('.chip.c25'); await p.waitForTimeout(1000);
    await p.click('#actions button:has-text("Deal")');
    // record every chip's height while the hand plays out
    await p.evaluate(() => {
      window.__tracks = new Map();
      const tick = () => {
        document.querySelectorAll('#fx .fly-chip').forEach(c => {
          if (!c.__id) c.__id = Math.random();
          const y = c.getBoundingClientRect().top;
          const t = window.__tracks.get(c.__id) || []; t.push(y); window.__tracks.set(c.__id, t);
        });
        window.__raf = requestAnimationFrame(tick);
      };
      tick();
    });
    for (let i = 0; i < 300; i++) {
      const labels = await p.$$eval('#actions button:not([disabled])', bs => bs.map(x => x.textContent));
      if (labels.some(l => /^(5|25|100|500|1K)$/.test(l))) break;
      if (!labels.length) { await p.waitForTimeout(50); continue; }
      const pick = labels.includes('Stand') ? 'Stand' : (['No insurance', 'No thanks'].find(l => labels.includes(l)) || labels[0]);
      await p.click(`#actions button:not([disabled]):text-is("${pick}")`);
      if (await p.isVisible('#warnGo')) await p.click('#warnGo');
    }
    await p.waitForTimeout(2500);
    const won = await p.$$eval('#banner.good', e => e.length);
    if (!won) continue;
    const res = await p.evaluate(() => {
      cancelAnimationFrame(window.__raf);
      const bankY = document.querySelector('#bankAmt').getBoundingClientRect().top;
      const out = [];
      for (const t of window.__tracks.values()) {
        if (t.length < 5) continue;
        const end = t[t.length - 1];
        if (Math.abs(end - bankY) > 60) continue;          // only chips that ended at the bankroll
        let rise = 0; for (let k = 1; k < t.length; k++) rise = Math.max(rise, t[k - 1] - t[k]);
        out.push({ frames: t.length, from: Math.round(t[0]), to: Math.round(end), biggestRise: Math.round(rise * 10) / 10 });
      }
      return out;
    });
    console.log(JSON.stringify({ chipsToBankroll: res }));
    break;
  }
  await b.close();
})();
