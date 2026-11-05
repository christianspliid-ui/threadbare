> **title:** Brainstorm companion — while you were away (THR-2173, slice 1)
> **linear_issue:** THR-2173
> **created:** 2026-11-06

# Brainstorm companion — while you were away

Companion to `Docs/plans/2026-11-06-thr-2173-while-you-were-away.md`.

## The tension

The three testers asked for three different things. The skimmer wanted "one encounter within 60 seconds". The veteran wanted a catch-up that summarised something. The story tester wanted the Chapter Ledger as the front door. The first ask is about how long the warm-up takes. The other two are about what the player sees when it ends. The question is what a returning god sees first, and in how many words, without adding a screen or a container.

## Options considered

| Option | For | Against | Taken? |
|---|---|---|---|
| The warm-up card turns into a five-line recap with a Ledger button | No new surface; the player is already looking at it; short enough for the skimmer, a door for the story tester | Only on warm arrival; the card grows to M tier | Yes |
| Open the Chapter Ledger on arrival | The story tester's literal ask; no new words | 56 rows; the skimmer quit on length; it hides the map they came back to | No (the button gives it) |
| A world digest (rivals, factions, towns) first | The veteran's "summarised almost nothing" | The strangers' events are the toast noise testers named; it puts the world before The First, against settled direction | No |
| A Chronicle tab badge or a toast | Cheap | A badge is a click nobody prompted; toasts are already skipped | No |
| Re-run every first-use caption on arrival | Teaches the rail words | A pile-up THR-2060 removed; the rail-row definition lines cover it | No |
| Name the rival behind a slipped place | More telling | The rival lookup is broken today (THR-2172) | Not now |
| Shorten the warm-up | The skimmer's real complaint | 127 s is under the 180 s kill line; tick cost is engine work, not this surface | No (watched by the warm plan) |

## Vision premises touched

- **The mortal's story leads.** The First is the spine of the run, and the recap leads with their chapters.
- **Prose before numbers.** Each line is a sentence the Aftermath already writes. Counts are words.
- **The map is the table.** The recap is the warm card's second state, not a new screen, and it hands the map back with one click.

## Why the bands are diffed rather than the day lines replayed

`composeDominionChronicle` writes its lines as `tickEvents`. `recentEvents` keeps about 100 of them, so after 300 ticks most are gone. Reading the band table once before the warm-up and once after is exact and cheap. It also needs no new stored field.
