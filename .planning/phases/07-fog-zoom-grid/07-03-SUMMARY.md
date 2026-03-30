---
phase: 07-fog-zoom-grid
plan: "03"
subsystem: renderer-integration
tags: [fog-of-war, zoom-lod, roads, follow-mode, three-js, hexmap]

requires:
  - phase: 07-fog-zoom-grid plan 01
    provides: ZoomVisibilityMatrix, FogCulling
  - phase: 07-fog-zoom-grid plan 02
    provides: RoadMesh

provides:
  - FollowMode.ts — mutable camera follow state management
  - HexMapV2 fully wired with fog, zoom matrix, road mesh, follow mode
  - HexV2View with ?fog URL param and computed visibility map

affects: [Phase 08 integration, HexMapV2 consumers, HexV2View]

tech-stack:
  added: []
  patterns:
    - "Separate fog update useEffect (depends only on visibilityMap, not scene rebuild)"
    - "FollowModeState in useRef — mutable, no React re-renders on follow change"
    - "ZOOM_VISIBILITY_MATRIX replaces scattered per-threshold checks"
    - "buildOriginalColorCache called once in scene init, updateFogColors in separate useEffect"

key-files:
  created:
    - src/components/HexMapV2/camera/FollowMode.ts
  modified:
    - src/components/HexMapV2/HexMapV2.tsx
    - src/components/HexMapV2/HexV2View.tsx

key-decisions:
  - "FollowMode stored in useRef not useState — follow changes don't trigger re-renders, camera is animated via animateCameraTo directly"
  - "visibilityMap is NOT in scene init useEffect deps — fog changes never rebuild scene geometry, only update instance colors"
  - "buildOriginalColorCache called in scene init alongside createHexFillMesh — cached colors available to fog update effect without closure staleness"
  - "ZOOM-05: setTimeout(0) ensures d3-zoom is fully initialized before initial retinue centering"
  - "Follow mode breaks on mousemove/pointermove/touchmove sourceEvents in zoom handler — programmatic zooms don't break follow"
  - "HexV2View sight range uses DEFAULT_SIGHT_RANGE+2 for retinue (wider test view), DEFAULT_SIGHT_RANGE for other agents"

requirements-completed: [ZOOM-05, ZOOM-06, FOG-01, FOG-02, FOG-03, FOG-04, FOG-05, FOG-06, ZOOM-02, ZOOM-03, ZOOM-04, GRID-03, GRID-04]

duration: 8min
completed: "2026-03-22"
tasks: 1
files: 3
---

# Phase 7 Plan 03: Fog, Zoom, Roads & Follow Mode Integration Summary

**Full fog-of-war system (per-hex color override + layer culling), 4-tier zoom LOD via ZOOM_VISIBILITY_MATRIX, road network from createRoadMesh, and follow-mode camera tracking all wired into HexMapV2 and activated via ?fog URL param in HexV2View.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-22T17:47:11Z
- **Completed:** 2026-03-22T17:53:41Z
- **Tasks:** 1 (auto) + 1 checkpoint (awaiting human-verify)
- **Files modified:** 3

## Accomplishments

- Created FollowMode.ts with mutable state stored in useRef — camera tracks followed agent hex changes
- Extended HexMapV2Props (visibilityMap, fogEnabled) and HexMapV2Handle (setFollowAgent)
- Wired buildOriginalColorCache + updateFogColors into separate useEffect (not scene rebuild)
- Replaced all scattered zoom threshold checks with unified getZoomTier + ZOOM_VISIBILITY_MATRIX lookup
- Wired createRoadMesh into scene init with roadGroupRef for zoom visibility control
- ZOOM-05: camera centers on retinue at hero-local zoom when fogEnabled
- HexV2View: reads ?fog URL param, builds VisibilityMap from agent positions via computeVisibilityFromSources

## Task Commits

1. **Task 1: Follow mode + full wiring** - `886bca6` (feat)

**Awaiting:** Task 2 visual verification checkpoint

## Files Created/Modified

- `src/components/HexMapV2/camera/FollowMode.ts` — FollowModeState, createFollowMode, updateFollowTarget
- `src/components/HexMapV2/HexMapV2.tsx` — fog, zoom matrix, road mesh, follow mode all wired in
- `src/components/HexMapV2/HexV2View.tsx` — fogEnabled from ?fog param, visibilityMap from agents

## Decisions Made

1. **FollowMode as mutable ref** — Storing in useRef avoids unnecessary React re-renders on every agent move; camera is animated via animateCameraTo which fires zoom events directly.

2. **Fog useEffect separate from scene init** — visibilityMap excluded from scene init deps so fog changes never rebuild 60K-hex geometry. Only updateFogColors is called (setColorAt + needsUpdate).

3. **ZOOM_VISIBILITY_MATRIX** — Replaces inline magic numbers in zoom.on('zoom.labels') handler with complete, inspectable data structure. All future layer visibility changes go through the matrix.

4. **setTimeout(0) for ZOOM-05** — d3-zoom's initialTransform is applied synchronously on setupD3Zoom; a setTimeout(0) ensures the initial transform is committed before animateCameraTo overwrites it.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

- Visual verification checkpoint pending (Task 2)
- All systems implemented and wired, build clean, fog/zoom tests passing
- Waiting for user to open ?view=hexv2 and ?view=hexv2&fog to verify behavior

---
*Phase: 07-fog-zoom-grid*
*Completed: 2026-03-22*
