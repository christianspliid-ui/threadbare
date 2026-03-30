---
phase: 12-flesh-reach-migration-to-quintessence
plan: "03"
subsystem: quintessence-runtime
tags: [engine, quintessence, erosion, dissolution, game-state]
dependency_graph:
  requires: ["12-01", "12-02"]
  provides: [quintessence-runtime, quintessence-types, phaseQuintessence]
  affects: [orchestrator, gameInit, phaseSpherePressure, encounterProgressionV2, gameState]
tech_stack:
  added: [phaseQuintessence.ts, src/types/quintessence.ts]
  patterns: [event-accumulation-pipeline, fail-soft-default, passive-regen-tick-phase]
key_files:
  created:
    - src/types/quintessence.ts
    - src/engine/phaseQuintessence.ts
    - src/types/__tests__/quintessence.test.ts
    - src/engine/__tests__/phaseQuintessence.test.ts
  modified:
    - src/types/gameState.ts
    - src/engine/orchestrator.ts
    - src/engine/gameInit.ts
    - src/engine/phaseSpherePressure.ts
decisions:
  - "phaseQuintessence iterates actor+location node types (not all nodes) for passive regen and dissolution checks — these are the only initialized quintessence-bearing types"
  - "Overchannel QuintessenceEvent emitted inside phaseSpherePressure.ts when processing a SpherePressureEvent with source=overchannel — hooks into the existing sphere pressure resolution loop"
  - "Encounter abandonment (not step failure) is the narrative-diminishing failure path — only abandoned encounters trigger quintessence erosion"
  - "dissolution_event TickEvent marks entity as dissolved=true but does NOT remove from graph — fail-soft, downstream systems handle removal"
  - "passive regen only applies to entities with quintessence > 0 AND < 1.0 — avoids regen for dissolved entities and entities already at max"
metrics:
  duration: 8
  completed: "2026-03-29"
  tasks: 2
  files: 8
---

# Phase 12 Plan 03: Quintessence Runtime System Summary

Implemented the Quintessence runtime: entity initialization at 1.0, overchannel erosion via SpherePressureEvent hook, encounter-failure erosion on abandoned encounters, passive regeneration each tick, and dissolution events at quintessence=0.0, all wired into the orchestrator tick loop.

## Tasks Completed

| # | Name | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Quintessence types, helper functions, and unit tests | 6fd21e9 | src/types/quintessence.ts, src/types/__tests__/quintessence.test.ts |
| 2 | phaseQuintessence engine module, orchestrator wiring, gameInit initialization, encounter failure erosion | e3d0277 | src/engine/phaseQuintessence.ts, src/engine/__tests__/phaseQuintessence.test.ts, src/types/gameState.ts, src/engine/orchestrator.ts, src/engine/gameInit.ts, src/engine/phaseSpherePressure.ts |

## What Was Built

**Type System (src/types/quintessence.ts)**
- `QuintessenceEvent` interface: targetNodeId, delta, source, tick
- `QUINTESSENCE_THRESHOLDS`: WEAKENED=0.25, CRITICAL=0.10, DISSOLUTION=0.0
- Constants: QUINTESSENCE_PASSIVE_REGEN=0.002, QUINTESSENCE_DEFAULT=1.0, QUINTESSENCE_OVERCHANNEL_EROSION=0.05, QUINTESSENCE_ENCOUNTER_FAILURE_EROSION=0.03
- `quintessenceToWord()` helper: maps 0-1 to 10-level QUINTESSENCE_LEXICON (Fraying to Absolute)
- `ZERO_STATE_RULES`: per-category dissolution behavior

**Engine Phase (src/engine/phaseQuintessence.ts)**
- Position: Phase 6.6392 — after phaseSpherePressure, before phaseSphereAggregation
- Step 1: Accumulate deltas per target node from pendingQuintessenceEvents
- Step 2: Apply deltas with 0-1 clamping
- Step 3: Passive regen for all entities with quintessence in (0, 1.0)
- Step 4: Dissolution check — emit `dissolution_event` TickEvent at quintessence=0.0, mark `dissolved=true`

**GameState Changes (src/types/gameState.ts)**
- Added `pendingQuintessenceEvents?: QuintessenceEvent[]` field
- Added `dissolution_event` to TickEvent type union

**Orchestrator Wiring (src/engine/orchestrator.ts)**
- Imports phaseQuintessence, QuintessenceEvent, QUINTESSENCE_ENCOUNTER_FAILURE_EROSION
- Phase 6.6392 call: `s = { ...s, ...phaseQuintessence(s), pendingQuintessenceEvents: [] }`
- `phaseEncounterProgressionV2`: emits QuintessenceEvent with source='encounter_failure' on encounter abandonment

**Overchannel Hook (src/engine/phaseSpherePressure.ts)**
- When processing SpherePressureEvent with source='overchannel', pushes QuintessenceEvent with delta=-QUINTESSENCE_OVERCHANNEL_EROSION to pendingQuintessenceEvents

**Initialization (src/engine/gameInit.ts)**
- All location nodes initialized with `quintessence: 1.0` alongside sphereAffinity
- All actor nodes initialized with `quintessence: 1.0` alongside sphereAffinity
- GameState factory includes `pendingQuintessenceEvents: []`

## Test Coverage

- 16 unit tests for type system (quintessenceToWord clamping, thresholds, constants)
- 14 unit tests for phaseQuintessence (erosion, clamping, passive regen, dissolution, fail-soft, multi-event accumulation, encounter_failure source processing)
- CLI smoke test: seed 42, 30 ticks, no crashes

## Deviations from Plan

None — plan executed exactly as written.

## Verification Results

- `npx tsc --noEmit`: 0 errors
- `npm test`: 6875 tests pass across 460 test files (0 regressions from GameState changes)
- `npx vite build`: succeeds
- CLI 30-tick smoke test: no crashes, quintessence system transparent in normal operation

## Self-Check: PASSED
