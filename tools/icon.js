// Draws the home-screen icon at the three sizes iPhone and browsers ask for:
// a whale made of card suits (a mosaic of spades, hearts, diamonds and clubs), a diamond eye, and a spout of dollar signs.
const { chromium } = require('playwright');
const path = require('path');
const root = path.resolve(__dirname, '..');
const suits = ['♠', '♥', '♦', '♣'];
// whale outline: big round head on the left, tail stock rising to flukes at the top right
const whale = `M 58 318
 C 52 238, 120 182, 214 182
 C 292 182, 338 222, 372 252
 C 392 270, 408 268, 418 250
 C 426 236, 430 214, 424 196
 C 410 186, 392 172, 384 150
 C 404 158, 426 166, 444 168
 C 456 150, 468 132, 488 124
 C 486 150, 474 178, 452 196
 C 452 230, 446 276, 424 306
 C 394 352, 330 380, 246 384
 C 150 388, 64 372, 58 318 Z`;
let glyphs = '';
for (let r = 0, y = 150; y < 410; r++, y += 26) {
  for (let x = 40 + (r % 2 ? 13 : 0), c = 0; x < 500; x += 26, c++) {
    const s = suits[(c + r * 2) % 4];
    const red = s === '♥' || s === '♦';
    glyphs += `<text x="${x}" y="${y}" font-size="25" fill="${red ? '#f6d9d4' : '#fbfaf5'}" text-anchor="middle">${s}</text>`;
  }
}
const html = `<!doctype html><html><body style="margin:0">
<div id="i" style="width:512px;height:512px;background:radial-gradient(circle at 50% 38%,#16624f,#09362b 75%);font-family:'DejaVu Sans',sans-serif">
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs><clipPath id="w"><path d="${whale}"/></clipPath></defs>
  <g transform="translate(-4 38)">
  <path d="${whale}" fill="#1f4f86"/>
  <g clip-path="url(#w)">${glyphs}</g>
  <path d="${whale}" fill="none" stroke="#fbfaf5" stroke-width="6" stroke-linejoin="round"/>
  <!-- mouth -->
  <path d="M 70 330 C 120 346, 170 346, 214 334" fill="none" stroke="#13294b" stroke-width="7" stroke-linecap="round"/>
  <!-- eye: a diamond -->
  <text x="132" y="286" font-size="52" fill="#13294b" stroke="#fbfaf5" stroke-width="3" text-anchor="middle">♦</text>
  <!-- spout: dollar signs -->
  <text x="176" y="150" font-size="64" font-weight="700" fill="#e4c57e" text-anchor="middle">$</text>
  <text x="132" y="112" font-size="48" font-weight="700" fill="#e4c57e" text-anchor="middle" transform="rotate(-22 132 112)">$</text>
  <text x="220" y="112" font-size="48" font-weight="700" fill="#e4c57e" text-anchor="middle" transform="rotate(22 220 112)">$</text>
  <text x="176" y="80" font-size="44" font-weight="700" fill="#e4c57e" text-anchor="middle">$</text>
  <text x="104" y="70" font-size="34" font-weight="700" fill="#e4c57e" text-anchor="middle" transform="rotate(-34 104 70)">$</text>
  <text x="248" y="70" font-size="34" font-weight="700" fill="#e4c57e" text-anchor="middle" transform="rotate(34 248 70)">$</text>
  </g>
</svg></div></body></html>`;
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
