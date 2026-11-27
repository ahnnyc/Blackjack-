"""Builds the installable, offline copy of the game.

Reads the game page (the same file published as the Claude artifact) and writes
index.html with a proper head, home-screen settings for iPhone, and the
offline helper registered. Run:  python3 tools/build.py <path-to-game.html>
"""
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
src = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ROOT / "tools" / "game.html").read_text()

split = src.index('<div id="app">')
head_part, body_part = src[:split], src[split:]

# The Claude viewer pads the page for the iPhone notch; a home-screen app must do it itself.
fixes = [
    ("  padding-block:8px 6px;", "  padding-block:calc(env(safe-area-inset-top, 0px) + 44px) 6px;"),   # well clear of the clock bar and the fade iOS draws under it
    ("#ctl{border-top:2px solid transparent;padding:10px 0 calc(4px + env(safe-area-inset-bottom, 0px));",
     "#ctl{border-top:2px solid transparent;padding:10px 0 calc(4px + var(--home-bar, env(safe-area-inset-bottom, 0px)));"),
    ("  -webkit-tap-highlight-color:transparent; overflow:hidden;",
     "  -webkit-tap-highlight-color:transparent; overflow:hidden; margin:0;\n  -webkit-user-select:none; user-select:none; -webkit-touch-callout:none; overscroll-behavior:none; position:fixed; inset:0;"),
]
for old, new in fixes:
    if head_part.count(old) != 1:
        raise SystemExit("Expected exactly one: " + old)
    head_part = head_part.replace(old, new)

page = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black">
<meta name="apple-mobile-web-app-title" content="Vegas Whale">
<meta name="theme-color" content="#09362b">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icon-180.png">
<link rel="icon" href="icon-192.png">
<style>[hidden]{{display:none!important}}</style>
{head_part.strip()}
</head>
<body>
{body_part.strip()}
<script>
// Some iPhones draw a home-screen app under the clock but give it a screen one clock-bar
// shorter, so the home bar falls in the part already cut off. In exactly that case the
// margin kept for the home bar is wasted: drop it.
(function () {{
  var standalone = navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
  if (!standalone) return;
  var probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:env(safe-area-inset-top,0px);visibility:hidden;pointer-events:none';
  document.body.appendChild(probe);
  function check() {{
    var top = probe.getBoundingClientRect().height;
    var portrait = innerHeight > innerWidth;
    var full = portrait ? Math.max(screen.width, screen.height) : Math.min(screen.width, screen.height);
    var cutOff = full - innerHeight;
    var bug = top > 0 && cutOff > 0 && Math.abs(cutOff - top) <= 3;
    document.documentElement.style.setProperty('--home-bar', bug ? '0px' : 'env(safe-area-inset-bottom, 0px)');
    dispatchEvent(new Event('bj-fit'));
  }}
  check();
  addEventListener('resize', check);
  addEventListener('orientationchange', function () {{ setTimeout(check, 300); }});
}})();
if ('serviceWorker' in navigator) {{
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {{}}));
}}
</script>
</body>
</html>
"""
(ROOT / "index.html").write_text(page)
print("wrote index.html", len(page), "bytes")
