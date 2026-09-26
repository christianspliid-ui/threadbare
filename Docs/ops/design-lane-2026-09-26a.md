---
lane: tb-design-lane
run: 2026-09-26a
promoted: 1
filed: 0
resolved: 0
newFindings: 0
needsChristian: false
---
# Design lane — 2026-09-26 (run a, ~00:30Z)

## Needs Christian

Nothing new needs you. [Faith and politics at game start](https://linear.app/threadbare/issue/THR-1596) and [A world with a past](https://linear.app/threadbare/issue/THR-1591) are still waiting for you on [the living-world map](https://linear.app/threadbare/issue/THR-1589). Nothing changed on either this run.

## Decided for you

- [Re-fit the dice](https://linear.app/threadbare/issue/THR-1581) and [mortals take on challenges they can win about half the time](https://linear.app/threadbare/issue/THR-1582) **now ship together as one change instead of one after the other.**
  - Built alone, the new dice did what they promised: skill finally matters.
  - But the mortals then fled to trivially easy challenges, and the world got easier: 79–87% success instead of the 50–65% you ruled.
  - Only the second half, where mortals seek even odds, pushes them back up. So each half is only judged with the other in place.
  - Two stops stay with you. If the "succeeded, but at a cost" share still falls below your July band once both halves are in, the builder stops and brings it to you. Nobody retunes it quietly.
  - The builder also stops if branching quests stay rare. With the new dice alone they fell about 80%.
  - Plan: [forecast window § Amendment 2026-09-26](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-24-thr-1575-forecast-window.md). Veto if you would rather see the dice alone live first, even though that world runs easier than today's.

## Work

- **Claimed** [Re-fit the dice](https://linear.app/threadbare/issue/THR-1581). The orchestrator had set it aside for a design pass after the builder's run stopped on its own safety check.
- **Amended the plan** in [#2059](https://github.com/christianspliid-ui/threadbare/pull/2059), which is merged and live on `main`.
  - The amendment re-sequences the two halves and retires the dice-only success gate, which cannot pass by construction. The checks that do not depend on the mortals' choices all stay.
  - Branching quests are now gated at the existing KPI floor of 1 per 30 ticks.
  - The build re-baselines on today's `main`. Since the branch was cut, the "odds shown are the odds rolled" fix and the whole fight block have landed.
- **Gates:**
  - Intent-judge: **Allow**. It raised two gaps, both fixed: a stale parity-test line, and the ticket description still carrying the old stop rule.
  - Design audits: NFP pass-with-notes, three pillars pass-with-notes, Vision **pass**.
- **Handed off:**
  - [Re-fit the dice](https://linear.app/threadbare/issue/THR-1581) is in Ready for Dev, unassigned, with the coordination block.
  - The [S4 ticket](https://linear.app/threadbare/issue/THR-1582) stays in Todo. The same PR closes it.

## Escalations

None.
