# Dehla Pakad / Mindi

A self-contained browser version of Dehla Pakad (Mindi).

## Run
1. Extract the ZIP.
2. Open `index.html` in a modern browser.
3. Optional local server: run `python -m http.server 8000` in this folder, then open `http://localhost:8000`.

No backend, install, or external library is required.

## Teams
- **Team 1:** You + Riya
- **Team 2:** Arjun + Karan

## Implemented gameplay and visuals
- Four players, 52-card deck, 13 cards each.
- Players must follow the led suit when possible.
- The first off-suit play reveals a trump suit different from the led suit.
- After every four-card trick, the winner's team is clearly identified.
- The four cards animate toward the winning team's capture pile.
- **CUT** has its own prominent panel and explains when a trump card cuts the lead suit.
- **DEHLA CAPTURED** is shown separately; each captured 10 is highlighted in the pile and counted as one point.
- Team capture piles show card count, Dehle, and tricks.
- Trick history records who won, the winning card, any trump cut, and captured Dehle.
- End-of-round result shows `TEAM 1 WINS X–Y` or `TEAM 2 WINS Y–X`, or a draw.
