// The four tables: start at 6 decks; open the next by chips of your own or by betting enough below;
// debts don't count; moved down when you can't cover the minimum; each table deals its own shoe and chips.
const { chromium } = require('playwright'); const dir = __dirname;
const isChip = l => /^(5|25|100|500|1K|5K|25K|100K)$/.test(l);
(async () => { const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 797 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.stack || e.message));
  await p.route(/fonts/, r => r.abort()); await p.goto('file://' + dir + '/cg-page.html'); await p.waitForTimeout(1600); await p.click('#bankStart');
  await p.evaluate(() => { __bj.S.settings.rules.motion = false; __bj.applyMotion(); });
  const out = {}; const shot = n => p.screenshot({ path: `${dir}/tb-${n}.png` });
  const look = () => p.evaluate(() => ({ table: __bj.S.table, decks: __bj.S.settings.decks, sign: document.getElementById('limitsV').textContent, shoeLabel: document.getElementById('shoeLabel').textContent,
    chips: [...document.querySelectorAll('#actions .chip')].map(c => c.textContent), open: __bj.S.open.slice() }));
  const playHand = async () => {
    const first = await p.$('#actions .chip:not([disabled])'); await first.click(); await p.waitForTimeout(80);
    await p.click('#actions button:has-text("Deal")');
    for (let i = 0; i < 300; i++) { const labels = await p.$$eval('#actions button:not([disabled])', bs => bs.map(x => x.textContent));
      if (labels.some(isChip)) break; if (!labels.length) { await p.waitForTimeout(40); continue; }
      const pick = labels.includes('Stand') ? 'Stand' : (['No insurance', 'No thanks'].find(l => labels.includes(l)) || labels[0]);
      await p.click(`#actions button:not([disabled]):text-is("${pick}")`); if (await p.isVisible('#warnGo')) await p.click('#warnGo'); }
    await p.waitForTimeout(1100);
  };
  out.start = await look();
  await p.click('#limits'); await p.waitForTimeout(200);
  out.tablesSheet = await p.$$eval('#tablesList .trow', rs => rs.map(r => r.innerText.replace(/\n/g, ' | ')));
  await shot('sheet-start'); await p.click('#tablesSheet [data-close]');
  // 1) open 4 decks with chips
  await p.evaluate(() => { __bj.S.bankroll = 30000; __bj.render(); });
  await playHand();
  out.openedByChips = { sheet: await p.isVisible('#fenceSheet') ? await p.textContent('#fenceText') : null };
  await shot('opened');
  await p.click('#fenceBtns button:last-child'); await p.waitForTimeout(200);
  out.at4 = await look();
  await playHand();
  out.shoeAt4 = await p.evaluate(() => ({ shoeDecks: __bj.S.shoeDecks, cards: __bj.S.shoe.length }));
  // 2) open 2 decks by betting
  await p.evaluate(() => { __bj.S.bankroll = 30000; __bj.S.betAt[1] = 260000; __bj.render(); });
  await playHand();
  out.openedByBetting = await p.isVisible('#fenceSheet') ? await p.textContent('#fenceText') : null;
  await p.click('#fenceBtns button:last-child'); await p.waitForTimeout(200);
  out.at2 = await look(); await shot('at2');
  // 3) debts don't count toward chips
  await p.evaluate(() => { const S = __bj.S; S.bankroll = 600000; S.card = 50000; S.shark = 100000; S.sharkNext = 99999; __bj.render(); });
  await playHand();
  out.oneDeckWithBorrowedMoney = { open: await p.evaluate(() => __bj.S.open[3]), sheet: await p.isVisible('#fenceSheet') };
  if (await p.isVisible('#fenceSheet')) await p.click('#fenceBtns button:first-child');
  await p.evaluate(() => { const S = __bj.S; S.card = 0; S.shark = 0; __bj.render(); });
  // 4) moved down when short of the minimum
  await p.evaluate(() => { __bj.S.bankroll = 60; __bj.render(); __bj.tablesAfterHand(); });
  await p.waitForTimeout(1200);
  out.movedDown1 = { text: await p.isVisible('#fenceSheet') ? await p.textContent('#fenceText') : null, ...(await look()) };
  await shot('moved-down');
  if (await p.isVisible('#fenceSheet')) await p.click('#fenceBtns button');
  await p.evaluate(() => { __bj.S.bankroll = 10; __bj.render(); __bj.tablesAfterHand(); }); await p.waitForTimeout(1200);
  out.movedDown2 = { text: await p.isVisible('#fenceSheet') ? await p.textContent('#fenceText') : null, ...(await look()) };
  if (await p.isVisible('#fenceSheet')) await p.click('#fenceBtns button');
  // 5) Tables sheet now: open tables you can't afford say so; moving up by hand works
  await p.evaluate(() => { __bj.S.bankroll = 5000; __bj.render(); });
  await p.click('#shoeBox'); await p.waitForTimeout(200);
  out.tablesSheetLater = await p.$$eval('#tablesList .trow', rs => rs.map(r => r.innerText.replace(/\n/g, ' | ')));
  await shot('sheet-later');
  await p.click('#tablesList .trow:nth-child(3) button'); await p.waitForTimeout(200);
  out.movedUpByHand = await look();
  // 6) Rules sheet
  await p.click('#openRules'); await p.waitForTimeout(200); out.rulesTable = await p.textContent('#tableNote'); await shot('rules');
  out.errors = errs;
  console.log(JSON.stringify(out, null, 1)); await b.close(); })();
