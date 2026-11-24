# Blackjack

Casino blackjack for the phone, installable to the iPhone home screen and playable with no internet connection.

Every casino rule is an on/off switch, the shoe holds 1 to 8 decks, the bankroll is yours to choose, chips run from $5 to $1,000, and every bet, win and loss is recorded, with charts of the current bankroll and the lifetime bankroll.

## Files

- `index.html` — the game. Built from `tools/game.html` by `python3 tools/build.py`; edit the game there, then rebuild.
- `sw.js` — keeps a copy on the phone so it opens offline. **Change `VERSION` in it whenever `index.html` changes**, or phones keep the old copy.
- `manifest.webmanifest`, `icon-*.png` — the home-screen name and icon (`node tools/icon.js` redraws the icons).
- `tools/offline-test.js` — loads the game, cuts the connection, and plays three hands to prove it works offline.

The record lives in the phone's own storage for this site. It is not synced anywhere.
