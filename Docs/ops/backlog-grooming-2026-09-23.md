---
lane: daily-backlog-grooming
run: 2026-09-23
promoted: 0
filed: 0
resolved: 0
swept: 29
canceled: 0
newFindings: 1
needsChristian: false
---
# Backlog Grooming — 2026-09-23

## Needs Christian
Nothing new needs you. The one design fork on the shelf, [THR-1523](https://linear.app/threadbare/issue/THR-1523/spotlight-pull-the-swap-pool-is-the-handful-of-ambition-less-seeded) (newborns ask for the spotlight and get refused ~220 times per 150 ticks — options A–D), falls under your agreed-outcome delegation: a design session should pick one and invite your veto. It does not need to wait for you.

## Work in flight
None. [THR-1521](https://linear.app/threadbare/issue/THR-1521/traits-wave-2-slice-3-artifact-traits-the-has-trait-schema-admits) (artifact traits) merged and auto-closed at 06:38Z, so the builder's Fable-limit stall is over. In Dev: **nothing blocked** (0 issues). [THR-1525](https://linear.app/threadbare/issue/THR-1525/signed-desire-score-vs-the-specs-step-6-a-fork-that-plants-on-its) has been In Design for 1 day, well inside the 7-day line.

## Technical gates resolved this run
None needed.

## Counts by state
Ready for Dev 0 · In Dev 0 · In Design 1 · Impl Planning 0 · Todo 28 · Idea 69

## Problems found and fixed
- Orphans **0**. Every `Now` project is High. No project has every issue Done. `.planning/ROADMAP.md` has not changed since 2026-07-30, and yesterday's cross-check found it fully tracked, so **0 filed**.
- Still flagged, not changed: *Action System & Unlocks* is `Now` but holds only Idea items. It is a roadmap call whether to demote it to `Next`.
- **Heavy simulation tests red on main is a timeout flake, not a code defect.** On f50759a4 the failure was `yieldBandCells.test.ts` (5318 ms against the 5000 ms default). Yesterday it was `peopleThingsCells.test.ts` (5278 ms), and a rerun on that same SHA passed. This is the THR-1517 class (generated-world arms with no explicit timeout), which was fixed for `orchestrator.test.ts` only. A rerun is in progress (run 35837874948). Under the process-work throttle this goes to the retro and is **not filed**; the fix is an explicit timeout on the heavy-lane world arms.

## Materiality sweep
Swept 29 (Ready for Dev + Todo). **0 in scope**: no ticket carries `Infrastructure`/`Improvement` or sits in Continuous Improvement, so 0 canceled and 0 consolidated. The active shelf is 100% product work.

## Pipeline status
**Starved: Ready for Dev and In Dev are both empty.** None of the Todo deferrals can be claimed as they stand. Each needs a short design pass first, and the next design session should take them in this order:
1. [THR-1526](https://linear.app/threadbare/issue/THR-1526/sequel-only-encounter-templates-are-reachable-from-the-live-board-the) (Medium): sequel-only encounters fire from the board. The fix is a small `reachableBy` field design, all technical *how*. Fastest path back to Ready for Dev.
2. [THR-1523](https://linear.app/threadbare/issue/THR-1523/spotlight-pull-the-swap-pool-is-the-handful-of-ambition-less-seeded) (Medium): pick A–D, measure the tick cost, hand off.
3. [THR-1522](https://linear.app/threadbare/issue/THR-1522/traits-wave-2-slice-4-the-deferred-location-trait-consumers-merchant) and [THR-1528](https://linear.app/threadbare/issue/THR-1528/battle-history-record-the-substrate-blood-soaked-needs-a-per-location) (Low): these close out traits wave 2.
