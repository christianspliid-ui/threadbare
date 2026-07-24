# Backlog Grooming — 2026-07-24

## Needs Christian
Nothing needs you today — found pipeline gap, fixed it directly (see below).

## Work in flight
In Dev: nothing blocked (queue is empty).

## Technical gates resolved this run
- **THR-701** (design-audit-pipeline stale inputs — wrong Vision path, missing taste-profile.md, stale design-brief NFP section): Todo → Ready for Dev. Self-contained, fully specified, zero blockers, sitting 3 days while the pickup queue was empty. Posted coordination-block comment (model: sonnet, no mutex).

## Counts by state
Ready for Dev: 1 (after fix) · In Dev: 0 · In Design: 0 · Implementation Planning: 0 · Todo: 22 · Idea: 50+ (paginated) · Deferral-labeled: 50+ (paginated, includes closed history)

## Problems found and fixed
- **Pipeline gap**: Ready for Dev and In Dev were both empty — executor had nothing to pick up. Root cause: the newest Content Architecture / Attention Tier Model tickets (THR-718, 719, 721, 723, 737 — split from `2026-07-23-system-interface-map.md`) all explicitly state "needs design grooming before Ready for Dev." Fixed the one ticket that didn't need grooming (THR-701); the rest genuinely need a design session, not a groomer fix.
- **THR-655** (post-migration retro) not yet ripe — spec says run ~1 week after THR-654 landed (2026-07-21); earliest useful date is ~2026-07-28. Left in Todo, correctly.
- No orphan issues (missing project) found across sampled Todo/Idea/Deferral lists.
- Legacy `.planning/ROADMAP.md` "Future Work" section cross-checked — all items (Procedural Content Component Library, Social Systems Expansion, M3 Dynamic Economy) already have live Linear project coverage; no new issues needed. Roadmap doc's Phase 22 line reads "Not started" but Linear's Code Hygiene project shows Done (2026-04-23) — roadmap doc staleness, not a backlog gap; not actioned (out of grooming scope).

## Pipeline status
**Next pickup: THR-701** (Ready for Dev, Continuous Improvement, Medium priority, sonnet-scale doc fix).
After that, the queue goes empty again — recommend a **design session on THR-718** ("Items move capability tiers again," High priority, Content Architecture) next. It's the highest-priority item blocking a 3-ticket mutex cluster (THR-719, THR-723, THR-737 all edit the same attachment/effects files and are converging on one `effects[]` substrate) — grooming it first unblocks the largest stalled cluster in the backlog.
