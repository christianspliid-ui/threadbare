---
phase: 05-hex-composition-landscape-signifiers
plan: 04
subsystem: ui
tags: [svg, signifiers, terrain, hex-map, art]

# Dependency graph
requires:
  - phase: 05-hex-composition-landscape-signifiers
    provides: signifierRegistry.ts scaffold with placeholder paths (Plans 01 and 03)

provides:
  - Production SVG path data for 16 terrain types (hills, forested_hills, mountains, high_mountains, plateau, mountain_pass, desert, sand_dunes, rocky_desert, badlands, tundra, snow_fields, glacier, volcano, broken_lands, dead_forest)
  - LART-22 hardened_clay coverage via badlands variants 3-4 (fine cracks, deep cracks)
  - LART-28 lava coverage via volcano variants 3-4 (fresh flow, cooling)
  - TERRAIN TYPE COVERAGE comment block documenting all 28 direct + 6 fallback = 33 land TerrainType values
  - hills variant 0 and mountains variant 0 using actual hand-drawn SVG paths from Design/

affects:
  - Phase 05 Plans 05+ (visual composition renders these art paths in SignifierMesh)
  - Any future art pass that revisits signifier aesthetics

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Multi-path SVG signifiers: primary fill path + secondary shadow highlight path at lower opacity
    - Sun-from-right asymmetric shadow: left face heavier opacity, right face lighter
    - Organic curve paths with C/Q bezier commands, not geometric primitives
    - Hand-drawn paths extracted directly from Design/ SVG references for hills/mountains

key-files:
  created: []
  modified:
    - src/components/HexMapV2/signifiers/signifierRegistry.ts

key-decisions:
  - "hills variant 0 uses exact path data from Design/hills-hand-drawn.svg (three layered ridge rows)"
  - "mountains variant 0 uses exact path data from Design/mountain-hand-drawn.svg (two-peak complex organic path)"
  - "Multi-layer approach for highland terrain: base fill path + secondary shadow path at 0.25-0.30 opacity"
  - "Desert clean variant uses very low opacity (0.22) wind ripples, not blank, to preserve visual interest at sparse density"
  - "Badlands spires use C-curve closed paths for organic eroded pillar feel, not straight line PLACEHOLDER_SPIRES"
  - "Glacier crevasse paths use C-curves to suggest ice flow direction, not straight grid lines"
  - "Volcano active crater includes smoke warp paths as a third path layer at 0.40 opacity"
  - "broken_lands rubble uses polygon clusters, not PLACEHOLDER_CRACKS open-path format"

patterns-established:
  - "Two-path pattern for 3D terrain: (1) full filled silhouette path, (2) partial left-face shadow curve at 0.25-0.32 opacity"
  - "Cold terrain opacity at 0.20-0.25 range (snow/glacier) — lower than standard 0.45-0.55 to feel lighter"
  - "Lava/flow paths: irregular closed blobs radiating from center, NOT cone shapes"

requirements-completed: [LSIG-01, LART-13, LART-14, LART-15, LART-16, LART-17, LART-18, LART-19, LART-20, LART-21, LART-22, LART-23, LART-24, LART-25, LART-26, LART-27, LART-28, LART-29, LART-30]

# Metrics
duration: 12min
completed: 2026-03-22
---

# Phase 05 Plan 04: Remaining Terrain Signifier Art Summary

**Production hand-drawn SVG paths for 16 terrain types (highland, desert, cold, volcanic, special) completing full signifier art coverage for all 33 land TerrainTypes**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-03-22T12:38:49Z
- **Completed:** 2026-03-22T12:50:00Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Replaced all remaining placeholder SVG paths (PLACEHOLDER_HILL, PLACEHOLDER_TRIANGLE, PLACEHOLDER_RIDGE, PLACEHOLDER_SPIRES, PLACEHOLDER_DUNES, PLACEHOLDER_DOTS, PLACEHOLDER_CRACKS) with production hand-drawn paths
- hills and mountains variant 0 use actual path data extracted from Design/hills-hand-drawn.svg and Design/mountain-hand-drawn.svg
- All 10 highland/desert terrain types (Task 1) and 6 cold/volcanic/special types (Task 2) now have production SVG art
- Added TERRAIN TYPE COVERAGE comment block to SIGNIFIER_REGISTRY documenting LART-22 (hardened_clay via badlands variants 3-4) and LART-28 (lava via volcano variants 3-4) coverage
- All 17 signifier tests pass, TypeScript compiles with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Production SVG signifiers for highland and desert terrain types** - `ad143af` (feat)
2. **Task 2: Production SVG signifiers for cold, volcanic, and special terrain types** - `00fbbed` (feat)

## Files Created/Modified

- `src/components/HexMapV2/signifiers/signifierRegistry.ts` - Production SVG path data replacing all placeholders for 16 terrain types; updated coverage comment block at registry head

## Decisions Made

- hills variant 0 and mountains variant 0 use actual Design/ SVG paths — gives the map's most common terrain types authentic hand-drawn feel as anchors for the style
- Multi-path approach for highland terrain (primary filled silhouette + secondary shadow highlight at lower opacity) gives depth without adding geometry overhead
- Desert clean variant uses very low opacity wind ripples (0.22) rather than blank — preserves visual differentiation from other sparse types
- Volcano smoke wisps implemented as third path layer at 0.40 opacity — lightweight way to signal "active" vs dormant
- Cold terrain (snow_fields, glacier) at 0.20-0.25 opacity range, lower than standard highland types, to feel lighter and less cluttered

## Deviations from Plan

None - plan executed exactly as written. All placeholder paths replaced with production art. Coverage comment added. All tests pass.

## Issues Encountered

The file was being reformatted by a linter between reads, causing the line offsets to shift. This required re-reading the file before each edit to find the current exact text. The linter formatting did not cause any functional issues.

## Next Phase Readiness

- Full signifier art coverage complete: 28 direct registry entries + 6 fallback mappings = all 33 land TerrainType values covered
- SIGNIFIER_REGISTRY is ready for consumption by SignifierMesh in the scene layer
- Phase 05 Plan 05+ can proceed to compose signifiers with location/settlement markers

---
*Phase: 05-hex-composition-landscape-signifiers*
*Completed: 2026-03-22*
