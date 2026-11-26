// Draws the home-screen icon at the three sizes iPhone and browsers ask for:
// a navy night sky, a straight water line over solid blue sea, the whale's back as one white curved line,
// and gold coins shooting out of its spout in two arcs.
const { chromium } = require('playwright');
const path = require('path');
const root = path.resolve(__dirname, '..');
const svg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#0c2a4f"/>
  <rect y="336" width="512" height="176" fill="#1f7fd6"/>
  <path d="M 92 336 C 104 184, 292 184, 420 336" fill="none" stroke="#ffffff" stroke-width="24" stroke-linecap="round"/>
  <g fill="#f5b52e"><circle cx="213" cy="196" r="11"/><circle cx="213" cy="166" r="14"/><circle cx="183" cy="130" r="16"/><circle cx="145" cy="114" r="17"/><circle cx="109" cy="126" r="16"/><circle cx="87" cy="156" r="14"/><circle cx="243" cy="130" r="16"/><circle cx="281" cy="114" r="17"/><circle cx="317" cy="126" r="16"/><circle cx="339" cy="156" r="14"/></g>
</svg>`;
(async () => {
  const b = await chromium.launch();
  for (const size of [512, 192, 180]) {
    const p = await b.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: size / 512 });
    await p.setContent('<body style="margin:0">' + svg + '</body>');
    await p.locator('svg').screenshot({ path: path.join(root, `icon-${size}.png`) });
    await p.close();
  }
  await b.close();
})();
