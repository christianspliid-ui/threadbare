---
phase: 12-conflict-destruction
plan: "02"
subsystem: army-spawning
tags: [army, spawning, types, encounter-templates, faction-ambitions]
dependency_graph:
  requires: [12-01]
  provides: [army-entity-model, army-spawning-pipeline, army-encounter-templates]
  affects: [factionAmbitions, orchestrator, encounter-system]
tech_stack:
  added: [ArmyState, ArmyObjective, ArmySizeCategory, ArmyEncounterMeta]
  patterns: [graph-actor-with-property-bag, deterministic-size-from-tier, fail-soft-spawn]
key_files:
  created:
    - src/types/army.ts
    - src/engine/armySpawning.ts
    - src/data/army-encounter-content.ts
    - src/engine/__tests__/armySpawning.test.ts
  modified:
    - src/engine/factionAmbitions.ts
    - src/data/encounter-content.ts
decisions:
  - "Army actor nodes reuse existing 'actor' graph node type with armyState property bag — no new node type required"
  - "Army size (warband/regiment/host) determined deterministically from faction Gold capability tier — no PRNG"
  - "Commander selection deterministic: highest Iron tier member qualifies; ties broken by iteration order"
  - "MAX_ARMIES_PER_FACTION=1 enforced by checking member_of edges for existing armyState nodes before spawn"
  - "spawnArmy called directly from phaseFactionAmbitions (not through encounter system) — mc.army.raise is a narrative template for UI reference, not the actual spawn trigger"
  - "Army located at commander's current location (fail-soft: skip spawn if commander has no location)"
metrics:
  duration: 8
  completed_date: "2026-03-29"
  tasks_completed: 6
  files_modified: 6
---

# Phase 12 Plan 02: Army Entity Types and Spawning Pipeline Summary

Army entity type system and spawning pipeline implemented — ArmyState interface on actor graph nodes, deterministic size from Gold tier, commander selection from Iron tier, and faction ambition integration with all lifecycle traces.

## What Was Built

### Task 1: Army Type Definitions (`src/types/army.ts`)
- `ArmySizeCategory` union type: `warband | regiment | host`
- `ArmyState` interface: size, headcount, objective, quintessence, quintessenceMax, raisedTick, maintenanceCost, thresholdsFired
- `ArmyObjective` interface: type (raid/conquer/defend/intercept/reinforce_siege), targetNodeId, estimatedAttrition
- All named constants: `ARMY_SIZE_HEADCOUNT`, `ARMY_QUINTESSENCE_BASE`, `ARMY_MAINTENANCE_COST`, `ARMY_SPAWN_IRON_TIER_MIN=4`, `ARMY_SPAWN_GOLD_TIER_MIN=3`, `ARMY_CREATION_GOLD_COST=50`, `MAX_ARMIES_PER_FACTION=1`
- `determineSizeCategory(goldTier)` — pure deterministic function

### Task 2: Army Spawning Engine (`src/engine/armySpawning.ts`)
- `isEligibleForArmySpawn(state, factionId)` — checks ambition type, Iron/Gold tiers, and army count cap
- `selectCommander(state, factionId)` — returns highest Iron-tier individual member, deterministic, skips members already commanding
- `spawnArmy(state, factionId, commanderId, ambitionNodeId)` — creates actor node with armyState, wires commanded_by/member_of/located_at/pursues edges, emits lifecycle trace
- Fail-soft: returns null on any missing data (no commander, no location, node creation failure)

### Task 3: Army Encounter Templates (`src/data/army-encounter-content.ts`)
- `mc.army.raise` — 2-step raise encounter (Iron muster + Gold pay gates), registered in ARMY_ENCOUNTER_TEMPLATES
- `army.threshold.supply_crisis` — 2-step (Eye + Gold)
- `army.threshold.desertion` — 2-step (Heart + Iron)
- `army.threshold.mutiny` — 2-step (Heart + Iron, deadly)
- `army.threshold.disbandment` — 1-step auto-fail narrative beat
- `ArmyEncounterMeta` interface and `ARMY_ENCOUNTER_META` lookup map
- Registered in `encounter-content.ts` aggregator via `getArmyEncounterById`

### Task 4: Orchestrator Wiring (`src/engine/factionAmbitions.ts`)
- `spawnArmy` called from `phaseFactionAmbitions` when `requiresMilitaryForce(ambition) && isEligibleForArmySpawn()`
- Fires at tick position 6.651 (after phaseAmbitionProgress)
- Slow evaluation: every 5 ticks per faction

### Task 5: Tests (`src/engine/__tests__/armySpawning.test.ts`)
- 12 test cases covering all eligibility conditions, commander selection, army node creation, edge wiring, deterministic ID, and fail-soft behavior
- All 465 test files pass (6969 tests)

### Task 6: Pre-Commit Verification
- `npm test` — 465 passed, 6 skipped
- `npx tsc --noEmit` — clean
- `npx vite build` — succeeds (2.79MB bundle, expected)

## Deviations from Plan

### Auto-added: ArmyEncounterMeta type and ARMY_ENCOUNTER_META export

**Found during:** Task 3 completion check — these were in the plan's artifact spec but missing from initial implementation.

**Fix:** Added `ArmyEncounterMeta` interface and `ARMY_ENCOUNTER_META` ReadonlyMap to `army-encounter-content.ts`. Added `ARMY_RAISE_TEMPLATE` constants (`ARMY_RAISE_IRON_DIFFICULTY=40`, `ARMY_RAISE_GOLD_DIFFICULTY=45`).

**Files modified:** `src/data/army-encounter-content.ts`

**Commit:** e8e8af4

### Implementation note: Direct spawn vs. encounter-gated spawn

The plan described `mc.army.raise` as the spawn trigger, but implementation calls `spawnArmy()` directly from `phaseFactionAmbitions`. The `mc.army.raise` template exists as a narrative/UI reference and for the encounter content aggregator, but spawning is direct for determinism and to avoid encounter queue latency. The eligibility checks in `isEligibleForArmySpawn()` enforce the same Iron Tier 4+ and Gold Tier 3+ gates described in the template.

## Self-Check

- [x] `src/types/army.ts` — created with all required exports
- [x] `src/engine/armySpawning.ts` — created with spawnArmy, isEligibleForArmySpawn, selectCommander
- [x] `src/data/army-encounter-content.ts` — mc.army.raise + threshold templates + ARMY_ENCOUNTER_META
- [x] `src/engine/__tests__/armySpawning.test.ts` — 12 test cases, all passing
- [x] Commits exist: a6d314f (main work), e8e8af4 (encounter templates completion)

## Self-Check: PASSED
