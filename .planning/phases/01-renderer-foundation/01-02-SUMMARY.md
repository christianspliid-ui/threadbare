---
phase: 01-renderer-foundation
plan: "02"
subsystem: HexMapV2 camera + interaction
tags: [three.js, d3-zoom, orthographic-camera, raycasting, tooltip, interaction]
dependency_graph:
  requires:
    - 01-01 (HexScene, InstancedMesh, HexFillMesh, HexGridLines, HexMapV2 base)
  provides:
    - D3ZoomCamera (syncCameraToZoom, setupD3Zoom, CAMERA_CONSTANTS)
    - CameraAnimator (animateCameraTo — 500ms fly-to)
    - HexRaycaster (screenToHex, worldToScreen, hexToWorldCenter, INTERACTION_CONSTANTS)
    - HexTooltip (HTML overlay with terrain name + coordinates)
    - Fully interactive HexMapV2 at ?view=hexv2
  affects:
    - src/components/HexMapV2/HexMapV2.tsx (extended with camera + interaction)
tech_stack:
  added: []
  patterns:
    - d3-zoom ZoomTransform to OrthographicCamera frustum sync (Y-flip applied)
    - d3 transition for smooth fly-to animation (same pattern as HexMap.tsx centerOn)
    - Screen NDC unproject to world coordinates for hex raycasting
    - Inverse hexToPixel for world-to-hex coordinate conversion
    - LineLoop with LineBasicMaterial for selected hex gold ring
    - Single Mesh with transparent MeshBasicMaterial for hover overlay
key_files:
  created:
    - src/components/HexMapV2/camera/D3ZoomCamera.ts
    - src/components/HexMapV2/camera/CameraAnimator.ts
    - src/components/HexMapV2/camera/__tests__/D3ZoomCamera.test.ts
    - src/components/HexMapV2/interaction/HexRaycaster.ts
    - src/components/HexMapV2/interaction/HexTooltip.tsx
    - src/components/HexMapV2/interaction/__tests__/HexRaycaster.test.ts
  modified:
    - src/components/HexMapV2/HexMapV2.tsx (camera integration + raycasting + tooltip + ring + hover)
decisions:
  - "d3 transition used for fly-to animation (matches existing HexMap.tsx centerOn pattern) — fires zoom events automatically so syncCameraToZoom stays in sync without a manual rAF loop"
  - "LineBasicMaterial linewidth used for selection ring — degrades to 1px on WebGL2 without ANGLE; acceptable for Phase 1, Phase 7 can use mesh outline if needed"
  - "frustumCulled=true explicit on InstancedMesh — Three.js default but stated explicitly per plan spec; per-instance culling deferred to Phase 7"
  - "Y-flip math: HexFillMesh stores hexes at world(x, -y) because SVG y-down vs Three.js y-up; syncCameraToZoom uses cy = transform.y/k (positive = up), screenToHex negates worldY to recover grid space"
metrics:
  duration_minutes: 5
  completed_date: "2026-03-21"
  tasks_completed: 2
  tasks_total: 2
  files_created: 6
  files_modified: 1
---

# Phase 1 Plan 02: Camera Controls + Interaction Summary

d3-zoom to OrthographicCamera sync, smooth 500ms fly-to animation, screen-to-hex raycasting, HTML tooltip overlay, gold ring selection, and hover highlight — completing all Phase 1 renderer requirements.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | D3ZoomCamera, CameraAnimator, D3ZoomCamera unit tests | 92a059a |
| 2 | HexRaycaster, HexTooltip, HexRaycaster tests, HexMapV2 integration | 44561e0 |

## What Was Built

**Camera layer** (`src/components/HexMapV2/camera/`):
- `D3ZoomCamera.ts`: `syncCameraToZoom` maps any d3 ZoomTransform to an OrthographicCamera frustum with correct Y-flip; `setupD3Zoom` attaches d3-zoom with scale extent [0.3, 10], double-click disabled, grid-centered initial transform at DEFAULT_ZOOM=1.5
- `CameraAnimator.ts`: `animateCameraTo` uses `d3.select(canvas).transition().duration(500).call(zoomBehavior.transform, ...)` — same pattern as the SVG HexMap's centerOn, ensuring zoom events fire every frame and keep the camera synced

**Interaction layer** (`src/components/HexMapV2/interaction/`):
- `HexRaycaster.ts`: `screenToHex` converts screen pixels to HexCoord via NDC unproject then inverse hexToPixel; `worldToScreen` projects world positions to canvas pixels for tooltip placement; `hexToWorldCenter` computes hex center in Three.js world space
- `HexTooltip.tsx`: absolutely-positioned React div, `pointer-events: none`, terrain name in `--accent-gold` at `--text-sm`, coordinates in `--text-secondary` at `--text-xs`; clamps to canvas bounds; water terrain types use display labels per UI-SPEC copywriting contract

**HexMapV2 integration** (`HexMapV2.tsx`):
- `setupD3Zoom` called on mount, zoom behavior and destroy stored in refs
- `useImperativeHandle` calls `animateCameraTo` for `centerOn(x, y, scale?)` API
- `onMouseMove` handler calls `screenToHex` → tooltip state → `onHexHover` callback
- `onClick` handler calls `screenToHex` → `onHexClick` callback
- `onMouseLeave` clears tooltip and calls `onHexHover(null)`
- Gold `LineLoop` ring (renderOrder GRID+1) repositioned when `selectedHex` prop changes
- White transparent `Mesh` overlay (renderOrder GRID+2, opacity 0.10) for hover highlight
- `frustumCulled = true` explicit on InstancedMesh with comment explaining Phase 7 scope

## Verification Results

- 35/35 tests pass (`npx vitest run src/components/HexMapV2/`)
  - 22 palette tests (Plan 01 unchanged)
  - 5 camera tests (D3ZoomCamera — frustum computation for identity, zoom, pan, combined)
  - 8 raycaster tests (null bounds, round-trips for even+odd columns, worldToScreen, hexToWorldCenter)
- `npx tsc --noEmit` exits 0 — no TypeScript errors
- `npx vite build` exits 0 — production build succeeds (chunk size warning is pre-existing Three.js bundle)

## Deviations from Plan

None — plan executed exactly as written.

The "combined zoom and pan" test value annotation in the plan noted that exact values needed verification — confirmed by running `d3.zoomIdentity.scale(4).translate(-50, 25)` in Node.js: k=4, x=-200, y=100, cx=50, cy=25. Test values match exactly.

## Self-Check: PASSED
