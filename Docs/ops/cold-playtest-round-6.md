---
lane: cold-playtest
round: 6
date: 2026-11-02
briefVersion: 1
startUrl: https://threadbearer.co/
deployedCommit: 339548a6
usable: 3/3
filed: 9
needsChristian: true
---

# Cold playtest — round 6 (2026-11-02)

The `tb-cold-playtest` lane ran this round on its own. All four gates were open:
- all 11 round-5 tickets were closed;
- `main` was live (`check:deploy` said `skipped`: the commits since the last game publish, 93ecdca4, were docs), and the newest close was 2026-10-27;
- 7 days had passed since round 5 (2026-10-26T09:49Z to 2026-11-02T09:50Z);
- the tester login was alive.

Same brief (v1), same three personas, same start URL. Artifacts: `%USERPROFILE%\.threadbare\cold-playtest\round-6\`. The warm series was not evaluated, because only one round runs per fire. (Warm round 2 still has open issues, 86.67% done, open 19 days, under the 21-day stale bar.)

## Verdicts (round 5 → round 6)

| Persona | Would keep playing? | Met The First? | Would quit at | Never understood | Surprises | Actions | Minutes | Notional cost |
|---|---|---|---|---|---|---|---|---|
| story | maybe (leaning no) → **maybe (leaning no)** | y → **y** (Elara) | 66 → **end of run**: Agent Thread "can't touch" anyone, and a search for another mortal finds nothing: "one follower, a goal to gather more, and no idea how" ([THR-2137](https://linear.app/threadbare/issue/THR-2137), [THR-2138](https://linear.app/threadbare/issue/THR-2138)) | 15 → 14 | 9 → 7 | 56 | 8 | $3.80 |
| veteran | maybe (leaning yes) → **maybe** | y → **y** (Elara) | 64 (soft) → **none written; soft at Elara's sheet**: "Reputation ▲▲▲ great against 'no one has spoken of her reputation'" ([THR-2139](https://linear.app/threadbare/issue/THR-2139), [THR-2143](https://linear.app/threadbare/issue/THR-2143)) | 12 → 11 | 9 → 8 | 53 | 8 | $3.86 |
| skimmer | no → **no** | y → **y** (Baldur) | 57 → **about minute 7**: chapters closed without a visible result, an Aftermath said he lost and "Passed", and Agent Thread had no target ([THR-2136](https://linear.app/threadbare/issue/THR-2136), [THR-2139](https://linear.app/threadbare/issue/THR-2139), [THR-2140](https://linear.app/threadbare/issue/THR-2140)) | 12 → 12 | 9 → 9 | 53 | 8 | $3.73 |

**What changed:**
- **The opening still holds, five rounds running.** All three bonded a mortal. All three named the opening as the best moment. Story: the bond line *"Elara straightens up and says yes before you have asked anything"*. Veteran: the binding scene remembered a blackmail from an earlier moment. Skimmer: watching the odds word climb from Perilous to Favorable.
- **Round 5's map faults are gone.** No tester reported the map drifting off-screen, popups landing on their click, the First's sheet denying the bond, or a chapter recorded as "Unknown".
- **The wall is now "what next?".** The god's hunger is "Gather followers", but Agent Thread finds no one (a real bug: townsfolk never enter the map's people index) and nothing says how to reach a second mortal. That is the story tester's quit point and the skimmer's last straw.
- **Chapters still end without a visible result** on the running clock, 3/3, a third round in a row. THR-2052 moved the answer to the next step's opening line and to a late Aftermath. Players read the close itself as "nothing happened."
- **The systems player stopped trusting the numbers.** The Aftermath and the sheet disagree about reputation, skill gains and leans.

## Earlier findings

| Ticket | Status in round 6 | Note |
|---|---|---|
| [THR-2052](https://linear.app/threadbare/issue/THR-2052) chapter ends with no answer on a running clock | **recurred** (3/3) | The step-2 "Step 1 held. You: …" line works as built; the result card stays off on a running clock (`CHAPTER_ANSWER_CARD_ON_RUNNING_CLOCK = false`), and the last Aftermath waits about 20 s behind other arrivals. Filed [THR-2136](https://linear.app/threadbare/issue/THR-2136) (design) |
| [THR-2053](https://linear.app/threadbare/issue/THR-2053) world-opened chapters land on the player's click | **fixed-confirmed** for chapters | No tester named a chapter opening over a click. The skimmer said "twice my click on a card was swallowed by a new popup" with no step named: unverified (six surface kinds still lack the arrival flag, see Not filed) |
| [THR-2054](https://linear.app/threadbare/issue/THR-2054) The First's sheet denies the bond | **fixed-confirmed** | No "No thread connects you"; Agent Thread is no longer offered on The First |
| [THR-2055](https://linear.app/threadbare/issue/THR-2055) "Unknown — Resolved successfully", names twice in the dormant court | **fixed-confirmed** | The story tester's dormant court listed no duplicates. A different double (two-step chapters listed twice in the sheet's story) is new: [THR-2139](https://linear.app/threadbare/issue/THR-2139) item 5 |
| [THR-2056](https://linear.app/threadbare/issue/THR-2056) the map drifts to the right edge | **fixed-confirmed** | Nobody reported it. "The camera kept moving" traces to the clock running while a card is armed: [THR-2141](https://linear.app/threadbare/issue/THR-2141) |
| [THR-2057](https://linear.app/threadbare/issue/THR-2057) six small faults | **fixed-confirmed** | No "Veil calls", no "they" in the bond scene, no crushed footer, no eaten close click, no "Intimidated", no seat complaint |
| [THR-2058](https://linear.app/threadbare/issue/THR-2058) / [THR-2061](https://linear.app/threadbare/issue/THR-2061) can't read spend or risk | **recurred** on pools and upkeep (3/3, sixth round) | Attention and the map tabs: nobody named them (fixed-confirmed). Filed [THR-2143](https://linear.app/threadbare/issue/THR-2143) |
| [THR-2060](https://linear.app/threadbare/issue/THR-2060) one arrival per chapter after the bond | **not-exercised** | Every run ended at about minute 8; the round-5 wall was at minute 10 |
| [THR-2059](https://linear.app/threadbare/issue/THR-2059) / [THR-2068](https://linear.app/threadbare/issue/THR-2068) the path steers what comes next | **recurred** in a new form (2/3) | The ×1.5 lean is applied, but by skill only: "torch of the uprising" pulls an iron scene, which was joining the city guard. Filed [THR-2144](https://linear.app/threadbare/issue/THR-2144) |
| [THR-1981](https://linear.app/threadbare/issue/THR-1981) / [THR-1987](https://linear.app/threadbare/issue/THR-1987) / [THR-1989](https://linear.app/threadbare/issue/THR-1989) blind picks, long setup | **still fixed** (picks); setup length carried forward | Portraits named. The veteran called setup "roughly 15 clicks of unskippable fade-in"; the moving-on cue and the black second are in [THR-2142](https://linear.app/threadbare/issue/THR-2142) items 1-2 |
| [THR-1978](https://linear.app/threadbare/issue/THR-1978) Advanced World Setup has no First | **not-exercised** | All three took New World |
| Round 1-4 tickets ([THR-1601](https://linear.app/threadbare/issue/THR-1601) … [THR-1993](https://linear.app/threadbare/issue/THR-1993)) | **still fixed** | 3/3 met The First; no raw ids or developer text; no autopilot |
| [THR-1802](https://linear.app/threadbare/issue/THR-1802), [THR-1705](https://linear.app/threadbare/issue/THR-1705), [THR-1709](https://linear.app/threadbare/issue/THR-1709) | **not-exercised** | |

## New findings (milestone *Cold playtest · round 6*)

| Ticket | Class | What | Personas |
|---|---|---|---|
| [THR-2136](https://linear.app/threadbare/issue/THR-2136) | design, High (recurs THR-2052) | On a running clock a chapter step closes with no result on screen; the answer shows only at the next step's top or in a late Aftermath | 3/3 |
| [THR-2137](https://linear.app/threadbare/issue/THR-2137) | bug, High | Agent Thread finds no one: the hex people index reads only `properties.locationId`, and townsfolk carry only a `located_at` edge, so they are never targets | 2/3 (story's quit point, skimmer's last straw) |
| [THR-2138](https://linear.app/threadbare/issue/THR-2138) | design, High | After the first follower there is no way forward: "Gather" counts no followers, nothing names the next step, "Dormant court" lists strangers | 3/3 |
| [THR-2139](https://linear.app/threadbare/issue/THR-2139) | bug, High | The Aftermath and the sheet disagree: reputation gate mismatch, "Passed" on a lost guard trial, "at a price" with no price, "faced it alone" after the god paid, two-step chapters listed twice | 2/3 (veteran's worst moment) |
| [THR-2140](https://linear.app/threadbare/issue/THR-2140) | bug, High | Chapter screen: authored-choice Play below the fold at 1920×1080, a second click clears the choice, a step with no hand stops the world for "Nothing here answers to you" | 1/3 (skimmer's worst moment) |
| [THR-2141](https://linear.app/threadbare/issue/THR-2141) | bug | An armed card does not hold the clock, so targets walk away; the right rail reflows every tick, so tab clicks miss | 3/3 |
| [THR-2142](https://linear.app/threadbare/issue/THR-2142) | bug | Six small faults: setup "Choose again" with no moving-on cue, a black second, "What she is to him", Observe vs Piercing Gaze, "Available: 609" counting hidden pools, a Needs-you pill with nothing waiting | 1-3/3 each |
| [THR-2143](https://linear.app/threadbare/issue/THR-2143) | design, High (recurs THR-2058, sixth round) | Upkeep, refill and the cap have no numbers; a ▲▲ gain never changes the sheet word; a lean never shows on the sheet; grey Fated reads as disabled | 3/3 |
| [THR-2144](https://linear.app/threadbare/issue/THR-2144) | design (recurs THR-2059) | The path steers by skill, not story: an uprising path pulls "join the guard", an honest reader of secrets goes grave-robbing | 2/3 |

## Not filed

- **"The camera re-centred on Baldur" (skimmer, story): misattributed, filed under its real cause.** Map follow mode is never switched on (`setFollowAgent`, `HexMapV2.tsx:877`, has no caller). What moved was time: an armed card does not pause the clock ([THR-2141](https://linear.app/threadbare/issue/THR-2141)).
- **"A blank panel for about 6 seconds" (skimmer): as built, mostly tester timing.** The veil's entrance fade is about 2.5 s (`ENTRANCE_DELAYS`, `EncounterVeil.tsx:580-590`). The page snapshot at `…09-56-23.3` already held all the prose. The 6 s was the gap between screenshots.
- **"Twice my click on a card was swallowed by a new popup" (skimmer): unverified.** No step was named; nearby clicks came in quick pairs during the meeting. There is a real gap: ascendant-beat, choice-set, emergence-dilemma, divine-receipt, threading-rite and meet-the-first have no `arrival` flag (`homed-surfaces.ts:65-87`), and the quiet window starts only at a pointerdown. Carried forward; file it if a round names the surface.
- **"Seren isn't on the map" (story): as built.** Candidates not picked never enter the world (`meetingEncounter.ts:1186`). The direction ("say at the pick that the other two walk away") is in [THR-2138](https://linear.app/threadbare/issue/THR-2138).
- **"Gold grew ▲▲ while the work on Gold failed" (skimmer): as built.** Growth runs on a failed step (`unifiedActionResolution.ts:2462-2473`), and same-reach rows fold (THR-1467). The "alone" half is filed ([THR-2139](https://linear.app/threadbare/issue/THR-2139) item 4).
- **"Reaching Fated was very cheap" (story): opinion.** Logged for the tuning pass.
- **"Fated is grey" (veteran):** Christian's ruling (THR-1724). Folded into [THR-2143](https://linear.app/threadbare/issue/THR-2143) as a tooltip direction, not a colour change.
- **"The store page promised whisper, nudge, dream" (story):** the brief's frozen pitch (v1). Not the game.

## Coverage (informational; the coverage rule binds warm rounds only)

| Persona | faction | undertaking | ambition | threadHistory |
|---|---|---|---|---|
| story | — | — | — | — |
| veteran | — | — | — | — |
| skimmer | — | — | — | — |

## Complaint classes

Updated in a docs PR on `main` ([Docs/ops/player-complaint-classes.md](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/ops/player-complaint-classes.md)): new evidence for PC-1, PC-2, PC-3, PC-4, PC-5, PC-6, PC-7 and PC-8. No class is new and none retires.

## Cost and duration

3 testers in parallel, 9 min wall clock, $11.39 notional on the subscription plan. Verification used four Explore investigators (about 4-8 min each). Round-3 screenshots pruned (`keepRoundsWithScreenshots: 3`).

## Needs Christian

- **The opening holds for the fifth round, and round 5's map faults are gone.** All three new players bonded a mortal and loved those first scenes. Nobody saw the map drift, popups steal clicks, or The First's page deny the bond ([report](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/cold-playtest-round-6.md)).
- **The new wall is "what do I do next?".** The god's goal says "gather followers", but the card for it finds no one. That is a bug: ordinary townsfolk are missing from the map's list of people ([THR-2137](https://linear.app/threadbare/issue/THR-2137), ready to build). Nothing tells the player how to reach a second mortal either ([THR-2138](https://linear.app/threadbare/issue/THR-2138), for design).
- **Chapters still seem to end with nothing happening** while time runs, 3/3, a third round in a row. The result now arrives a step later or about 20 seconds later, and players miss it ([THR-2136](https://linear.app/threadbare/issue/THR-2136), for design).
- **The results screen and the mortal's page disagree** (reputation rose but "no one has spoken of it"; "lost" next to "Passed"), and that is where the strategy player stopped trusting the numbers ([THR-2139](https://linear.app/threadbare/issue/THR-2139), ready to build).
- **9 tickets are filed** in the [round-6 group](https://linear.app/threadbare/project/onboarding-and-first-run-experience-4591bc5f51c7): 5 bugs ready to build and 4 for design. Round 7 runs on its own once they are all closed and live. Nothing here needs a decision from you.
