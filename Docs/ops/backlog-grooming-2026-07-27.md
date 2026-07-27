# Backlog Grooming — 2026-07-27

## Needs Christian

Nothing needs you. No issue is parked on a creative or design-vision decision; everything resolved this run was a technical verdict.

## Work in flight

- **THR-802** (In Dev, assigned) — shipped 07:13Z, PR [#943](https://github.com/christianspliid-ui/threadbare/pull/943) armed on the required check, carrying the auto-close keyword for THR-802 in its commit and PR bodies. All three Done-whens met with a falsification pass (5 of 6 new tests red against pre-fix code). Nothing remains; auto-close fires on merge.
- **THR-814** (was In Dev, unassigned) — closed this run, see below.

## Technical gates resolved this run

- **THR-814 → Done.** Its executor explicitly deferred the close as "a triage call, not a code one." Both preconditions verified: PR #934 **merged** 04:41Z carrying *no* auto-close keyword (so no auto-close would ever fire), and successor **THR-815 is Done** with this issue's Done-whens 1–3 measured met (reputation gains 0 → 449, member-resolved jobs 0 → 944, `sweep:rank-reach` exits 0). Done-when 4 was already met here. Reasoning posted to the issue.
- **PR #940 unblocked → merged 07:18Z.** The plan doc gating the two top-priority issues (THR-774/THR-775, both "wait for main before pickup") sat armed at `mergeStateStatus: BEHIND` since 06:30. Armed auto-merge never fires at BEHIND under strict branch protection — this is THR-735's known sweep-vs-merge-rate race. Ran `gh pr update-branch 940`; it merged within the minute. **Both headline issues are now pickup-ready.**

## Counts by state

In Dev 1 · Ready for Dev 22 · Todo 28 · In Design 0 · Implementation Planning 0 · Idea 60+ (paginated).

## Problems found and fixed

- **WIP was 2, not 1** — THR-814 sat In Dev *unassigned* while its successor had already shipped, starving the single executor slot and double-tracking closed work. Closing it restored WIP = 1.
- **THR-799 was filed into a project completed three months earlier** — "UI/UX Design Infrastructure" (status Done, completed 2026-04-13) held a Ready-for-Dev issue created 2026-07-26. Moved to **UI Visual Overhaul — Design System v1** (Now/High), which owns shared primitives and already holds the sibling THR-637/THR-638 art work.
- **No orphan issues** — every issue sampled across all six states carries a project.
- **Roadmap cross-reference (Step 3): no filings needed.** Every `.planning/ROADMAP.md` § Future Work item already has Linear coverage — NPC workforce → THR-67, culture seeding → THR-70, Content Architecture phases 3–5 → THR-54/55/56, plus the Social Systems Expansion, M3, Codex and Onboarding projects. The section's *stale status claims* are already tracked by THR-763; filing more would duplicate it.

## Flagged, not changed

- **Repo Health** is status `Next` while holding Ready-for-Dev work (THR-807). Left alone — one Low-priority queued item does not justify claiming active focus.
- **Idea is 60+ deep**, incl. 7 priority-none drift-scan issues (THR-746–751, THR-705). Already tracked twice: THR-574 (stale-Idea triage sweep) and THR-756 (stop filing weekly drift-scan duplicates). No new tickets filed into that pile by design.

## Pipeline status

Healthy — 22 items Ready for Dev, none blocked. **Recommended next pickup: THR-774 / THR-775** (Nudge Model WS1/WS2, both High, Encounter Experience, Christian's stated first priority) now that PR #940 has landed their plan doc on main. If the executor prefers to clear the active project's deferrals first per "Finish Before You Start", **THR-817 and THR-818** are cheap Low-priority deferrals in the same project.
