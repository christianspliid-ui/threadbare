---
phase: 04-regions-borders
plan: 03
subsystem: renderer + engine
tags: [region-labels, collision-detection, html-overlay, three-js, zoom-tiers, cartography, tdd, typescript]

# Dependency graph
requires:
  - phase: 04-regions-borders
    plan: 01
    provides: RegionData, RegionCluster with centroids, REGION_MAP_LABEL_MIN_SIZE
  - phase: 04-regions-borders
    plan: 02
    provides: regionData.baronies, regionData.kingdoms populated by assignPoliticalRegions
  - phase: 03-coastlines-water-elevation
    provides: WorldGenResult.riverPaths for river label generation

provides:
  - generateRegionLabels (engine): kingdom/barony/geographic label data from RegionData
  - generateRiverLabels (engine): major river labels with seeded placeholder names
  - LABEL_PRIORITY export: kingdom=0, barony=1, geographic=2, river=3
  - removeOverlaps (overlay): AABB collision detection for screen-space labels
  - estimateBBox (overlay): font-size-based bbox estimate for each label tier
  - RegionLabelOverlay (React): RAF-driven HTML label overlay over Three.js canvas
  - HexMapV2 wired: generateRegionLabels/generateRiverLabels called, zoom.labels listener tracks d3 scale

affects:
  - Phase 5 (signifiers): can reuse RegionLabelOverlay pattern for POI labels
  - Phase 6 (locations): same overlay infrastructure applies to location name labels

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TDD RED-GREEN per task with atomic commits"
    - "RAF-driven HTML overlay with camera.project() for zero-lag label positioning during pan"
    - "AABB sweep (O(n^2)) with priority-sorted placement — acceptable for <200 labels on screen"
    - "Debounced collision detection (60ms) to avoid per-frame AABB recomputation"
    - "d3-zoom secondary event listener (zoom.labels) for decoupled zoom level tracking"
    - "mulberry32 seeded PRNG for deterministic river name generation"

key-files:
  created:
    - src/engine/regionLabels.ts
    - src/components/HexMapV2/overlay/labelCollision.ts
    - src/components/HexMapV2/overlay/RegionLabelOverlay.tsx
    - src/engine/__tests__/regionLabels.test.ts
    - src/components/HexMapV2/overlay/__tests__/labelCollision.test.ts
  modified:
    - src/components/HexMapV2/HexMapV2.tsx

key-decisions:
  - "HEX_SIZE=10 duplicated as local constant in regionLabels.ts to avoid circular import with HexMapV2 scene layer"
  - "Zoom tier thresholds: full-world <1.5, continental <5, regional <15, hero-local >=15 (from CAMERA_CONSTANTS)"
  - "Kingdom labels visible at continental+full-world (zoomLevel < 15); barony at 1.5-15; geo/river at 5-15"
  - "Viewport culling uses display:none (performance); collision-hidden labels use visibility:hidden (stable DOM)"
  - "River labels placed at midpoint hex of the path (hexes[Math.floor(length/2)])"
  - "mulberry32(seed + i * 7919 + 31337) for river name — prime offset avoids collision with other name generators"
  - "zoom.on('zoom.labels', ...) secondary listener removed in cleanup with zoom.on('zoom.labels', null)"

patterns-established:
  - "overlay/ subdirectory under HexMapV2 for HTML overlay components (tooltip + labels)"
  - "cameraRef.current.project() as the canonical world→screen conversion for HTML overlays"
  - "useRef<number>(0) for RAF ID — cancel in useEffect cleanup"

requirements-completed: [REGN-07, REGN-08, GRID-02]

# Metrics
duration: 5min
completed: 2026-03-22
---

# Phase 4 Plan 3: HTML Label Overlay System Summary

**RAF-driven HTML label overlay generating kingdom/barony/geographic/river labels with zoom-tier filtering, AABB collision detection, and cartographic dark-text-with-halo styling — wired into HexMapV2.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-22T10:23:24Z
- **Completed:** 2026-03-22T10:28:40Z
- **Tasks:** 2 (Task 1: TDD RED+GREEN; Task 2: implementation)
- **Files modified:** 6

## Accomplishments

- Created `regionLabels.ts` with `generateRegionLabels()` (kingdom/barony/geographic from RegionData) and `generateRiverLabels()` (major rivers with mulberry32 placeholder names and " River" suffix)
- Created `labelCollision.ts` with `removeOverlaps()` (priority-sorted AABB sweep) and `estimateBBox()` (font-size-based estimate)
- Created `RegionLabelOverlay.tsx` with RAF-driven camera.project() positioning, zoom-tier visibility filtering, AABB collision detection (60ms debounce), viewport culling, and all four tier styles matching UI-SPEC.md
- Wired into `HexMapV2.tsx`: labels generated in scene setup effect, zoom level tracked via `zoom.on('zoom.labels')`, overlay rendered as sibling of canvas

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: failing tests for regionLabels and labelCollision** — `cfdfcf6` (test)
2. **Task 1 GREEN: implement regionLabels.ts and labelCollision.ts** — `60e0e7b` (feat)
3. **Task 2: RegionLabelOverlay + HexMapV2 wiring** — `1a74f27` (feat)

_Task 1 uses TDD RED+GREEN. Task 2 has no tests (React component with RAF loop — covered by visual verification)._

## Files Created/Modified

- `src/engine/regionLabels.ts` — Created: generateRegionLabels (kingdom/barony/geo with REGION_MAP_LABEL_MIN_SIZE filter), generateRiverLabels (major rivers, mulberry32 names), LABEL_PRIORITY export
- `src/components/HexMapV2/overlay/labelCollision.ts` — Created: ScreenLabel/ScreenBBox interfaces, estimateBBox (font-size estimate), removeOverlaps (priority-sorted AABB sweep)
- `src/components/HexMapV2/overlay/RegionLabelOverlay.tsx` — Created: RAF-driven HTML overlay, zoom-tier filtering, collision detection (60ms debounce), all four tier CSS styles
- `src/engine/__tests__/regionLabels.test.ts` — Created: 22 tests for LABEL_PRIORITY, generateRegionLabels, generateRiverLabels
- `src/components/HexMapV2/overlay/__tests__/labelCollision.test.ts` — Created: 10 tests for estimateBBox and removeOverlaps
- `src/components/HexMapV2/HexMapV2.tsx` — Updated: imports RegionLabelOverlay, generateRegionLabels, generateRiverLabels; adds regionLabels and zoomLevel state; generates labels in scene setup effect; tracks zoom via zoom.labels listener; renders RegionLabelOverlay as canvas sibling

## Decisions Made

- `HEX_SIZE = 10` duplicated as local constant in `regionLabels.ts` to avoid circular import with the HexMapV2 scene layer (importing HEX_CONSTANTS from HexFillMesh.ts into an engine file is problematic)
- Zoom thresholds: full-world < 1.5, continental < 5, regional < 15, hero-local >= 15 — derived from CAMERA_CONSTANTS and CONTEXT.md locked decisions
- Kingdom labels visible at continental + full-world (`zoomLevel < 15`); barony at 1.5–15; geographic and river at 5–15 (regional only)
- `d3.zoom.on('zoom.labels', handler)` used as secondary listener for decoupled zoom tracking — removed with `null` in cleanup

## Deviations from Plan

None — plan executed exactly as written. All acceptance criteria met without adjustment.

## Issues Encountered

Pre-existing test failures (7 files, same as Plans 01 and 02) confirmed unrelated to this plan's changes: familiarity-integration, content-layer1-integration, traceBuffer-integration, MandateTracker, MovementTrails, movementExecution, movement-p2-integration.

## User Setup Required

None.

## Next Phase Readiness

- `RegionLabelOverlay` pattern (cameraRef + RAF + camera.project()) is available for Phase 5 POI labels and Phase 6 location name labels
- `labelCollision.ts` is reusable for any screen-space deduplication of HTML overlays
- Phase 4 is now complete: geographic detection (04-01), political regions + borders (04-02), label overlay (04-03)

---
*Phase: 04-regions-borders*
*Completed: 2026-03-22*

## Self-Check: PASSED

All key files confirmed present on disk:
- FOUND: src/engine/regionLabels.ts
- FOUND: src/components/HexMapV2/overlay/labelCollision.ts
- FOUND: src/components/HexMapV2/overlay/RegionLabelOverlay.tsx
- FOUND: src/engine/__tests__/regionLabels.test.ts
- FOUND: src/components/HexMapV2/overlay/__tests__/labelCollision.test.ts
- FOUND: src/components/HexMapV2/HexMapV2.tsx (modified)

All task commits verified in git log:
- cfdfcf6 - test RED Task 1
- 60e0e7b - feat GREEN Task 1
- 1a74f27 - feat Task 2
