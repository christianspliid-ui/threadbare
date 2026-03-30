---
phase: 10-sphere-affinity
plan: 02
subsystem: engine
tags: [sphere-affinity, world-soul, pressure-resolution, aggregation, orchestrator]

# Dependency graph
requires:
  - phase: 10-sphere-affinity/10-01
    provides: SphereAffinity type, SpherePressureEvent type, seeding functions, SPHERE_ALLIES/SPHERE_OPPOSITES in cosmology.ts
provides:
  - phaseSpherePressure: full pressure resolution with opposition cancellation, allied defense, erosion, construction, agent presence buffer
  - phaseSphereAggregation: global World-Soul aggregate from entity scores, FundamentState.sphereWeights derived
  - SphereAggregate type in types/worldSoul.ts
  - Both phases wired into orchestrator at positions 6.639 and 6.6395
affects: [10-sphere-affinity/10-03, 10-sphere-affinity/10-04, engine-phases, world-soul]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - isValidSphereAffinity type guard protects against legacy bare-string sphere values in graph nodes
    - SphereAggregate defined in types layer to avoid circular imports with engine layer
    - Phase functions return Partial<GameState> (empty {} for no-op, updated fields otherwise)
    - Opposition cancellation uses visited-set to process each pair once (symmetric SPHERE_OPPOSITES)

key-files:
  created:
    - src/engine/phaseSpherePressure.ts
    - src/engine/phaseSphereAggregation.ts
    - src/engine/__tests__/phaseSpherePressure.test.ts
    - src/engine/__tests__/phaseSphereAggregation.test.ts
  modified:
    - src/engine/orchestrator.ts
    - src/types/worldSoul.ts

key-decisions:
  - "SphereAggregate type lives in types/worldSoul.ts, not engine file — avoids circular import worldSoul.ts ↔ phaseSphereAggregation.ts"
  - "isValidSphereAffinity guard checks for .scores and .progress objects — worldSeed.ts stores bare SphereName string in artifact.sphereAffinity, not a SphereAffinity object"
  - "phaseSpherePressure returns {} (empty) when no pending pressures — avoids graph copy overhead on idle ticks"
  - "Agent presence buffer uses AGENT_PRESENCE_RATIO=1.0 from sphereAffinity.ts constants — tuneable"
  - "cancelOppositions: larger magnitude wins, remainder stays; equal magnitudes → both zero"
  - "constructive pressure: classifyPressureForEntity checks if entity has score in opposite sphere first; if so, pressure is destructive to that sphere"

patterns-established:
  - "Fail-soft for legacy data: isValidSphereAffinity type guard silently skips malformed nodes"
  - "Circular import prevention: shared types go in types/ layer, engine files import from types/"
  - "TDD pattern: tests written first (RED), minimal implementation to pass (GREEN), type-check clean"

requirements-completed: [SPHR-04, SPHR-05, SPHR-06, SPHR-07, SPHR-08, SPHR-09, SPHR-10, SPHR-15, SPHR-16, SPHR-26, SPHR-27]

# Metrics
duration: 12min
completed: 2026-03-28
---

# Phase 10 Plan 02: Sphere Pressure Resolution Engine Summary

**Opposition-cancellation pressure engine with allied defense, erosion, construction, and agent presence buffer; global World-Soul aggregation deriving FundamentState.sphereWeights from entity scores**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-03-28T17:30:00Z
- **Completed:** 2026-03-28T17:44:45Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Full pressure resolution engine: 4 outcomes (absorbed, eroded, progress, level_up) with typed SpherePressureTrace
- Opposition cancellation correctly handles all 4 pairs (Force/Energy, Life/Entropy, Mind/Time, Spirit/Matter)
- Allied defense adds floor(ally/2) to defensive threshold; agent presence buffer adds agent scores
- Global World-Soul aggregate computed each tick from weighted entity scores; FundamentState.sphereWeights kept in sync for backward compat
- Both phases wired at positions 6.639 and 6.6395 in orchestrator, all 21 orchestrator integration tests pass
- 45 new tests (28 pressure + 17 aggregation) all passing; no regressions in 6649-test suite

## Task Commits

Each task was committed atomically:

1. **Task 1: Pressure resolution engine** - `04488f4` (feat)
2. **Task 2: Aggregation + orchestrator wiring** - `a62b95c` (feat)

## Files Created/Modified
- `src/engine/phaseSpherePressure.ts` - Full pressure resolution engine: netPressuresBySphere, cancelOppositions, resolveSpherePressure, effectiveHexThreshold, phaseSpherePressure
- `src/engine/phaseSphereAggregation.ts` - Aggregation phase: normalizeAggregate, computeFoundationBalance, getDominantSphere, phaseSphereAggregation + ENTITY_AGGREGATE_WEIGHT constants
- `src/engine/__tests__/phaseSpherePressure.test.ts` - 28 tests covering all resolution outcomes, opposition cancellation, allied defense, agent presence buffer, MAX_SPHERE_SCORE cap
- `src/engine/__tests__/phaseSphereAggregation.test.ts` - 17 tests covering normalization, foundation axes, entity weighting, fail-soft
- `src/engine/orchestrator.ts` - Added imports + two phase insertions at 6.639/6.6395
- `src/types/worldSoul.ts` - Added SphereAggregate interface; WorldSoulState gains optional aggregate field

## Decisions Made
- SphereAggregate defined in types/worldSoul.ts (not engine) to avoid circular import: worldSoul.ts ↔ phaseSphereAggregation.ts
- isValidSphereAffinity type guard added to both phases — worldSeed.ts stores bare SphereName strings in artifact.sphereAffinity; guard silently skips these
- phaseSpherePressure returns empty {} on no pending pressures (no-op path avoids graph copy cost on idle ticks)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed circular import breaking orchestrator tick loop**
- **Found during:** Task 2 (aggregation + wiring)
- **Issue:** worldSoul.ts importing SphereAggregate from engine/phaseSphereAggregation.ts, which imports WorldSoulState from types/worldSoul.ts — circular import caused runtime crash: "Cannot read properties of undefined (reading 'force')"
- **Fix:** Moved SphereAggregate interface definition to types/worldSoul.ts; phaseSphereAggregation.ts re-exports it via `export type { SphereAggregate } from '../types/worldSoul'`
- **Files modified:** src/types/worldSoul.ts, src/engine/phaseSphereAggregation.ts
- **Verification:** All 21 orchestrator tests pass; no more tick crashes
- **Committed in:** a62b95c (Task 2 commit)

**2. [Rule 1 - Bug] Fixed crash on artifact nodes with bare SphereName strings**
- **Found during:** Task 2 (orchestrator wiring integration test)
- **Issue:** worldSeed.ts stores `sphereAffinity: pickRandom(rng, SPHERE_NAMES)` (a bare string like "force") in artifact properties. Both aggregation and pressure phases called aff.scores[sphere] on this string, crashing with "Cannot read properties of undefined"
- **Fix:** Added isValidSphereAffinity(value) type guard checking for .scores and .progress objects; both phases use this guard before accessing sphere data
- **Files modified:** src/engine/phaseSpherePressure.ts, src/engine/phaseSphereAggregation.ts
- **Verification:** All 21 orchestrator integration tests pass including multi-tick simulation
- **Committed in:** a62b95c (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 bugs)
**Impact on plan:** Both fixes necessary for correctness. Circular import is a structural issue; bare-string artifact affinity is a pre-existing legacy data pattern. No scope creep.

## Issues Encountered
- Circular import detection required running the orchestrator integration test — tsc --noEmit didn't catch it (type-only circular imports compile but crash at runtime)
- Legacy artifact data pattern (bare SphereName string vs SphereAffinity object) is a pre-existing inconsistency in worldSeed.ts — deferred to deferred-items

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Pressure resolution and aggregation fully functional and integrated
- Both phases fire each tick in orchestrator; World-Soul updates automatically
- Ready for Plan 03 (sphere pressure emission from upstream phases: actions, encounters, control effects)
- Note: The bare-string artifact.sphereAffinity in worldSeed.ts is a cleanup item (Plan 02 deferred it)

---
*Phase: 10-sphere-affinity*
*Completed: 2026-03-28*
