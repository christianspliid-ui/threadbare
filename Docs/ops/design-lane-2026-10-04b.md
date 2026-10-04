---
lane: tb-design-lane
run: 2026-10-04b
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-04 (run b, ~06:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [The world arrives paused with no direction](https://linear.app/threadbare/issue/THR-1716/the-world-arrives-paused-with-no-direction-after-ascend-nothing-says): **after Ascend, "Reach Down" is on screen before you touch the map.** Five calls, each in [the plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-04-thr-1716-arrival-first-beat.md):
  - **The opening beat is there at once.** It was always due on the first turn. Nothing offered it until a turn passed, and the world arrives paused. It now opens on arrival, without its "click to enter" banner.
  - **The world still arrives paused (your Stellaris ruling).** The first time time moves is the bond's own button, *"Let them walk."* Pressing it starts the world. After that, the clock goes back to however you left it, as now.
  - **A quiet Play prompt** appears only if time has never run and nothing is open: a soft pulse and *"Time is still. Press Play or Space to let the world move."* It goes away for good after the first run.
  - **All four picture screens stay; one click chooses.** The zoom-then-confirm double click is gone. The chosen picture still gets its large view. The two screens that move on by themselves show "Choose again" for a moment first.
  - *The call to veto:* if you would rather the world start on its own after the bond, say so and the bond resumes time every time.

  Say "veto arrival" to reverse any of it. It can be built from about 08:45 Monday your time.

## Work

- **Chosen:**
  - The build shelf held 4 jobs that are not deferrals, so a plan doc was not urgent.
  - No wayfinder map is open.
  - This was the oldest undesigned cold-playtest ticket whose design rests on no decision of mine still inside its veto window. It covers the half of the opening *before* the bond, so it does not build on [The First asks](https://linear.app/threadbare/issue/THR-1715/after-the-bond-the-game-lives-the-firsts-life-without-the-player-her).
  - [The player can't read what they spend or risk](https://linear.app/threadbare/issue/THR-1713/recurs-after-fix-the-player-cant-read-what-they-spend-or-risk-round-2) is higher priority but was skipped. Its forecast words and dilemma colours depend on [Show the roll](https://linear.app/threadbare/issue/THR-1714/dilemmas-hide-the-roll-the-players-whisper-is-a-weight-not-a-choice), which is still in its veto window.
- **Measured before deciding:**
  - The opening beat is authored as due on turn 0 (`SPINE_TRIGGER_TURNS = [0, 2, 4, 6, 8]`).
  - The code that offers beats has exactly one caller: the per-turn loop (`orchestrator.ts:2975`).
  - The clock starts paused (`useSimulation.ts:89`).
  - So a paused arrival offers nothing, and the meeting waits behind it.
- **Gates:**
  - The intent judge first returned **Revise**: the trace types file has 148 importers and the plan had no blast-radius section. That was fixed, and the second pass returned **Allow**.
  - All three auditors (NFP, three-pillar, Vision) returned **pass-with-notes**. Their notes were applied.
- **Merged:** [the plan doc via PR #2212](https://github.com/christianspliid-ui/threadbare/pull/2212), with its [brainstorm companion](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-04-thr-1716-arrival-first-beat-brainstorm.md).
- **Handed off:**
  - [The world arrives paused with no direction](https://linear.app/threadbare/issue/THR-1716/the-world-arrives-paused-with-no-direction-after-ascend-nothing-says) is in Ready for Dev, with `Claimable from: 2026-10-05T06:45:00Z`.
  - It cannot be built at the same time as [The First asks](https://linear.app/threadbare/issue/THR-1715/after-the-bond-the-game-lives-the-firsts-life-without-the-player-her), because both edit the main game view.
- **Process slip, corrected:** the first push used a branch name that contained the ticket id, which the plan-doc rule forbids. I re-pushed under an id-free name and deleted the old branch before opening the PR.

## Escalations

- None.
