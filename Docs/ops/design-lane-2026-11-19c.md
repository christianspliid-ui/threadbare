---
lane: tb-design-lane
run: 2026-11-19c
promoted: 1
filed: 2
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-11-19 (run c, ~11:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [Doom's last stage is a stand](https://linear.app/threadbare/issue/THR-2247/dooms-last-stage-is-a-stand-not-a-wait-what-pushes-the-clock-besides) — when a mortal fails and feeds the Doom, the game now remembers where. Ground your god tends starves the Doom, so a failure there feeds it nothing. Rebuke can be played on a place where the Doom fed, and it holds that place for a few days. In the last stage, the stage notice says "From here a failure can feed the doom. Ground you tend starves it.", a daily alert that does not pause names one place to Rebuke, and the Doom panel lists where it fed. There is no new card, and Doom's speed, Stay and the end of the age are unchanged. [Plan doc](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-19-thr-2247-dooms-last-stage-is-a-stand.md). Veto in chat. The build tickets wait until 00:00Z (01:00 local) for that.

## Work

- **Claimed** [THR-2247](https://linear.app/threadbare/issue/THR-2247/dooms-last-stage-is-a-stand-not-a-wait-what-pushes-the-clock-besides) under Step 2, rule 1. The shelf held 3 non-Deferral items in Ready for Dev, all inside veto windows. No period-focus unit could be worked: the UI legibility map is closed, and the UI project holds only your icon picks. No vetoes were in the briefing.
- **Measured** on main @ `9c4300ad` with an instrumented census on [proto/thr-2247-doom-push-census](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-2247-doom-push-census) (never merged). Seeds 42, 7 and 99 were played, and seed 42 was also run hands-off, from warm 300 to the age's end.
  - Failures are 23–29% of Doom's movement. There were 611–739 a run, from 41–57 mortals at 47–74 places. The First caused 1–2.5%.
  - No other writer moved the clock in any run.
  - The Return fires on the exact tick the last stage begins.
  - In the last stage the god is offered 0.10–0.31 decisions a day, against 1.04–1.44 before it.
  - Essence rises unspent through the last stage.
- **Plan doc merged:** [PR 2865](https://github.com/christianspliid-ui/threadbare/pull/2865), with a [brainstorm companion](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-11-19-thr-2247-dooms-last-stage-is-a-stand-brainstorm.md). `check:plan-doc-liveness` returned LIVE.
- **Gates:**
  - Intent judge: **Allow** on run 4. Runs 1–3 returned Revise, and every finding was fixed and logged in `Docs/judge-metrics/2026-W47.md`.
  - Audits: NFP PASS-with-notes. Three-pillar REVISE for a missing substrate table, now added. Vision PASS-with-notes; its drumbeat note is answered.
  - `npm run gate -- --final` PASS on the docs track.
- **Filed and handed off.** Both are unassigned with `Claimable from: 2026-11-20T00:00:00Z`.
  - [The Doom feeds at a place](https://linear.app/threadbare/issue/THR-2255/the-doom-feeds-at-a-place-ground-you-tend-starves-it-rebuke-answers-it) — **Ready for Dev**, with its coordination block. Mutex with the census tickets [THR-2248](https://linear.app/threadbare/issue/THR-2248) and [THR-2253](https://linear.app/threadbare/issue/THR-2253).
  - [The Doom panel shows where it feeds](https://linear.app/threadbare/issue/THR-2256/the-doom-panel-shows-where-it-feeds-a-place-list-with-rebuke-a-bar) — Todo, blocked by THR-2255. Mutex with [THR-2252](https://linear.app/threadbare/issue/THR-2252) on the Doom dialog.
- THR-2247 is back in Todo, unassigned and blocked by both builds. It tracks its "Fixed when": an expert session started at `?warm=600` names one place the player chose to hold in the last stage. The second-journey question stays yours and was not touched.

## Escalations

None.
