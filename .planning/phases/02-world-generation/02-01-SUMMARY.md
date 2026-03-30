---
phase: 02-world-generation
plan: "01"
subsystem: worldgen-pipeline
tags: [worldgen, provinces, elevation, ridges, coastline, culture, determinism]
dependency_graph:
  requires:
    - src/engine/worldGenData.ts
    - src/lib/prng.ts
    - src/lib/hexMath.ts
    - src/engine/terrain.ts
  provides:
    - src/engine/worldgen/types.ts
    - src/engine/worldgen/constants.ts
    - src/engine/worldgen/WorldGenPipeline.ts
    - src/engine/worldgen/passes/pass00-grid.ts
    - src/engine/worldgen/passes/pass01-provinces.ts
    - src/engine/worldgen/passes/pass02-elevation.ts
    - src/engine/worldgen/passes/pass03-coastline.ts
  affects:
    - src/types/culture.ts
    - src/data/culture-content.ts
    - src/data/historical-culture-content.ts
tech_stack:
  added:
    - simplex-noise (createNoise2D) — seeded 2D simplex noise for elevation
    - MinHeap (inline) — priority queue for province flood-fill
  patterns:
    - Multi-pass pipeline architecture with per-pass PRNG streams
    - WorldGenContext as mutable shared state passed through all passes
    - Weighted flood-fill from culture/wilderness seeds
    - Ridge spine random-walk with cosine falloff foothills
    - Province-biased elevation blending via exponential decay
key_files:
  created:
    - src/engine/worldgen/types.ts
    - src/engine/worldgen/constants.ts
    - src/engine/worldgen/WorldGenPipeline.ts
    - src/engine/worldgen/passes/pass00-grid.ts
    - src/engine/worldgen/passes/pass01-provinces.ts
    - src/engine/worldgen/passes/pass02-elevation.ts
    - src/engine/worldgen/passes/pass03-coastline.ts
    - src/engine/worldgen/__tests__/pipeline.test.ts
    - src/engine/worldgen/__tests__/provinces.test.ts
    - src/engine/worldgen/__tests__/elevation.test.ts
    - src/engine/worldgen/__tests__/sampling.test.ts
  modified:
    - src/types/culture.ts (added preferredBiomes, toleratedBiomes)
    - src/data/culture-content.ts (BiomeModifier expanded; all 32 entries updated)
    - src/data/historical-culture-content.ts (8 templates expanded)
decisions:
  - Province role radii scaled proportionally to province extent (not fixed distance) to handle small test grids
  - PROVINCE_ROLE_* consts exported from types.ts (not constants.ts) to avoid circular-import risk
  - Province flood-fill uses strict PROVINCE_MIN_SEED_DISTANCE — no distance relaxation fallback
  - Wilderness provinces fail gracefully if no valid seed hex found (NFP #4)
  - Ridge orientation stored as atan2 of spine direction, normalized to [0, 2*PI)
metrics:
  duration: ~25 minutes
  completed_date: 2026-03-21
  tasks_completed: 2
  files_created: 11
  files_modified: 3
  tests_added: 28
---

# Phase 02 Plan 01: WorldGen Pipeline Scaffold, Province Seeding, Elevation — Summary

Multi-pass WorldGenPipeline built with province-first generation and simplex-noise elevation field with ridge mountain ranges, canyon features, and detailed coastline geometry.

## What Was Built

### Core Pipeline Architecture

`WorldGenPipeline.run(params)` orchestrates four passes in order:
- **Pass 00 (Grid):** Allocates all typed arrays — Float32Array for elevation/temperature/moisture, Uint8Array for isOcean/hasRiver, Int16Array for provinceIds/lakeIds, province arrays
- **Pass 01 (Provinces):** Seeds province centers (one per living culture, one per lost culture, N wilderness), then flood-fills all hexes using a min-heap priority queue with directional cost growth
- **Pass 02 (Elevation):** Multi-octave simplex noise + ridge overlay (cosine falloff) + canyon carving + province bias via exponential decay
- **Pass 03 (Coastline):** High-frequency coastal noise + island chain generator + peninsula generator + bay carver

All passes are wrapped in try/catch (NFP #4 Fail-soft). Pass timing logged in dev mode.

### Province System

Province seeding uses `BIOME_TEMP_BANDS` to place culture seeds at climatically compatible latitudes (desert cultures near equator, tundra cultures near poles). Province roles (capital/heartland/borderland) are assigned proportionally to each province's actual hex extent — not with fixed absolute distances — so they work correctly on both small test grids and 60K-hex production grids.

### Elevation System

Ridge mountain ranges use a random-walk with directional momentum (`RIDGE_STEP_VARIANCE = PI/12` per step). Ridge falloff is cosine-curved over `RIDGE_FOOTHILLS_HEXES = 4` distance. Province bias blends each hex toward the province's target elevation range (mountain/forest/lowland) with strength decaying as `exp(-dist * PROVINCE_BIAS_DECAY_RATE)`.

### 7-Point Hex Sampling

`sample7Point(col, row, fn, hexSize)` — averages center + 6 flat-top hex corners for smooth field values. Exported from pass02-elevation.ts for use by Phase 3 coastline rendering.

### Culture Expansion

`CultureIdentity` gained `preferredBiomes: TerrainType[]` and `toleratedBiomes: TerrainType[]` (32 BiomeModifier entries + 8 HistoricalCultureTemplate entries updated). The existing `primaryBiome` field is preserved for backward compatibility.

## Test Results

28 tests passing across 4 test files:

| File | Tests | Focus |
|------|-------|-------|
| pipeline.test.ts | 3 | Determinism, required fields, different seeds |
| provinces.test.ts | 8 | Coverage, climate placement, min distance, max size, roles |
| elevation.test.ts | 10 | Range, ridges, sea level, determinism, bias |
| sampling.test.ts | 7 | 7-point sampling correctness, range, smoothing |

TypeScript compiles with no errors. Full project test suite: 5429 existing tests pass, 10 failures are pre-existing and unrelated to worldgen.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] PROVINCE_ROLE consts imported from wrong module**
- **Found during:** Task 1 — GREEN phase debugging
- **Issue:** province pass imported `PROVINCE_ROLE_CAPITAL/HEARTLAND/BORDERLAND` from `../constants` where they don't exist (they're in `../types`)
- **Fix:** Changed imports to use `../types` — all role constants now correctly resolve
- **Files modified:** src/engine/worldgen/passes/pass01-provinces.ts
- **Commit:** bb16c3b

**2. [Rule 1 - Bug] Province roles only showing 1 value on small test grids**
- **Found during:** Task 1 — test failures
- **Issue:** Fixed absolute role radii (capital=3, heartland=8) covered entire 20x30 test grid, leaving no borderland hexes
- **Fix:** Switched to proportion-based role assignment: capital = bottom 15% of province extent, heartland = next 40%, borderland = remainder
- **Files modified:** src/engine/worldgen/passes/pass01-provinces.ts
- **Commit:** bb16c3b

**3. [Rule 2 - Missing] Province seed distance: removed unsafe relaxation fallback**
- **Found during:** Task 1 — test for min seed distance failed because last-resort fallback halved the minimum distance
- **Fix:** Removed the distance-relaxation fallback; provinces that can't be placed with full min distance are simply not placed (fail gracefully, NFP #4)
- **Files modified:** src/engine/worldgen/passes/pass01-provinces.ts
- **Commit:** bb16c3b

## Self-Check: PASSED

All 7 key files found. All 3 task commits verified (c1d27ea, bb16c3b, 25b7568).

| Check | Result |
|-------|--------|
| src/engine/worldgen/types.ts | FOUND |
| src/engine/worldgen/constants.ts | FOUND |
| src/engine/worldgen/WorldGenPipeline.ts | FOUND |
| src/engine/worldgen/passes/pass00-grid.ts | FOUND |
| src/engine/worldgen/passes/pass01-provinces.ts | FOUND |
| src/engine/worldgen/passes/pass02-elevation.ts | FOUND |
| src/engine/worldgen/passes/pass03-coastline.ts | FOUND |
| commit c1d27ea (RED tests) | FOUND |
| commit bb16c3b (implementation) | FOUND |
| commit 25b7568 (GREEN tests) | FOUND |
