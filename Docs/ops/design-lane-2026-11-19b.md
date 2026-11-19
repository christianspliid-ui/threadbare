---
lane: tb-design-lane
run: 2026-11-19b
promoted: 1
filed: 4
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-19 (run b, ~10:05Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [The player can read the race](https://linear.app/threadbare/issue/THR-2246/the-player-can-read-the-race-at-any-moment-the-screen-says-which-clock) — from Doom's Signs stage onward, the Mandate row says which clock lands first at the last fifteen days' pace ("Goal · Doom lands first"). The Mandate block says it in one sentence ("At this pace, Doom ends the age before your Mandate is fulfilled."). The Mandate and Doom dialogs name the one move ("Spend Order essence on Kael Thornweaver's chapters to raise your Mandate.", or Stay the Unmaking when no mortal is bound). A shift is a non-pausing alert plus a "While you were away" line. No numbers, and nothing new in the top bar. [Plan doc](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-19-thr-2246-the-player-can-read-the-race.md). Veto in chat. The build tickets hold until 22:00Z for that.

## Work

- **Claimed** [THR-2246](https://linear.app/threadbare/issue/THR-2246/the-player-can-read-the-race-at-any-moment-the-screen-says-which-clock) as a period-focus unit. The shelf was thin: 2 non-Deferral items in Ready for Dev, below the floor of 4. No vetoes were in the briefing. The UI legibility map's carve-up is fully done.
- **Plan doc merged:** [PR 2863](https://github.com/christianspliid-ui/threadbare/pull/2863), with a [brainstorm companion](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-19-thr-2246-the-player-can-read-the-race-brainstorm.md). `check:plan-doc-liveness` LIVE.
- **Gates:**
  - Intent judge: **Allow** on run 7. Runs 1–6 returned Revise, every finding was fixed, and each run is logged in `Docs/judge-metrics/2026-W47.md`.
  - Audits: NFP PASS-with-notes, three-pillar PASS, Vision PASS-with-notes. The notes are answered in the plan.
  - `npm run gate -- --final` PASS (docs track).
- **Substrate measured:** no projection or ETA code exists for either clock. The Mandate has only a 36-tick ledger-points window (`game-config.ts:188`). Doom steps by `tickModifier × rate` (`doomClock.ts:746`). The post-bond floor comes from `doomFloorMetAtTick` (`doomClock.ts:716`).
- **Filed and handed off** (all unassigned, `Claimable from: 2026-11-19T22:00:00Z`):
  - [The engine reads the race](https://linear.app/threadbare/issue/THR-2251/the-engine-reads-the-race-a-daily-pace-sample-a-forecast-of-which-clock) — **Ready for Dev**.
  - [The player can read the race (UI)](https://linear.app/threadbare/issue/THR-2252/the-player-can-read-the-race-the-mandate-row-says-which-clock-lands) — Todo, blocked by THR-2251.
  - [The census checks the race forecast](https://linear.app/threadbare/issue/THR-2253/the-agency-census-checks-the-race-forecast-it-turns-at-most-three) — Todo, blocked by THR-2251 and THR-2248.
  - [The race names a place to tend](https://linear.app/threadbare/issue/THR-2254/the-race-names-a-place-to-tend-once-a-gods-place-cast-fills-the) — Todo, blocked by THR-2249 and THR-2252.
- THR-2246 stays in Todo, unassigned, as the tracker for its "Fixed when" (a later warm round), the same as THR-2245. The executor builds the four tickets, not the plan ticket.

## Escalations

None.
