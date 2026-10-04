---
lane: tb-design-lane
run: 2026-10-04d
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-04 (run d, ~18:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [A minimised encounter step plays out on its own](https://linear.app/threadbare/issue/THR-1730/a-minimised-encounter-step-plays-out-on-its-own-once-time-runs-should): **a moment you set down waits for you, however long the world runs.** [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-04-thr-1730-minimised-step-waits.md).
  - **Today:** press Escape or "Show on map", then Play, and the encounter finishes without you within seconds, as if you had chosen "Let fate decide". Your layout pass said the empty-hand commit is *the one* deliberate way to let fate decide, so this was a second, accidental way.
  - **After the fix:** the mortal stands still in that moment while everyone else's time runs on. Their badge reads "waiting for you". Open it to play your hand, or let fate decide. Switching their thread to **Lives on** also lets the moment go, because that toggle means they live without you.
  - **No time limit.** The moment never plays out by itself, and it never pops back up to nag you.
  - *The call to veto:* if you meant minimise as "I'll come back if I can, otherwise let it play out", say so. That is a one-line switch.

  Say "veto set-down waits" to reverse it. It can be built from about 20:40 Monday your time.

## Work

- **Chosen:**
  - The build shelf had 3 jobs that are not deferrals (floor 4), so a plan doc was due.
  - No wayfinder map is open.
  - [The player can't read what they spend or risk](https://linear.app/threadbare/issue/THR-1713/recurs-after-fix-the-player-cant-read-what-they-spend-or-risk-round-2) is higher priority but was skipped. It builds on [Show the roll](https://linear.app/threadbare/issue/THR-1714/dilemmas-hide-the-roll-the-players-whisper-is-a-weight-not-a-choice), still inside its veto window when this run started (~18:45Z).
  - This ticket builds on [The First asks](https://linear.app/threadbare/issue/THR-1715/after-the-bond-the-game-lives-the-firsts-life-without-the-player-her), whose window closed at 12:53Z and which has shipped.
- **Reproduced on the live site** ([Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge), main `288083e6`):
  - Pressing Escape left the badge reading "The Unsafe Bridge, step 1 — open encounter".
  - After Play and 12 seconds, it read "The Unsafe Bridge concluded — open aftermath", with no player input.
- **Measured in source:**
  - Minimise is held only in a screen-side list; nothing in the game state records it.
  - The engine advances every unfinished encounter step every turn, with no exception (`unifiedActionLifecycle.ts:129-135`).
- **Gates:**
  - The intent judge returned **Allow**, with two small gaps (a trace-registration file and a read site for the cap constant). Both were fixed before commit.
  - The NFP auditor returned **pass-with-notes**, the three-pillar auditor **pass**, and the Vision auditor **pass-with-notes** (a missing Vision citation, now added).
  - `npm run gate` and `gate --final` both passed (docs only).
- **Merged:** [the plan doc via PR #2228](https://github.com/christianspliid-ui/threadbare/pull/2228), with its [brainstorm companion](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-04-thr-1730-minimised-step-waits-brainstorm.md).
- **Handed off:**
  - [A minimised encounter step plays out on its own](https://linear.app/threadbare/issue/THR-1730/a-minimised-encounter-step-plays-out-on-its-own-once-time-runs-should) is in Ready for Dev, held until its veto window closes.
  - It can't be built at the same time as [Show the roll](https://linear.app/threadbare/issue/THR-1714/dilemmas-hide-the-roll-the-players-whisper-is-a-weight-not-a-choice) or [the five-card hand bar](https://linear.app/threadbare/issue/THR-1732/a-five-card-hand-at-169-doesnt-fit-1080-the-encounter-column-scrolls), because all three touch the hand's commit path.

## Escalations

- None.
