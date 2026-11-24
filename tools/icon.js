// Draws the home-screen icon at the three sizes iPhone and browsers ask for.
const { chromium } = require('playwright');
const path = require('path');
const root = path.resolve(__dirname, '..');
const html = `<!doctype html><html><body style="margin:0">
<div id="i" style="width:512px;height:512px;background:radial-gradient(circle at 50% 35%,#16624f,#09362b 75%);position:relative;overflow:hidden;font-family:Arial,Helvetica,sans-serif">
  <div style="position:absolute;left:96px;top:118px;width:200px;height:280px;border-radius:22px;background:#fbfaf5;transform:rotate(-12deg);box-shadow:0 10px 24px rgba(0,0,0,.45);color:#b3231b">
    <div style="position:absolute;left:18px;top:10px;font-weight:700;font-size:92px;line-height:1">K</div>
    <div style="position:absolute;left:24px;top:104px;font-size:64px;line-height:1">&#9829;</div>
  </div>
  <div style="position:absolute;left:216px;top:104px;width:200px;height:280px;border-radius:22px;background:#fbfaf5;transform:rotate(9deg);box-shadow:0 10px 24px rgba(0,0,0,.45);color:#1d1d23">
    <div style="position:absolute;left:20px;top:10px;font-weight:700;font-size:92px;line-height:1">A</div>
    <div style="position:absolute;left:26px;top:104px;font-size:64px;line-height:1">&#9824;</div>
    <div style="position:absolute;right:18px;bottom:8px;font-size:120px;line-height:1">&#9824;</div>
  </div>
  <div style="position:absolute;left:0;right:0;bottom:34px;text-align:center;color:#e4c57e;font:700 46px Georgia,serif;letter-spacing:4px">21</div>
</div></body></html>`;
(async () => {
  const b = await chromium.launch();
  for (const size of [512, 192, 180]) {
    const p = await b.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: size / 512 });
    await p.setContent(html);
    await p.locator('#i').screenshot({ path: path.join(root, `icon-${size}.png`) });
    await p.close();
  }
  await b.close();
})();
