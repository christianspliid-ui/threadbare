---
phase: 03-coastlines-water-elevation
plan: 02
subsystem: renderer
tags: [rivers, water, three-js, quad-strips, meander-noise, tdd]
dependency_graph:
  requires: [03-01]
  provides: [RiverMesh, createRiverMesh, river-quad-strips, meander-pipeline]
  affects: [HexMapV2, waterPalette]
tech_stack:
  added: [RiverMesh.ts, SimplexNoise meander displacement in Three.js context]
  patterns: [Scene Module Factory, TDD Red/Green, Merged BufferGeometry]
key_files:
  created:
    - src/components/HexMapV2/scene/RiverMesh.ts
    - src/components/HexMapV2/scene/__tests__/RiverMesh.test.ts
  modified:
    - src/components/HexMapV2/HexMapV2.tsx
decisions:
  - "Mesh quad strips used for river width (not Three.js linewidth — WebGL clamps to 1px on most hardware)"
  - "All river paths merged into one BufferGeometry for minimal draw calls (NFP #7)"
  - "Y-flip applied during pixel conversion (threeY = -svgY) matching HexFillMesh convention"
  - "Meander pipeline ported from RiverOverlay.tsx SVG reference: edge-midpoints → subdivide → simplex noise → Chaikin smooth"
  - "riverPaths added to useEffect dep array so rivers rebuild on world regeneration"
metrics:
  duration_seconds: 264
  completed_date: "2026-03-21"
  tasks_completed: 2
  files_modified: 1
  files_created: 2
---

# Phase 03 Plan 02: River Overlay Rendering with Width Scaling

**One-liner:** Curved blue river overlays via mesh quad strips with meander noise, Chaikin smoothing, and width scaling from thin mountain streams to wide lowland rivers.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 (RED) | Failing TDD tests for river quad strip geometry | e450b44 |
| 1 (GREEN) | RiverMesh.ts — quad strip scene module with meander pipeline | 4826f8e |
| 2 | Wire createRiverMesh into HexMapV2 scene | 8dcf12a |

## What Was Built

### Task 1: RiverMesh Scene Module

`RiverMesh.ts` creates a `THREE.Group` at `RENDER_ORDER.RIVERS` (4) containing a single merged mesh for all river paths.

**Meander pipeline** (ported from `RiverOverlay.tsx` SVG reference):
1. Map hex coords → pixel centers via `hexToPixel`
2. Y-flip (SVG y-down → Three.js y-up)
3. Route through edge-midpoint waypoints (keeps river away from hex center icons)
4. Subdivide points (`RIVER_MEANDER_SUBDIVISIONS = 4` intermediate points per segment)
5. Perpendicular simplex noise displacement (`RIVER_SEED_OFFSET = 5501` so meander differs from coastline noise)
6. Chaikin smoothing (`RIVER_SMOOTH_PASSES = 2`)

**Quad strip geometry:**
- At each curve point, two vertices emitted: center ± normal * halfWidth
- Width lerps from `RIVER_WIDTH_SOURCE = 0.3` (source) to `RIVER_WIDTH_MOUTH = 1.8` (mouth)
- Triangle strip connects successive cross-sections
- All paths merged into one `BufferGeometry` (single draw call)

**Constants (all named, NFP #1):**
| Constant | Value | Purpose |
|----------|-------|---------|
| RIVER_WIDTH_SOURCE | 0.3 | Half-width at mountain source |
| RIVER_WIDTH_MOUTH | 1.8 | Half-width at lowland mouth |
| RIVER_MEANDER_SUBDIVISIONS | 4 | Intermediate waypoints per hex segment |
| RIVER_MEANDER_NOISE_SCALE | 0.035 | Noise frequency |
| RIVER_MEANDER_AMPLITUDE | 0.35 | Max perpendicular displacement (fraction of HEX_SIZE) |
| RIVER_SMOOTH_PASSES | 2 | Chaikin iterations |
| RIVER_SEED_OFFSET | 5501 | Differentiates river noise from coastline noise |
| RIVER_Z_OFFSET | 0.03 | Z position above all lower layers |

**Fail-soft table:**
| Condition | Behavior |
|-----------|----------|
| Empty riverPaths | Returns empty THREE.Group |
| RiverPath with < 2 hexes | Skipped |
| Invalid/missing hex coords | Skipped without crash |

### Task 2: HexMapV2 Wiring

`HexMapV2.tsx` updated to:
- Import `createRiverMesh` from `./scene/RiverMesh`
- Create river mesh after coastline mesh, guarded by `riverPathsRef.current.length > 0`
- Full disposal of mesh geometry and materials in cleanup
- `riverPaths` added to useEffect dependency array

## Tests Written

6 TDD tests in `RiverMesh.test.ts`:
1. Returns THREE.Group with renderOrder = RENDER_ORDER.RIVERS
2. 3-hex path produces non-zero vertex count
3. Empty paths returns group with no children (fail-soft)
4. Width at mouth > width at source (verified via vertex spread)
5. Y coordinates negated vs hexToPixel output (Y-flip)
6. 2-hex path produces at least 4 vertices

All 6 tests pass. Full suite: 5508 passing (13 pre-existing failures — unrelated to this plan).

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

### Files exist
- src/components/HexMapV2/scene/RiverMesh.ts: FOUND
- src/components/HexMapV2/scene/__tests__/RiverMesh.test.ts: FOUND

### Commits exist
- e450b44 (TDD RED): FOUND
- 4826f8e (Task 1 GREEN): FOUND
- 8dcf12a (Task 2): FOUND

## Self-Check: PASSED
