---
phase: 02-world-generation
plan: "02"
subsystem: worldgen
tags: [worldgen, climate, biome, terrain, noise, simplex, temperature, moisture, tdd]

# Dependency graph
requires:
  - phase: 02-world-generation-plan-01
    provides: WorldGenContext with provinces, elevation, coastline, ridges; PASS_SEED_* constants
provides:
  - pass04-climate.ts: temperature field (latitude + altitude + maritime + noise) + moisture field (coastal + rain shadow)
  - pass06-tempReassess.ts: lake effect + river valley temperature/moisture moderation
  - pass07-biome.ts: Whittaker biome classification with elevation/wetland/desert/volcanic overrides
  - pass08-smoothing.ts: illegal biome adjacency elimination with transition biomes
  - 25 TDD tests for climate and biome systems
affects: [02-world-generation-plan-03, hydrology, river-routing, fog-of-war, hex-rendering]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "BFS coast-distance map for maritime moderation (built once per pass, reused for moisture)"
    - "Deterministic integer hash (mulberry32-style bit mixing) for volcanic placement"
    - "fractalNoise from prng.ts for desert sub-type spatial variation"
    - "Fail-soft no-op pattern: check lakeIds/hasRiver before running dependent effects"

key-files:
  created:
    - src/engine/worldgen/passes/pass04-climate.ts
    - src/engine/worldgen/passes/pass06-tempReassess.ts
    - src/engine/worldgen/passes/pass07-biome.ts
    - src/engine/worldgen/passes/pass08-smoothing.ts
    - src/engine/worldgen/__tests__/climate.test.ts
    - src/engine/worldgen/__tests__/biome.test.ts
  modified:
    - src/engine/worldgen/constants.ts
    - src/engine/worldgen/WorldGenPipeline.ts

key-decisions:
  - "Volcanic placement uses mulberry32-style integer hash (not fractalNoise) because fractalNoise distribution never exceeded 0.95 threshold with seed 42 — integer hash gives uniform [0,1) coverage"
  - "Desert subtype selection uses fractalNoise with DESERT_SUBTYPE_NOISE_SCALE=0.15 — produces 4+ distinct types across typical grids"
  - "Wetland override only applies to hexes with elev < ELEV.LOWLAND (0.40) — avoids misclassifying mid-elevation forested terrain"
  - "BFS coast-distance map built separately for land hexes only; ocean hexes treated as distance=0"
  - "pass06-tempReassess fail-soft: checks lakeIds and hasRiver arrays for non-default values before running lake/river effects — no-ops gracefully before hydrology runs"

patterns-established:
  - "TDD RED-GREEN cycle: write failing tests first, implement to pass, no separate refactor commit needed"
  - "Integer hash for deterministic placement at ~5%: (col * 374761393 + row * 668265263 + seed * 1274126177) bit-mixed then / 4294967296"

requirements-completed:
  - WGEN-03
  - WGEN-04
  - WGEN-06
  - WGEN-08
  - WGEN-09
  - WGEN-10
  - WGEN-11

# Metrics
duration: 14min
completed: 2026-03-21
---

# Phase 02 Plan 02: Climate Fields, Biome Classification, and Adjacency Smoothing Summary

**Temperature/moisture climate fields with rain shadow + Whittaker biome classification with elevation/wetland/desert overrides + illegal adjacency smoothing — four pipeline passes, 25 TDD tests, all passing**

## Performance

- **Duration:** 14 min
- **Started:** 2026-03-21T20:42:35Z
- **Completed:** 2026-03-21T20:56:53Z
- **Tasks:** 2 (both TDD)
- **Files modified:** 8 (4 new passes, 2 test files, constants, pipeline)

## Accomplishments

- Climate pass generates latitude-gradient temperature (equatorial 0.6, polar ~0.2), altitude cooling, maritime moderation via BFS coast-distance, and prevailing-wind rain shadow from ridge data
- Biome pass assigns all 27+ terrain types using Whittaker classification + overrides for highlands (mountains/plateau/mountain_pass), wetlands (marsh/swamp/moor_bog/floodplain), desert sub-types (4 variants), and volcanoes (~5% of qualifying hexes)
- Smoothing pass eliminates 24 illegal adjacency pairs (desert+jungle, tundra+tropical_forest, glacier+savanna, etc.) using transition biomes in up to 3 iterations
- Temperature reassessment pass moderates temperature near lakes (lake effect) and boosts temp/moisture along river corridors — fail-soft when hydrology hasn't run yet

## Task Commits

Each task was committed atomically:

1. **Task 1: Climate fields — temperature and moisture with rain shadow** - `4a6efc1` (feat)
2. **Task 2: Temperature reassessment, biome classification, overrides, and adjacency smoothing** - `c87ee2c` (feat)

## Files Created/Modified

- `src/engine/worldgen/passes/pass04-climate.ts` — Temperature (latitude + altitude + maritime + noise) and moisture (coastal + noise - rain shadow) with BFS coast-distance and continuous sampling functions
- `src/engine/worldgen/passes/pass06-tempReassess.ts` — Lake effect moderation (BFS within LAKE_EFFECT_RADIUS) + river valley temperature/moisture boost; fail-soft no-op before hydrology
- `src/engine/worldgen/passes/pass07-biome.ts` — Whittaker classification + elevation overrides (highland/plateau/mountain_pass) + wetland overrides + desert sub-type noise selection + volcanic integer hash
- `src/engine/worldgen/passes/pass08-smoothing.ts` — 24-pair ILLEGAL_ADJACENCIES table + TRANSITION_BIOMES lookup + iterative smoothing (max 3 passes, early exit at <5% change)
- `src/engine/worldgen/__tests__/climate.test.ts` — 10 TDD tests (latitude gradient, altitude penalty, maritime moderation, rain shadow, coastal moisture, value bounds, determinism, continuous sampling)
- `src/engine/worldgen/__tests__/biome.test.ts` — 15 TDD tests (lake effect, river valley, elevation overrides, wetland overrides, desert sub-types, volcanic placement, adjacency smoothing, integration)
- `src/engine/worldgen/constants.ts` — Added 17 new constants for climate, temperature reassessment, biome overrides, and smoothing
- `src/engine/worldgen/WorldGenPipeline.ts` — Wired passes 04, 06, 07, 08; placeholder comment for pass 05 (hydrology, Plan 03)

## Decisions Made

- **Volcanic hash:** Used mulberry32-style integer hash instead of fractalNoise. During testing, fractalNoise with seed 42 + scale 0.1 produced a max normalized value of 0.9496 — never reaching the `> 0.95` threshold. Integer hash gives uniform distribution guaranteeing ~5% volcano rate.
- **Wetland elevation boundary:** Tests revealed `elev=0.40` hits the mid-elevation branch in classifyBiome (`>= ELEV.LOWLAND`). Wetland tests corrected to use `elev=0.39` (strictly below LOWLAND), matching actual game conditions.
- **fractalNoise for desert sub-types:** With `DESERT_SUBTYPE_NOISE_SCALE=0.15`, the function produces 4+ distinct types across a 50-column grid (column buckets change every 6-7 cols). Verified distribution produces all 4 types.

## Deviations from Plan

None — plan executed exactly as written. Tests required small corrections during RED→GREEN cycle (boundary conditions, hash approach) but no structural changes to the plan.

## Issues Encountered

- `fractalNoise` threshold issue for volcanic placement: max value with seed 42 was 0.9496, just below the 0.95 threshold. Resolved by switching to a mulberry32-style bit-mixing hash that gives true uniform [0,1) distribution.
- Boundary condition at `elev=0.40` (exactly at `ELEV.LOWLAND`): hexes at this elevation go to mid-elevation classification, not lowland. Tests corrected to use `elev=0.39` for lowland/wetland scenarios.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Climate, biome, and smoothing passes are complete and wired into WorldGenPipeline
- pass06-tempReassess has a placeholder for hydrology data (`lakeIds`, `hasRiver`) — correctly no-ops until Plan 03 populates these
- Continuous `sampleTemperature` and `sampleMoisture` functions are exposed on `ctx` for Phase 3 coastline rendering
- Plan 03 (hydrology: rivers, lakes, depression filling) can proceed immediately

---
## Self-Check: PASSED

- All 7 new files exist on disk
- Commits 4a6efc1 and c87ee2c verified in git log
- 25/25 worldgen tests pass; 0 new test failures in full suite
- TypeScript compiles cleanly (npx tsc --noEmit exits 0)

*Phase: 02-world-generation*
*Completed: 2026-03-21*
