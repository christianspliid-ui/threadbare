---
phase: 01-renderer-foundation
plan: "01"
subsystem: HexMapV2 renderer
tags: [three.js, instanced-mesh, terrain-palette, renderer, webgl]
dependency_graph:
  requires: []
  provides:
    - TERRAIN_PALETTE (30-entry terrain color record)
    - WATER_PALETTE (5-entry water color record)
    - RENDER_ORDER enum (13 named render layers)
    - HexMapV2 component (Three.js forwardRef canvas component)
    - ?view=hexv2 route
  affects:
    - src/App.tsx (new hexv2 route)
tech_stack:
  added:
    - three@0.183.2
    - "@types/three@0.183.1"
  patterns:
    - InstancedMesh with per-instance color for 60K hex draw call
    - ResizeObserver + requestAnimationFrame render loop
    - Seeded simplex-noise for per-hex brightness variation
key_files:
  created:
    - src/components/HexMapV2/palette/terrainPalette.ts
    - src/components/HexMapV2/palette/waterPalette.ts
    - src/components/HexMapV2/palette/colorUtils.ts
    - src/components/HexMapV2/palette/__tests__/terrainPalette.test.ts
    - src/components/HexMapV2/scene/RenderLayers.ts
    - src/components/HexMapV2/scene/HexSceneSetup.ts
    - src/components/HexMapV2/scene/HexFillMesh.ts
    - src/components/HexMapV2/scene/HexGridLines.ts
    - src/components/HexMapV2/HexMapV2.tsx
    - src/components/HexMapV2/HexV2View.tsx
  modified:
    - src/App.tsx (added hexv2 route + HEXV2_COLS/ROWS constants)
    - package.json (three + @types/three added)
decisions:
  - "Used standalone HexV2View component rather than modifying GameView to minimize blast radius — GameView has ~15 hooks and complex state"
  - "Generated 200x300 world (60K hexes) for hexv2 route rather than reusing 20x15 quickStart tiles — the route exists to prove performance at scale"
  - "noiseCache Map in colorUtils prevents recreating the simplex-noise generator on every hex color call"
  - "Edge deduplication in HexGridLines uses rounded string key Set to halve line count for interior hexes"
metrics:
  duration_minutes: 4
  completed_date: "2026-03-21"
  tasks_completed: 2
  tasks_total: 2
  files_created: 10
  files_modified: 2
---

# Phase 1 Plan 01: Renderer Foundation — Palette, Scene, and Route Summary

Three.js hex renderer foundation: 30-terrain Tait palette, InstancedMesh 60K-hex draw call, deduplicated grid lines, and `?view=hexv2` route with full game chrome topbar.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Terrain/water palettes, colorUtils, RenderLayers enum | 5b70043 |
| 2 | HexSceneSetup, HexFillMesh, HexGridLines, HexMapV2, App route | d9c0f4c |

## What Was Built

**Palette layer** (`src/components/HexMapV2/palette/`):
- `TERRAIN_PALETTE`: 30 entries covering all Tait terrain categories (lowland, forest, wet, highland, desert, cold, volcanic, special) with exact hex color strings from the UI-SPEC
- `WATER_PALETTE`: 5 entries mapping water variants to blue-palette colors
- `colorUtils.getHexColor`: main entry point — resolves water > terrain > fallback, applies ±5% seeded brightness noise using `simplex-noise` + `mulberry32`

**Scene layer** (`src/components/HexMapV2/scene/`):
- `RenderLayers.ts`: 13-layer `RENDER_ORDER` enum (HEX_FILL=0..FOG=12)
- `HexSceneSetup.ts`: `createHexScene` + `resizeHexScene` — WebGLRenderer, OrthographicCamera, Scene
- `HexFillMesh.ts`: `createHexFillMesh` — single `InstancedMesh` for all hexes, `setMatrixAt`/`setColorAt` per tile, Y-flip for Three.js coordinate system
- `HexGridLines.ts`: `createHexGridLines` — deduplicated edge segments via sorted string key Set, `LineBasicMaterial` at 12% opacity

**React layer** (`src/components/HexMapV2/`):
- `HexMapV2.tsx`: `forwardRef` component, `ResizeObserver` + `requestAnimationFrame` loop, empty-state + error-state renders, `HexMapV2Handle` with stub `centerOn` (Plan 02 adds camera animation)
- `HexV2View.tsx`: minimal game chrome (topbar with route label, hex count, seed, hover/select coords) + full-height canvas

**Route**: `?view=hexv2` in App.tsx generates a 200×300 world (60K tiles) and renders via `HexV2View`.

## Verification Results

- 22/22 palette tests pass (`npx vitest run src/components/HexMapV2/`)
- `npx tsc --noEmit` exits 0 — no TypeScript errors
- `npx vite build` exits 0 — production build succeeds (chunk size warning is pre-existing Three.js bundle)

## Deviations from Plan

### Auto-selected implementations

**1. HexV2View instead of GameView modification**
- **Found during:** Task 2 App.tsx wiring
- **Issue:** GameView has ~15 hooks, complex simulation state, and would require significant plumbing for a map-swap prop. Minimizing blast radius per NFP #6 (additive over destructive).
- **Fix:** Created standalone `HexV2View` component with minimal game chrome (topbar only). Full chrome parity with GameView is a Phase 8 integration concern.
- **Impact:** Route works correctly; no GameView code touched.

**2. 200x300 grid instead of quickStartPhase tiles**
- **Found during:** Task 2 route wiring
- **Issue:** `quickStartPhase(42)` only provides archetype selection — tiles still need to be generated. The existing game uses 20x15; the V2 route's purpose is proving 60K-hex performance.
- **Fix:** Route generates `generateWorld(createBalancedCosmology(), 200, 300, 42)` directly.
- **Impact:** Route correctly demonstrates 60K-hex single draw call.

## Self-Check: PASSED

All 10 created files found on disk. Both task commits (5b70043, d9c0f4c) verified in git log.
