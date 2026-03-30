---
phase: 03-coastlines-water-elevation
plan: 01
subsystem: renderer
tags: [coastline, water, worldgen, three-js, marching-squares]
dependency_graph:
  requires: [02-world-generation]
  provides: [WorldGenResult, CoastlineMesh, getDepthBandColor, water-depth-bands, lake-coloring]
  affects: [HexMapV2, HexV2View, App, HexFillMesh, colorUtils]
tech_stack:
  added: [CoastlineMesh.ts, waterPalette.getDepthBandColor, WorldGenResult type]
  patterns: [Scene Module Factory, TDD Red/Green, Refs for worldgen data]
key_files:
  created:
    - src/components/HexMapV2/scene/CoastlineMesh.ts
    - src/components/HexMapV2/palette/__tests__/waterPalette.test.ts
    - src/components/HexMapV2/scene/__tests__/CoastlineMesh.test.ts
  modified:
    - src/engine/hexGrid.ts
    - src/App.tsx
    - src/components/HexMapV2/HexV2View.tsx
    - src/components/HexMapV2/HexMapV2.tsx
    - src/components/HexMapV2/palette/waterPalette.ts
    - src/components/HexMapV2/palette/colorUtils.ts
    - src/components/HexMapV2/scene/HexFillMesh.ts
    - src/engine/gameInit.ts
    - src/engine/__tests__/hexGrid.test.ts
    - src/engine/__tests__/coastline-integration.test.ts
    - src/engine/__tests__/regionNaming-integration.test.ts
    - src/engine/worldgen/__tests__/validation.test.ts
    - src/components/HexMapV2/palette/__tests__/terrainPalette.test.ts
    - STYLE.md
decisions:
  - "Water colors extracted from Design/hexmap macro-reference.png: deep_ocean #3A7AB8, ocean #5098D0, shallows #78BCE0, lake #4A8FC0, river #68B0D8"
  - "WorldGenResult replaces HexTile[] return — all call sites updated to use .tiles"
  - "getHexColor options pattern: optional { elevation, lakeId } for depth bands and lake coloring"
  - "CoastlineMesh renders two layers: shallows band at z=0.01, land boundary at z=0.02"
  - "Winding correction: SVG positive area (CCW in y-down) → reversed after Y-flip for Three.js CCW convention"
metrics:
  duration_seconds: 624
  completed_date: "2026-03-21"
  tasks_completed: 2
  files_modified: 14
  files_created: 3
---

# Phase 03 Plan 01: Coastline Mask + Water Depth Bands + Worldgen Data Threading

**One-liner:** Organic coastline overlay from marching squares contours, 3-band ocean depth gradient via elevation, lake fill color, and WorldGenResult threading riverPaths/lakeIds to the renderer.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Thread worldgen data + water depth bands + lake fill + color extraction | aa6c09e |
| 2 | Coastline mesh from marching squares contours | 04eb22a |

## What Was Built

### Task 1: WorldGenResult + Water Depth Bands + Lake Coloring

`generateWorld()` in `hexGrid.ts` now returns `WorldGenResult` instead of `HexTile[]`:
```typescript
export interface WorldGenResult {
  tiles: HexTile[];
  riverPaths: RiverPath[];
  lakeIds: Int16Array;
  cols: number;
  rows: number;
  seed: number;
}
```

All call sites updated: `App.tsx`, `gameInit.ts`, `coastline-integration.test.ts`, `regionNaming-integration.test.ts`, `validation.test.ts`.

`waterPalette.ts` updated with colors extracted from `Design/hexmap macro-reference.png`:
- `WATER_PALETTE.deep_ocean` = `#3A7AB8` (deepest ocean)
- `WATER_PALETTE.ocean` = `#5098D0` (mid ocean)
- `WATER_PALETTE.shallows` = `#78BCE0` (coastal shallows)
- `WATER_PALETTE.lake` = `#4A8FC0` (inland lakes)
- `WATER_PALETTE.river` = `#68B0D8` (rivers)

`getDepthBandColor(elevation)` added with thresholds: deep < 0.15, mid < 0.30, shallows >= 0.30.

`getHexColor()` in `colorUtils.ts` extended with options parameter for elevation-based depth bands and lakeId-based lake coloring. `HexFillMesh.ts` passes both when rendering.

`HexV2View` and `HexMapV2` accept `riverPaths` and `lakeIds` props and store in refs for downstream use.

### Task 2: CoastlineMesh Scene Module

`CoastlineMesh.ts` creates a `THREE.Group` with two overlay layers:
- Shallow band (z=0.01): `shallowLoops` filled with `WATER_PALETTE.shallows`
- Land boundary (z=0.02): `loops` filled with `COASTLINE_LAND_COLOR` (#5a7a48)

All contour points Y-flipped (SVG y-down → Three.js y-up). Winding corrected: positive SVG area (CCW in y-down) reversed to CCW in Three.js y-up space, as required by `THREE.Shape`.

Wired into `HexMapV2.tsx` tiles useEffect with full geometry disposal on cleanup.

## Tests Written

- 6 tests in `waterPalette.test.ts` (getDepthBandColor thresholds, getWaterColor for lake, all water terrains)
- 9 tests in `hexGrid.test.ts` (WorldGenResult shape, tiles/riverPaths/lakeIds, determinism)
- 5 tests in `CoastlineMesh.test.ts` (Group type, renderOrder, vertex count, Y-flip, shallows color)

All 20 new tests pass. Full suite: 5498 passing (10 pre-existing failures unrelated to this plan).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed regionNaming-integration.test.ts determinism test**
- Found during: Task 1 execution
- Issue: Test was passing `WorldGenResult` to `seedWorld` as if it were `HexTile[]` — type mismatch introduced when changing `generateWorld` return type
- Fix: Added `.tiles` to both `generateWorld()` calls in the determinism test
- Files modified: `src/engine/__tests__/regionNaming-integration.test.ts`
- Commit: aa6c09e

**2. [Rule 1 - Bug] Updated all integration tests for WorldGenResult return type**
- Found during: Task 1 execution
- Issue: `coastline-integration.test.ts` and `validation.test.ts` were using `generateWorld()` return directly as `HexTile[]`
- Fix: Updated all calls to use `.tiles` property
- Files modified: `src/engine/__tests__/coastline-integration.test.ts`, `src/engine/worldgen/__tests__/validation.test.ts`
- Commit: aa6c09e

**3. [Rule 2 - Missing] Updated terrainPalette.test.ts hardcoded color assertions**
- Found during: Task 1 (updating waterPalette colors)
- Issue: Existing test had hardcoded old color values (`#88C0E0`, `#5898D0`, `#3870B0`) that would fail with new reference-image-extracted colors
- Fix: Updated assertions to match new canonical colors from `Design/hexmap macro-reference.png`
- Files modified: `src/components/HexMapV2/palette/__tests__/terrainPalette.test.ts`
- Commit: aa6c09e

## Self-Check

### Files exist
- src/components/HexMapV2/scene/CoastlineMesh.ts: FOUND
- src/components/HexMapV2/palette/__tests__/waterPalette.test.ts: FOUND
- src/components/HexMapV2/scene/__tests__/CoastlineMesh.test.ts: FOUND

### Commits exist
- aa6c09e (Task 1): FOUND
- 04eb22a (Task 2): FOUND

## Self-Check: PASSED
