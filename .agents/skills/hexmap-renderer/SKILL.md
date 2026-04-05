---
name: hexmap-renderer
description: >
  Three.js hex map renderer patterns and decisions from Hex Map V2 (Phases 1-8).
  Load when working on HexMapV2, scene layers, zoom behavior, coordinate mapping,
  coastline/river/elevation overlays, region labels, or any rendering code in
  src/components/HexMapV2/. Triggers on "hex map", "HexMapV2", "Three.js scene",
  "zoom", "coastline", "river overlay", "region labels", "elevation ticks",
  "InstancedMesh", "d3-zoom", or any hex renderer work.
---

# Hex Map Renderer — Domain Context

This skill captures hard-won decisions from the Hex Map V2 implementation (Phases 1-8). HexMapV2 is the sole hex map renderer — the old V1 SVG map was deleted in Phase 8. Load before modifying any rendering code.

## Architecture

- **Raw Three.js** — no React Three Fiber. Direct Three.js gives full control over InstancedMesh, render loop, and d3-zoom integration.
- **Canvas ref pattern** — React owns the `<canvas>` element via ref; Three.js owns the scene graph and render loop.
- **Scene layers** — each visual feature (terrain, coastline, rivers, elevation ticks, region borders, labels) is a separate module that adds/removes its own meshes.

## Visual Verification

Playwright/preview tools **cannot** see WebGL canvas content — snapshots and inspect only see a blank `<canvas>` element. Use this two-tier approach:

| What to check | Tool |
|----------------|------|
| Console errors, network, DOM UI around canvas | Playwright `preview_console_logs`, `preview_network`, `preview_snapshot` |
| Actual rendered hex map visuals (terrain, coastlines, signifiers, colors) | **Codex in Chrome** — `tabs_context_mcp` → `navigate` to `localhost:5173/?view=game` → `computer` with `action: "screenshot"` or `action: "zoom"` for detail. |

When verifying hex map changes, always check both: Playwright for errors, Codex in Chrome for visual correctness.

## Coordinate System

- **Odd-q offset grid** — column-major hex layout. Odd columns are shifted down by half a hex.
- **HEX_SIZE = 10** — each hex is 10 units wide. This is the fundamental scaling constant.
- **Y-flip** — Three.js y-up, SVG/screen y-down. All coordinate conversions must account for this. Winding order: positive SVG signed area (CCW in y-down) is reversed after Y-flip to maintain CCW in Three.js y-up.

## Zoom & Camera

- **d3-zoom owns the camera.** All wheel zoom is handled manually (not d3-zoom default) because `syncCameraToZoom` uses non-standard coordinate mapping: `cx = -tx/k`, `cy = ty/k` with Y-flip.
- **`resizeHexScene` only updates renderer size** — camera frustum is managed exclusively by d3-zoom via `syncCameraToZoom`. Never set camera position/zoom outside this path.
- **Zoom-toward-selected-hex** uses lerp convergence: 0.4 factor when zooming in, 0.15 when zooming out.
- **Zoom tier thresholds:** full-world `<1.5`, continental `<5`, regional `<15`, hero-local `>=15`. Labels filter by tier accordingly.
- **`zoom.on('zoom.labels')` secondary listener** for decoupled zoom level tracking; removed with null in cleanup.

## Terrain Rendering

- **InstancedMesh** — one mesh per terrain type, uses `setMatrixAt` for positioning. Minimal draw calls.
- **Province flood-fill** uses strict min seed distance — no fallback relaxation. Provinces that can't fit are skipped.
- **Province role radii** scaled to province extent (not fixed distance) — works on both small test grids and 60K-hex production grids.
- **Volcanic placement** uses mulberry32-style integer hash (not fractalNoise) — fractalNoise range with seed 42 never reached 0.95 threshold.
- **Wetland overrides** only apply below `ELEV.LOWLAND` (0.40) to prevent mid-elevation forest misclassification.

## Water & Coastlines

- **Water colors** extracted from `Design/mark-known-world-region-8-v2.png`: deep_ocean `#3A7AB8`, ocean `#5098D0`, shallows `#78BCE0`, lake `#4A8FC0`, river `#68B0D8`.
- **CoastlineMesh** — two-layer approach: shallows band (z=0.01) + land boundary (z=0.02) using ShapeGeometry from marching squares loops.
- **River rendering** — mesh quad strips for width (not linewidth — WebGL clamps to 1px). All river paths merged into one BufferGeometry for minimal draw calls.
- **Terrain seeding before biome pass** — hydrology pre-seeds terrain from `isOcean` + elevation so river routing works before biome classification.
- **`generateWorld()` returns `WorldGenResult` not `HexTile[]`** — all call sites use `.tiles`.

## Elevation & Terrain

- **ElevationTicks** uses hex-pair coord dedup (not vertex-position key) to avoid index-to-neighbor mapping error in odd-q offset grids.
- **Pass06 tempReassess fail-soft:** checks `lakeIds`/`hasRiver` for non-default values before running effects — no-ops gracefully before hydrology.

## Region Labels & Borders

- **RegionCluster id field** added to legacy `detectRegions()` for backward compat — returns sequential int starting at 0.
- **`detectRegionsBorderCost`** seeds from province capitals; fallback auto-places seeds every `sqrt(REGION_TARGET_SIZE)` hexes on land.
- **Feature type mapping:** coast/coastal_shallows/reef → `sea`; plateau → `hill_country`; oasis → `desert`.
- **One province = one barony** — province is the unit of political control, not geographic region.
- **Border geometry:** only barony/kingdom differences generate border mesh — geographic-only differences produce nothing.
- **Two separate Points objects for capitals** — PointsMaterial has one size per object, not per-point.
- **HEX_SIZE duplication** — `HEX_SIZE=10` duplicated as local const in `regionLabels.ts` to avoid circular import with HexMapV2 scene layer.

## Key Source Files

| File | Purpose |
|------|---------|
| `src/components/HexMapV2/HexMapV2.tsx` | Main scene setup, d3-zoom integration, render loop |
| `src/components/HexMapV2/scene/` | Scene layers: terrain, coastline, rivers, elevation ticks, grid lines, signifiers |
| `src/components/HexMapV2/camera/D3ZoomCamera.ts` | d3-zoom ↔ Three.js camera sync |
| `src/components/HexMapV2/signifiers/` | Terrain signifier textures and registry |
| `src/components/HexMapV2/agents/` | Agent sprite rendering on hex map |
| `src/components/HexMapV2/HexV2View.tsx` | Standalone debug route (no game state) |
| `src/components/Game/GameView.tsx` | Primary game view — imports HexMapV2 with full game chrome |
| `src/engine/worldSeed.ts` | World generation pipeline |

## Completed Phases

All 8 phases of the Hex Map V2 roadmap are complete. The V1 SVG hex map was deleted in Phase 8 and HexMapV2 is now the sole renderer, integrated directly into GameView.
