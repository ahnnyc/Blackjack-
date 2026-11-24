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
    ("  padding-block:8px 6px;", "  padding-block:max(8px, env(safe-area-inset-top, 0px)) 6px;"),
    ("  -webkit-tap-highlight-color:transparent; overflow:hidden;",
     "  -webkit-tap-highlight-color:transparent; overflow:hidden; margin:0;\n  -webkit-user-select:none; user-select:none; -webkit-touch-callout:none; overscroll-behavior:none;"),
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
if ('serviceWorker' in navigator) {{
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {{}}));
}}
</script>
</body>
</html>
"""
(ROOT / "index.html").write_text(page)
print("wrote index.html", len(page), "bytes")
