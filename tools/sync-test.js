// Plays real hands with animations on, then compares every sound's key moment with its animation's key moment.
const { chromium } = require('playwright'); const dir = __dirname;
const isChip = l => /^(5|25|100|500|1K|5K|25K|100K)$/.test(l);
(async () => { const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await (await b.newContext({ viewport: { width: 390, height: 797 }, isMobile: true, hasTouch: true })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route(/fonts/, r => r.abort()); await p.goto('file://' + dir + '/sync-page.html'); await p.waitForTimeout(1500); await p.click('#bankStart'); await p.waitForTimeout(800);
  for (let h = 0; h < 4; h++) {
    await p.click('.chip.c25'); await p.waitForTimeout(1100); await p.click('#actions button:has-text("Deal")');
    for (let i = 0; i < 300; i++) { const labels = await p.$$eval('#actions button:not([disabled])', bs => bs.map(x => x.textContent));
      if (labels.some(isChip)) break; if (!labels.length) { await p.waitForTimeout(40); continue; }
      const pick = labels.includes('Stand') ? 'Stand' : (['No insurance', 'No thanks'].find(l => labels.includes(l)) || labels[0]); await p.click(`#actions button:not([disabled]):text-is("${pick}")`); if (await p.isVisible('#warnGo')) await p.click('#warnGo'); }
    await p.waitForTimeout(2600);
  }
  const r = await p.evaluate(() => {
    const out = {}, used = new Set();
    for (const s of window.__soundLog) {
      let best = null, bi = -1;
      window.__anim.forEach((a, i) => { if (a.kind !== s.name || used.has(i)) return; const d = s.at - a.key; if (best === null || Math.abs(d) < Math.abs(best)) { best = d; bi = i; } });
      if (bi >= 0) used.add(bi);
      (out[s.name] = out[s.name] || []).push(best === null ? 'no animation' : Math.round(best));
    }
    return { offsetsMs: out, loaded: Object.fromEntries(Object.entries(__bj.Sound.buffers).map(([k, v]) => [k, v.length])) };
  });
  const summary = {};
  for (const [k, v] of Object.entries(r.offsetsMs)) { const nums = v.filter(x => typeof x === 'number'); summary[k] = { sounds: v.length, worstOffMs: nums.length ? Math.max(...nums.map(Math.abs)) : null, all: v.join(' ') }; }
  console.log(JSON.stringify({ loaded: r.loaded, summary, errors: errs }, null, 1)); await b.close(); })();
