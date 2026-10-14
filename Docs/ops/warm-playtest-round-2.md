---
lane: cold-playtest
mode: warm
round: 2
date: 2026-10-14
briefVersion: 1
warmBriefVersion: 1
warmTicks: 300
startUrl: https://threadbearer.co/?view=game&seeded&size=medium&warm=300
deployedCommit: 667869d2b2663e9cce7df194570faef260478f03
usable: 3/3
covered: 0/3
filed: 11
needsChristian: false
---

# Warm playtest — round 2 (2026-10-14)

**Fell short on coverage: 0 of 3 testers reached the mid-game (bar: 2).** For the second round running, no tester opened a faction. This time the cause is one missing wire: the links on a ruler's card are drawn as plain text ([THR-1851](https://linear.app/threadbare/issue/THR-1851)).

- Run attended on Christian's request. Gate 3 (spacing) is skipped in attended mode; gates 2 (deployed, `667869d2`) and 4 (tester login) passed, and gate 1 opened when [THR-1785](https://linear.app/threadbare/issue/THR-1785) closed this morning.
- Three cold personas (Opus testers), warm brief v1, three seasons warm-up with Kael Thornweaver already bonded.
- Artifacts: `%USERPROFILE%\.threadbare\warm-playtest\round-2\`.
- **Coverage marker corrected.** The harness first scored the veteran as covered, because `heading "Ambitions"` also matches the Codex's ambition catalogue, which is where the veteran actually was. The ambition marker is now `heading "Intent"`, which renders only in a mortal's own ambitions. Round 1 re-scores the same; round 2 re-scores 0/3. The original summary is kept as `round.json.orig`.

## Warm start

| Persona | `[warm-start] done` | advanced | ms | pending at arrival | open at arrival | opening settled |
|---|---|---|---|---|---|---|
| story | yes | 300/300 | 82 904 | 0 | JourneyVignetteModal | 4/4 |
| veteran | yes | 300/300 | 82 854 | 0 | JourneyVignetteModal | 4/4 |
| skimmer | yes | 300/300 | 83 016 | 0 | JourneyVignetteModal | 4/4 |

- ~83 s each with three running in parallel (round 1: ~105 s). Well under the 180 s kill line.
- One decision waiting at arrival, within the limit. The opening gifts were settled before arrival ([THR-1787](https://linear.app/threadbare/issue/THR-1787)), and no tester read arrival as a replayed tutorial.

## Verdicts

| Persona | Would keep playing? | Round 1 | Met The First? | Would quit at | Never understood | Surprises | Actions | Minutes | Notional cost |
|---|---|---|---|---|---|---|---|---|---|
| story | maybe (leaning no) | maybe | y (bonded at start) | near-quit at the failed Oath-Breaker's Rite: "nothing told me *why* it failed" | 16 | 11 | 53 | 13 | $3.63 |
| veteran | maybe (leaning yes) | maybe | y | soft: the second failed attempt to open the Chapter Ledger, when a queued event took the click | 11 | 7 | 57 | 13 | $3.48 |
| skimmer | maybe (leaning no) | **no** | y | ~action 33: the same "Road of Trials" question asked a second time | 9 | 10 | 56 | 12 | $3.62 |

Trend: skimmer moved from **no** to maybe, and veteran now leans yes. Every tester named an Oath-Breaker's Rite or a named reward as a high point.

**Common message to the designer:** say what my choice did.
- story: "Show me Kael's reaction every time I whisper."
- veteran: "Let me open the ledger, rivals and doom panels without a queued event hijacking the click."
- skimmer: "After every choice I make, show me one plain line saying what it changed."

## Coverage

| Persona | faction | undertaking | ambition | threadHistory | coverage failure |
|---|---|---|---|---|---|
| story | — | — | — | reached | **yes** |
| veteran | — | — | — (Codex catalogue, not Kael) | reached | **yes** |
| skimmer | — | — | — | reached | **yes** |

**Why nobody reached a faction.**
- story and veteran did what round 1's fix intended: Notables → a ruler → the ruler's card. The card's "Faction allegiances" line is plain text, because the opener behind every link on these cards is mounted only in a test. The card also has no way through to the full sheet.
- skimmer took the "Rising Faction" popup. It has one button ("Attend"), links nowhere, and named an elder-age civilisation.
- All three filed under [THR-1851](https://linear.app/threadbare/issue/THR-1851).

**Why nobody reached The Work or Ambitions.** Both live only behind "View Full Profile →". It was on screen in 38–48 snapshots per tester, and nobody pressed it. Filed as design [THR-1859](https://linear.app/threadbare/issue/THR-1859).

**Kill criterion.** The pre-committed v2 trigger (2+ coverage failures on v1) fired. The decision is filed as [THR-1861](https://linear.app/threadbare/issue/THR-1861): honour it and run v2 in round 3 alongside THR-1851.

## Earlier findings

| Ticket | Status | Note |
|---|---|---|
| [THR-1780](https://linear.app/threadbare/issue/THR-1780) who holds power is a dead end | **fixed-confirmed** (its Fixed-when) | Two testers opened a ruler from Notables. The dead end moved one step on → [THR-1851](https://linear.app/threadbare/issue/THR-1851) |
| [THR-1777](https://linear.app/threadbare/issue/THR-1777) aftermath choice does nothing | **fixed-confirmed** | skimmer: "My pick is highlighted and the other is greyed out" |
| [THR-1781](https://linear.app/threadbare/issue/THR-1781) God's Will changes nothing | **fixed-confirmed** | "compelled toward … at their next free choice", Force 35→32, and "Your will holds" toasts. The names in them recur as raw ids → [THR-1852](https://linear.app/threadbare/issue/THR-1852) |
| [THR-1778](https://linear.app/threadbare/issue/THR-1778) "Return to the world" bounces back | **fixed-confirmed** for the button | The Escape key takes the old path → [THR-1856](https://linear.app/threadbare/issue/THR-1856) |
| [THR-1782](https://linear.app/threadbare/issue/THR-1782), [THR-1786](https://linear.app/threadbare/issue/THR-1786), [THR-1787](https://linear.app/threadbare/issue/THR-1787), [THR-1788](https://linear.app/threadbare/issue/THR-1788) arrival replays the opening | **fixed-confirmed** | Four opening beats settled at arrival; no tester mentions a replay or "Beat 1" |
| [THR-1784](https://linear.app/threadbare/issue/THR-1784), [THR-1789](https://linear.app/threadbare/issue/THR-1789) outcomes can't be read | **fixed-confirmed** for the identical rows | No repeated world-standing rows quoted. The *why* of a failure is still missing → [THR-1860](https://linear.app/threadbare/issue/THR-1860) |
| [THR-1791](https://linear.app/threadbare/issue/THR-1791) one odds word | **fixed-confirmed** | One word per step. Its side effect, no movement shown inside a tier, is item 2 of [THR-1858](https://linear.app/threadbare/issue/THR-1858) |
| [THR-1783](https://linear.app/threadbare/issue/THR-1783) prices name no pool | **fixed-confirmed** | Prices name their pool. The elder pools a price drains are hidden → [THR-1858](https://linear.app/threadbare/issue/THR-1858) item 1 |
| [THR-1779](https://linear.app/threadbare/issue/THR-1779) template seams | **fixed-confirmed** for its instances | New, different seams → [THR-1857](https://linear.app/threadbare/issue/THR-1857) |
| [THR-1805](https://linear.app/threadbare/issue/THR-1805) (cold r3) gifts open over the player's click | **recurred** (3/3) | Filed as Recurs after fix → [THR-1853](https://linear.app/threadbare/issue/THR-1853) |
| [THR-1802](https://linear.app/threadbare/issue/THR-1802) (cold r3) God's Will options name what they ask | **recurred** (3/3) | The name is a raw id → [THR-1852](https://linear.app/threadbare/issue/THR-1852) |
| [THR-1792](https://linear.app/threadbare/issue/THR-1792) the god's seat is findable | **not-exercised** | No tester looked for the seat |
| [THR-1785](https://linear.app/threadbare/issue/THR-1785) warm brief v1 kill criterion | trigger fired | → [THR-1861](https://linear.app/threadbare/issue/THR-1861) |

## New findings (filed into [Warm playtest · round 2](https://linear.app/threadbare/project/thematic-pressure-and-living-world-p-thr-3))

| Ticket | Class | Testers | What |
|---|---|---|---|
| [THR-1851](https://linear.app/threadbare/issue/THR-1851) | bug · High | 3/3 | Factions are still out of reach: card links render as text (provider never mounted), no route to the full sheet, and the Rising Faction popup is a dead end naming a dead civilisation |
| [THR-1853](https://linear.app/threadbare/issue/THR-1853) | bug · High (recurs) | 3/3 | Popups steal clicks: gifts enter 2 s after input, premonitions and journey moments have no guard, and a gift opens over a live chapter step |
| [THR-1852](https://linear.app/threadbare/issue/THR-1852) | bug · High (recurs) | 3/3 | God's Will prints `encounter.town.oath_breaker_rite` and other raw ids in its options and toasts |
| [THR-1854](https://linear.app/threadbare/issue/THR-1854) | bug · High | 3/3 | Journey choices apply none of their declared effects and never show their consequence line; the same Road of Trials moment fires twice |
| [THR-1855](https://linear.app/threadbare/issue/THR-1855) | bug | 3/3 | A gift never names what it gave; two market offers share one description |
| [THR-1856](https://linear.app/threadbare/issue/THR-1856) | bug | 2/3 | Escape on an aftermath blanks and bounces; the exit, a reaction choice and a six-card hand fall below the fold |
| [THR-1857](https://linear.app/threadbare/issue/THR-1857) | bug | 1/3 quoted, 3/3 on screen | Seams: "They wants", "Kael Thornweaver work", a place called "Inn", "Wilderness (14, 14)", a `{target}` icon label |
| [THR-1858](https://linear.app/threadbare/issue/THR-1858) | bug | 1/3 each | Hidden Chaos pool drained, odds movement invisible inside a tier, a closing dropdown eats a click, a bare "Mute" chip |
| [THR-1859](https://linear.app/threadbare/issue/THR-1859) | design · High | 3/3 | The Work and Ambitions only behind "View Full Profile"; two progress words for one work; focus always at maximum zoom |
| [THR-1860](https://linear.app/threadbare/issue/THR-1860) | design | 3/3 | "At great cost" with no cost shown, the aftermath leads with stats, an unexplained Notables count, Doom wording that blames the player |
| [THR-1861](https://linear.app/threadbare/issue/THR-1861) | design (harness) | — | The v2 trigger fired; recommend running v2 in round 3 |

## Not filed

| Candidate | Class | Why |
|---|---|---|
| "The same bond listed twice" (story) | tester-error (likely) | One BOND row; the second is the legend chip "SCAR / BOND / BOON / PATH" (story `07-07-20`, l.4790 vs l.4829) |
| "The previous answer was pre-selected" on the repeated journey moment | tester-error | Keyboard autofocus on the first button, present on the first showing too. Removing it is part of THR-1854 |
| "The page didn't scroll" on the aftermath (story) | tester-error (part) | The wheel was at x=1740, outside the 65% scroll column. The below-the-fold exit itself is real → THR-1856 |
| Paid to steer Kael to "Spar with a Stranger"; he went on "Shadow in the Night" instead (skimmer) | works as built | Shadow was the choice already made when the steer was offered, then a chapter step. The steer waits for the next free choice, and the round ended first. The wording could name the wait; noted on THR-1860's theme, not filed separately |
| Mouse wheel did not zoom the map out (skimmer) | unverified | Zoom limits are correct (`D3ZoomCamera.ts:84-90`). Only one wheel reached the map, during a follow-camera move. Max-zoom focus is in THR-1859 |
| Black area left of the map (skimmer) | unverified | Fog should render as parchment; not reproduced from the artifacts |
| "The Shushia settle every quarrel" recurring across chapters (story) | design, minor | One culture line per culture × reach (`culture-sphere-lines.ts:192`). Grammar is correct. Carried as a note; file if it recurs |
| "Back on the map, still no result" after a committed step (story, skimmer) | works as built | The next step resolves on a later tick, and the aftermath did arrive in both logs. Watch it under PC-2 |
| Failures feed doom (story) | works as built | Intended (`complication-templates.ts:565-583`); its wording is in THR-1860 |

**Complaint classes:** updated. PC-3 (THR-1852, THR-1857), PC-5 (THR-1853), PC-6 (THR-1859) and PC-8 (THR-1851, THR-1854, THR-1855, THR-1856) recur with warm r2 evidence. PC-1 and PC-2 recur through THR-1858 and THR-1860. No new class; none retired.

**Best moments named:**
- story: reading "The Star Pilgrim" in the Chapter Ledger.
- veteran: stacking three cards on the Oath-Breaker's Rite and watching PERILOUS flip to FAVORABLE.
- skimmer: the Shadowweave Cloak "credited to my nudge".

## Cost and duration

$10.73 notional (subscription). 13 min wall clock, run in parallel. Verification fanned out to four read-only agents.

## Needs Christian

None. Warm round 2 ran on the live game. All three testers now say "maybe" (last time one said no), but none of them could reach a faction or Kael's own long work. Eleven fixes are queued in [Warm playtest · round 2](https://linear.app/threadbare/project/thematic-pressure-and-living-world-p-thr-3). The two that matter most are [factions are still out of reach](https://linear.app/threadbare/issue/THR-1851): one missing wire makes every link on a ruler's card dead. The other is [popups steal the player's clicks](https://linear.app/threadbare/issue/THR-1853). Warm round 3 runs once they close.
