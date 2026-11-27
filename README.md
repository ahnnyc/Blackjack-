# Vegas Whale

Casino blackjack for the phone, installable to the iPhone home screen and playable with no internet connection.

You walk in with $1,000. Everything you do feeds one ranking: your prestige rank, from Guppy to Super Whale, which sets how you live, what you must bet, and which offers you get. A typical player who plays well reaches Super Whale in about 117 hours, counting restarts (modelled before building: prestige from play, sponsors paying 75% of the bills, credit lines up to $1,000,000 at Whale, debt costing half its size in prestige; a Whale has bet about $1 million to get there and a Super Whale about $20 million).

There are four tables, using the deck counts Vegas uses: 8 decks ($5 to $500), 6 decks ($25 to $5,000), 2 decks ($100 to $25,000) and 1 deck ($500 to $100,000). As in a real casino, you can sit at any table whose minimum you can cover (tap the Limits sign) and bet anything in its range, whatever your rank; the ranges never change. If you can't cover a table's minimum you're moved down. Each table has its own felt: worn gray-green, blue, black, and red with gold trim. Every other casino rule is an on/off switch, and every bet, win, loss and money move is recorded, with charts of how far up or down you are this game and over all games.

## Ranks

| Rank | Prestige | Expected bet (never shown) | Stay | Eat | Get around | A day (after perks, before homes, cars and deals) | Sponsor |
|---|---|---|---|---|---|---|---|
| Guppy | $0 | $5 | a friend's couch, free | fast food $25 | walking | $25 | none |
| Minnow | $1,000 | $10 | hostel bed $22 | fast food $25 (breakfast comped) | city bus $3 | $44 | none |
| Barracuda | $5,000 | $25 | standard room at the casino $60, half price $30 | diner $45 | city bus $10 | $85 | none |
| Swordfish | $10,000 | $50 | deluxe room at the casino $99, comped | café $95 | taxis $36 | $131 | none |
| Shark | $25,000 | $250 | tower suite $799 | fine dining $500 | car service $300 | $1,599 | an energy drink |
| Whale | $250,000 | $2,500 | villa $1,500 | chef's table $1,000 | limo with driver $800 | $3,300 | a watch brand |
| Super Whale | $5,000,000 | $10,000 | penthouse | anywhere | private car and driver | comped (else $9,000) | none |

- **Small regulars get rewarded** (the players' club, since nobody sponsors them): the first time in a game you reach Minnow, Barracuda or Swordfish the casino gives you $100, $500 or $1,000 in free chips (once per rank per game, said in the new-rank message), and those ranks get breakfast comped, the room at half price, and the room comped. Modelled: 64% of starts reach Super Whale in a median 116 hours, against 66% and 118 without them, so the climb is unchanged.
- **Rentals below Whale, purchases at Whale:** homes, cars and a chef are rented by the month below Whale (they say "Rent", "Lease" or "Hire", don't count toward your rank, and keep working if your rank changes until they run out). At Whale a penthouse ($3,000,000) and your own limo ($400,000) are real purchases that last for good and count toward your rank; their offers lead with how much closer they get you to Super Whale. Rental buttons say Rent, Lease or Hire. The old cheap apartment, condo, cars and chef are no longer offered but keep working for anyone who bought them.
- **Deals cover only the place they were bought for:** the weekly hostel rate pays for the hostel, not a room at the casino; the fast-food meal deal doesn't pay for the diner; the bus pass still works wherever you ride the same city bus. Homes, cars and the chef keep working at every rank.
- **Cash advance fee:** borrowing cash on any credit line (card or marker) costs 5%, at least $10, added to what you owe, so moving money in and out isn't free. The cashier's Borrow button shows the fee, and "All" leaves room for it. The moneylender charges no fee (his cut is enough).
- **Rank-up fireworks:** ranking up sets off fireworks, which burst over the new-rank message; the message pops up in the middle of the screen after the first bursts (a tap shows it at once). They grow with the rank: Minnow 3 small white bursts; Barracuda 4, blue and white; Swordfish 6, light blue, with rings; Shark 8 bigger, orange, gold and red, with crackling sparks; Whale 12 in every color with gold willows; Super Whale 18 of the biggest with double rings and a gold finale. Off when Animations is off in Rules. Previewed and approved first (claude.ai/artifact/9qRi1WQTw77joSXskTfx1Q).
- **How you live is said plainly:** Welcome back, new-rank messages and offers say whether you pay by the night ("You pay $799 a night for a tower suite"), rent ("You rent a condo"), own ("You live in the penthouse you own"), are on a deal ("on your weekly hostel rate"), or get it free or comped; the same for meals and getting around, then the total a day.
- **The bottom bar** (layout C, chosen by Mike): your rank badge and your chips side by side, centered; under them, centered, how far to the next rank, up/down for this game, and what you owe. On a narrow phone the lower line wraps rather than running off the edge.
- **Every message box is centered** on the screen and never taller than it; a long one (the cashier) scrolls inside.
- **The rank's fish badge** (not a whale picture) heads the new-rank and Welcome back messages.
- **Players never see prestige.** It is the hidden number behind the rank. On screen there are only rank names and, under the rank badge, how far along you are ("15% to Minnow"). Every offer of a thing or a person says in words what it does for you: "Impresses the casino: gets you 15% closer to Minnow, where you can get a $10,000 credit card", or which rank it makes you and what that rank gets you. Selling says how far you fall back. Debt is "holding your rank back", never a figure.
- **Prestige** = prestige from play (every $4 bet earns $1) + what you paid for things (counted only once your debts are paid, so nothing bought on credit counts until it's paid off) − half of any debt left over beyond what your things are worth (so losing money and borrowing can drop your rank; modelled: about 117 hours to Super Whale, 62% of starts make it) + eye candy ($5,000) and an entourage ($25,000).
- **Bets:** as in a real casino you can sit at any table and bet its minimum; there's no minimum by rank. But the casino rates you: if your average bet over a day is under what your rank is expected to bet (the lowest rank you held that day, so ranking up mid-day costs nothing), your sponsor pays nothing that day, any comps for the day are charged to you (a Super Whale pays $9,000), and your eye candy and entourage leave. Nobody is warned beforehand; the end-of-day "Low bets today" message is how the player finds out. Modelled (300 players each): betting your rank's level, 58% of starts reach Super Whale in a median 120 hours; dropping to $5 bets when chips run low, or always betting $5, never gets there.
- **A day** is 150 hands. Breakfast, lunch and dinner come after hands 25, 75 and 125; the room and getting around at the end of the day.
- **Sponsors** come only from Shark up (nobody sponsors a small-time gambler, so the lower ranks live cheaply: about what they paid after a sponsor before, so the climb still models at about 120 hours and 58% of starts). They pay 75% of the day's bills at the end of the day if you made the right move (basic strategy) on at least 95% of your hands. New players (Guppy, Minnow) whose own chips are under $1,000 get their bills comped.

## Offers

Between hands (about every 14) you get one offer matched to your rank, saying what it does for you: the prestige it adds and the rank it reaches, how much it saves and how fast it pays for itself, or the terms of a credit line. Offers from lower ranks you skipped can still come.

| Rank | Save money | Raise rank | Credit |
|---|---|---|---|
| Guppy | weekly meal deal $120 (7 days) | sharp shirt $150 | store card $2,000 |
| Minnow | weekly hostel rate $120 (7 days), bus pass $60 (30 days) | tailored suit $600 | credit card $10,000 |
| Barracuda | weekly meal plan at the diner $250 (7 days) | gold watch $2,500 | bigger card $25,000 |
| Swordfish | rent a car $900 (30 days) | diamond ring $8,000 | gold card $50,000 |
| Shark | rent a condo $15,000, lease a luxury car $6,000, hire a personal chef $9,000 (each 30 days) | eye candy $300 a day | casino marker $100,000 |
| Whale | buy a penthouse $3,000,000, buy your own limo $400,000 | entourage $2,500 a day | bigger marker $1,000,000 |
| Super Whale | | private jet $5,000,000 | open marker, no limit |

Homes, cars and the chef work for good, at every higher rank too, and add their price to your prestige. Credit lines charge interest once a day (5%, down to 2% for the open marker); a new line replaces the old one and what you owe carries over. Things sell back for half what you paid.

## Out of money, the moneylender

If you can't cover your minimum bet: borrow on your credit line, then from the moneylender (who lends only when your credit is used up or you have none; every 5 hands he takes 20% of what you owe, less with prestige), sell things, or leave town, which wipes chips, debts, stuff, people and prestige and starts over (the record is kept). If you can't pay the moneylender's cut, he takes your things, most valuable first; if they aren't worth enough, you end up in a shallow grave in the desert.

## Messages

Starting over (from the Record screen, the out-of-chips message or game over) goes back to the opening message, as on a first visit.

When the app is reopened, or you come back after 10 minutes or more away, a Welcome back message says who you are (rank, prestige, how far to the next rank), the life you live at that rank (where you stay, eat and how you get around, counting homes, cars, a chef and deals you have, what it costs a day, your sponsor, who is with you), then your chips and what you owe.

Every message in the game is short and plain: what happened and the numbers, no jokes. The welcome screen says the $1,000 start, the next rank and how prestige is earned, and that you can sit at any table you can cover. Borrowing is explained when the chips run out. There are no table unlocks and no table messages. A free bill is always called comped.

## Files

- `index.html` — the game. Built from `tools/game.html` by `python3 tools/build.py`; edit the game there, then rebuild.
- `sw.js` — keeps a copy on the phone so it opens offline. **Change `VERSION` in it whenever `index.html` changes**, or phones keep the old copy.
- `manifest.webmanifest`, `icon-*.png` — the home-screen name and icon (`node tools/icon.js` redraws the icons).
- `tools/offline-test.js` — loads the game, cuts the connection, and plays three hands to prove it works offline.
- `tools/cg-test.js` — the money side: the $1,000 start, prestige from play, offers, credit lines and daily interest, bills and sponsors, no minimum by rank, the moneylender, the grave, starting over.
- `tools/rating-test.js` — every table open, no minimum by rank, and the low-bet day: sponsor, comps and people lost, told only afterwards; ranking up mid-day is safe.
- `tools/perks-test.js` — free chips on reaching Minnow, Barracuda and Swordfish (once per game), breakfast comped, half-price and comped rooms.
- `tools/fireworks-test.js` — rank-up fireworks before the message, a tap shows it at once, none with Animations off; every message box centered and on screen at 390 and 320 wide.
- `tools/rentals-test.js` — monthly rentals below Whale (no rank, keep working after a rank change), real purchases at Whale, old cheap homes and cars no longer offered.

The record lives in the phone's own storage for this site. It is not synced anywhere.

## Sounds

The card sounds (dealing, flipping, shuffling, collecting) are real recordings from Kenney's Casino Audio pack (kenney.nl), released under CC0, built into the page so they work offline. The chip sound is made in code: a short, dead plastic clack with a smaller second clack as the chip settles, at about the same loudness as the card recordings.
