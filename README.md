# Vegas Whale

Casino blackjack for the phone, installable to the iPhone home screen and playable with no internet connection.

You walk in with $1,000. Everything you do feeds one ranking: your prestige rank, from Guppy to Super Whale, which sets how you live, what you must bet, and which offers you get. A typical player who plays well reaches Super Whale in about 117 hours, counting restarts (modelled before building: prestige from play, sponsors paying 75% of the bills, credit lines up to $1,000,000 at Whale, debt costing half its size in prestige; a Whale has bet about $1 million to get there and a Super Whale about $20 million).

There are four tables, using the deck counts Vegas uses: 8 decks ($5 to $500), 6 decks ($25 to $5,000), 2 decks ($100 to $25,000) and 1 deck ($500 to $100,000). You start at 8 decks; a table opens when your chips plus prestige reach $1,250 / $7,500 / $100,000 (tables can be skipped), or once you have bet enough at the table below ($150 / $5,000 / $200,000); the offer to move up comes when your shoe is due for a shuffle, so a move always starts with a fresh shoe; the message also says what the next goal is. Each table has its own felt: worn gray-green, blue, black, and red with gold trim. If you can't cover a table's minimum you're moved down. A table whose maximum is under your rank's minimum bet is too small for you: a Whale can't play 8 decks, a Super Whale can't play 8 or 6, and ranking up moves you to the smallest table that fits. Every other casino rule is an on/off switch, and every bet, win, loss and money move is recorded, with charts of how far up or down you are this game and over all games.

## Ranks

| Rank | Prestige | Minimum bet | Stay | Eat | Get around | A day (before savings) | Sponsor |
|---|---|---|---|---|---|---|---|
| Guppy | $0 | $5 | motel $49 | fast food $25 | walking | $74 | a local bar |
| Minnow | $1,000 | $10 | hotel room $99 | coffee shop $60 | city bus $10 | $169 | a pawn shop |
| Barracuda | $5,000 | $25 | scenic room $249 | café $150 | taxis $60 | $459 | a sports bar chain |
| Swordfish | $10,000 | $50 | suite $499 | steakhouse $300 | rental car $120 | $919 | a sports-betting app |
| Marlin | $25,000 | $250 | tower suite $799 | fine dining $500 | car service $300 | $1,599 | an energy drink |
| Whale | $250,000 | $2,500 | villa $1,500 | chef's table $1,000 | limo with driver $800 | $3,300 | a watch brand |
| Super Whale | $5,000,000 | $10,000 | penthouse | anywhere | private car and driver | comped | none |

- **Prestige** = prestige from play (every $4 bet earns $1) + what you paid for things (counted only once your debts are paid, so nothing bought on credit counts until it's paid off) − half of any debt left over beyond what your things are worth (so losing money and borrowing can drop your rank; modelled: about 117 hours to Super Whale, 62% of starts make it) + eye candy ($5,000) and an entourage ($25,000). It also counts with chips toward opening tables.
- **Minimum bet** is your rank's minimum or the table's, whichever is higher.
- **A day** is 150 hands. Breakfast, lunch and dinner come after hands 25, 75 and 125; the room and getting around at the end of the day.
- **Sponsors** pay 75% of the day's bills at the end of the day if you made the right move (basic strategy) on at least 95% of your hands. New players (Guppy, Minnow) whose own chips are under $1,000 get their bills comped.

## Offers

Between hands (about every 14) you get one offer matched to your rank, saying what it does for you: the prestige it adds and the rank it reaches, how much it saves and how fast it pays for itself, or the terms of a credit line. Offers from lower ranks you skipped can still come.

| Rank | Save money | Raise rank | Credit |
|---|---|---|---|
| Guppy | weekly motel rate $250 (7 days) | sharp shirt $150 | store card $2,000 |
| Minnow | extended-stay deal $450 (7 days), bus pass $150 (30 days) | tailored suit $600 | credit card $10,000 |
| Barracuda | apartment $2,500, used car $4,000 | gold watch $2,500 | bigger card $25,000 |
| Swordfish | condo $8,000, new car $30,000 | diamond ring $8,000 | gold card $50,000 |
| Marlin | personal chef $15,000, luxury car $90,000 | eye candy $300 a day | casino marker $100,000 |
| Whale | penthouse $100,000, own limo $250,000 | entourage $2,500 a day | bigger marker $1,000,000 |
| Super Whale | | private jet $5,000,000 | open marker, no limit |

Homes, cars and the chef work for good, at every higher rank too, and add their price to your prestige. Credit lines charge interest once a day (5%, down to 2% for the open marker); a new line replaces the old one and what you owe carries over. Things sell back for half what you paid.

## Out of money, the loan shark

If you can't cover your minimum bet: borrow on your credit line, then from the loan shark (who lends only when your credit is used up or you have none; every 5 hands he takes 20% of what you owe, less with prestige), sell things, or leave town, which wipes chips, debts, stuff, people and prestige and starts over (the record is kept). If you can't pay the loan shark's cut, he takes your things, most valuable first; if they aren't worth enough, you end up in a shallow grave in the desert.

## Messages

Starting over (from the Record screen, the out-of-chips message or game over) goes back to the opening message, as on a first visit.

When the app is reopened, or you come back after 10 minutes or more away, a Welcome back message says who you are (rank, prestige, how far to the next rank, minimum bet), the life you live at that rank (where you stay, eat and how you get around, counting homes, cars, a chef and deals you have, what it costs a day, your sponsor, who is with you), then your chips, what you owe, and the next goal.

Every message in the game is short and plain: what happened and the numbers, no jokes. The welcome screen says only the $1,000 start and the next table. Borrowing is explained when the chips run out. Each new-table message states the next goal in full. A free bill is always called comped.

## Files

- `index.html` — the game. Built from `tools/game.html` by `python3 tools/build.py`; edit the game there, then rebuild.
- `sw.js` — keeps a copy on the phone so it opens offline. **Change `VERSION` in it whenever `index.html` changes**, or phones keep the old copy.
- `manifest.webmanifest`, `icon-*.png` — the home-screen name and icon (`node tools/icon.js` redraws the icons).
- `tools/offline-test.js` — loads the game, cuts the connection, and plays three hands to prove it works offline.
- `tools/cg-test.js` — the money side: the $1,000 start, prestige from play, offers, credit lines and daily interest, bills and sponsors, rank minimum bets, the loan shark, the grave, starting over.

The record lives in the phone's own storage for this site. It is not synced anywhere.

## Sounds

The card sounds (dealing, flipping, shuffling, collecting) are real recordings from Kenney's Casino Audio pack (kenney.nl), released under CC0, built into the page so they work offline. The chip sound is made in code: a short, dead plastic clack with a smaller second clack as the chip settles, at about the same loudness as the card recordings.
