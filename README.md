# Vegas Whale

Casino blackjack for the phone, installable to the iPhone home screen and playable with no internet connection.

You walk in with $1,000. When it's gone there's a credit card ($50,000 limit; 20% of what you owe is added every 10 hands). Once the card is maxed, the loan shark lends; every 5 hands he takes 20% of what you owe from your chips, and if you can't pay, he kills you and the game is over. Between hands Guy, in a trench coat, sells hot goods for men and women, from a pinky ring or a silk scarf to a private jet; everything you buy is kept as a card under Stuff, and you can sell it back. He never stops coming: buy from him and he comes more often with nicer things, turn him down and he comes less often with junk. If you own something that cost over $10,000, he often comes back with a buyer who'll pay more (1 in 4 hands, at least 2 hands apart).

There are four tables: 6 decks ($5 to $1,000), 4 decks ($25 to $5,000), 2 decks ($100 to $25,000) and 1 deck ($500 to $100,000). You start at 6 decks; the next table opens when you have enough chips of your own after debts ($1,250 / $7,500 / $100,000) or have bet enough at the table below ($150 / $5,000 / $200,000); the casino host invites you up. Each table has its own felt: worn gray-green, blue, black, and red with gold trim. If you can't cover a table's minimum you're moved down. Every other casino rule is an on/off switch, and every bet, win, loss and money move is recorded, with charts of how far up or down you are this game and over all games.

## Files

- `index.html` — the game. Built from `tools/game.html` by `python3 tools/build.py`; edit the game there, then rebuild.
- `sw.js` — keeps a copy on the phone so it opens offline. **Change `VERSION` in it whenever `index.html` changes**, or phones keep the old copy.
- `manifest.webmanifest`, `icon-*.png` — the home-screen name and icon (`node tools/icon.js` redraws the icons).
- `tools/offline-test.js` — loads the game, cuts the connection, and plays three hands to prove it works offline.
- `tools/cg-test.js` — the money side: the $1,000 start, the card, the loan shark's cut, the warning, death, starting over, Guy and the Stuff cards.

The record lives in the phone's own storage for this site. It is not synced anywhere.

## Sounds

The card sounds (dealing, flipping, shuffling, collecting) are real recordings from Kenney's Casino Audio pack (kenney.nl), released under CC0, built into the page so they work offline. The chip sounds are made in code.
