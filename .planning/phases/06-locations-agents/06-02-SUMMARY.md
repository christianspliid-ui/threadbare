---
phase: 06-locations-agents
plan: 02
subsystem: ui
tags: [svg, icons, hex-map, location-icons, art, signifiers]

# Dependency graph
requires:
  - phase: 06-01
    provides: LOCATION_ICON_REGISTRY structure, locationIconRegistry.ts, locationIconTextures.ts, rendering pipeline
provides:
  - 17 production-quality hand-drawn SVG location icon path sets
  - Multi-layer opacity compositing for all location types
  - Ruin variants visually derived from intact counterparts
affects:
  - locationIconTextures.ts (consumes LOCATION_ICON_REGISTRY)
  - HexIconLayer (renders via texture cache)
  - Any phase adding new LocationType values

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Multi-layer SVG silhouette with sun-from-right shadow: base opacity 0.2-0.35, mid opacity 0.65, full 1.0"
    - "Ruin variants derived from intact counterparts with breaks/truncation at same proportions"
    - "Organic hand-drawn paths: irregular vertex placement, no arc commands, no mechanical symmetry"

key-files:
  created: []
  modified:
    - src/components/HexMapV2/locations/locationIconRegistry.ts

key-decisions:
  - "Capital uses 4-layer system (mass/shadow/keep+towers/crenellations+banner) for visual richness"
  - "Ruin icons share proportions with intact counterparts — ruined_city derives from city wall layout, ruined_tower from tower body, ruined_village from hamlet dual-cottage layout"
  - "No arc commands in any path — all irregular polygon vertices for hand-drawn organic feel"
  - "Shadow layer always second in path array (opacity 0.2-0.25), applied to left face per sun-from-right convention"

patterns-established:
  - "Location icons: shadow layer at opacity 0.2/0.25 on left face, always before main silhouette layer"
  - "Ruin convention: same viewBox footprint as intact, broken top/gap in wall/collapsed roof added as final path"

requirements-completed:
  - LIART-01
  - LIART-02
  - LIART-03
  - LIART-04
  - LIART-05
  - LIART-06
  - LIART-07
  - LIART-08
  - LIART-09
  - LIART-10
  - LIART-11
  - LIART-12
  - LIART-13
  - LIART-14
  - LIART-15
  - LIART-16
  - LIART-17

# Metrics
duration: 3min
completed: 2026-03-22
---

# Phase 06 Plan 02: Location Icon Art Summary

**17 production hand-drawn SVG silhouette icons for all location types — multi-layer opacity, sun-from-right shadow, ruin variants structurally derived from intact counterparts**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-22T14:23:14Z
- **Completed:** 2026-03-22T14:26:15Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- All 7 settlement/fortification icons (capital, city, town, hamlet, castle, fort, tower) replaced with production hand-drawn paths using 2-4 opacity layers
- All 10 religious/ruins/utility/special icons (temple, shrine, ruins, ruined_city, ruined_tower, ruined_village, mining, camp, battleground, unexplored_poi) replaced with production art
- Ruin variants (ruined_city, ruined_tower, ruined_village) explicitly built as damaged versions of their intact counterparts — same proportions, broken/truncated forms
- Sun-from-right convention applied consistently: shadow opacity layer (0.2-0.25) on left face of every structure

## Task Commits

Each task was committed atomically:

1. **Tasks 1+2: All 17 production location icons** - `306a4df` (feat)

**Plan metadata:** (pending)

## Files Created/Modified
- `src/components/HexMapV2/locations/locationIconRegistry.ts` - Replaced all 17 placeholder icon path sets with production hand-drawn multi-layer SVG silhouettes

## Decisions Made
- Committed both tasks in a single commit since they modify the same file and the acceptance criteria were verified together
- Capital icon uses 4 layers (most complex) to reflect its highest importance tier
- Tower icon uses only 2 layers (simplest fortification) — body shadow + full silhouette with arrow slit
- Unexplored POI uses teardrop-plus-question-mark shape for readability at tiny (25% HEX_SIZE) scale

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 17 location icons are production-ready and will render via the existing locationIconTextures.ts cache builder
- Ready for Plan 03 (agent activity indicator icons or next sequential plan in phase 06)

---
*Phase: 06-locations-agents*
*Completed: 2026-03-22*
