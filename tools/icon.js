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
<g transform="translate(213 190) rotate(-30) scale(1 1.0)">
  <circle r="17" fill="#ffc83a" opacity=".85" filter="url(#glow)"/>
  <circle r="15" fill="url(#gold)" stroke="#8a5a06" stroke-width="2"/>
  <circle r="10.2" fill="none" stroke="#b07a12" stroke-width="1.6"/>
  <ellipse cx="-4.5" cy="-5.2" rx="4.8" ry="2.4" fill="#fff6c8" opacity=".85" transform="rotate(-30 -4.5 -5.2)"/></g><g transform="translate(213 152) rotate(7) scale(1 0.55)">
  <circle r="20" fill="#ffc83a" opacity=".85" filter="url(#glow)"/>
  <circle r="18" fill="url(#gold)" stroke="#8a5a06" stroke-width="2"/>
  <circle r="12.2" fill="none" stroke="#b07a12" stroke-width="1.6"/>
  <ellipse cx="-5.4" cy="-6.3" rx="5.8" ry="2.9" fill="#fff6c8" opacity=".85" transform="rotate(-30 -5.4 -6.3)"/></g><g transform="translate(206 118) rotate(-16) scale(1 1.0)">
  <circle r="22" fill="#ffc83a" opacity=".85" filter="url(#glow)"/>
  <circle r="20" fill="url(#gold)" stroke="#8a5a06" stroke-width="2"/>
  <circle r="13.6" fill="none" stroke="#b07a12" stroke-width="1.6"/>
  <ellipse cx="-6.0" cy="-7.0" rx="6.4" ry="3.2" fill="#fff6c8" opacity=".85" transform="rotate(-30 -6.0 -7.0)"/></g><g transform="translate(180 98) rotate(21) scale(1 0.7)">
  <circle r="23" fill="#ffc83a" opacity=".85" filter="url(#glow)"/>
  <circle r="21" fill="url(#gold)" stroke="#8a5a06" stroke-width="2"/>
  <circle r="14.3" fill="none" stroke="#b07a12" stroke-width="1.6"/>
  <ellipse cx="-6.3" cy="-7.3" rx="6.7" ry="3.4" fill="#fff6c8" opacity=".85" transform="rotate(-30 -6.3 -7.3)"/></g><g transform="translate(150 84) rotate(-2) scale(1 1.0)">
  <circle r="24" fill="#ffc83a" opacity=".85" filter="url(#glow)"/>
  <circle r="22" fill="url(#gold)" stroke="#8a5a06" stroke-width="2"/>
  <circle r="15.0" fill="none" stroke="#b07a12" stroke-width="1.6"/>
  <ellipse cx="-6.6" cy="-7.7" rx="7.0" ry="3.5" fill="#fff6c8" opacity=".85" transform="rotate(-30 -6.6 -7.7)"/></g><g transform="translate(118 86) rotate(-25) scale(1 0.45)">
  <circle r="24" fill="#ffc83a" opacity=".85" filter="url(#glow)"/>
  <circle r="22" fill="url(#gold)" stroke="#8a5a06" stroke-width="2"/>
  <circle r="15.0" fill="none" stroke="#b07a12" stroke-width="1.6"/>
  <ellipse cx="-6.6" cy="-7.7" rx="7.0" ry="3.5" fill="#fff6c8" opacity=".85" transform="rotate(-30 -6.6 -7.7)"/></g><g transform="translate(92 104) rotate(12) scale(1 1.0)">
  <circle r="24" fill="#ffc83a" opacity=".85" filter="url(#glow)"/>
  <circle r="22" fill="url(#gold)" stroke="#8a5a06" stroke-width="2"/>
  <circle r="15.0" fill="none" stroke="#b07a12" stroke-width="1.6"/>
  <ellipse cx="-6.6" cy="-7.7" rx="7.0" ry="3.5" fill="#fff6c8" opacity=".85" transform="rotate(-30 -6.6 -7.7)"/></g><g transform="translate(72 132) rotate(-11) scale(1 0.75)">
  <circle r="23" fill="#ffc83a" opacity=".85" filter="url(#glow)"/>
  <circle r="21" fill="url(#gold)" stroke="#8a5a06" stroke-width="2"/>
  <circle r="14.3" fill="none" stroke="#b07a12" stroke-width="1.6"/>
  <ellipse cx="-6.3" cy="-7.3" rx="6.7" ry="3.4" fill="#fff6c8" opacity=".85" transform="rotate(-30 -6.3 -7.3)"/></g><g transform="translate(60 164) rotate(26) scale(1 1.0)">
  <circle r="21" fill="#ffc83a" opacity=".85" filter="url(#glow)"/>
  <circle r="19" fill="url(#gold)" stroke="#8a5a06" stroke-width="2"/>
  <circle r="12.9" fill="none" stroke="#b07a12" stroke-width="1.6"/>
  <ellipse cx="-5.7" cy="-6.6" rx="6.1" ry="3.0" fill="#fff6c8" opacity=".85" transform="rotate(-30 -5.7 -6.6)"/></g><g transform="translate(232 118) rotate(3) scale(1 0.6)">
  <circle r="22" fill="#ffc83a" opacity=".85" filter="url(#glow)"/>
  <circle r="20" fill="url(#gold)" stroke="#8a5a06" stroke-width="2"/>
  <circle r="13.6" fill="none" stroke="#b07a12" stroke-width="1.6"/>
  <ellipse cx="-6.0" cy="-7.0" rx="6.4" ry="3.2" fill="#fff6c8" opacity=".85" transform="rotate(-30 -6.0 -7.0)"/></g><g transform="translate(258 98) rotate(-20) scale(1 1.0)">
  <circle r="23" fill="#ffc83a" opacity=".85" filter="url(#glow)"/>
  <circle r="21" fill="url(#gold)" stroke="#8a5a06" stroke-width="2"/>
  <circle r="14.3" fill="none" stroke="#b07a12" stroke-width="1.6"/>
  <ellipse cx="-6.3" cy="-7.3" rx="6.7" ry="3.4" fill="#fff6c8" opacity=".85" transform="rotate(-30 -6.3 -7.3)"/></g><g transform="translate(288 84) rotate(17) scale(1 0.7)">
  <circle r="24" fill="#ffc83a" opacity=".85" filter="url(#glow)"/>
  <circle r="22" fill="url(#gold)" stroke="#8a5a06" stroke-width="2"/>
  <circle r="15.0" fill="none" stroke="#b07a12" stroke-width="1.6"/>
  <ellipse cx="-6.6" cy="-7.7" rx="7.0" ry="3.5" fill="#fff6c8" opacity=".85" transform="rotate(-30 -6.6 -7.7)"/></g><g transform="translate(320 86) rotate(-6) scale(1 1.0)">
  <circle r="24" fill="#ffc83a" opacity=".85" filter="url(#glow)"/>
  <circle r="22" fill="url(#gold)" stroke="#8a5a06" stroke-width="2"/>
  <circle r="15.0" fill="none" stroke="#b07a12" stroke-width="1.6"/>
  <ellipse cx="-6.6" cy="-7.7" rx="7.0" ry="3.5" fill="#fff6c8" opacity=".85" transform="rotate(-30 -6.6 -7.7)"/></g><g transform="translate(346 104) rotate(-29) scale(1 0.5)">
  <circle r="24" fill="#ffc83a" opacity=".85" filter="url(#glow)"/>
  <circle r="22" fill="url(#gold)" stroke="#8a5a06" stroke-width="2"/>
  <circle r="15.0" fill="none" stroke="#b07a12" stroke-width="1.6"/>
  <ellipse cx="-6.6" cy="-7.7" rx="7.0" ry="3.5" fill="#fff6c8" opacity=".85" transform="rotate(-30 -6.6 -7.7)"/></g><g transform="translate(366 132) rotate(8) scale(1 1.0)">
  <circle r="23" fill="#ffc83a" opacity=".85" filter="url(#glow)"/>
  <circle r="21" fill="url(#gold)" stroke="#8a5a06" stroke-width="2"/>
  <circle r="14.3" fill="none" stroke="#b07a12" stroke-width="1.6"/>
  <ellipse cx="-6.3" cy="-7.3" rx="6.7" ry="3.4" fill="#fff6c8" opacity=".85" transform="rotate(-30 -6.3 -7.3)"/></g><g transform="translate(378 164) rotate(-15) scale(1 0.75)">
  <circle r="21" fill="#ffc83a" opacity=".85" filter="url(#glow)"/>
  <circle r="19" fill="url(#gold)" stroke="#8a5a06" stroke-width="2"/>
  <circle r="12.9" fill="none" stroke="#b07a12" stroke-width="1.6"/>
  <ellipse cx="-5.7" cy="-6.6" rx="6.1" ry="3.0" fill="#fff6c8" opacity=".85" transform="rotate(-30 -5.7 -6.6)"/></g><g transform="translate(165 128) rotate(22) scale(1 1.0)">
  <circle r="16" fill="#ffc83a" opacity=".85" filter="url(#glow)"/>
  <circle r="14" fill="url(#gold)" stroke="#8a5a06" stroke-width="2"/>
  <circle r="9.5" fill="none" stroke="#b07a12" stroke-width="1.6"/>
  <ellipse cx="-4.2" cy="-4.9" rx="4.5" ry="2.2" fill="#fff6c8" opacity=".85" transform="rotate(-30 -4.2 -4.9)"/></g><g transform="translate(262 130) rotate(-1) scale(1 0.8)">
  <circle r="16" fill="#ffc83a" opacity=".85" filter="url(#glow)"/>
  <circle r="14" fill="url(#gold)" stroke="#8a5a06" stroke-width="2"/>
  <circle r="9.5" fill="none" stroke="#b07a12" stroke-width="1.6"/>
  <ellipse cx="-4.2" cy="-4.9" rx="4.5" ry="2.2" fill="#fff6c8" opacity=".85" transform="rotate(-30 -4.2 -4.9)"/></g><g transform="translate(118 128) rotate(-24) scale(1 0.6)">
  <circle r="15" fill="#ffc83a" opacity=".85" filter="url(#glow)"/>
  <circle r="13" fill="url(#gold)" stroke="#8a5a06" stroke-width="2"/>
  <circle r="8.8" fill="none" stroke="#b07a12" stroke-width="1.6"/>
  <ellipse cx="-3.9" cy="-4.5" rx="4.2" ry="2.1" fill="#fff6c8" opacity=".85" transform="rotate(-30 -3.9 -4.5)"/></g><g transform="translate(310 126) rotate(13) scale(1 1.0)">
  <circle r="15" fill="#ffc83a" opacity=".85" filter="url(#glow)"/>
  <circle r="13" fill="url(#gold)" stroke="#8a5a06" stroke-width="2"/>
  <circle r="8.8" fill="none" stroke="#b07a12" stroke-width="1.6"/>
  <ellipse cx="-3.9" cy="-4.5" rx="4.2" ry="2.1" fill="#fff6c8" opacity=".85" transform="rotate(-30 -3.9 -4.5)"/></g>
  
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
