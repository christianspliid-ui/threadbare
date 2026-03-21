---
phase: 03-coastlines-water-elevation
plan: 03
subsystem: renderer
tags: [elevation, ticks, caterpillar, topographic, three-js, tdd]
dependency_graph:
  requires: [03-01, 03-02]
  provides: [ElevationTicks, ELEV-01-verified, ELEV-02, ELEV-03, GRID-01-verified]
  affects: [HexMapV2, ElevationTicks.ts]
tech_stack:
  added: [ElevationTicks.ts]
  patterns: [Scene Module Factory, TDD Red/Green, hex-pair deduplication, sharedEdgeVertices geometry]
key_files:
  created:
    - src/components/HexMapV2/scene/ElevationTicks.ts
    - src/components/HexMapV2/scene/__tests__/ElevationTicks.test.ts
  modified:
    - src/components/HexMapV2/HexMapV2.tsx
decisions:
  - "Edge dedup uses sorted hex-pair coord key (col,row:col,row) not vertex-position key — avoids index-to-neighbor mapping error"
  - "sharedEdgeVertices() finds the two world-space vertices shared between adjacent hexes via tolerance comparison (TOL=0.01)"
  - "ELEV-04 (altitude text labels) NOT implemented — CUT per user decision before plan execution"
  - "ELEV-01 confirmed via terrain palette inspection: highlands use browns/golds, lowlands use greens"
  - "GRID-01 confirmed: createHexGridLines uses RENDER_ORDER.GRID (2), GRID_LINE_OPACITY 0.12"
metrics:
  duration_seconds: 364
  completed_date: "2026-03-21"
  tasks_completed: 2
  files_modified: 3
  files_created: 2
---

# Phase 03 Plan 03: Elevation Tick Marks + GRID-01 Verification Summary

**One-liner:** Caterpillar-style topographic tick marks on steep hex edges via TDD, with GRID-01 and ELEV-01 verified from prior implementation.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | ElevationTicks.ts — TDD Red/Green for tick geometry | 403e1af |
| 2 | Wire elevation ticks into HexMapV2 + verify GRID-01, ELEV-01 | 8dcf12a |

## What Was Built

### Task 1: ElevationTicks Scene Module

`ElevationTicks.ts` creates a `THREE.LineSegments` mesh with caterpillar-style tick marks on steep hex edges:

- `createElevationTicks(tiles: HexTile[]): THREE.LineSegments`
- Tick density scales with steepness: `tickCount = clamp(floor(elevDiff / TICK_DENSITY_STEP), TICK_MIN, TICK_MAX)` = clamp 3–8
- TICK_THRESHOLD = 0.08: minimum elevation diff to show ticks (gentle slopes are invisible)
- Edge deduplication via sorted hex-pair coord key (not vertex positions) — ensures shared edges processed once
- `sharedEdgeVertices()` finds the two world-space vertices shared between adjacent hexes by tolerance comparison, avoiding index-mapping errors
- Tick marks are perpendicular line segments distributed evenly along the qualifying edge
- Y-flip applied to hex centers (`worldCY = -cy`)
- All constants named in `ELEVATION_TICK_CONSTANTS` (NFP #1)
- Fail-soft: empty tiles or all-same-elevation returns empty `LineSegments` (NFP #4)

**Constants:**
| Constant | Default | Purpose |
|----------|---------|---------|
| TICK_THRESHOLD | 0.08 | Minimum elevation diff for ticks |
| TICK_DENSITY_STEP | 0.03 | Elevation diff per tick count step |
| TICK_LENGTH | 0.8 | Half-length of each tick (world units) |
| TICK_COLOR | 0x2a1a0a | Dark brown, blends with highland terrain |
| TICK_OPACITY | 0.6 | Transparency |
| TICK_MIN | 3 | Minimum ticks per qualifying edge |
| TICK_MAX | 8 | Maximum ticks per qualifying edge |

**7 TDD tests pass:**
1. Returns `THREE.LineSegments` with `renderOrder = ELEVATION_TICKS (3)`
2. Non-zero vertex count for adjacent hexes with elevDiff > threshold
3. Zero vertices for adjacent hexes with elevDiff < threshold
4. Minimum qualifying edge produces 3 ticks (TICK_MIN clamp) = 6 vertices
5. Very large elevation diff produces 8 ticks (TICK_MAX clamp) = 16 vertices
6. Shared edges not double-counted (dedup)
7. All-flat terrain produces zero vertices (fail-soft)

### Task 2: HexMapV2 Wiring + Verification

**Wired into HexMapV2:**
- Import `createElevationTicks` from `./scene/ElevationTicks`
- `const elevTicks = createElevationTicks(tiles)` in tiles useEffect after coastline mesh
- `scene.add(elevTicks)` adds at RENDER_ORDER.ELEVATION_TICKS (3)
- Full geometry + material disposal in cleanup

**GRID-01 verified (no changes needed):**
- `createHexGridLines` called in tiles useEffect
- Grid lines use `RENDER_ORDER.GRID` (2)
- `HEX_CONSTANTS.GRID_LINE_OPACITY = 0.12` (12%)
- Grid lines render at all zoom levels

**ELEV-01 verified (no changes needed):**
- `terrainPalette.ts` confirms highland terrain uses brown/gold palette: mountains `#9E7830`, high_mountains `#8A6828`, hills `#C8A850`, plateau `#B89848`
- Lowland terrain uses green palette: grassland `#8EB852`, floodplain `#7EA04A`
- Color passively communicates elevation without explicit labeling

**ELEV-04 NOT implemented:** Altitude text labels cut per user decision before this plan executed.

## Tests Written

- 7 tests in `ElevationTicks.test.ts` — all pass
- Full test suite: 5510+ passing, 11 pre-existing failures (unrelated to this plan)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed edge-to-neighbor index mapping assumption**
- Found during: Task 1 GREEN phase (tests 4, 5, 6 failed showing 2× expected vertex count)
- Issue: Original implementation assumed `hexNeighbors(tile)[i]` corresponds to the tile's vertex edge `i → (i+1)%6`. This mapping is not correct for odd-q offset hex grids — the neighbor direction order in `hexNeighbors` doesn't align 1:1 with vertex edge order.
- Fix: Replaced vertex-index-based neighbor lookup with hex-pair deduplication (sorted coord key) and `sharedEdgeVertices()` — finds the actual shared geometric edge between two hexes via vertex tolerance comparison.
- Files modified: `src/components/HexMapV2/scene/ElevationTicks.ts`
- Commit: 403e1af

## Self-Check

### Files exist
- src/components/HexMapV2/scene/ElevationTicks.ts: FOUND
- src/components/HexMapV2/scene/__tests__/ElevationTicks.test.ts: FOUND

### Commits exist
- 403e1af (Task 1 TDD): FOUND
- 8dcf12a (Task 2 wiring — captured in Plan 02 commit due to edit ordering): FOUND

## Self-Check: PASSED
