---
lane: daily-backlog-grooming
run: 2026-09-04
promoted: 0
filed: 0
resolved: 3
swept: 7
canceled: 0
newFindings: 0
needsChristian: true
---
# Backlog Grooming — 2026-09-04

## Needs Christian
- **THR-1130 — approve the batch-2 encounter brief, and answer one yes/no.** The brief is drafted and merged; the batch has not run. The question: is repair-in-place still what you want for the camp six, or has that band earned re-rolling from fresh premises? **Recommendation: repair-in-place.** The brief re-measured the corpus and the real scope came back smaller (seven encounters, not nine), and the rolled consequence hands already force two omen emitters, a condition, a membership change, a relocation and a piece of intelligence into a game that currently measures one of each — repair done honestly closes those gaps anyway. A re-roll turns a bounded retrofit into new-content authoring.
- **THR-1392 — review the retirement list of the 64 undertaking templates in chat.** Slice 4a shipped (verbs renamed, registry redrawn on the world-object catalogue, grid generated and gated). Slice 4b is the closing slice and cannot start until the list is reviewed, because it deletes templates.
- Both are correctly parked and will surface in the hourly briefing.

## Work in flight
- **THR-1410** (In Dev, claimed 07:03 today) — authored-choice veil commit control unreachable at 1920×1080. Fresh claim, coordination block present, correctly ordered ahead of its two mutex siblings THR-1411/THR-1416. Healthy, no action.
- **THR-1130**, **THR-1392** — deliberate parks on Christian gates (above). Not stalled work.

## Technical gates resolved this run
- **THR-1392** — assignee cleared. It had repopulated via impediment #657 (Linear's native GitHub integration re-assigns on PR open when the branch name carries the issue id; slice 4a's PR #1804 did it). A populated assignee breaks the `assignee: null` ∧ `In Dev` shape `keep-work-flowing-cc` matches, so the ask was invisible in the briefing and the park read as a live claim against WIP=1. Verified via re-query.
- **THR-1415** — `docs-only` label removed. The body itself calls the label wrong and asks for removal "at pickup", but the docs-only fast-track lane selects *by label* and then runs only the docs gate — a `vite.config.ts` edit would have shipped with no tests, no typecheck, no build. Verified via re-query.
- **Repo Health** project — `Next` → `Now`. It held two Ready-for-Dev (started-type) issues while marked as planned-not-started.

## Counts by state
Idea 70 · Todo 52 · In Design 2 · Implementation Planning 0 · Ready for Dev 10 · In Dev 3 (1 live claim, 2 parked). No orphan issues — every issue in every queried state has a project. No open PRs.

## Problems found and fixed
- The three above. No orphans, no completed-but-open projects, no stale design work (both In Design issues updated yesterday), no unclaimable deferrals — THR-1168 is the sole Ready-for-Dev deferral and carries both a verdict and a coordination block.
- Noted, not fixed: **Plan Cross-Linking Infrastructure** is an empty project (zero issues, status Idea). Harmless; left for a human to delete rather than deleted by a lane.
- Roadmap cross-reference: every `.planning/ROADMAP.md` Future Work item already has a Linear counterpart (THR-54/55/56, THR-52, THR-67/68/70/72, the Social Systems and M3 projects). Nothing filed.

## Materiality sweep
7 in-scope by label. 3 set aside as player-visible product, not process (THR-1413 companions row, THR-1416 chip tag width, THR-1168 encounter audio). 4 judged on magnitude — **0 canceled**: THR-1412 (37 of 43 debug tabs off-canvas, `fireAction` matching a field no actor has — blocks the verification levers every browser Done-when depends on), THR-1415 (dev server never serves `main.tsx`), THR-1134 (director-requested, UI pillar, not paperwork), THR-1256 (a dated review gate, due 2026-09-08). Consolidated: 0.
**Doubt recorded, ticket stands:** THR-1415's measured cost is ~15 min against a ~1h bar, so on question 1 alone it is a log row. It stands because the fix is written and verified in the body, nobody is otherwise "passing" through `vite.config.ts`, and the thing it blocks is the browser-verify evidence gate.

## Pipeline status
Healthy — 10 Ready for Dev, one live claim, no gap. **Recommended next pickup after THR-1410 ships: THR-1168** — prioritization rule 1 (a Deferral in an active project, Encounter Experience/Now), and it is now a pure deletion with the director verdict recorded. Then THR-1411 and THR-1416, which unblock as THR-1410's mutex clears.
