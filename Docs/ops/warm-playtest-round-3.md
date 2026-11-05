---
lane: cold-playtest
mode: warm
round: 3
date: 2026-11-05
briefVersion: 2
warmBriefVersion: 2
warmTicks: 300
startUrl: https://threadbearer.co/?view=game&seeded&size=medium&warm=300
deployedCommit: 36c3e9ca8020400935c0bb52b81b6d2eabae14ed
usable: 3/3
covered: 3/3
filed: 11
needsChristian: false
---

# Warm playtest — round 3 (2026-11-05)

**Coverage passed for the first time: 3 of 3 testers reached the mid-game** (bar: 2). Two opened a faction sheet, and all three read The First's own work and ambitions. With the mid-game finally in reach, the testers' complaints moved up a level: rival gods they can see but not answer, a "Fated" roll that failed with no explanation, and a return to the game that summarises nothing.

- Attended run, on Christian's request (chat, 2026-11-04). Gates 2 (deployed, `36c3e9ca`) and 4 (tester login) passed. Gates 1 and 3 are skipped in attended mode. The warm series had been locked since 2026-10-21 by impediment #1246, which was fixed on 2026-11-04 (`bae851a1`).
- Three cold personas (Opus testers), warm brief v2 (first run on v2), three seasons warm-up, Kael Thornweaver already bonded.
- Since round 2, the Mortal economy map's whole carve-up has shipped ([THR-1863](https://linear.app/threadbare/issue/THR-1863)), along with the Map-is-the-Table screen and legibility 1–4.
- Artifacts: `%USERPROFILE%\.threadbare\warm-playtest\round-3\`.

## Warm start

| Persona | `[warm-start] done` | advanced | ms | pending at arrival | open at arrival | opening settled |
|---|---|---|---|---|---|---|
| story | yes | 300/300 | 127 619 | 0 | JourneyVignetteModal | 4/4 |
| veteran | yes | 300/300 | 126 514 | 0 | JourneyVignetteModal | 4/4 |
| skimmer | yes | 300/300 | 126 692 | 0 | JourneyVignetteModal | 4/4 |

- **Each warm-up took ~127 s, up from ~83 s in round 2 and ~105 s in round 1.** That is under the 180 s kill line but heading toward it, and it is the first finding in [THR-2173](https://linear.app/threadbare/issue/THR-2173). The testers' "4–8 minutes" counts their own wait timeouts. Screenshot timestamps put the real wait at about 3 min.
- One decision was waiting at arrival, which is within the limit. No pile-up.

## Verdicts

| Persona | Would keep playing? | Round 2 | Met The First? | Would quit at | Never understood | Surprises | Actions | Minutes | Notional cost |
|---|---|---|---|---|---|---|---|---|---|
| story | maybe | maybe (leaning no) | y (bonded at start) | no hard point; drifting at the 11-ruler Notables list | 12 | 10 | 62 | 11 | $3.86 |
| veteran | maybe (leaning yes) | maybe (leaning yes) | y | soft: a FATED step that "broke" | 13 | 10 | 69 | 11 | $4.21 |
| skimmer | maybe | maybe (leaning no) | y | ~5 min in, during the catch-up | 12 | 8 | 62 | 10 | $3.78 |

**All three named the same best moment:** The Gallows Pardon. A named mother and justice, cards that fit the fiction ("Soften Hard Hearts" for the crowd), the odds rising as cards were added, and a ledger of named people afterwards. Veteran: "That's the game the store page promised."

**Common message to the designer:** let the story lead, and let me answer what threatens me.
- story: "Make the Chapter Ledger the front door … explain the world (rivals, dominion, doom) through Kael's story."
- veteran: "Put a real number (or at least a tooltip with the rule) behind every odds word, rank word and pip, and never let a 'Fated' roll fail without saying why."
- skimmer: "Put the player in [an encounter] within 60 seconds of returning, and give the … rival threats a single button that lets me act on them."

## Coverage

| Persona | faction | undertaking | ambition | threadHistory | coverage failure |
|---|---|---|---|---|---|
| story | reached | reached | reached | reached | no |
| veteran | reached | reached | reached | — | no |
| skimmer | — | reached | reached | — | no |

Round 2 was 0/3 and round 1 was 1/3. The faction link fix ([THR-1851](https://linear.app/threadbare/issue/THR-1851)) and brief v2 ([THR-1861](https://linear.app/threadbare/issue/THR-1861)) did their job. Veteran found the Congregation's faction sheet, with its rivalries, alliance history and pilgrim ways running to the seat, and named it a close second-best moment.

## Earlier findings

- **fixed-confirmed:**
  - [THR-1851](https://linear.app/threadbare/issue/THR-1851): factions are reachable.
  - [THR-1785](https://linear.app/threadbare/issue/THR-1785) / [THR-1861](https://linear.app/threadbare/issue/THR-1861): coverage is 3/3.
  - [THR-1854](https://linear.app/threadbare/issue/THR-1854): no repeated journey choice.
  - [THR-1852](https://linear.app/threadbare/issue/THR-1852): God's Will shows no raw ids.
  - [THR-1855](https://linear.app/threadbare/issue/THR-1855): a gift toast names its five cards.
  - [THR-2136](https://linear.app/threadbare/issue/THR-2136) / [THR-2151](https://linear.app/threadbare/issue/THR-2151): "The world turns. The answer comes here." and the answer came.
  - [THR-2141](https://linear.app/threadbare/issue/THR-2141): an armed card holds the clock ("held by your armed card").
  - [THR-1782](https://linear.app/threadbare/issue/THR-1782) / [THR-1787](https://linear.app/threadbare/issue/THR-1787): no replayed opening.
- **partly fixed, partly recurred:** [THR-1859](https://linear.app/threadbare/issue/THR-1859). Work and Ambitions are now reached by everyone, but "See the work →" still opens the mortal, not the work. Commented on the ticket.
- **recurred:**
  - [THR-1860](https://linear.app/threadbare/issue/THR-1860): outcome words still read a win as a loss. Commented, and the wording half is filed as THR-2171.
  - [THR-2142](https://linear.app/threadbare/issue/THR-2142): Needs-you with nothing to open. Filed as THR-2169.
  - [THR-2143](https://linear.app/threadbare/issue/THR-2143): the player can't read the words. Filed as THR-2175, the sixth occurrence and the first in mid-game surfaces.
- **possible recurrence, unverified:** [THR-2053](https://linear.app/threadbare/issue/THR-2053). Two testers say an arriving story moment took their click. Evidence commented; not filed.
- **not exercised:** [THR-1856](https://linear.app/threadbare/issue/THR-1856), [THR-1858](https://linear.app/threadbare/issue/THR-1858), [THR-2140](https://linear.app/threadbare/issue/THR-2140), [THR-2137](https://linear.app/threadbare/issue/THR-2137), and the Notables and Doom halves of THR-1860.

## New findings (11 filed, milestone *Warm playtest · round 3*)

| Ticket | Class | Personas | What |
|---|---|---|---|
| [THR-2165](https://linear.app/threadbare/issue/THR-2165) | bug | 3/3 | The bonded mortal's name prints one letter per line in the Threads rail |
| [THR-2166](https://linear.app/threadbare/issue/THR-2166) | bug | 3/3 | Buttons move under the click: Continue jumps after a pick, the top bar shifts, and the camera cuts on chapter close |
| [THR-2171](https://linear.app/threadbare/issue/THR-2171) | design | 3/3 | "Fated" fails and nothing says why; a won chapter says "the work on Heart failed" |
| [THR-2172](https://linear.app/threadbare/issue/THR-2172) | design | 3/3 | Rival gods are a threat you can see but never answer |
| [THR-2173](https://linear.app/threadbare/issue/THR-2173) | design | 3/3 | Coming back has no "while you were away"; the catch-up estimate sticks and the warm-up is getting longer |
| [THR-2175](https://linear.app/threadbare/issue/THR-2175) | design | 3/3 | Recurs ×6: mid-game words mean nothing (Reaches, Hooks, Signatures, Mandate, Doom, pips) |
| [THR-2170](https://linear.app/threadbare/issue/THR-2170) | bug | 3/3 (cast), 1–2 each for the rest | Five small faults: "Shiaru Shiaru", "Oetgotkoetgoeyt", a flipping loyalty word, "Too far from here", a three-card hand |
| [THR-2168](https://linear.app/threadbare/issue/THR-2168) | bug | 3/3 | A cast's result contradicts itself, "hex_17_14", "4 encounters, 0 succeeded" |
| [THR-2169](https://linear.app/threadbare/issue/THR-2169) | bug | 3/3 | Recurs: Needs-you counts unopenable rows; action toasts never expire |
| [THR-2174](https://linear.app/threadbare/issue/THR-2174) | design | 2/3 | Which chapters wait for the player's cards is never shown |
| [THR-2167](https://linear.app/threadbare/issue/THR-2167) | bug | 2/3 | Escape and Space do the wrong thing (tooltip eats Escape; Space double-fires) |

## Not filed

- **"The Bone Coast" label wrapping vertically, "Designs" clipped at a panel edge** (veteran): *unverified*. Map labels are `nowrap` (`RegionLabelOverlay.tsx:60`, `LocationLabelOverlay.tsx:227`). The wrap candidates (`stage/Stage.tsx:330` place tag, `HexTooltip.tsx:226`) could not be tied to the screenshot.
- **"Lirik" underlined but not clickable** (story): *unverified*. `ReadTheThreadsPanel.tsx:207,239` render names as plain spans. The underline came from another surface (probably `Tooltip.tsx:133-139` tooltip-link spans).
- **Catch-up "took 5–8 minutes"** (all): *tester-error* as a duration (measured 127 s, about 3 min wall), but filed inside THR-2173 as the stuck estimate and warm-up trend.
- **"for a fortnight" → "for a month"** (veteran): *tester-error*. It is a real threshold crossing (`purseSentences.ts:142-143`), not flicker.
- **Doom clock moving without the player** (veteran): working as built. Doom advances on its own; the confusion is covered by THR-2175.
- **Clicks swallowed by arriving moments** (story, veteran): *unverified*; evidence is on THR-2053.

## Cost and duration

About 11 min wall clock for the testers, plus ~10 min for observer verification (three parallel source searches). Notional tester cost: $11.85 ($3.86 + $4.21 + $3.78).

## Complaint classes

Updated in a docs PR on `main`: the classes covering readouts, moving targets and outcome wording are marked recurring with the round-3 tickets, and a new class covers threats with no answer (THR-2172).

## Needs Christian

None. For your information:
- For the first time, all three returning testers reached the mid-game: factions, a mortal's work and ambitions. All three called the Gallows Pardon chapter the best thing they played.
- The three biggest problems:
  - **Rival gods you can't answer.** You see their threats but can do nothing about them ([THR-2172](https://linear.app/threadbare/issue/THR-2172)).
  - **"Fated" can still fail.** A roll marked "Fated" failed and nothing said why ([THR-2171](https://linear.app/threadbare/issue/THR-2171)).
  - **Coming back recaps nothing.** Returning to the game tells you nothing about what happened while you were away ([THR-2173](https://linear.app/threadbare/issue/THR-2173)).
- The design lane picks these up. Six screen bugs are ready to build.
