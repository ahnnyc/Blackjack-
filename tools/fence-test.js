// The man in the trench coat: offers, buying, the stash, selling back, security, the Rules switch, and the books.
const { chromium } = require('playwright'); const fs = require('fs'); const dir = __dirname;
fs.writeFileSync(dir + '/page.html', '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>[hidden]{display:none!important}body{margin:0}</style></head><body>' + fs.readFileSync(dir + '/blackjack.html', 'utf8').replace('/* ---------- boot ---------- */', 'window.__bj = { get S(){ return S; }, get history(){ return history; }, fenceOffer, fenceSeize, fenceAfterHand, stashList, applyMotion };\n/* ---------- boot ---------- */') + '</body></html>');
const isChip = l => /^(5|25|100|500|1K)$/.test(l);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 797 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.goto('file://' + dir + '/page.html');
  await p.fill('#bankInput', '5000'); await p.click('#bankStart');
  await p.evaluate(() => { const {S, applyMotion} = __bj; S.settings.rules.motion = false; applyMotion(); });
  const out = {};
  const bank = async () => Number((await p.textContent('#bankAmt')).replace(/[^0-9.]/g, ''));
  const playHand = async () => {
    await p.click('.chip.c25'); await p.waitForTimeout(100);
    await p.click('#actions button:has-text("Deal")');
    for (let i = 0; i < 300; i++) {
      const labels = await p.$$eval('#actions button:not([disabled])', bs => bs.map(x => x.textContent));
      if (labels.some(isChip)) break;
      if (!labels.length) { await p.waitForTimeout(40); continue; }
      const pick = labels.includes('Stand') ? 'Stand' : (['No insurance', 'No thanks'].find(l => labels.includes(l)) || labels[0]);
      await p.click(`#actions button:not([disabled]):text-is("${pick}")`);
      if (await p.isVisible('#warnGo')) await p.click('#warnGo');
    }
  };
  // 1) left to chance: play 60 hands and count visits
  let offers = 0, seized = 0, firstAt = null;
  for (let h = 1; h <= Number(process.env.HANDS || 60); h++) {
    await playHand(); await p.waitForTimeout(1600);
    if (await p.isVisible('#fenceSheet')) {
      const title = await p.textContent('#fenceH');
      if (title === 'Psst…') { offers++; if (!firstAt) { firstAt = h; out.offerText = await p.textContent('#fenceText'); await p.screenshot({ path: dir + '/fence-offer.png' }); } }
      else seized++;
      await p.click('#fenceBtns button:first-child');
    }
  }
  out.byChance = { hands: 60, offers, seizures: seized, firstOfferAfterHand: firstAt };
  // 2) buy one on purpose
  await p.evaluate(() => { const r = Math.random; Math.random = () => 0.5; __bj.fenceOffer(); Math.random = r; });
  const priceTxt = await p.textContent('#fenceBtns button:last-child');
  const price = Number(priceTxt.replace(/[^0-9]/g, ''));
  const plBefore = await p.textContent('#plTag'), b0 = await bank();
  await p.click('#fenceBtns button:last-child'); await p.waitForTimeout(800);
  out.buy = { button: priceTxt, bankBefore: b0, bankAfter: await bank(), paidRight: Math.abs(b0 - price - await bank()) < 0.01, upDownBefore: plBefore, upDownAfter: await p.textContent('#plTag') };
  // 3) the stash in Record
  await p.click('#openRecord'); await p.waitForTimeout(400);
  out.stash = await p.$$eval('#stash .item', xs => xs.map(x => x.textContent));
  out.logTop = await p.$eval('#log .entry .when', e => e.textContent.split(' · ')[0]);
  out.stats = await p.$$eval('#stats .stat', ss => ss.slice(-3).map(s => s.textContent));
  await p.$eval('#stash', e => e.scrollIntoView()); await p.screenshot({ path: dir + '/fence-stash.png' });
  // 4) sell back: the offer stays the same if you ask twice without playing
  await p.click('#stash .item .btn'); await p.waitForTimeout(200);
  const ask1 = await p.textContent('#fenceBtns button:last-child');
  await p.screenshot({ path: dir + '/fence-sell.png' });
  await p.click('#fenceBtns button:first-child'); await p.waitForTimeout(200);
  out.keepItReturnsToRecord = await p.isVisible('#recordSheet');
  await p.click('#stash .item .btn'); await p.waitForTimeout(200);
  const ask2 = await p.textContent('#fenceBtns button:last-child');
  const sellFor = Number(ask2.replace(/[^0-9]/g, '')), b1 = await bank();
  await p.click('#fenceBtns button:last-child'); await p.waitForTimeout(800);
  out.sell = { firstAsk: ask1, secondAsk: ask2, sameOffer: ask1 === ask2, bankBefore: b1, bankAfter: await bank(), paidRight: Math.abs(b1 + sellFor - await bank()) < 0.01 };
  // 5) security takes something
  await p.evaluate(() => { const r = Math.random; Math.random = () => 0.5; __bj.fenceOffer(); Math.random = r; });
  await p.click('#fenceBtns button:last-child'); await p.waitForTimeout(500);
  const b2 = await bank();
  await p.evaluate(() => __bj.fenceSeize()); await p.waitForTimeout(200);
  out.seize = { text: await p.textContent('#fenceText'), bankUnchanged: (await bank()) === b2, stashLeft: await p.evaluate(() => __bj.stashList().length) };
  await p.screenshot({ path: dir + '/fence-seize.png' });
  await p.click('#fenceBtns button'); 
  // 6) the Rules switch
  await p.click('#openRules'); await p.waitForTimeout(200);
  await p.$eval('#rulesSheet', e => e.querySelector('.panel').scrollTop = 1e5); await p.screenshot({ path: dir + '/fence-rules.png' });
  out.switchShown = await p.evaluate(() => [...document.querySelectorAll('#rulesSheet .rule')].some(r => /trench coat/.test(r.textContent)));
  await p.click('#rulesSheet [data-close]');
  await p.evaluate(() => { __bj.S.settings.rules.fence = false; });
  await playHand(); await p.waitForTimeout(300);
  await p.evaluate(() => { const r = Math.random; Math.random = () => 0.0001; __bj.S.fenceLast = -99; __bj.S.fenceSeen = -1; __bj.fenceAfterHand(); Math.random = r; });
  await p.waitForTimeout(1800); out.offWhenSwitchedOff = !(await p.isVisible('#fenceSheet'));
  await p.evaluate(() => { __bj.S.settings.rules.fence = true; const r = Math.random; Math.random = () => 0.0001; __bj.S.fenceLast = -99; __bj.S.fenceSeen = -1; __bj.fenceAfterHand(); Math.random = r; });
  await p.waitForTimeout(1800); out.onWhenSwitchedOn = await p.isVisible('#fenceSheet');
  if (out.onWhenSwitchedOn) await p.click('#fenceBtns button:first-child');
  // 7) the books still add up, and a reload keeps the stash
  out.books = await p.evaluate(() => { const {S, history, stashList} = __bj; const H = history.filter(r => r.s === S.session), sess = S.sessions.find(x => x.s === S.session);
    const sum = sess.start + H.reduce((a, r) => a + r.n, 0) + S.cash.filter(c => c.s === S.session).reduce((a, c) => a + c.a, 0);
    return { adds: Math.abs(sum - S.bankroll) < 0.001, stash: stashList().length }; });
  await p.evaluate(() => { const r = Math.random; Math.random = () => 0.9; __bj.fenceOffer(); Math.random = r; });
  await p.click('#fenceBtns button:last-child'); await p.waitForTimeout(500);
  out.stashBeforeReload = await p.evaluate(() => __bj.stashList().map(x => x.item + ' ' + x.paid));
  await p.reload(); await p.waitForTimeout(2000);
  out.afterReload = await p.evaluate(() => __bj.stashList().map(x => x.item + ' ' + x.paid));
  out.errors = errs;
  console.log(JSON.stringify(out, null, 1)); await b.close();
})();
