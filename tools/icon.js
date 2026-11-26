// Draws the home-screen icon at the three sizes iPhone and browsers ask for:
// Las Vegas neon: a hot-pink neon whale's back over an electric-blue neon waterline on a midnight sky,
// with a fountain of little gold coins shooting out of its spout.
const { chromium } = require('playwright');
const path = require('path');
const root = path.resolve(__dirname, '..');
const svg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="glow" filterUnits="userSpaceOnUse" x="-40" y="-40" width="592" height="592"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="bigglow" filterUnits="userSpaceOnUse" x="-40" y="-40" width="592" height="592"><feGaussianBlur stdDeviation="16"/></filter>
    <radialGradient id="gold" cx=".38" cy=".35" r=".75"><stop offset="0" stop-color="#fff0a8"/><stop offset=".45" stop-color="#f6c435"/><stop offset="1" stop-color="#c98a0c"/></radialGradient>
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
<g transform="translate(210.0 192.0)">
  <circle r="12" fill="#ffc83a" opacity=".85" filter="url(#glow)"/>
  <circle r="10" fill="url(#gold)" stroke="#8a5a06" stroke-width="2"/>
  <circle r="6.6" fill="none" stroke="#b07a12" stroke-width="1.6"/>
  <ellipse cx="-3.0" cy="-3.5" rx="3.2" ry="1.6" fill="#fff6c8" opacity=".85" transform="rotate(-30 -3.0 -3.5)"/></g><g transform="translate(210.0 164.0)">
  <circle r="14" fill="#ffc83a" opacity=".85" filter="url(#glow)"/>
  <circle r="12" fill="url(#gold)" stroke="#8a5a06" stroke-width="2"/>
  <circle r="7.9" fill="none" stroke="#b07a12" stroke-width="1.6"/>
  <ellipse cx="-3.6" cy="-4.2" rx="3.8" ry="1.9" fill="#fff6c8" opacity=".85" transform="rotate(-30 -3.6 -4.2)"/></g><g transform="translate(210.0 134.0)">
  <circle r="15" fill="#ffc83a" opacity=".85" filter="url(#glow)"/>
  <circle r="13" fill="url(#gold)" stroke="#8a5a06" stroke-width="2"/>
  <circle r="8.6" fill="none" stroke="#b07a12" stroke-width="1.6"/>
  <ellipse cx="-3.9" cy="-4.5" rx="4.2" ry="2.1" fill="#fff6c8" opacity=".85" transform="rotate(-30 -3.9 -4.5)"/></g><g transform="translate(178.9 90.8)">
  <circle r="16" fill="#ffc83a" opacity=".85" filter="url(#glow)"/>
  <circle r="14" fill="url(#gold)" stroke="#8a5a06" stroke-width="2"/>
  <circle r="9.2" fill="none" stroke="#b07a12" stroke-width="1.6"/>
  <ellipse cx="-4.2" cy="-4.9" rx="4.5" ry="2.2" fill="#fff6c8" opacity=".85" transform="rotate(-30 -4.2 -4.9)"/></g><g transform="translate(241.1 90.8)">
  <circle r="16" fill="#ffc83a" opacity=".85" filter="url(#glow)"/>
  <circle r="14" fill="url(#gold)" stroke="#8a5a06" stroke-width="2"/>
  <circle r="9.2" fill="none" stroke="#b07a12" stroke-width="1.6"/>
  <ellipse cx="-4.2" cy="-4.9" rx="4.5" ry="2.2" fill="#fff6c8" opacity=".85" transform="rotate(-30 -4.2 -4.9)"/></g><g transform="translate(145.9 91.7)">
  <circle r="16" fill="#ffc83a" opacity=".85" filter="url(#glow)"/>
  <circle r="14" fill="url(#gold)" stroke="#8a5a06" stroke-width="2"/>
  <circle r="9.2" fill="none" stroke="#b07a12" stroke-width="1.6"/>
  <ellipse cx="-4.2" cy="-4.9" rx="4.5" ry="2.2" fill="#fff6c8" opacity=".85" transform="rotate(-30 -4.2 -4.9)"/></g><g transform="translate(274.1 91.7)">
  <circle r="16" fill="#ffc83a" opacity=".85" filter="url(#glow)"/>
  <circle r="14" fill="url(#gold)" stroke="#8a5a06" stroke-width="2"/>
  <circle r="9.2" fill="none" stroke="#b07a12" stroke-width="1.6"/>
  <ellipse cx="-4.2" cy="-4.9" rx="4.5" ry="2.2" fill="#fff6c8" opacity=".85" transform="rotate(-30 -4.2 -4.9)"/></g><g transform="translate(116.4 106.6)">
  <circle r="15" fill="#ffc83a" opacity=".85" filter="url(#glow)"/>
  <circle r="13" fill="url(#gold)" stroke="#8a5a06" stroke-width="2"/>
  <circle r="8.6" fill="none" stroke="#b07a12" stroke-width="1.6"/>
  <ellipse cx="-3.9" cy="-4.5" rx="4.2" ry="2.1" fill="#fff6c8" opacity=".85" transform="rotate(-30 -3.9 -4.5)"/></g><g transform="translate(303.6 106.6)">
  <circle r="15" fill="#ffc83a" opacity=".85" filter="url(#glow)"/>
  <circle r="13" fill="url(#gold)" stroke="#8a5a06" stroke-width="2"/>
  <circle r="8.6" fill="none" stroke="#b07a12" stroke-width="1.6"/>
  <ellipse cx="-3.9" cy="-4.5" rx="4.2" ry="2.1" fill="#fff6c8" opacity=".85" transform="rotate(-30 -3.9 -4.5)"/></g><g transform="translate(93.2 130.2)">
  <circle r="14" fill="#ffc83a" opacity=".85" filter="url(#glow)"/>
  <circle r="12" fill="url(#gold)" stroke="#8a5a06" stroke-width="2"/>
  <circle r="7.9" fill="none" stroke="#b07a12" stroke-width="1.6"/>
  <ellipse cx="-3.6" cy="-4.2" rx="3.8" ry="1.9" fill="#fff6c8" opacity=".85" transform="rotate(-30 -3.6 -4.2)"/></g><g transform="translate(326.8 130.2)">
  <circle r="14" fill="#ffc83a" opacity=".85" filter="url(#glow)"/>
  <circle r="12" fill="url(#gold)" stroke="#8a5a06" stroke-width="2"/>
  <circle r="7.9" fill="none" stroke="#b07a12" stroke-width="1.6"/>
  <ellipse cx="-3.6" cy="-4.2" rx="3.8" ry="1.9" fill="#fff6c8" opacity=".85" transform="rotate(-30 -3.6 -4.2)"/></g><g transform="translate(75.0 158.0)">
  <circle r="13" fill="#ffc83a" opacity=".85" filter="url(#glow)"/>
  <circle r="11" fill="url(#gold)" stroke="#8a5a06" stroke-width="2"/>
  <circle r="7.3" fill="none" stroke="#b07a12" stroke-width="1.6"/>
  <ellipse cx="-3.3" cy="-3.8" rx="3.5" ry="1.8" fill="#fff6c8" opacity=".85" transform="rotate(-30 -3.3 -3.8)"/></g><g transform="translate(345.0 158.0)">
  <circle r="13" fill="#ffc83a" opacity=".85" filter="url(#glow)"/>
  <circle r="11" fill="url(#gold)" stroke="#8a5a06" stroke-width="2"/>
  <circle r="7.3" fill="none" stroke="#b07a12" stroke-width="1.6"/>
  <ellipse cx="-3.3" cy="-3.8" rx="3.5" ry="1.8" fill="#fff6c8" opacity=".85" transform="rotate(-30 -3.3 -3.8)"/></g><g transform="translate(210.0 102.0)">
  <circle r="16" fill="#ffc83a" opacity=".85" filter="url(#glow)"/>
  <circle r="14" fill="url(#gold)" stroke="#8a5a06" stroke-width="2"/>
  <circle r="9.2" fill="none" stroke="#b07a12" stroke-width="1.6"/>
  <ellipse cx="-4.2" cy="-4.9" rx="4.5" ry="2.2" fill="#fff6c8" opacity=".85" transform="rotate(-30 -4.2 -4.9)"/></g>
  
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
