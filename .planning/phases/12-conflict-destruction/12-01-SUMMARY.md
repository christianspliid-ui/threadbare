---
phase: 12-conflict-destruction
plan: 01
subsystem: engine
tags: [factions, military, ambitions, graph, encounters, traces]

# Dependency graph
requires:
  - phase: 11-agent-character-sheet
    provides: agent knowledge system, interaction depth, AgentKnowledge types
provides:
  - FactionAmbitionType union (6 variants) and FactionAmbition interface
  - Mercenary company faction definition with 4 rank tiers
  - phaseFactionAmbitions orchestrator phase (every 5 ticks)
  - commanded_by and participates_in edge types in graph schema
  - faction_ambition trace category with FactionAmbitionTrace
  - Mercenary encounter templates (mc.join, mc.promotion, 4 quests, 3 social, 1 elite)
affects: [12-conflict-destruction-02, 12-conflict-destruction-03, army spawning, battle resolution]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Faction ambitions are graph nodes connected via pursues edges — same pattern as agent ambitions"
    - "Ambition scoring uses weighted candidate selection with PRNG for determinism"
    - "Fail-soft defaults to defensive_consolidation when no eligible ambitions"
    - "Army spawning triggered automatically when military ambition adopted (requiresMilitaryForce check)"

key-files:
  created:
    - src/data/mercenary-company-definition.ts
    - src/data/mercenary-encounter-content.ts
    - src/engine/factionAmbitions.ts
    - src/engine/__tests__/factionAmbitions.test.ts
  modified:
    - src/types/graph.ts
    - src/types/edgeSchema.ts
    - src/types/faction.ts
    - src/types/trace.ts
    - src/data/faction-definitions.ts
    - src/engine/orchestrator.ts

key-decisions:
  - "Faction ambitions stored as graph nodes (type: ambition) connected via pursues edges — keeps graph as single source of truth"
  - "phaseFactionAmbitions placed at position 6.651 (after phaseAmbitionProgress) since faction ambition is slow (every 5 ticks) and analogous to agent ambition progress"
  - "Army spawning integrated directly into phaseFactionAmbitions when requiresMilitaryForce — coupling is intentional, avoids separate pass"
  - "participates_in edge targetNodeType is actor (not event) in edgeSchema because battle nodes are actor-type in current graph schema"
  - "Mercenary company reputation decays at 0.004/tick vs guild 0.003/tick — mercs are transactional"

patterns-established:
  - "FactionDefinition.ambitionWeights drives ambition selection — no hardcoded faction behavior"
  - "emitTrace with category faction_ambition on all ambition lifecycle events (created/abandoned)"

requirements-completed: [TB-073]

# Metrics
duration: pre-implemented
completed: 2026-03-29
---

# Phase 12 Plan 01: Mercenary Company + Faction Ambition System Summary

**Mercenary company faction with 4 military rank tiers and weighted ambition evaluation system that creates ambition graph nodes every 5 ticks with revenge grievance decay and defensive_consolidation fallback**

## Performance

- **Duration:** Pre-implemented (committed as f1cd422 during Phase 12 planning session)
- **Started:** 2026-03-29T17:32:34Z
- **Completed:** 2026-03-29T17:32:34Z
- **Tasks:** 10 (Tasks 1-9 implemented + Task 10 verification)
- **Files modified:** 22

## Accomplishments

- Added `commanded_by` and `participates_in` edge types to graph schema (Task 1)
- Added `FactionAmbitionType`, `FactionAmbition` interface, and `faction_ambition` trace category (Tasks 2-3)
- Created mercenary company faction definition with 4 rank tiers and military reach profile (Task 4)
- Created 9 mercenary encounter templates (join, promotion, 4 quests, 3 social) + 1 elite quest (Task 5)
- Implemented `phaseFactionAmbitions` engine phase with weighted scoring, PRNG selection, and grievance decay (Task 6)
- Wired `phaseFactionAmbitions` into orchestrator at position 6.651 (Task 7)
- Verified faction seeding handles mercenary company via existing data-driven seedFaction() (Task 8)
- All 465 test files pass, TypeScript clean, production build succeeds (Task 10)

## Task Commits

The entire plan was implemented atomically in a single commit:

1. **Tasks 1-9: Full implementation** — `f1cd422` (feat: TB-073 M2-01 — mercenary company faction + faction ambition system)

## Files Created/Modified

- `src/types/graph.ts` — Added `commanded_by` and `participates_in` to EdgeType union
- `src/types/edgeSchema.ts` — Added edge schemas for both new military edge types
- `src/types/faction.ts` — Added FactionAmbitionType, FactionAmbition interface, FactionAmbitionTrace, MILITARY_AMBITION_TYPES, requiresMilitaryForce helper, ambitionWeights field on FactionDefinition
- `src/types/trace.ts` — Added `faction_ambition` to TraceCategory union and TRACE_CATEGORIES array
- `src/data/mercenary-company-definition.ts` — (new) Mercenary company definition with 4 rank tiers, MC_REPUTATION_DECAY_PER_TICK=0.004
- `src/data/mercenary-encounter-content.ts` — (new) 9 encounter templates + getMercenaryEncounterById lookup
- `src/data/faction-definitions.ts` — Registered MERCENARY_COMPANY_DEFINITION in FACTION_DEFINITIONS map
- `src/engine/factionAmbitions.ts` — (new) phaseFactionAmbitions with scoring, selection, grievance decay, army spawning hook
- `src/engine/orchestrator.ts` — Added phaseFactionAmbitions(s) call at position 6.651
- `src/engine/__tests__/factionAmbitions.test.ts` — (new) 8 tests covering all plan test cases + mercenary definition validation

## Decisions Made

- Faction ambitions stored as `ambition` graph nodes connected via `pursues` edges — same pattern as agent ambitions, single source of truth
- `phaseFactionAmbitions` placed after phaseAmbitionProgress (position 6.651) since faction evaluation is slow (every 5 ticks) and not needed before agent decision on the same tick
- Army spawning integrated directly into `phaseFactionAmbitions` via `requiresMilitaryForce` check — intentional coupling to keep military trigger clear
- `participates_in` edge uses `targetNodeType: 'actor'` in the schema (not 'event') since battle nodes in the current graph use `type: 'actor'`
- `FactionAmbitionTrace.summary` field added to match existing trace patterns in the codebase (all traces have a summary string)

## Deviations from Plan

None — plan executed exactly as written. The implementation appeared in the commit history as a complete unit delivered during the Phase 12 design/planning session (f1cd422).

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 12-01 deliverables complete: faction ambition system, mercenary company, military edge types
- Plan 12-02 (army entities + spawning pipeline) already implemented (a6d314f) and extends this phase's `requiresMilitaryForce`/`spawnArmy` infrastructure
- Plans 12-02 through 12-07 all committed — full conflict pipeline through battle, siege, destruction, and UI already delivered

---
*Phase: 12-conflict-destruction*
*Completed: 2026-03-29*
