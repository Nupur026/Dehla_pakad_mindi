# Dehla Pakad / Mindi — Documentation

## Overview
This is a static, client-side four-player Dehla Pakad/Mindi card game. It uses plain HTML, CSS, and JavaScript and does not require a server or external packages.

## Teams
| Team | Players |
|---|---|
| Team 1 | You + Riya |
| Team 2 | Arjun + Karan |

## Round flow
1. Shuffle a standard 52-card deck and deal 13 cards to each player.
2. Players take turns in seat order, playing one card each.
3. A player must follow the lead suit if they have a card in that suit.
4. When a player first cannot follow suit, a trump suit is revealed, chosen to differ from the lead suit.
5. After four cards, determine the winning play. A trump beats a non-trump; otherwise the highest card in the lead suit wins.
6. The winner's team captures all four cards and leads the next trick.
7. Each captured 10 counts as one Dehla point.
8. After 13 tricks, compare the two teams' Dehla totals and display the final result.

## CUT display
The **CUT** panel is intentionally separate and visually prominent. If the winning card is a trump played against the led suit, the panel shows the winning trump card and explains which led suit it cut. If there was no trump cut, it says so clearly.

## Capture animation and Dehle
When a trick finishes:
- The winning team capture zone is highlighted.
- The center cards animate into that team's capture zone.
- The result panel says `TEAM 1 CAPTURED THIS TRICK` or `TEAM 2 CAPTURED THIS TRICK`.
- The player who won and the winning card are shown.
- Captured 10s are listed in the Dehla panel and highlighted in the pile.
- Team Dehla and trick counters update.

## Final result
The final panel displays the winning team and the Dehla score, for example `TEAM 1 WINS 3–1 · You + Riya`.

## Files
- `index.html`: layout, team scoreboard, capture areas, dialogs.
- `styles.css`: responsive styling and card/capture animations.
- `game.js`: dealing, legal moves, AI turns, trick resolution, scoring, cut/dehla UI.
- `README.md`: quick-start guide.
- `DOCUMENTATION.md`: rules and implementation notes.
