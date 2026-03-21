---
phase: 02-world-generation
plan: "03"
subsystem: worldgen
tags: [hydrology, rivers, lakes, depression-filling, worldgen, pipeline, validation]

requires:
  - phase: 02-world-generation-02
    provides: climate fields, biome classification, adjacency smoothing (passes 04-08)

provides:
  - Hydrology pass (pass05): fillDepressions → generateRivers → promoteDepressionLakes → generateLakeOutflows → canyon carving
  - Validation pass (pass09): drainage guarantee, province coverage, terrain distribution checks
  - Updated generateWorld() in hexGrid.ts using full WorldGenPipeline (rivers, lakes, biomes, validation)
  - Per-pass timing collection in WorldGenPipeline.passTiming

affects:
  - phase 03 (coastline/water rendering will use hasRiver and lakeIds)
  - hexGrid.ts callers (generateWorld() now returns pipeline-generated tiles with rivers)

tech-stack:
  added: []
  patterns:
    - "Terrain seeding before biome pass: hydrology pass pre-seeds terrain with ocean/land/shallows so river routing works before pass07-biome classifies full biomes"
    - "WorldGenPipeline.passTiming: readonly Record collecting elapsed ms per pass for performance inspection"
    - "Fail-soft hydrology: each sub-step (fillDepressions, generateRivers, etc.) in its own try/catch"

key-files:
  created:
    - src/engine/worldgen/passes/pass05-hydrology.ts
    - src/engine/worldgen/passes/pass09-validation.ts
    - src/engine/worldgen/__tests__/hydrology.test.ts
    - src/engine/worldgen/__tests__/validation.test.ts
  modified:
    - src/engine/worldgen/WorldGenPipeline.ts
    - src/engine/worldgen/constants.ts
    - src/engine/hexGrid.ts

key-decisions:
  - "Terrain seeding before biome pass: hydrology pass seeds terrain array from isOcean+elevation before generateRivers runs, since biome pass hasn't classified terrain yet — without this, all hexes appear as ocean and no rivers generate"
  - "generateWorld() now uses WorldGenPipeline exclusively — old forceField+classifyBiome path removed; cosmology parameter accepted for API compatibility but deferred to future integration"
  - "ValidationResult drainageGuaranteed uses 5% violation threshold — fillDepressions guarantees a path to sea but some plateau hexes only have equal-elevation neighbors (flat traversal)"

requirements-completed:
  - WGEN-05
  - WGEN-12
  - WGEN-13

duration: 10min
completed: 2026-03-21
---

# Phase 02 Plan 03: World Generation Hydrology Summary

**Hydrology pipeline pass integrating fillDepressions + generateRivers + lake promotion into the multi-pass worldgen, wiring generateWorld() to the full 9-pass pipeline with validation**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-21T21:02:39Z
- **Completed:** 2026-03-21T21:12:00Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Added pass05-hydrology.ts: depression filling → river generation → lake promotion → lake outflows → canyon carving, with terrain pre-seeding so routing works before biome classification
- Added pass09-validation.ts: structural integrity checks for drainage guarantee, province coverage, land/ocean balance, river count, terrain distribution
- Updated hexGrid.ts generateWorld() to use WorldGenPipeline — world now includes rivers, lakes, proper biomes, and validation
- Added 26 TDD tests covering all hydrology behaviors (sea outlet, downhill flow, lakes, drainage guarantee, delta forking, determinism) and end-to-end validation (generateWorld HexTile[], geoParams range, terrain variety, determinism)

## Task Commits

1. **Task 1: Hydrology pass** - `2bed6bd` (feat)
2. **Task 2: Validation pass + hexGrid integration** - `d9789ac` (feat)

## Files Created/Modified

- `src/engine/worldgen/passes/pass05-hydrology.ts` - Hydrology pipeline pass with 6-step ordering; pre-seeds terrain for routing
- `src/engine/worldgen/passes/pass09-validation.ts` - Validation pass: ValidationResult interface + drainage/coverage/balance checks
- `src/engine/worldgen/WorldGenPipeline.ts` - Added hydrology and validation passes; added passTiming record
- `src/engine/worldgen/constants.ts` - Added DELTA_FORK_DISTANCE_FROM_COAST, DELTA_FAN_ANGLE, DELTA_BRANCH_COUNT, WETLAND_SPAWN_PROBABILITY
- `src/engine/hexGrid.ts` - Replaced old forceField+classifyBiome with WorldGenPipeline; added toHexTilesFromContext()
- `src/engine/worldgen/__tests__/hydrology.test.ts` - 10 TDD hydrology tests
- `src/engine/worldgen/__tests__/validation.test.ts` - 16 TDD validation + end-to-end tests

## Decisions Made

- **Terrain seeding before biome pass:** At hydrology time, ctx.terrain is all 'ocean' (pass00-grid default). River routing (routeRiver) checks terrain to identify coastal_shallows and ocean hex types. Without pre-seeding, all hexes look like ocean and rivers never generate. The hydrology pass now seeds terrain from isOcean+elevation before calling generateRivers. Biome pass (pass07) overwrites with full Whittaker classification.
- **5% drainage violation threshold:** fillDepressions guarantees every hex has a path to sea via the drainageElevation surface. However, the validation check (checking for a strictly lower neighbor) can see violations at plateau hexes where all neighbors have equal elevation — they drain via the filled surface but don't have a strictly lower direct neighbor. 5% tolerance captures this reality.
- **generateWorld() removed cosmology dependency:** The old generateWorld used cosmology-biased forceField. The new pipeline uses the WorldGenPipeline which doesn't yet support cosmology weighting. The cosmology parameter is accepted for API compatibility but ignored — full integration deferred.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Terrain array must be pre-seeded before river generation**
- **Found during:** Task 1 (hydrology pass GREEN phase — tests showed 0 rivers generated)
- **Issue:** At hydrology pass time, ctx.terrain is initialized to all 'ocean' by pass00-grid. River routing uses terrain to identify ocean/coastal_shallows termination points, and uses isOcean to identify land hexes. With all terrain = 'ocean', generateRivers found no valid land sources and routed nothing.
- **Fix:** Added seedTerrainForHydrology() which sets ocean/land/coastal_shallows from isOcean+elevation before calling generateRivers. Biome pass overwrites these with full classification.
- **Files modified:** src/engine/worldgen/passes/pass05-hydrology.ts
- **Verification:** All 10 hydrology tests pass; hasRiver sum > 0; riverPaths non-empty
- **Committed in:** 2bed6bd (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Critical fix — without terrain pre-seeding the entire hydrology pass was a no-op. No scope creep.

## Issues Encountered

- Pre-existing test failures in unrelated modules (familiarity-integration, movement trail constants, trace buffer, MandateTracker) confirmed pre-existing before our changes via git stash verification — all 79 worldgen tests pass, TypeScript compiles clean, build succeeds.

## Next Phase Readiness

- Full worldgen pipeline operational: grid → provinces → elevation → coastline → climate → hydrology → tempReassess → biome → smoothing → validation
- generateWorld() returns HexTile[] with rivers, lakes, full biomes — Phase 1 renderer can display generated worlds
- ctx.hasRiver and ctx.lakeIds ready for Phase 3 coastline/water rendering
- Phase 2 complete — all 3 plans delivered

---
*Phase: 02-world-generation*
*Completed: 2026-03-21*

## Self-Check: PASSED

- src/engine/worldgen/passes/pass05-hydrology.ts — FOUND
- src/engine/worldgen/passes/pass09-validation.ts — FOUND
- src/engine/worldgen/__tests__/hydrology.test.ts — FOUND
- src/engine/worldgen/__tests__/validation.test.ts — FOUND
- Commit 2bed6bd — FOUND
- Commit d9789ac — FOUND
