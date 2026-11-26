# Vegas Whale

Casino blackjack for the phone, installable to the iPhone home screen and playable with no internet connection.

You walk in with $1,000. When it's gone there's a credit card ($50,000 limit; 20% of what you owe is added every 10 hands). Once the card is maxed, the loan shark lends; every 5 hands he takes 20% of what you owe from your chips, and if you can't pay, he kills you and the game is over. Between hands Guy sells goods for men and women, from a pinky ring or a silk scarf to a private jet; everything you buy is kept as a card under Stuff, and you can sell it back. He never stops coming: buy from him and he comes more often with nicer things, turn him down and he comes less often with junk. If you own something that cost over $10,000, he often comes back with a buyer who'll pay more (1 in 4 hands, at least 2 hands apart).

There are four tables: 6 decks ($5 to $1,000), 4 decks ($25 to $5,000), 2 decks ($100 to $25,000) and 1 deck ($500 to $100,000). You start at 6 decks; a table opens when you have enough chips, borrowed or not ($1,250 / $7,500 / $100,000), and tables can be skipped, or have bet enough at the table below ($150 / $5,000 / $200,000); the offer to move up comes when your shoe is due for a shuffle, so a move always starts with a fresh shoe; the message also says what the next goal is. Each table has its own felt: worn gray-green, blue, black, and red with gold trim. If you can't cover a table's minimum you're moved down. Every other casino rule is an on/off switch, and every bet, win, loss and money move is recorded, with charts of how far up or down you are this game and over all games.

Time passes in hands: every 150 hands is a day, about an hour of play. You stop for breakfast (after hand 25), lunch (75) and dinner (125), and pay for your room at the end of the day (150). Prices go with your table: the diner and a budget motel at 6 decks ($5 / $8 / $12, room $49), the coffee shop and a hotel room at 4 decks ($25 / $40 / $85, room $249), the steakhouse and a tower suite at 2 decks ($40 / $75 / $180, room $799), and everything comped at the 1-deck high-roller table. When your own chips (after debts) are under $1,000, the bill is comped. It can be switched off in Rules, under Extras.

## Messages

Starting over (from the Record screen, the out-of-chips message or game over) goes back to the opening message, as on a first visit.

When the app is reopened, or you come back after 10 minutes or more away, a Welcome back message shows your chips and the next goal.

Every message in the game is short and plain: what happened and the numbers, no jokes. The welcome screen says only the $1,000 start and the next table. The credit card and the loan shark are explained when the chips run out. Each new-table message states the next goal in full. A free bill is always called comped.

## Files

- `index.html` — the game. Built from `tools/game.html` by `python3 tools/build.py`; edit the game there, then rebuild.
- `sw.js` — keeps a copy on the phone so it opens offline. **Change `VERSION` in it whenever `index.html` changes**, or phones keep the old copy.
- `manifest.webmanifest`, `icon-*.png` — the home-screen name and icon (`node tools/icon.js` redraws the icons).
- `tools/offline-test.js` — loads the game, cuts the connection, and plays three hands to prove it works offline.
- `tools/cg-test.js` — the money side: the $1,000 start, the card, the loan shark's cut, the warning, death, starting over, Guy and the Stuff cards.

The record lives in the phone's own storage for this site. It is not synced anywhere.

## Sounds

The card sounds (dealing, flipping, shuffling, collecting) are real recordings from Kenney's Casino Audio pack (kenney.nl), released under CC0, built into the page so they work offline. The chip sounds are made in code.
