---
lane: cold-playtest
mode: warm
round: 1
date: 2026-10-08
briefVersion: 1
warmBriefVersion: 1
warmTicks: 300
startUrl: https://threadbearer.co/?view=game&seeded&size=medium&warm=300
deployedCommit: b20e5003111298fb35e3d4a121f33e7fa9aeeb77
usable: 3/3
covered: 1/3
filed: 9
needsChristian: false
---

# Warm playtest — round 1 (2026-10-08)

**Fell short on coverage: 1 of 3 testers reached the mid-game (bar: 2).**

This is the first warm round. It was run attended by [THR-1744](https://linear.app/threadbare/issue/THR-1744)'s executor, which skips gates 1 and 3, straight after a [dry run](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/warm-playtest-round-1-dry-run.md) on the same build.
- The three cold personas (Opus testers) start at the warm link.
- The game lets three seasons pass behind "The world moves on" with Kael Thornweaver already bonded, then hands over.
- Brief: warm v1, "you played the opening an hour ago and are coming back".
- Artifacts: `%USERPROFILE%\.threadbare\warm-playtest\round-1\`.

## Warm start

| Persona | `[warm-start] done` | advanced | ms | pending at arrival | open at arrival |
|---|---|---|---|---|---|
| story | yes | 300/300 | 105 329 | 0 | JourneyVignetteModal |
| veteran | yes | 300/300 | 104 962 | 0 | JourneyVignetteModal |
| skimmer | yes | 300/300 | 105 592 | 0 | JourneyVignetteModal |

- **Timing.** Three warm-ups ran in parallel at ~105 s each. A single live warm-up took 74 s. All are under the 180 s kill line.
- **Arrival.** Each tester found one decision waiting, within `WARM_START_MAX_ARRIVAL_DECISIONS` (1). Two more opened one after another behind it: the First Thread opener, then the doom-stage notice. This is not a pile-up, since only one is ever on screen, but testers read the sequence as a replayed tutorial ([THR-1782](https://linear.app/threadbare/issue/THR-1782)).

## Verdicts

There is no earlier warm round, so the dry run is shown for reference.

| Persona | Would keep playing? | Dry run | Met The First? | Would quit at | Never understood | Surprises | Actions | Minutes | Notional cost |
|---|---|---|---|---|---|---|---|---|---|
| story | maybe | maybe (leaning no) | y (bonded at start) | ~action 20 (debrief: Mind 0 locked every power, and the ruler lists wouldn't open) | 13 | 9 | 53 | 13 | $3.19 |
| veteran | maybe | maybe | y | soft: the third "Stay silent" caravan step | 14 | 8 | 70 | 12 | $3.97 |
| skimmer | **no** | maybe (leaning no) | y | ~10 min: the Duel they paid for turned into "Gather Firewood" | 14 | 9 | 55 | 11 | $3.28 |

**Common message to the designer:** show what my click, my essence and my choice did.
- story: "make every choice show a clear result".
- veteran: "Show me where my Mind essence comes from and where it goes."
- skimmer: "show me right away what my nudge caused."

## Coverage

| Persona | faction | undertaking | ambition | threadHistory | coverage failure |
|---|---|---|---|---|---|
| story | — | — | — | reached | **yes** |
| veteran | — | reached-empty | reached | reached | no |
| skimmer | — | — | — | reached | **yes** |

- **No tester opened a faction**, in the dry run or in round 1. Every tester set out to "find out who holds power", tried the Notables and Rivals lists, and hit rows that open nothing ([THR-1780](https://linear.app/threadbare/issue/THR-1780)).
- **Kill criterion.** Two coverage failures on brief v1, twice running, trips it ("bump `warmBriefVersion`, never the bar"). It is filed as [THR-1785](https://linear.app/threadbare/issue/THR-1785). The recommendation is to hold v1 until THR-1780 and THR-1781 ship, so round 2 measures the fixes and not a new brief.

## Earlier findings

Warm round 1 has no warm predecessor. These are the cold-playtest tickets whose surfaces the warm testers reached. All are closed.

| Ticket | Status | Note |
|---|---|---|
| [THR-1713](https://linear.app/threadbare/issue/THR-1713) / [THR-1607](https://linear.app/threadbare/issue/THR-1607) can't read what they spend or risk | **recurred** | Hit again on the outcome surfaces → [THR-1784](https://linear.app/threadbare/issue/THR-1784) (Recurs after fix, twice) and [THR-1783](https://linear.app/threadbare/issue/THR-1783) item 1 |
| [THR-1706](https://linear.app/threadbare/issue/THR-1706) essence tells three stories | **recurred** (missed site) | God's Will prices name no pool → [THR-1783](https://linear.app/threadbare/issue/THR-1783) |
| [THR-1708](https://linear.app/threadbare/issue/THR-1708) / [THR-1602](https://linear.app/threadbare/issue/THR-1602) template seams | **recurred** | Chapter archive, work names, ambitions → [THR-1779](https://linear.app/threadbare/issue/THR-1779) |
| [THR-1604](https://linear.app/threadbare/issue/THR-1604) Rivals/Notables labels unclickable | **fixed-confirmed** (top-bar labels open their panels) | The rows inside the panels are dead → [THR-1780](https://linear.app/threadbare/issue/THR-1780) |
| [THR-1715](https://linear.app/threadbare/issue/THR-1715) the game lives The First's life without the player | **fixed-confirmed** for the default ("Asks you" restored after the warm-up) | The toggle reads as a label → [THR-1783](https://linear.app/threadbare/issue/THR-1783) item 2 |
| [THR-1716](https://linear.app/threadbare/issue/THR-1716) world arrives paused with no direction | **fixed-confirmed** | "Time is still. Press Play or Space…" showed at arrival; every tester started the clock |
| [THR-1711](https://linear.app/threadbare/issue/THR-1711) Escape / pause faults | **fixed-confirmed** | Escape closed Notables for the veteran. The dry run's skimmer could not close it; not reproduced this round |
| [THR-1605](https://linear.app/threadbare/issue/THR-1605), [THR-1704](https://linear.app/threadbare/issue/THR-1704), [THR-1712](https://linear.app/threadbare/issue/THR-1712) and the other round-1/2 tickets | **not-exercised** | A warm start skips the meeting and the bond |

The open divine-economy ticket [THR-1747](https://linear.app/threadbare/issue/THR-1747) got the round's Mind-at-0 evidence as a comment (3/3, the top "worst moment"). It was not re-filed.

## New findings (filed into [Warm playtest · round 1](https://linear.app/threadbare/project/thematic-pressure-and-living-world-p-thr-3))

| Ticket | Class | Testers | What |
|---|---|---|---|
| [THR-1781](https://linear.app/threadbare/issue/THR-1781) | bug · High | 3/3 | God's Will takes the essence and changes nothing. Whisper influences are never read, a paid compulsion lapses after 3 ticks mid-chapter, and the result message is discarded |
| [THR-1777](https://linear.app/threadbare/issue/THR-1777) | bug · High | 2/3 (dry 3/3) | An aftermath choice does nothing. The reaction resolves against The First's oldest pending aftermath, and the failure is silent |
| [THR-1780](https://linear.app/threadbare/issue/THR-1780) | bug | 3/3 | Who holds power is a dead end. The Notables badge and list count different sets, a ruler is listed twice, and no name opens |
| [THR-1778](https://linear.app/threadbare/issue/THR-1778) | bug | 3/3 | "Return to the world" bounces back. Acknowledge leaves the chapter's step notification behind |
| [THR-1779](https://linear.app/threadbare/issue/THR-1779) | bug (recurs) | 1/3 (dry 1/3) | Template seams: an empty `{cast:heir}`, raw tokens in the Chapter Ledger, "Quarter of Quarter of", he/she flips |
| [THR-1783](https://linear.app/threadbare/issue/THR-1783) | bug | 3/3 | "3 essence" names no pool, and "Asks you / Lives on" looks like a label |
| [THR-1782](https://linear.app/threadbare/issue/THR-1782) | design | 3/3 | Arrival replays the opening ("The First Thread", "Beat 1 — Call") |
| [THR-1784](https://linear.app/threadbare/issue/THR-1784) | design (recurs ×2) | 3/3 | Outcomes can't be read: six identical world-standing rows, ▲ without a scale, three odds words, and a seat shown nowhere |
| [THR-1785](https://linear.app/threadbare/issue/THR-1785) | design (harness) | — | Warm brief v1 tripped its kill criterion |

## Not filed

| Candidate | Class | Why |
|---|---|---|
| Mind at 0, every power locked (3/3) | open ticket | [THR-1747](https://linear.app/threadbare/issue/THR-1747) is open; evidence commented there |
| "Takes a minute or two" took ~4 minutes (veteran) | tester-error | The live done line measured 105 s under three-way load and 74 s alone. The tester counted page load, the overlay and the decisions that followed |
| "Clicking Chapter Ledger opened Kael's current chapter" (story) | unverified | A held chapter step opened over the ledger at that moment (PC-5 territory). Not reproduced from the log alone |
| "Open HER sheet" on a place card (story) | unverified | No matching copy found in the place card. The tester may have misread the hover target |
| Laggy, wrong-target tooltips (veteran) | unverified | Plausibly the tooltip delay plus a moving camera. No cause located |
| Journey tab "Nothing yet worth the telling" next to 61 ledger chapters | dry run only | The arc strip reads `getAgentArc`, not the chapter archive (`JourneyTab.tsx` ~177). No round-1 tester hit it; carried to round 2 |
| Seasons passing fast (Winter → Spring yr 2 in ~15 s, skimmer) | tester-error | 1× speed with the clock running; working as built |

**Complaint classes:** updated. PC-1, PC-3, PC-4 and PC-6 are recurring with warm r1 evidence. **New PC-8 "The player acts and nothing answers"** (THR-1777, THR-1781, THR-1778, THR-1780). The change lands on `main` with THR-1744's closeout PR.

**Best moments named:** the Silent Chamber's aftermath and its choice (story), the Captain's dated "Arc so far" reached through Kael's profile (veteran), and the Doom panel's plain "chapter 2 of 5" (skimmer).

## Cost and duration

$10.44 notional (subscription). 13 min wall clock, run in parallel. Dry run: $11.05 and 17 min.

## Needs Christian

None. Nine fixes are queued in [Warm playtest · round 1](https://linear.app/threadbare/project/thematic-pressure-and-living-world-p-thr-3). The two that matter most are [paid nudges that change nothing](https://linear.app/threadbare/issue/THR-1781) and [chapter choices that ignore the click](https://linear.app/threadbare/issue/THR-1777). Warm round 2 runs automatically once they close.
