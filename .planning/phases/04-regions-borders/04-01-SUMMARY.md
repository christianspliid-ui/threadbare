---
phase: 04-regions-borders
plan: 01
subsystem: engine
tags: [region-detection, worldgen, watershed, terrain, typescript]

# Dependency graph
requires:
  - phase: 03-coastlines-water-elevation
    provides: WorldGenResult with riverPaths used for river-edge boundary costs
  - phase: 02-world-generation
    provides: province capital hexes used as region seeds

provides:
  - Border-cost watershed geographic region detection (detectRegionsBorderCost)
  - Shared region type contracts (RegionData, BaronyRegion, KingdomRegion, RegionCluster, RegionLabel)
  - WorldGenResult.regionData field with geographicRegions and hexRegionId
  - edgeBorderCost() pure function for edge classification (coast/mountain/river/steep/biome/same)
  - TERRAIN_TO_FEATURE coverage for all 42 TerrainType values

affects:
  - 04-02 (political region assignment reads geographicRegions and hexRegionId)
  - 04-03 (label placement reads RegionCluster centroids and RegionLabel interface)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dijkstra-style flood fill with MinHeap for O(n log n) watershed region detection"
    - "TDD RED-GREEN per task with atomic commits"
    - "NFP compliance inline: constants table, tracing maps, fail-soft try/catch"

key-files:
  created:
    - src/engine/regionTypes.ts
  modified:
    - src/engine/regionDetection.ts
    - src/engine/hexGrid.ts
    - src/engine/__tests__/regionDetection.test.ts

key-decisions:
  - "RegionCluster id field added to legacy detectRegions() for backward compat — returns sequential int starting at 0"
  - "coast/coastal_shallows/reef map to 'sea' feature type (not a separate 'coast' category)"
  - "plateau maps to 'hill_country' (elevated flat terrain, topographically similar to hills)"
  - "oasis maps to 'desert' (contextually desert-adjacent, prevents orphaned single-hex classification)"
  - "detectRegionsBorderCost uses province capital hexes as seeds; fallback auto-places seeds every sqrt(120) hexes"
  - "REGION_MIN_SIZE=20 means test grids must have >20 hexes per side to test boundary separation"
  - "RegionData.baronies/kingdoms/labels initialized empty — Plan 02 fills these"
  - "Fail-soft: region detection errors caught in generateWorld() so worldgen never crashes due to region detection"

patterns-established:
  - "regionTypes.ts as single source of truth for region interfaces (not regionDetection.ts)"
  - "hexRegionId Map<string, number> keyed by 'col,row' for O(1) per-hex region lookup"
  - "MinHeap implemented inline (~30 lines) rather than as external dependency"

requirements-completed: [REGN-01, REGN-02, REGN-03]

# Metrics
duration: 8min
completed: 2026-03-22
---

# Phase 4 Plan 1: Geographic Region Detection Engine Summary

**Border-cost watershed detection (Dijkstra flood fill with MinHeap) producing geographically natural regions bounded by mountains, rivers, and coastlines, threaded through WorldGenResult.regionData.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-22T10:02:09Z
- **Completed:** 2026-03-22T10:09:42Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Created `regionTypes.ts` with the complete shared type contract: `RegionData`, `BaronyRegion`, `KingdomRegion`, `RegionLabel`, `RegionCluster` (all interfaces Plans 02 and 03 depend on)
- Upgraded `TERRAIN_TO_FEATURE` to cover all 42 `TerrainType` values: added `plateau`, `oasis`, `coast`, `coastal_shallows`, `reef` (were missing)
- Implemented `edgeBorderCost()` with the priority hierarchy: coast=1.0 > mountain=0.9 > river=0.7 > steep elevation=0.5 > biome change=0.4 > same terrain=0.1
- Implemented `detectRegionsBorderCost()` with Dijkstra flood fill, small-region merge (< REGION_MIN_SIZE=20), large-region split (> REGION_MAX_SIZE=200), and snapped centroids
- Threaded `regionData` through `WorldGenResult` — `generateWorld()` now returns geographic regions for all downstream renderers

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: TERRAIN_TO_FEATURE/edgeBorderCost/RegionCluster id tests** - `370a67a` (test)
2. **Task 1 GREEN: regionTypes.ts + regionDetection.ts upgrade** - `0fbe9e1` (feat)
3. **Task 2 RED: detectRegionsBorderCost + WorldGenResult tests** - `0c1d0e8` (test)
4. **Task 2 GREEN: watershed detection + hexGrid.ts threading** - `af50f4a` (feat)

_TDD tasks have RED + GREEN commits (no REFACTOR needed — implementation was clean)._

## Files Created/Modified

- `src/engine/regionTypes.ts` — Created: shared interfaces for regions across Phase 4 (RegionData, BaronyRegion, KingdomRegion, RegionLabel, RegionCluster)
- `src/engine/regionDetection.ts` — Updated: TERRAIN_TO_FEATURE coverage, edgeBorderCost(), BORDER_COSTS, REGION_* constants, detectRegionsBorderCost(), MinHeap, updated RegionCluster with id field
- `src/engine/hexGrid.ts` — Updated: WorldGenResult.regionData field, detectRegionsBorderCost call in generateWorld(), fail-soft try/catch
- `src/engine/__tests__/regionDetection.test.ts` — Updated: 23 tests covering all acceptance criteria

## Decisions Made

- `coast`, `coastal_shallows`, `reef` map to `'sea'` (not a separate category) — these are transition zones, not landward biomes
- `plateau` maps to `'hill_country'` — topographically elevated flat terrain, behaves like hills for region clustering
- `oasis` maps to `'desert'` — contextually desert-adjacent, prevents isolated single-hex classification
- Province capital hexes used as region seeds — each capital anchors one natural geographic region
- Auto-seed fallback: every `sqrt(REGION_TARGET_SIZE)` = ~11 hexes on land if no capitals provided

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test grid sizes adjusted for REGION_MIN_SIZE constraint**
- **Found during:** Task 2 (mountain-wall and river-boundary tests)
- **Issue:** Tests used grids where each side had <20 hexes, so both sides merged into one region (correct behavior, wrong test assumption)
- **Fix:** Increased test grids to 12+ rows so each side has >20 hexes (24 hexes per side for mountain test, 30 for river test)
- **Files modified:** src/engine/__tests__/regionDetection.test.ts
- **Verification:** Tests pass with revised grid sizes
- **Committed in:** 0c1d0e8 (Task 2 RED) and af50f4a (Task 2 GREEN)

---

**Total deviations:** 1 auto-fixed (Rule 1 - test assumption bug)
**Impact on plan:** No scope creep. Fix was a test-size correction, not an algorithm change.

## Issues Encountered

Pre-existing test failures (7 files) confirmed to be unrelated to this plan's changes: familiarity-integration, content-layer1-integration, traceBuffer-integration, MandateTracker, MovementTrails, movementExecution, movement-p2-integration. All failures existed before plan execution (verified via `git stash` comparison).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `regionTypes.ts` exports all interfaces Plan 02 (political regions) and Plan 03 (label placement) depend on
- `WorldGenResult.regionData.geographicRegions` populated after `generateWorld()` call
- `hexRegionId` map enables O(1) per-hex region lookup for border rendering
- `baronies`, `kingdoms`, `labels` arrays initialized empty — Plan 02 fills baronies/kingdoms

---
*Phase: 04-regions-borders*
*Completed: 2026-03-22*

## Self-Check: PASSED

All key files confirmed present on disk:
- FOUND: src/engine/regionTypes.ts
- FOUND: src/engine/regionDetection.ts
- FOUND: src/engine/hexGrid.ts
- FOUND: src/engine/__tests__/regionDetection.test.ts
- FOUND: .planning/phases/04-regions-borders/04-01-SUMMARY.md

All task commits verified in git log:
- 370a67a - test RED Task 1
- 0fbe9e1 - feat GREEN Task 1
- 0c1d0e8 - test RED Task 2
- af50f4a - feat GREEN Task 2
- b16275d - docs metadata commit
