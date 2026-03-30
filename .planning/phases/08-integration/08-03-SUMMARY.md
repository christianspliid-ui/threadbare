---
phase: 08-integration
plan: 03
subsystem: test-sync
tags: [tests, gap-closure, intg-06, signifier-mesh, elevation-ticks, terrain-palette, coastline]
dependency_graph:
  requires: [08-02]
  provides: [INTG-06-closed]
  affects: [test-suite-health]
tech_stack:
  added: []
  patterns: [canvas-mock-completeness, terrain-gated-tests, quad-geometry-assertions]
key_files:
  created: []
  modified:
    - src/components/HexMapV2/scene/__tests__/SignifierMesh.test.ts
    - src/components/HexMapV2/scene/__tests__/ElevationTicks.test.ts
    - src/components/HexMapV2/palette/__tests__/terrainPalette.test.ts
    - src/types/__tests__/coastline.test.ts
  deleted:
    - src/components/HexMap/__tests__/MovementTrails.test.tsx
decisions:
  - Canvas mock must include all ctx methods invoked by buildSignifierTexture: translate, clip, beginPath, closePath, fillRect
  - ElevationTicks now plateau-only with fixed TICKS_PER_EDGE=4 quad geometry — tests reflect new geometry model
  - MovementTrails.test.tsx was untracked (V1 code deleted in 08-02) — removed from disk, not git-tracked
metrics:
  duration: 5 minutes
  completed_date: "2026-03-23T06:55:32Z"
  tasks_completed: 2
  files_modified: 4
  files_deleted: 1
---

# Phase 8 Plan 03: INTG-06 Test Gap Closure Summary

Fixed 14 test failures caused by source/test divergence from uncommitted WIP changes. Deleted stale V1 MovementTrails test referencing deleted code.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix SignifierMesh test canvas mock | 81e125f | SignifierMesh.test.ts |
| 2 | Fix ElevationTicks, terrainPalette, coastline + delete MovementTrails | 735c540 | ElevationTicks.test.ts, terrainPalette.test.ts, coastline.test.ts, deleted MovementTrails.test.tsx |

## What Was Done

### Task 1: SignifierMesh Canvas Mock

`buildSignifierTexture()` in `signifierTextures.ts` calls `ctx.translate()`, `ctx.clip()`, and more on the Canvas 2D context, but the test mock only provided `save`, `restore`, `scale`, `fill`, `fillStyle`, `globalAlpha`. Added the missing methods:

- `translate: vi.fn()`
- `clip: vi.fn()`
- `beginPath: vi.fn()`
- `closePath: vi.fn()`
- `fillRect: vi.fn()`

All 9 SignifierMesh tests now pass (was 7 failing, 2 passing before fix — actually all 7 land-related tests were failing due to missing mock methods).

### Task 2: Multiple Test Fixes

**ElevationTicks.test.ts** — full rewrite of assertions to match new source behavior:
- Source returns `THREE.Mesh` (was `THREE.LineSegments`) — quad geometry for visible ticks on all WebGL platforms
- Only `terrain: 'plateau'` hexes emit ticks (was all terrain types)
- Fixed `TICKS_PER_EDGE = 4` (was density-based 3–8 scaling)
- `TICK_THRESHOLD = 0.01` (was `0.25`)
- Each tick = 4 vertices (quad), so 4 ticks = 16 vertices per qualifying edge
- Updated `makeTile` helper to accept terrain parameter (default `'plateau'`)
- Updated `twoAdjacentTiles` to create plateau + grassland pair

**terrainPalette.test.ts** — updated key count assertion: `30 → 32` (source added `volcano` and `light_forest` entries)

**coastline.test.ts** — updated shallowWidth assertion: `0.19 → 0.28` (constant tuned in COASTLINE_DEFAULTS)

**MovementTrails.test.tsx** — deleted from disk. File was untracked (V1 HexMap directory deleted in Phase 8 Plan 02 commits), but vitest was discovering it and trying to run it against the deleted source.

## Verification Results

All 4 target test files:
- `SignifierMesh.test.ts`: 9/9 passed
- `ElevationTicks.test.ts`: 7/7 passed
- `terrainPalette.test.ts`: 22/22 passed
- `coastline.test.ts`: 4/4 passed

Full test suite after changes: 5792 passed, 1 pre-existing timeout failure (content-layer1-integration, unrelated to this plan).

MovementTrails.test.tsx confirmed not on disk.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- SignifierMesh.test.ts exists with translate and clip mocks: FOUND
- ElevationTicks.test.ts contains THREE.Mesh and plateau terrain: FOUND
- terrainPalette.test.ts contains toHaveLength(32): FOUND
- coastline.test.ts contains toBe(0.28): FOUND
- MovementTrails.test.tsx does not exist: CONFIRMED (untracked file, removed from disk)
- Task 1 commit 81e125f: FOUND
- Task 2 commit 735c540: FOUND
