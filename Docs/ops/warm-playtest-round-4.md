---
lane: cold-playtest
mode: warm
round: 4
date: 2026-11-14
briefVersion: 2
warmBriefVersion: 2
warmTicks: 300
startUrl: https://threadbearer.co/?view=game&seeded&size=medium&warm=300
deployedCommit: 1416a3b62c2dcbf8fa1abdb37deb3a82b4164135
usable: 3/3
covered: 3/3
filed: 9
needsChristian: false
---

# Warm playtest — round 4 (2026-11-14)

**The returning player now gets a real "while you were away", and the rival panel finally explains itself.** All three testers again came back for The First's chapters. The complaints moved on, though: Doom and the Mandate still say nothing about what the player can do, a won chapter told all three testers their cards "were on another step", and two of the three now say the chapters that play out alone are the problem, not just the missing label.

- **How it ran.** The lane ran automatically. All four warm gates were open: every round-3 build ticket was Done (the four design findings count as closed under gate 1's rule), the latest commit `1416a3b6` was deployed, round 3 was 9 days earlier, and the tester login was alive. The cold series stayed shut, because cold round 7 ran on 2026-11-12.
- **Setup.** Three cold personas (Opus testers), warm brief v2, a 300-tick warm-up, Kael Thornweaver already bonded.
- **What shipped since round 3.** Every round-3 build ([THR-2178](https://linear.app/threadbare/issue/THR-2178), [THR-2180](https://linear.app/threadbare/issue/THR-2180), [THR-2182](https://linear.app/threadbare/issue/THR-2182) to [THR-2186](https://linear.app/threadbare/issue/THR-2186)), and overnight Stay the Unmaking ([THR-2207](https://linear.app/threadbare/issue/THR-2207)), Mandate deeds ([THR-2208](https://linear.app/threadbare/issue/THR-2208)) and Rebuke ([THR-2209](https://linear.app/threadbare/issue/THR-2209)).
- **Artifacts:** `%USERPROFILE%\.threadbare\warm-playtest\round-4\`.

## Warm start

| Persona | `[warm-start] done` | advanced | ms | pending at arrival | open at arrival | recap lines |
|---|---|---|---|---|---|---|
| story | yes | 300/300 | 148 450 | 0 | JourneyVignetteModal, EventPopup | 5 |
| veteran | yes | 300/300 | 148 075 | 0 | JourneyVignetteModal, EventPopup | 5 |
| skimmer | yes | 300/300 | 149 282 | 0 | JourneyVignetteModal, EventPopup | 5 |

- **The warm-up took about 148 s, the third rise in a row** (83 → 127 → 148 s). That is still under the 180 s kill line, but round 5 should watch it.
- **Two windows were open at arrival on every tester, up from one in round 3.** No decision was pending, so this is not a pile-up under the kill criterion. Two testers say popups took their clicks; the evidence is commented on [THR-2197](https://linear.app/threadbare/issue/THR-2197) (unverified).

## Verdicts

| Persona | Would keep playing? | Round 3 | Met The First? | Would quit at | Never understood | Surprises | Actions | Minutes | Notional cost |
|---|---|---|---|---|---|---|---|---|---|
| story | maybe | maybe | y (bonded at start) | soft: a paid Read the Threads that returned a tally | 11 | 11 | 64 | 11 | $3.79 |
| veteran | maybe | maybe (leaning yes) | y | action 69: a season and a Doom stage passed unannounced; Mandate "Holding" all session | 14 | 9 | 69 | 12 | $4.18 |
| skimmer | maybe | maybe | y | ~10 min: The Gleaming Vein, the third chapter in a row with no hand | 13 | 12 | 61 | 13 | $3.77 |

**Best moments were again The First's chapters with cards in them.** Story named Flawed Steel and The Apotheosis. Skimmer named The Inheritance Wake: "Choice, consequence and my name on it, all in one place." Veteran named the Breach and Rival gods panels, the first time a tester has called a world panel the best moment.

**Common message to the designer:** let the world speak like the chapters do, and show cause and effect.
- story: "make the rest of the world (rulers, rivals, doom, 'Read the Threads') speak in the same storytelling voice instead of tallies and repeated labels."
- veteran: "Show me the number behind every result: what my Mandate is at, what my cards actually changed, and why."
- skimmer: "Put the faction story feed in the 'While you were away' recap, and let me play cards in every Kael chapter."

## Coverage

| Persona | faction | undertaking | ambition | threadHistory | coverage failure |
|---|---|---|---|---|---|
| story | — | reached | reached | reached | no |
| veteran | — | reached | reached | — | no |
| skimmer | reached | reached | — | — | no |

3/3 covered (bar: 2), the same as round 3. Only one tester opened a faction sheet this time (round 3: two). The skimmer found it "by accidentally clicking an army icon three layers deep" and called its Story tab "exactly the 'what happened while I was away' I wanted".

## Earlier findings

- **fixed-confirmed:**
  - [THR-2173](https://linear.app/threadbare/issue/THR-2173) / [THR-2184](https://linear.app/threadbare/issue/THR-2184): the "While you were away" recap. Story: "gave a great 'While you were away' summary"; the warm-up is under 180 s. The "Fixed when" is met; commented.
  - [THR-2185](https://linear.app/threadbare/issue/THR-2185): rival temper and cause. Veteran: "wrathful toward you, and cooling", "last pressed Greycity".
  - [THR-2178](https://linear.app/threadbare/issue/THR-2178): the "theirs alone" words are read correctly.
  - [THR-2180](https://linear.app/threadbare/issue/THR-2180): "even Fated can miss" is read.
  - [THR-2182](https://linear.app/threadbare/issue/THR-2182): the Dominion ladder is read from its hovers.
  - [THR-2165](https://linear.app/threadbare/issue/THR-2165), [THR-2177](https://linear.app/threadbare/issue/THR-2177), [THR-2186](https://linear.app/threadbare/issue/THR-2186): the rail name, the hand space and "See the work". Reached, no complaint.
  - [THR-2170](https://linear.app/threadbare/issue/THR-2170): no doubled cast names; the range is now named ("More than three hexes from your avatar").
- **partly met, still open (commented):**
  - [THR-2171](https://linear.app/threadbare/issue/THR-2171): Fated is still listed by story after a Fated dream failed, and the skimmer asks why to play cards on Fated.
  - [THR-2174](https://linear.app/threadbare/issue/THR-2174): the label works, but the story tester reads alone chapters as the Play promise ("stops for every moment that matters", `ui-content.ts:467`) being broken. Skimmer's worst moment.
  - [THR-2172](https://linear.app/threadbare/issue/THR-2172): no tester did anything about a rival. Rebuke ([THR-2209](https://linear.app/threadbare/issue/THR-2209)) was not found.
- **recurred:**
  - [THR-2199](https://linear.app/threadbare/issue/THR-2199) (cold r7, open): the Mandate reads "Holding" with no cause. 2/3, including the veteran's quit point. Commented.
  - [THR-2202](https://linear.app/threadbare/issue/THR-2202) (open): no tester found an answer to Doom; Stay the Unmaking was unseen. Commented.
  - [THR-2168](https://linear.app/threadbare/issue/THR-2168) → filed as [THR-2220](https://linear.app/threadbare/issue/THR-2220).
  - [THR-2166](https://linear.app/threadbare/issue/THR-2166) (camera) → filed as [THR-2221](https://linear.app/threadbare/issue/THR-2221).
  - [THR-2175](https://linear.app/threadbare/issue/THR-2175) (words, ×7) → filed as [THR-2224](https://linear.app/threadbare/issue/THR-2224).
- **possible recurrence, unverified:** [THR-2197](https://linear.app/threadbare/issue/THR-2197), popups taking clicks (2/3). Evidence commented.
- **not exercised:** [THR-2167](https://linear.app/threadbare/issue/THR-2167) (Escape/Space; one Space press, no complaint), [THR-2169](https://linear.app/threadbare/issue/THR-2169) (toast expiry), [THR-1856](https://linear.app/threadbare/issue/THR-1856), [THR-2137](https://linear.app/threadbare/issue/THR-2137), [THR-2140](https://linear.app/threadbare/issue/THR-2140).

## New findings (9 filed, milestone *Warm playtest · round 4*)

| Ticket | Class | Personas | What |
|---|---|---|---|
| [THR-2218](https://linear.app/threadbare/issue/THR-2218) | bug | 3/3 | A won chapter says "your cards were on another step": a tie between good steps names the untouched one |
| [THR-2219](https://linear.app/threadbare/issue/THR-2219) | bug | 3/3 (Doom unclear), 1/3 each part | The Doom stage popup shows only titles; the panel reads "four weeks of many weeks" |
| [THR-2217](https://linear.app/threadbare/issue/THR-2217) | bug | 3/3 | Garbled "â€"" dashes across the anomaly chapters; three lab-report lines |
| [THR-2224](https://linear.app/threadbare/issue/THR-2224) | design | 3/3 | Recurs ×7: Hooks, Signatures, Investiture, card tags, one ● for skill and odds, unseen elder pools in costs |
| [THR-2220](https://linear.app/threadbare/issue/THR-2220) | bug | 2/3 | Recurs: a no-hold dream still says "held" and "Heart grew" |
| [THR-2221](https://linear.app/threadbare/issue/THR-2221) | bug | 2/3 (pan), 3/3 (no map hover) | Recurs: the Stage pans the map to Kael on every chapter open and close |
| [THR-2222](https://linear.app/threadbare/issue/THR-2222) | bug | 2/3 | "Ended without an answer on screen" fires with the answer showing; "opens when you begin" opens nothing |
| [THR-2223](https://linear.app/threadbare/issue/THR-2223) | bug | 1/3 | A ruler's Story tab repeats one chapter; "What happened" echoes the title |
| [THR-2225](https://linear.app/threadbare/issue/THR-2225) | design | 1/3 | Read the Threads at its cheapest returns only a tally (story's worst moment) |

## Not filed

- **"Rulers · 12" but four listed** (veteran): *tester-error*. The count and the list are the same array (`NotablesPanel.tsx:174,194-195`); the other eight sit below the panel's scroll fold (`overflow-y-auto`, :191).
- **No Doom tooltip** (story, veteran): *unverified*. `DoomBar.tsx:89-93` has a `ui.doom_bar` tooltip with a 200 ms dwell. The Playwright move-then-screenshot may not have dwelt, but the veteran waited and still saw none.
- **No hover tooltip on hexes** (3/3): partly explained by the camera pans in THR-2221. The tooltip needs a 1 s dwell and an `onMouseMove` (`HexRaycaster.ts:17`, `HexMapV2.tsx:2178-2185`). Not filed separately.
- **A season and a Doom stage passed in ~10 s with no announcement** (veteran, story): *unverified* as a defect. The story tester did get the stage popup. Commented on [THR-2202](https://linear.app/threadbare/issue/THR-2202).
- **Elder pools appear only at the end** (story, skimmer): as built (THR-1986), filed inside THR-2224 as the cost-before-pool gap.
- **"Touched … a little cheaper", by how much?** (veteran): as built. Words, never numerals (Law IV).
- **Rival toasts name places never seen on the map** (skimmer): *unverified*; noted on [THR-2172](https://linear.app/threadbare/issue/THR-2172).
- **Picked one card reward, got two** (skimmer); **Kael won but reputation ▼▼** (skimmer); **Hawkgate "Held" in the recap but "Touched" on the faction** (skimmer); **a closed side panel kept coming back** (story): *unverified*. Each was one tester, with no screenshot tie-down this run.

## Cost and duration

About 13 min wall clock for the testers, plus ~15 min of observer verification (two parallel source searches plus direct reads). Notional tester cost: $11.74 ($3.79 + $4.18 + $3.77).

## Complaint classes

Updated in a docs PR on `main`.
- **PC-1:** [THR-2224](https://linear.app/threadbare/issue/THR-2224), recurring an eighth time.
- **PC-2:** [THR-2218](https://linear.app/threadbare/issue/THR-2218), [THR-2219](https://linear.app/threadbare/issue/THR-2219).
- **PC-3:** [THR-2217](https://linear.app/threadbare/issue/THR-2217).
- **PC-4:** [THR-2221](https://linear.app/threadbare/issue/THR-2221).
- **PC-5:** [THR-2223](https://linear.app/threadbare/issue/THR-2223).
- **PC-6:** [THR-2220](https://linear.app/threadbare/issue/THR-2220).
- **PC-7:** comment evidence only (Doom and the Mandate on [THR-2202](https://linear.app/threadbare/issue/THR-2202) and [THR-2199](https://linear.app/threadbare/issue/THR-2199)).
- **PC-8:** [THR-2222](https://linear.app/threadbare/issue/THR-2222), [THR-2225](https://linear.app/threadbare/issue/THR-2225).
- **PC-9:** [THR-2185](https://linear.app/threadbare/issue/THR-2185) is marked fixed-confirmed for cause and place, but the class stays open because no tester answered a rival.

## Needs Christian

None. For your information:
- Coming back now works. The returning screen tells the story of what happened while you were away, and one tester called it great ([THR-2173](https://linear.app/threadbare/issue/THR-2173)). All three still came back for Kael's chapters and would keep playing only "maybe".
- **The two big clocks still don't explain themselves.** No tester could say what Doom does or what fills the Mandate, and nobody found the new cards that answer them ([THR-2202](https://linear.app/threadbare/issue/THR-2202), [THR-2199](https://linear.app/threadbare/issue/THR-2199)).
- **Winning chapters tell you your cards didn't count.** All three testers won a chapter and were told their cards "were on another step" ([THR-2218](https://linear.app/threadbare/issue/THR-2218)).
- **Chapters that play out alone are now the complaint.** Two of three testers want a hand in every Kael chapter, not just a label saying which ones they get ([THR-2174](https://linear.app/threadbare/issue/THR-2174)).
- Seven screen bugs are ready to build; the design lane picks up the two design findings.
