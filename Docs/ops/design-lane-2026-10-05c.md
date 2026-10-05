---
lane: tb-design-lane
run: 2026-10-05c
promoted: 1
filed: 1
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-10-05 (run c, ~12:20Z)

## Needs Christian

Nothing needs you.

## Decided for you

- [Mortals pick sure things over a fair fight](https://linear.app/threadbare/issue/THR-1740/forecast-window-re-plan-branching-quests-win-at-near-certain-odds-the): **mortals now take on work they'd win about half the time, instead of padding their record with things they can't lose.** [Plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-05-thr-1740-forecast-window-replan.md).
  - **What was wrong:** only 45% of mortals' own choices sat at the odds you asked for (50–65%). The best mortals kept re-running quests they were sure to win, so experts and masters succeeded far more often than everyone else.
  - **Quests:** a branching quest no longer gets a free pass for being easy, **except for mortals you've threaded**. The First and your other threads see their quests exactly as today; their quest count held (9 → 11 over six test worlds). Unthreaded masters stop farming easy reputation quests.
  - **Sure things stop paying twice:** a mortal's sense of what a job is worth already counted the odds. A near-certain job got that bonus *and then* beat the window. Now, above even-ish odds, being surer adds no extra worth. The odds decide whether a job is acceptable; what the mortal cares about decides which one.
  - **What it bought:** every skill band now succeeds at a similar rate (about 54–63%, from 61–70%). Experts reliably try harder work than journeymen (all six runs, from four).
  - **The gauge:** it now judges each mortal against **its own** comfort zone (bold mortals and mortals on a losing streak shift theirs, as you designed). It asks for "most" choices inside it (0.50), down from 0.60. 0.60 was a starting guess, and the real test of open odds is now the level success in every band.
  - **Not decided:** masters still rarely pick master work. That's a content-volume question, filed as [Masters don't attempt harder work than experts](https://linear.app/threadbare/issue/THR-1742/masters-still-dont-attempt-harder-work-than-experts-they-choose-master).
  - *The calls to veto:*
    - Say **"keep 0.60"** if most-in-window isn't enough. Steeper edges then become the next question, and they make masters succeed too often again.
    - Say **"quests stay exempt"** if unthreaded mortals should keep their easy quests.

  Say "veto fair fights" to reverse it all. It can be built from about 14:50 Tuesday your time.

## Work

- **Chosen:**
  - The build shelf had 4 jobs that are not deferrals (floor 4), so it was not thin.
  - No wayfinder map is open.
  - This was the agreed design request from the out-of-window audit. Its precondition (the master content, THR-1688) had merged, and no younger lane decision sat underneath it.
  - The ticket carried only Linear's default assignee and no claim marker.
- **Measured** (main `e2f765fc`): a new probe reader, [`window-replan.ts`](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-09-25-living-world-data/readers/window-replan.ts), ran eight arms on seeds 42 · 99 · 7 × 120 ticks, in both an unattended world and the attended First world. A six-seed attended run checked threaded mortals. [Raw output](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-09-25-living-world-data/output/window-replan-2026-10-05-thr1740.txt).
  - In-window share: 0.455 → 0.51 static, 0.515 → 0.552 own window.
  - The all-mortal branching rate stays at 4× its floor.
  - Idle and retry-after-failure stay at 0.
- **Gates:**
  - Intent judge, round 1: **Escalate**. The first draft took The First's branching quests to zero. I measured the threaded carve-out its question named and adopted it.
  - Round 2: **Revise**, five wording and number fixes.
  - Round 3: **Allow**.
  - Auditors: NFP, pillars and Vision all PASS-with-notes. The pillar note (importer check) was fixed.
- **Shipped:**
  - [PR #2241](https://github.com/christianspliid-ui/threadbare/pull/2241) merged; plan-doc liveness `LIVE`.
  - The ticket moved to Ready for Dev, unassigned, with `Claimable from: 2026-10-06T12:50:00Z` in the description.
  - The decision record and the handoff comment (with the coordination block) are posted.
- **Filed:** [Masters don't attempt harder work than experts](https://linear.app/threadbare/issue/THR-1742/masters-still-dont-attempt-harder-work-than-experts-they-choose-master), a Deferral blocked by the re-plan, with its coordination block.
- **Seen, not filed:** threaded mortals play branching quests about 0.4 times per 30 ticks, below the per-threaded-agent target of 1. This predates the plan, which holds it rather than lowering it.

## Escalations

None.
