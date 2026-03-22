---
phase: 04-regions-borders
plan: 02
subsystem: engine + renderer
tags: [political-regions, borders, capitals, three-js, worldgen, tdd, typescript]

# Dependency graph
requires:
  - phase: 04-regions-borders
    plan: 01
    provides: detectRegionsBorderCost, RegionData, RegionCluster, hexRegionId
  - phase: 03-coastlines-water-elevation
    provides: WorldGenResult.riverPaths for region seeding
  - phase: 02-world-generation
    provides: Province, provinceIds, provinceCapitalHexes from WorldGenContext

provides:
  - assignPoliticalRegions (engine): groups geographic regions into baronies/kingdoms by province and cultureId
  - createBorderMesh (renderer): red quad-strip border polylines along kingdom and barony edges
  - createCapitalMarkers (renderer): red dot markers at political capital hexes
  - regionData.baronies + kingdoms: populated after generateWorld()
  - HexMapV2.regionData prop: renders borders and capitals when regionData provided

affects:
  - 04-03 (label placement reads baronies/kingdoms for political label rendering)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "mulberry32 PRNG for seeded name generation (adjective+noun barony names)"
    - "Quad-strip border edges via buildThickEdge — same pattern as RiverMesh"
    - "Two-tier Points groups for capital markers (kingdom vs barony-only dot sizes)"
    - "3-of-6 neighbor direction check to avoid double-processing each hex edge"
    - "TDD RED-GREEN per task with atomic commits"

key-files:
  created:
    - src/engine/regionPolitical.ts
    - src/components/HexMapV2/scene/BorderMesh.ts
    - src/components/HexMapV2/scene/CapitalMarkers.ts
    - src/engine/__tests__/regionPolitical.test.ts
    - src/components/HexMapV2/scene/__tests__/BorderMesh.test.ts
  modified:
    - src/engine/hexGrid.ts
    - src/components/HexMapV2/HexMapV2.tsx

key-decisions:
  - "One province = one barony — province is the unit of political control, not geographic region"
  - "REGN-06: only barony/kingdom differences generate border geometry — geographic-only differences produce nothing"
  - "buildThickEdge uses 3-of-6 direction check to avoid double-counting each shared edge"
  - "CapitalMarkers uses two separate Points objects (kingdom size=6, barony size=3) since PointsMaterial lacks per-point size support"
  - "mulberry32(seed + id * 1777) for barony names — offset avoids name collision with kingdom names"

requirements-completed: [REGN-04, REGN-05, REGN-06, REGN-09]

# Metrics
duration: 7min
completed: 2026-03-22
---

# Phase 4 Plan 2: Political Regions, Border Mesh, and Capital Markers Summary

**Political barony/kingdom grouping (one province = one barony, same cultureId = one kingdom), red quad-strip border polylines, and capital dot markers — fully wired into HexMapV2 via the regionData prop.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-22T10:13:05Z
- **Completed:** 2026-03-22T10:20:05Z
- **Tasks:** 1 (TDD: RED + GREEN)
- **Files modified:** 7

## Accomplishments

- Created `regionPolitical.ts` with `assignPoliticalRegions()`: groups geographic regions into baronies (one per province) and kingdoms (grouped by cultureId), with mulberry32 seeded name generation
- Created `BorderMesh.ts` with `createBorderMesh()`: quad-strip border polylines along political boundaries — kingdom edges (halfWidth=1.5) and barony edges (halfWidth=0.75), all using red MeshBasicMaterial (0xC83030)
- Created `CapitalMarkers.ts` with `createCapitalMarkers()`: two THREE.Points groups — kingdom capitals (size=6) and barony-only capitals (size=3), sizeAttenuation: false
- REGN-06 enforced: geographic-only differences produce zero border geometry (test-verified)
- Wired `assignPoliticalRegions` into `generateWorld()` in hexGrid.ts with fail-soft nested try/catch
- Wired `createBorderMesh` and `createCapitalMarkers` into HexMapV2.tsx scene setup with `regionData?` prop

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: failing tests for political regions, border mesh, capital markers** — `20210f3` (test)
2. **Task 1 GREEN: regionPolitical.ts + BorderMesh.ts + CapitalMarkers.ts + wiring** — `02e65a6` (feat)

_TDD task has RED + GREEN commits (no REFACTOR needed)._

## Files Created/Modified

- `src/engine/regionPolitical.ts` — Created: assignPoliticalRegions (province → barony → kingdom grouping, mulberry32 names)
- `src/components/HexMapV2/scene/BorderMesh.ts` — Created: createBorderMesh (quad-strip borders, REGN-06 geographic skip)
- `src/components/HexMapV2/scene/CapitalMarkers.ts` — Created: createCapitalMarkers (two Points groups, kingdom/barony sizes)
- `src/engine/__tests__/regionPolitical.test.ts` — Created: 5 tests covering all behavior scenarios
- `src/components/HexMapV2/scene/__tests__/BorderMesh.test.ts` — Created: 8 border + 4 capital tests (16 total)
- `src/engine/hexGrid.ts` — Updated: wire assignPoliticalRegions after detectRegionsBorderCost, fail-soft inner try/catch
- `src/components/HexMapV2/HexMapV2.tsx` — Updated: regionData? prop, import + call createBorderMesh/createCapitalMarkers in scene setup

## Decisions Made

- One province = one barony — the province from WorldGenContext is the atomic unit of political control
- REGN-06 enforced at geometry level: buildThickEdge only called when hexBaronyId or hexKingdomId differs across edge
- 3-of-6 neighbor direction check in BorderMesh avoids double-processing each shared edge (directions 0, 1, 2 only)
- Two separate Points objects for capitals: PointsMaterial has one size per object, not per-point
- mulberry32(seed + id * 1777) produces different barony name sequences vs kingdom names

## Deviations from Plan

None — plan executed exactly as written. All acceptance criteria met without adjustment.

## Issues Encountered

Pre-existing test failures (7 files, same as Plan 01) confirmed unrelated to this plan's changes: familiarity-integration, content-layer1-integration, traceBuffer-integration, MandateTracker, MovementTrails, movementExecution, movement-p2-integration.

## User Setup Required

None.

## Next Phase Readiness

- `regionData.baronies` + `regionData.kingdoms` populated after `generateWorld()` — Plan 03 label placement can read these
- `hexBaronyId` and `hexKingdomId` maps available for per-hex political lookup
- HexMapV2 renders borders and capitals when `regionData` prop is provided

---
*Phase: 04-regions-borders*
*Completed: 2026-03-22*
