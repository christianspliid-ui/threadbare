---
lane: tb-design-lane
run: 2026-10-05d
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-05 (run d, ~18:15Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [Warm playtest](https://linear.app/threadbare/issue/THR-1744/warm-playtest-no-knowledge-testers-start-a-few-hundred-ticks-into-a): **new testers will now also start an hour into a running world, with The First already bonded, so someone finally plays factions, long work and ambitions.** [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-05-thr-1744-warm-playtest.md).
  - **Why it's needed:** both cold rounds stopped in the first ten minutes. In round 2, 0 of 3 testers ever opened a faction, a mortal's long work or their ambitions. All three did read their mortal's story.
  - **How they get there:** a new start link loads the usual test world and lets about three seasons pass behind a short "The world moves on" screen. That screen says: "Catching up on the seasons you were away. This takes a minute or two." It takes about a minute and a half. The First lives on by itself meanwhile. Nothing is decided for you or the tester: any choice that came up waits on return.
  - **What testers are told:** they are the same three player types, told they played the opening an hour ago and are coming back curious about who holds power, what their mortal is working towards and what happened while away. They are never told which panel to open.
  - **The pass mark:** a tester who never opens a faction, a long work or an ambition counts as a **coverage failure**, not a pass. Reading the mortal's story alone doesn't count, because cold testers already do that.
  - **When it runs:** it is part of the existing daily playtest check, at most one round a day, cold first. Findings go into their own "Warm playtest · round N" groups.
  - *The calls to veto:*
    - Say **"don't steer them"** if testers shouldn't be given the coming-back curiosity.
    - Say **"story counts"** if reading the mortal's story should count as reaching the mid-game.
    - Say **"run both the same day"** if a warm round shouldn't wait for a cold one.

  Say "veto warm playtest" to reverse it all. It can be built from about 21:15 Tuesday your time.

## Work

- **Chosen:**
  - The build shelf had 4 jobs that are not deferrals (floor 4), so it was not thin.
  - No wayfinder map is open.
  - This was the next agreed design request. You filed it today and it hands its design questions to a design session.
  - No lane decision sat underneath it.
- **Measured** on the live site and on main `c53a96c4`:
  - The live site's seeded test link lands with The First bonded. The debug bridge is absent in production, so a warm start can't come from it.
  - There is no save or load. The top speed is 20×, and The First's moments stop the clock.
  - 300 ticks headless took 93 s. The world is still playing at doom stage 1 (509 → 841 people).
  - Cold round-2 snapshot files: faction / long work / ambition reached by 0/3 testers; story reached by 3/3.
- **Gates:**
  - Intent judge rounds 1–3: **Revise** each time, and each caught a real problem:
    - Round 1: the plan reinvented the pause-suppression switch.
    - Round 2: acknowledged moments vanish from the badge, and the arrival "Press Play" line would never show.
    - Round 3: the moment list holds only 8 entries for the whole world. The beat clean-up would have made the player's choices for them, so it was dropped.
  - Intent judge round 4: **Allow**.
  - Auditors: NFP, pillars and Vision all PASS-with-notes.
- **Shipped:** [PR #2247](https://github.com/christianspliid-ui/threadbare/pull/2247), plan-doc liveness `LIVE`. The ticket moved to Ready for Dev, unassigned, with `Claimable from: 2026-10-06T19:15:00Z` in the description. The decision record and the handoff comment (with the coordination block) are posted.

## Escalations

None.
