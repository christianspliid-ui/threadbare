---
lane: cold-playtest
round: 3
date: 2026-10-10
briefVersion: 1
startUrl: https://threadbearer.co/
deployedCommit: d372e413
usable: 3/3
filed: 9
needsChristian: true
---

# Cold playtest — round 3 (2026-10-10)

The `tb-cold-playtest` lane ran this round on its own. All four gates were open: all 13 round-2 tickets were closed, `main` (d372e413) was live and settled, 7 days had passed since round 2, and the tester login was alive. Same brief (v1), same three personas, same start URL. Artifacts: `%USERPROFILE%\.threadbare\cold-playtest\round-3\`. The warm series was not evaluated: one round per fire, and the warm milestone is still open.

## Verdicts (round 2 → round 3)

| Persona | Would keep playing? | Met The First? | Would quit at | Never understood | Surprises | Actions | Minutes | Notional cost |
|---|---|---|---|---|---|---|---|---|
| story | maybe (leaning no) → **maybe (leaning no)** | y → **y** (Elara) | ~55 → **61**: a chapter whose choices could not be picked ([THR-1800](https://linear.app/threadbare/issue/THR-1800)) | 17 → 13 | 12 → 8 | 61 | 11 | $4.44 |
| veteran | maybe → **maybe (leaning yes)** | y → **y** (Thessa) | 63 → **none** (closest: popups covering the profile) | 12 → 12 | 9 → 7 | 71 | 14 | $4.34 |
| skimmer | maybe (leaning no) → **maybe (leaning no)** | y → **y** (Thessa) | 62 → **none tagged** (the debrief names ~minute 10, when a chapter repeated) | 16 → 13 | 10 → 11 | 52 | 9 | $3.57 |

**What changed:**
- **The veteran moved to "leaning yes"**, the first lean toward yes in three rounds: *"The depth looks real … The writing is the best I've seen in this genre."*
- **Never-understood fell** for story and skimmer (17 → 13, 16 → 13), and fell to 13/12/13 overall.
- **The round-2 wall is gone.** No tester said the game played their mortal's life without them, and no tester lost clicks to a paused world.
- **Best moment, again, 3/3:** the bonding scenes (the faith scene, the commander memory, the tannery chapter).
- **The drop moved again:** from "the game lives my mortal's life without me" to "on the main map my actions don't answer" (results out of sight, popups taking my clicks, one chapter that could not be played).

## Earlier findings

| Ticket | Status in round 3 | Note |
|---|---|---|
| [THR-1715](https://linear.app/threadbare/issue/THR-1715) game lives The First's life | **fixed-confirmed** | The First showed "Asks you". No tester reported autopilot chores, and neither round-2 quit point recurred |
| [THR-1716](https://linear.app/threadbare/issue/THR-1716) world arrives paused, no direction | **recurred** (direction half) | The press-Play wall is gone, but the post-bond dashboard still gives no next step. Filed [THR-1808](https://linear.app/threadbare/issue/THR-1808) |
| [THR-1714](https://linear.app/threadbare/issue/THR-1714) dilemmas hide the roll | **fixed-confirmed** (core) | All three read "Uncertain → Favorable"-style shifts and the HELPS/HINDERS result lines. The new gap, a miss writing the opposite trait unannounced, is in [THR-1807](https://linear.app/threadbare/issue/THR-1807) |
| [THR-1713](https://linear.app/threadbare/issue/THR-1713) can't read spend or risk | **recurred** (third round) | 3/3 again. Filed [THR-1807](https://linear.app/threadbare/issue/THR-1807) |
| [THR-1706](https://linear.app/threadbare/issue/THR-1706) essence tells three stories | **recurred** (one surface) | The authored-choice footer still sums every pool ("◆ 608 essence"). Filed [THR-1803](https://linear.app/threadbare/issue/THR-1803). "Gold costs Life" is by design (a Reach is paid by its sphere) and its legibility is in THR-1807 |
| [THR-1704](https://linear.app/threadbare/issue/THR-1704) "No Threads" after the bond | **fixed-confirmed** | For all three testers the Threads panel showed The First as soon as time ran after the bond |
| [THR-1711](https://linear.app/threadbare/issue/THR-1711) six small faults | **fixed-confirmed** (items 2, 6) | Card selection worked for everyone. Pause-through-popup holds (`useInterruptAutoPause.ts:100-115`); the veteran's "un-paused" was a misread label (see Not filed). Items 1, 3, 4 and 5: not exercised |
| [THR-1712](https://linear.app/threadbare/issue/THR-1712) Meet The First contradicts itself | **fixed-confirmed** (names) | No "Decay"/"Corrode" names and no portrait-name mismatch in the logs. The skimmer's "described as young" is unverified (see Not filed) |
| [THR-1707](https://linear.app/threadbare/issue/THR-1707) developer text in Codex / mortal panel | **fixed-confirmed** | No "Engine bridge", WIRED or "Encounter Pool / Idle reason" in any snapshot. The veteran browsed the Codex. New developer text was found in the hex panel instead ([THR-1804](https://linear.app/threadbare/issue/THR-1804) item 2) |
| [THR-1708](https://linear.app/threadbare/issue/THR-1708) "The The", "completed Observe" | **fixed-confirmed** | Neither string appears in any snapshot |
| [THR-1710](https://linear.app/threadbare/issue/THR-1710) own avatar "Unaware" | **fixed-confirmed** | "Unaware" appears in no snapshot |
| [THR-1705](https://linear.app/threadbare/issue/THR-1705) people-list click becomes cast target | **not-exercised** | |
| [THR-1709](https://linear.app/threadbare/issue/THR-1709) court screen cut off | **not-exercised** | |
| [THR-1600](https://linear.app/threadbare/issue/THR-1600) raw `{name}` | **fixed-confirmed** | The veteran opened Story so far; no `{name}` or `{cast` appears in any snapshot |
| [THR-1604](https://linear.app/threadbare/issue/THR-1604) five small faults (r1) | **partly confirmed** | Naming: all three named their god without friction. The rest: not exercised |
| Round-1 tickets fixed-confirmed in round 2 ([THR-1601](https://linear.app/threadbare/issue/THR-1601), [THR-1602](https://linear.app/threadbare/issue/THR-1602), [THR-1603](https://linear.app/threadbare/issue/THR-1603), [THR-1605](https://linear.app/threadbare/issue/THR-1605), [THR-1606](https://linear.app/threadbare/issue/THR-1606), [THR-1608](https://linear.app/threadbare/issue/THR-1608), [THR-1609](https://linear.app/threadbare/issue/THR-1609)) | **still fixed** | 3/3 met The First. No raw ids. The veteran recognised their avatar |
| Warm [THR-1791](https://linear.app/threadbare/issue/THR-1791) (open) the legend's "UNCERTAIN" pill | **hit again (cold)**, 2/3 | Evidence commented on the original, not refiled |
| Warm [THR-1792](https://linear.app/threadbare/issue/THR-1792) (In Dev) the seat is placed for you | **hit again (cold)**, 1/3 | Evidence commented on the original, not refiled |

## New findings (milestone *Cold playtest · round 3*)

| Ticket | Class | What | Personas |
|---|---|---|---|
| [THR-1800](https://linear.app/threadbare/issue/THR-1800) | bug, Urgent | A chapter with unpriced choices can't be played ("0 essence · Not enough Energy essence", dead play button). 29 encounters also point at a missing placeholder image | 1/3 (story's quit point) |
| [THR-1805](https://linear.app/threadbare/issue/THR-1805) | design | The opening gifts open on top of whatever the player just clicked | 3/3 |
| [THR-1807](https://linear.app/threadbare/issue/THR-1807) | design (recurs twice) | Terms still unreadable: sphere pour, Reaches, Doom/Omen, a miss writing the opposite trait, nameless picker portraits | 3/3 |
| [THR-1806](https://linear.app/threadbare/issue/THR-1806) | design | Main-map chapters end out of sight; the result is found only in the Chapter Ledger | 2/3 |
| [THR-1808](https://linear.app/threadbare/issue/THR-1808) | design (recurs) | After the bond about 30 panels arrive at once with no next step | 2/3 (both designer notes) |
| [THR-1802](https://linear.app/threadbare/issue/THR-1802) | bug | God's Will options never name their activity ("Assist right here" leads to "Rest and Recover") | 2/3 |
| [THR-1801](https://linear.app/threadbare/issue/THR-1801) | bug | Step 2 opens with step 1's cards pre-picked and charges for them again | 1/3 |
| [THR-1803](https://linear.app/threadbare/issue/THR-1803) | bug (recurs) | The authored-choice footer sums every essence pool ("◆ 608 essence") | 1/3 |
| [THR-1804](https://linear.app/threadbare/issue/THR-1804) | bug | Five small faults: invisible setup cards take clicks, hex-panel debug data, the bonding hand scrolls below the fold, a chapter repeats within minutes, the ▷ narration button spins silently | 1/3 each |

## Not filed

- **"Closing a popup un-paused time" (veteran): tester-error.** In every case TIME read "running ×1" *before* the popup opened (snapshots 11:44:54 → 11:45:11, 11:45:29 → 11:45:46, 11:46:03 → 11:46:18). `useInterruptAutoPause.ts:100-115` restores the state from before the popup opened. The labels "held · runs on after" and "paused · Decipher Old Markings" don't say who is holding time; that wording is folded into [THR-1807](https://linear.app/threadbare/issue/THR-1807).
- **"The Cast never resolved" (skimmer): tester-error.** Cast was disabled with "Choose a card." (`skimmer/shots/page-…11-41-13-347Z.yml:221-223`). No card was selected, so nothing was lost.
- **"The Gold path costs Life essence" (veteran, skimmer): by design.** A Reach is paid by its sphere (`premonition-constants.ts:155`, `gold: 'life'`). The card names its paying sphere honestly. Its legibility is folded into THR-1807. Not a recurrence of THR-1706, which covered the nudge stage and Meet The First.
- **"Leans Perceptive made her Judgemental" (skimmer): by design.** A miss writes the opposite pole (`meetingEncounter.ts:767-785`). That nothing says so beforehand is folded into THR-1807.
- **"Store page said turn-based, but it runs in real time" (skimmer).** This is the brief's pitch text, not the game. The brief is frozen at v1 within a run.
- **"The text called Thessa young, but the portrait is an older woman" (skimmer): unverified.** No snapshot captured the line with the portrait.
- **"No healer path for a healer" (story): not a fault.** It is a content-breadth opinion; the paths are generated from the Reaches.
- **"Escape closed the saint event and the clock kept running" (story): not verified.** The event was still reopenable from the "!" chip, so nothing was lost.

## Coverage (informational; the coverage rule binds warm rounds only)

| Persona | faction | undertaking | ambition | threadHistory |
|---|---|---|---|---|
| story | — | — | — | reached |
| veteran | — | — | — | reached |
| skimmer | — | — | — | — |

## Complaint classes

Updated in a docs PR on `main` ([Docs/ops/player-complaint-classes.md](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/ops/player-complaint-classes.md)): new evidence added to PC-1, PC-2, PC-3, PC-4, PC-5, PC-6, PC-7 and PC-8. No class is new and none retires.

## Cost and duration

3 testers in parallel, 14 min wall clock, $12.35 notional on the subscription plan. Verification used three Explore investigators (about 3–6 min each). Round-1 screenshots pruned (`keepRoundsWithScreenshots: 3`).

## Needs Christian

- **Steady progress.** All three new players again met and bonded their mortal, and all three again named those scenes the best part. For the first time one leaned toward "yes, I'd keep playing" ([report](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/cold-playtest-round-3.md)).
- **Last round's wall is gone:** nobody felt the game played their mortal's life for them.
- **The new wall is the main map.** Choices there don't answer on screen ([THR-1806](https://linear.app/threadbare/issue/THR-1806)), the opening gifts pop up over whatever the player clicked ([THR-1805](https://linear.app/threadbare/issue/THR-1805)), and one chapter could not be played at all ([THR-1800](https://linear.app/threadbare/issue/THR-1800), Urgent, ready to build).
- **9 tickets are filed** in the [round-3 group](https://linear.app/threadbare/project/onboarding-and-first-run-experience-4591bc5f51c7): 5 bugs ready to build, 4 for design. Round 4 runs on its own once they are all closed and live. Nothing here needs a decision from you.
