// Resplitting aces up to four hands with a stacked shoe; an older saved game gets the switch turned on;
// and Guy's odds rise as you get further up this game.
const { chromium } = require('playwright'); const dir = __dirname;
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 797 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.route(/fonts/, r => r.abort()); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + dir + '/cg-page.html'); await p.waitForTimeout(1600); await p.click('#bankStart');
  const out = {};
  out.switchOnInNewGame = await p.evaluate(() => __bj.S.settings.rules.resplitAces);
  // aces everywhere: player A A, dealer 5 9, then more aces
  await p.evaluate(() => { const S = __bj.S; S.settings.rules.motion = false; __bj.applyMotion();
    const top = [0, 4, 13, 8, 26, 39, 1, 14, 27, 40, 52 + 0, 52 + 13, 9, 10, 11];
    const rest = []; for (let d = 0; d < 6; d++) for (let c = 0; c < 52; c++) rest.push(c);
    S.shoe = top.map(c => c % 52).concat(rest); S.pos = 0; S.shoeDecks = S.settings.decks; __bj.render(); });
  await p.click('.chip.c25'); await p.click('#actions button:has-text("Deal")'); await p.waitForTimeout(1500);
  const splits = [];
  for (let i = 0; i < 12; i++) {
    const can = await p.$('#actions button:not([disabled]):text-is("Split")');
    if (!can) break;
    await can.click(); if (await p.isVisible('#warnGo')) await p.click('#warnGo');
    await p.waitForTimeout(1200);
    splits.push(await p.$$eval('#hands .hand', hs => hs.length));
  }
  out.handsAfterEachSplit = splits;
  await p.screenshot({ path: dir + '/resplit.png' });
  out.splitStillOfferedAtFour = !!(await p.$('#actions button:not([disabled]):text-is("Split")'));
  // an older saved game, from before this change, with the switch off
  await p.evaluate(() => { const st = JSON.parse(localStorage.getItem('cg.state.v2')); st.settings.rules.resplitAces = false; delete st.settings.fix; st.round = null; st.updatedAt = Date.now() + 99999; localStorage.setItem('cg.state.v2', JSON.stringify(st)); });
  const p2 = await ctx.newPage(); await p2.goto('file://' + dir + '/cg-page.html'); await p2.waitForTimeout(2200);
  out.oldGameSwitchTurnedOn = await p2.evaluate(() => [__bj.S.settings.rules.resplitAces, __bj.S.settings.fix]);
  // Guy's odds as you get further up this game
  out.guyByWinnings = await p2.evaluate(() => { const S = __bj.S, H = __bj.history, res = {};
    for (const up of [0, 10000, 20000, 40000, 100000]) { H.push({ s: S.session, n: up, fake: 1 }); const o = __bj.guyOdds(); res['up $' + up] = { gapHands: o.gap, chance: +o.chance.toFixed(3) }; H.pop(); }
    return res; });
  out.errors = errs;
  console.log(JSON.stringify(out, null, 1)); await b.close(); })();
