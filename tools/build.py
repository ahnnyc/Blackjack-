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
    ("  padding-block:8px 6px;", "  padding-block:calc(env(safe-area-inset-top, 0px) + 14px) 6px;"),   # clear of the clock bar and its blurred edge
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
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Blackjack">
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
// Some iPhones report a home-screen app's screen as one clock-bar shorter than it is,
// leaving an empty band at the bottom. Spot exactly that and use the true screen height.
(function () {{
  var standalone = navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
  if (!standalone) return;
  var probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:env(safe-area-inset-top,0px);visibility:hidden;pointer-events:none';
  document.body.appendChild(probe);
  function fix() {{
    var top = probe.getBoundingClientRect().height;
    var portrait = innerHeight > innerWidth;
    var full = portrait ? Math.max(screen.width, screen.height) : Math.min(screen.width, screen.height);
    var gap = full - innerHeight;
    if (top > 0 && Math.abs(gap - top) <= 3) {{ document.body.style.bottom = 'auto'; document.body.style.height = full + 'px'; }}
    else {{ document.body.style.bottom = ''; document.body.style.height = ''; }}
    if (window.dispatchEvent) dispatchEvent(new Event('bj-fit'));
  }}
  fix();
  addEventListener('resize', fix);
  addEventListener('orientationchange', function () {{ setTimeout(fix, 300); }});
  document.addEventListener('visibilitychange', function () {{ if (!document.hidden) setTimeout(fix, 100); }});
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
