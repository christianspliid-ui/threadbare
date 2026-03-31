# Project Status

> Updated 2026-03-31.

## Current Focus

**v1.1 Low-Hanging Fruit Optimization** — Phases 19-22 in progress (separate agent). Determinism, wiring, performance, code hygiene.

**Culture Seeding Phase 1** (TB-031) — Territory-aware culture placement via province system. Shipped 2026-03-31.

## Milestone Status

- **v1.0 Foundation:** Shipped 2026-03-30 — Phases 1-18 + M2.5 (81 plans, 1533 commits)
- **v1.1 Optimization:** In progress — Phases 19-22 (determinism, wiring, performance, hygiene)
- **Next:** Agent seeding (TB-032), Chain reactions (TB-017), NPCs (TB-069), Economy second pass (TB-071)

## Recent Completions (2026-03-31)

- **Reach-polarity reputation trait system:** 17 parseable reputation traits (8 reaches × 2 polarities + power renown). Tallies accumulate from encounters, decay per tick, assign traits at thresholds (3/8/15). 3-layer polarity determination. Encounter gating (requiredTraits + blockedByTraits), scoring bonus, orchestrator phase 6.64. 16 tests.
- **TB-031 Culture Seeding Phase 1:** Territory-aware culture placement. Cultures generated before worldgen, seeded into provinces, locations and actors inherit from province. Homeland/border strength, diaspora, dual-culture at borders. Fixed preferredBiomes bug.
- **Location variety + anomaly discovery system (fully wired):** 29 location subtypes, anomaly shimmer visuals, 10 rare resources, 10 discovery encounters, 10 artifacts, 8 bestowed traits, 6 conditions. Engine wiring: encounter completion seeds resources + flips discovery flag. Eye/Veil agent seeking bias. UI reveal flash on anomaly_discovered event.
- TB-086/087/088: Mutation observability (`SimulationRuntime` with version counters, `touchWorld()`/`touchStructure()` API, version-keyed `useMemo` deps, per-session cache ownership, distance matrix cap raised 500→1200). 9 contract tests.

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
