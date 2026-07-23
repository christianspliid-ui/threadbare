# Backlog Grooming — 2026-07-23

## Needs Christian
- Nothing needs you today.

## Work in flight
- In Dev: empty — no active or stalled work to report.

## Technical gates resolved this run
- None needed — no stale In Dev, no upstream-shipped orphans, no parked technical decisions.

## Counts by state
Todo 16 · In Design 0 · Implementation Planning 0 · Ready for Dev 2 · In Dev 0 · Idea 49 · Deferral-labeled 96 total (16 active, all correctly in Idea/Todo; 80 terminal Done/Canceled/Duplicate).

## Problems found and fixed
- **Fixed — 3 orphan issues.** THR-544/545/546 ("The Core" slices 2–4, all Done) carried no project despite CLAUDE.md's "every issue belongs to a project" rule. Sibling THR-547 was already in **Agent Personality & Moral Drift**; assigned all three there.
- **Flagged, not fixed — 4 "Now"-status projects are 100% Done but intentionally perpetual.** Small manual tweaks, Repo Health, Agent Coordination Protocol, and Marketing Site each have every current issue in a terminal state, which would normally trigger a move to Done. Their own descriptions frame them as standing infrastructure homes ("Ongoing infrastructure project...", "this is where small manual tweaks...goes") rather than milestone projects with a completion point — closing them would just cause thrash when the next issue lands. Left as-is; flagging here so it's a visible judgment call, not a silent skip.
- Legacy `.planning/ROADMAP.md` "Future Work" section cross-checked — every item (Procedural Content Library, Social Systems Expansion, M3 Dynamic Economy, Codex) already has a matching Linear project. No new issues needed.
- Deferral-label hygiene: all 16 non-terminal Deferral issues sit in Idea or Todo (none stuck mid-flight). No action needed.
- No stale In Design / Implementation Planning work — both states are empty.

## Pipeline status
- Ready for Dev holds 2 issues: **THR-573** (Encounter volume architecture, Medium priority, Content Architecture — active project) and **THR-714** (strip volatile ul-dashboard timestamp, Low priority, Continuous Improvement). Neither is Deferral-labeled, so priority ordering applies straight.
- Recommended next pickup: **THR-573** (Medium beats Low, and Content Architecture is an active project with more work queued behind it per "Finish Before You Start").
