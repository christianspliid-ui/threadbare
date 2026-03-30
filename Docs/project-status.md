# Project Status

> Updated 2026-03-30.

## Current Focus

**v1.1 Low-Hanging Fruit Optimization** — Phases 19-22 in progress (separate agent). Determinism, wiring, performance, code hygiene.

**Cleanup Sprint** — Closing walking skeleton gaps before moving to culture seeding, NPCs, and chain reactions. Doc cleanup, trivial wiring, hex action effects, trait prerequisites.

## Milestone Status

- **v1.0 Foundation:** Shipped 2026-03-30 — Phases 1-18 + M2.5 (81 plans, 1533 commits)
- **v1.1 Optimization:** In progress — Phases 19-22 (determinism, wiring, performance, hygiene)
- **Next:** Culture seeding (TB-031), Agent seeding (TB-032), Chain reactions (TB-017), NPCs (TB-069)

## Recent Completions (2026-03-30)

- Phase 20 (Wiring) complete — all 3 WIRE requirements done (camera animation, avatar pos gate, actorId attribution + NarrativeLog click-to-select)
- TB-085 CLI stale doom clock fields + encounter liveness test timeout
- TB-084 Graph Schema Gaps — `constructed_by` edge type + `bonded_to` target mismatch fixed
- TB-081 Hex Action Remaining Effects — all 8 wired via dynamic GraphOp generators
- v1.0 Foundation milestone shipped (Phases 1-18 + M2.5)
- Phase 19 Plan 1 committed (PRNG replacement in 15 engine files)

## Active Backlog Ideas

- TB-071 Economy Second Pass (brainstormed, needs design)
- TB-069 Location NPCs (idea)
- TB-051 Monster Encounters residual scope (roaming, threat scaling — core delivered in M2.5)
- TB-037 Onboarding (idea)
- TB-031/032 Culture & Agent Seeding (preliminary designs exist)
- TB-017 Chain Reactions (idea, blocked on TB-045 graph ops — now wiring)
- TB-018 Cosmological Manipulation (idea)

## Full Backlog
See: `.planning/BACKLOG.md`

## Completed Work
See: `Docs/project-history.md`
