---
phase: 12-conflict-destruction
plan: 03
subsystem: engine
tags: [army, movement, attrition, quintessence, pathfinding, TB-073]

# Dependency graph
requires:
  - phase: 12-02
    provides: "army entity type (ArmyState), armySpawning.ts, actor node with armyState property"
provides:
  - "phaseArmyMovement: objective-driven pathfinding for army actors"
  - "phaseArmyAttrition: quintessence degradation with threshold encounter spawning"
  - "Army movement constants: ARMY_MOVEMENT_COST_MULTIPLIERS, ARMY_ROAD_DISCOUNT, ARMY_SPEED"
  - "disbandArmy: remove army node on quintessence depletion, release commander"
affects: [12-04, battle-detection, battle-resolution]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Army actors use actorType=group with armyState property bag — no new node type"
    - "phaseArmyMovement uses findShortestPath + army-specific cost calculation for route initiation"
    - "phaseArmyAttrition emits faction_ambition traces for all attrition events"
    - "Threshold crossings tracked in armyState.thresholdsFired to prevent re-firing"

key-files:
  created:
    - src/engine/__tests__/armyMovement.test.ts
  modified:
    - src/engine/armyMovement.ts
    - src/engine/orchestrator.ts

key-decisions:
  - "phaseArmyMovement added as separate phase at 2.352, NOT merged into phaseMovement (phaseMovement filters to individual actors only)"
  - "Army edge costs computed directly using getArmyMovementCost + ARMY_SPEED in phaseArmyMovement to avoid circular dep movementCost.ts → armyMovement.ts"
  - "Standard findShortestPath used for route selection (approximately correct for armies; army-specific cost scaling applied to movement queue tick speed)"

patterns-established:
  - "Army movement phase: initiate queue on first tick with objective, tick queue on subsequent ticks"
  - "Army attrition: runs every tick regardless of movement; terrain from current located_at"

requirements-completed: [TB-073]

# Metrics
duration: 25min
completed: 2026-03-29
---

# Phase 12 Plan 03: Army Movement and Attrition Summary

**Army movement phase (objective-driven pathfinding) + quintessence attrition (threshold encounters at 70/50/30/10%) with full disband-on-depletion lifecycle**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-03-29T22:36:00Z
- **Completed:** 2026-03-29T22:41:30Z
- **Tasks:** 7 (1-2 army movement, 3-4 attrition, 5 orchestrator, 6 tests, 7 verification)
- **Files modified:** 3

## Accomplishments

- `phaseArmyMovement` added to `armyMovement.ts`: armies with `armyState.objective` pathfind to target using `findShortestPath`, armies with existing movement queues are ticked each tick using army-specific costs
- `phaseArmyAttrition` (pre-existing) verified complete with all threshold logic and disbandment
- Both phases wired into orchestrator at 2.352 (movement) and 2.355 (attrition)
- 20 new tests in `armyMovement.test.ts` covering constants, cost functions, and phase behavior
- All 6989 tests pass, type check clean, production build succeeds

## Task Commits

1. **Task 1-2+5: Army movement + orchestrator wiring** - `ca8e9dc` (feat)
2. **Task 6: armyMovement.test.ts** - `c083674` (test)

## Files Created/Modified

- `src/engine/armyMovement.ts` - Added `phaseArmyMovement` function + GameState/pathfinding imports
- `src/engine/orchestrator.ts` - Added `phaseArmyMovement` import + phase 2.352 call
- `src/engine/__tests__/armyMovement.test.ts` - 20 tests for movement constants and phase behavior

## Decisions Made

- `phaseArmyMovement` kept as separate function in `armyMovement.ts` (not merged into `phaseMovement`) because `phaseMovement` filters `actorType === 'individual'` only. Modifying that filter would risk breaking existing behavior.
- Army edge costs computed locally in `phaseArmyMovement` using `getArmyMovementCost + ARMY_SPEED` to avoid circular dependency: `movementCost.ts` → `armyMovement.ts` → `movementCost.ts`.
- Standard `findShortestPath` used for route selection. Route is approximately correct (standard terrain costs block water etc.); army-specific slower speeds applied to tick accumulation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Avoided circular import between movementCost.ts and armyMovement.ts**
- **Found during:** Task 2 (movement execution integration)
- **Issue:** The plan suggested injecting army costs into `computeEdgeCost` which would require `movementCost.ts` importing from `armyMovement.ts`, while `armyMovement.ts` needed to import `computeEdgeCost`. Circular dep.
- **Fix:** Army edge costs computed directly in `phaseArmyMovement` without going through `computeEdgeCost`. Standard `findShortestPath` is used for route planning; army speed scaling applied to the first-edge cost calculation.
- **Files modified:** src/engine/armyMovement.ts
- **Committed in:** ca8e9dc

---

**Total deviations:** 1 auto-fixed (1 bug/blocking import cycle)
**Impact on plan:** Route selection uses standard agent costs, which gives approximately correct results (water/ocean impassable in both cost systems). Army speed scaling is correctly applied to movement tick accumulation.

## Issues Encountered

- Tasks 1, 3, 4, 5 were already partially or fully implemented from previous session work (armyAttrition.ts existed and was complete; armyMovement.ts had constants but not the phase function; orchestrator had phaseArmyAttrition but not phaseArmyMovement). Added the missing `phaseArmyMovement` function.

## Next Phase Readiness

- Army movement and attrition complete; armies can now march to objectives and lose quintessence
- Ready for Phase 12-04: Battle detection (hostile army colocation → battle node) — `phaseBattleDetection` and `phaseBattleTick` are already stub-wired in orchestrator from `battleResolution.ts`
- `armyAttrition.test.ts` already passes with 14 tests; `armyMovement.test.ts` now adds 20 more

---
*Phase: 12-conflict-destruction*
*Completed: 2026-03-29*
