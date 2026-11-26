// Draws the home-screen icon at the three sizes iPhone and browsers ask for:
// Las Vegas neon: a hot-pink neon whale's back over an electric-blue neon waterline on a midnight sky,
// with a fountain of playing cards shooting out of its spout.
const { chromium } = require('playwright');
const path = require('path');
const root = path.resolve(__dirname, '..');
const svg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="glow" filterUnits="userSpaceOnUse" x="-40" y="-40" width="592" height="592"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="bigglow" filterUnits="userSpaceOnUse" x="-40" y="-40" width="592" height="592"><feGaussianBlur stdDeviation="16"/></filter>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#07021a"/><stop offset="1" stop-color="#22074a"/></linearGradient>
    <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a0a4a"/><stop offset="1" stop-color="#0a0424"/></linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#sky)"/>
  <rect y="336" width="512" height="176" fill="url(#sea)"/>
  <!-- neon reflection of the hump in the water -->
  <path d="M 120 358 L 392 358" stroke="#ff2fa0" stroke-width="5" opacity=".35" filter="url(#glow)" stroke-dasharray="26 18"/>
  <path d="M 150 382 L 360 382" stroke="#ff2fa0" stroke-width="4" opacity=".22" filter="url(#glow)" stroke-dasharray="18 22"/>
  <path d="M -10 336 L 522 336" fill="none" stroke="#1fe3ff" stroke-width="23.400000000000002" stroke-linecap="round" opacity=".55" filter="url(#bigglow)"/>
  <path d="M -10 336 L 522 336" fill="none" stroke="#1fe3ff" stroke-width="9" stroke-linecap="round" filter="url(#glow)"/>
  <path d="M -10 336 L 522 336" fill="none" stroke="#fff4fb" stroke-width="3.06" stroke-linecap="round"/>
  <path d="M 92 336 C 104 184, 292 184, 420 336" fill="none" stroke="#ff2fa0" stroke-width="57.2" stroke-linecap="round" opacity=".55" filter="url(#bigglow)"/>
  <path d="M 92 336 C 104 184, 292 184, 420 336" fill="none" stroke="#ff2fa0" stroke-width="22" stroke-linecap="round" filter="url(#glow)"/>
  <path d="M 92 336 C 104 184, 292 184, 420 336" fill="none" stroke="#fff4fb" stroke-width="7.48" stroke-linecap="round"/>
  <g transform="translate(213 186) rotate(0) scale(0.6875)">
  <rect x="-20" y="-28" width="40" height="56" rx="5" fill="#ff2fa0" opacity=".9" filter="url(#glow)"/>
  <rect x="-20" y="-28" width="40" height="56" rx="5" fill="#fffdf6"/>
  <text x="-13" y="-8" font-family="DejaVu Sans" font-weight="700" font-size="17" fill="#14121a">A</text>
  <text x="0" y="20" text-anchor="middle" font-family="DejaVu Sans" font-size="24" fill="#14121a">♠</text></g><g transform="translate(213 148) rotate(0) scale(0.875)">
  <rect x="-20" y="-28" width="40" height="56" rx="5" fill="#1fe3ff" opacity=".9" filter="url(#glow)"/>
  <rect x="-20" y="-28" width="40" height="56" rx="5" fill="#fffdf6"/>
  <text x="-13" y="-8" font-family="DejaVu Sans" font-weight="700" font-size="17" fill="#d0102c">K</text>
  <text x="0" y="20" text-anchor="middle" font-family="DejaVu Sans" font-size="24" fill="#d0102c">♥</text></g><g transform="translate(179 106) rotate(-22) scale(1.025)">
  <rect x="-20" y="-28" width="40" height="56" rx="5" fill="#ff2fa0" opacity=".9" filter="url(#glow)"/>
  <rect x="-20" y="-28" width="40" height="56" rx="5" fill="#fffdf6"/>
  <text x="-13" y="-8" font-family="DejaVu Sans" font-weight="700" font-size="17" fill="#d0102c">Q</text>
  <text x="0" y="20" text-anchor="middle" font-family="DejaVu Sans" font-size="24" fill="#d0102c">♦</text></g><g transform="translate(133 88) rotate(-48) scale(1.125)">
  <rect x="-20" y="-28" width="40" height="56" rx="5" fill="#1fe3ff" opacity=".9" filter="url(#glow)"/>
  <rect x="-20" y="-28" width="40" height="56" rx="5" fill="#fffdf6"/>
  <text x="-13" y="-8" font-family="DejaVu Sans" font-weight="700" font-size="17" fill="#14121a">J</text>
  <text x="0" y="20" text-anchor="middle" font-family="DejaVu Sans" font-size="24" fill="#14121a">♣</text></g><g transform="translate(89 108) rotate(-76) scale(1.1)">
  <rect x="-20" y="-28" width="40" height="56" rx="5" fill="#ff2fa0" opacity=".9" filter="url(#glow)"/>
  <rect x="-20" y="-28" width="40" height="56" rx="5" fill="#fffdf6"/>
  <text x="-13" y="-8" font-family="DejaVu Sans" font-weight="700" font-size="17" fill="#d0102c">10</text>
  <text x="0" y="20" text-anchor="middle" font-family="DejaVu Sans" font-size="24" fill="#d0102c">♥</text></g><g transform="translate(65 148) rotate(-100) scale(1)">
  <rect x="-20" y="-28" width="40" height="56" rx="5" fill="#1fe3ff" opacity=".9" filter="url(#glow)"/>
  <rect x="-20" y="-28" width="40" height="56" rx="5" fill="#fffdf6"/>
  <text x="-13" y="-8" font-family="DejaVu Sans" font-weight="700" font-size="17" fill="#14121a">9</text>
  <text x="0" y="20" text-anchor="middle" font-family="DejaVu Sans" font-size="24" fill="#14121a">♠</text></g><g transform="translate(247 106) rotate(22) scale(1.025)">
  <rect x="-20" y="-28" width="40" height="56" rx="5" fill="#ff2fa0" opacity=".9" filter="url(#glow)"/>
  <rect x="-20" y="-28" width="40" height="56" rx="5" fill="#fffdf6"/>
  <text x="-13" y="-8" font-family="DejaVu Sans" font-weight="700" font-size="17" fill="#d0102c">A</text>
  <text x="0" y="20" text-anchor="middle" font-family="DejaVu Sans" font-size="24" fill="#d0102c">♥</text></g><g transform="translate(293 88) rotate(48) scale(1.125)">
  <rect x="-20" y="-28" width="40" height="56" rx="5" fill="#1fe3ff" opacity=".9" filter="url(#glow)"/>
  <rect x="-20" y="-28" width="40" height="56" rx="5" fill="#fffdf6"/>
  <text x="-13" y="-8" font-family="DejaVu Sans" font-weight="700" font-size="17" fill="#14121a">K</text>
  <text x="0" y="20" text-anchor="middle" font-family="DejaVu Sans" font-size="24" fill="#14121a">♠</text></g><g transform="translate(337 108) rotate(76) scale(1.1)">
  <rect x="-20" y="-28" width="40" height="56" rx="5" fill="#ff2fa0" opacity=".9" filter="url(#glow)"/>
  <rect x="-20" y="-28" width="40" height="56" rx="5" fill="#fffdf6"/>
  <text x="-13" y="-8" font-family="DejaVu Sans" font-weight="700" font-size="17" fill="#d0102c">Q</text>
  <text x="0" y="20" text-anchor="middle" font-family="DejaVu Sans" font-size="24" fill="#d0102c">♥</text></g><g transform="translate(361 148) rotate(100) scale(1)">
  <rect x="-20" y="-28" width="40" height="56" rx="5" fill="#1fe3ff" opacity=".9" filter="url(#glow)"/>
  <rect x="-20" y="-28" width="40" height="56" rx="5" fill="#fffdf6"/>
  <text x="-13" y="-8" font-family="DejaVu Sans" font-weight="700" font-size="17" fill="#d0102c">J</text>
  <text x="0" y="20" text-anchor="middle" font-family="DejaVu Sans" font-size="24" fill="#d0102c">♦</text></g>
  
</svg>`;
(async () => {
  const b = await chromium.launch();
  for (const size of [512, 192, 180]) {
    const p = await b.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: size / 512 });
    await p.setContent('<body style="margin:0;background:#000">' + svg + '</body>');
    await p.locator('svg').screenshot({ path: path.join(root, `icon-${size}.png`) });
    await p.close();
  }
  await b.close();
})();
