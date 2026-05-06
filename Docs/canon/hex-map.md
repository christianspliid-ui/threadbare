---
domain: hex-map
last_reviewed: 2026-05-06
reviewer: cowork
ul_shards: [Graph]
status: live
---

# Canon — Hex Map

> The hex map is the world made visible. HexMapV2 is the sole renderer: a raw Three.js scene driven by d3-zoom, layered by `RENDER_ORDER`, clipped by stencil at the coastline, and instanced for performance. Every hex you see is one position in the three-tier model — every agent, encounter, and intervention resolves through it.

## How to use this page

Load this page once at session start when working on the hex map renderer, signifiers, agents-on-map, fog-of-war, zoom behavior, coastlines, region labels, or any Three.js code in `src/components/HexMapV2/`. Every link below is a pointer; the linked target is authoritative. When a pointer disagrees with the target, the target wins and the pointer needs an update — open a `drift-scan`-labeled Linear issue.

**Three skills divide the hex-map work.** Pick one before you write — running the wrong skill fights the right one.

## Authoring entrypoint — pick the skill that matches your task

| If you are doing… | Load skill | Lives at |
|---|---|---|
| Architecture, coordinates, zoom, render order, color pipeline, performance — load BEFORE any HexMapV2 code work | [`hexmap-core`](../../.claude/skills/hexmap-core/SKILL.md) | `src/components/HexMapV2/` (root, scene setup, color pipeline) |
| Hands-on layer work — signifiers, agents, fog, labels, click handlers, trails. Load alongside `hexmap-core` | [`hexmap-layers`](../../.claude/skills/hexmap-layers/SKILL.md) | `src/components/HexMapV2/{signifiers,agents,overlay,interaction}/` |
| Quick reference for settled renderer decisions and Phase 1–8 patterns | [`hexmap-renderer`](../../.claude/skills/hexmap-renderer/SKILL.md) | `src/components/HexMapV2/scene/`, camera modules |

If your task crosses two skills (e.g. adding a new render layer), load `hexmap-core` first — architecture before features. The Blender → GLB pipeline is a separate skill ([`blender-to-hexmap`](../../.claude/skills/blender-to-hexmap/SKILL.md)) loaded only when authoring 3D model assets.

## Current spec

- **Sole renderer:** HexMapV2. The V1 SVG hex map (`HexMap.tsx`, `HexTile.tsx`, `AgentDots.tsx`, `MovementTrails.tsx`) was deleted in Phase 8. Any reference to V1 components is stale.
- **Main entry:** [`src/components/HexMapV2/HexMapV2.tsx`](../../src/components/HexMapV2/HexMapV2.tsx) — scene setup, d3-zoom, render loop, layer orchestration. React owns the `<canvas>` ref; Three.js owns the scene graph.
- **Standalone debug view:** [`src/components/HexMapV2/HexV2View.tsx`](../../src/components/HexMapV2/HexV2View.tsx) — seed 42, no game state. URL: `?view=glow` and related flags.
- **Game integration:** [`src/components/Game/GameView.tsx`](../../src/components/Game/GameView.tsx) — primary game view. Test with `?view=game&seeded` (large map) or `?view=game&seeded&size=medium` (avoids tick-loop perf stall).
- **World gen entry:** [`src/engine/worldSeed.ts`](../../src/engine/worldSeed.ts) → `generateWorld(seed, cols, rows)` returns `WorldGenResult` (not `HexTile[]`; all call sites use `.tiles`).
- **Coordinate math:** [`src/lib/hexMath.ts`](../../src/lib/hexMath.ts) — `hexToPixel`, `offsetToCube`, `cubeToOffset`, `hexNeighbors`, `hexDistance`. Flat-top odd-q offset grid; `HEX_SIZE = 10`.
- **Tunable constants catalog:** [`src/components/CMS/tunableConstants.ts`](../../src/components/CMS/tunableConstants.ts) — every named constant exposed to the editor UI (NFP #1).
- **UL terms:** [Graph shard](../ubiquitous-language/Graph.md) — HexTile, TerrainType, Three-tier Position Model, located_at Edge, Hex, Location, Sublocation.

## Load-bearing architectural decisions (settled)

CLAUDE.md is authoritative — repeated here as Step-0 reminders. Do not revisit.

- **Raw Three.js, no React Three Fiber.** Direct Three.js gives full control over `InstancedMesh`, the render loop, stencil buffer operations, and d3-zoom integration without R3F abstraction overhead. R3F is on the Rejected Approaches list.
- **Flat hex grid + 2D signifier art, no 3D models per hex.** The KayKit GLTF approach was rejected; terrain art is composited per-hex via signifier sprites. Discrete 3D models (cities, fortresses) ship via the `blender-to-hexmap` pipeline at landmark scale, not per-hex.
- **Three-tier position model: hex → location → sublocation.** An agent occupies exactly one tier via a single `located_at` edge to the most-specific node. Resolution upward: sublocation → parent location → hex. All systems needing spatial reasoning resolve to the hex level. See [Graph UL shard](../ubiquitous-language/Graph.md) for the canonical definition.
- **Hex-granular awareness, not location-graph hops.** Within-hex visibility is automatic (distance 0). Cross-hex visibility uses hex coordinate distance, not the location-distance matrix. The distance matrix exists for other purposes (encounter scoring) but is **not** the awareness oracle.
- **d3-zoom owns ALL camera state.** Never set camera position/zoom outside `syncCameraToZoom()`. The custom wheel handler is mandatory (the d3-zoom default produces wrong results with the `cx=-tx/k`, `cy=ty/k` Y-flipped mapping).
- **Y-flip applies everywhere.** Three.js is y-up; SVG/screen is y-down. World position is `(pixelX, -pixelY, 0)`. Winding order reverses; coastline contour loops, label overlays, and raycasting all account for it.
- **HEX_SIZE = 10** is the fundamental scaling constant. Duplicated as a local const in `regionLabels.ts` to avoid a circular import — that duplication is intentional (load-bearing), not a bug.
- **Hex state mutations live in `GameState.tiles[]`, not the graph.** Hex actions produce `HexMutation[]` applied in `phaseHexState`. The graph holds nodes and edges; hex tiles are flat array state.

## Coordinate system summary

- **Flat-top odd-q offset:** `HexCoord = { col, row }`; odd columns shifted down half a hex.
- **Cube coordinates:** `CubeCoord = { q, r, s }` — used for hex math (distance, neighbors, rings); convert via `offsetToCube` / `cubeToOffset`.
- **Pixel position:** `hexToPixel(hex, size)` returns `{ x, y }` in SVG-space (y-down). Three.js world position is `(x, -y, 0)`.
- **Neighbors:** `hexNeighbors(hex)` returns 6 neighbors, parity-aware for odd-q. Naive vertex-position dedup breaks here — use hex-pair coord keys (e.g. ElevationTicks dedup).

## Render layers (the 13 named layers)

Single source of truth: [`src/components/HexMapV2/scene/RenderLayers.ts`](../../src/components/HexMapV2/scene/RenderLayers.ts) `RENDER_ORDER`.

```
STENCIL_WRITE -1 → HEX_FILL 0 → COASTLINE 1 → GRID 2 → ELEVATION_TICKS 3 →
RIVERS 4 → ROADS 5 → BORDERS 6 → SIGNIFIERS 7 → LOCATIONS 8 → AGENTS 9 →
EVENTS 10 → LABELS 11 → FOG 12
```

**Adding a layer:** add to `RENDER_ORDER` → add visibility row to `ZOOM_VISIBILITY_MATRIX` → factory in `scene/` (`create*Mesh(tiles, …) → THREE.Group`) → wire into `HexMapV2.tsx` lifecycle → tests in `scene/__tests__/`. The `hexmap-layers` skill walks each step.

**Stencil clipping at the coastline:** organic shorelines without modifying hex geometry. `CoastlineMesh` writes 1 into the stencil buffer (renderOrder -1, `colorWrite: false`); land `InstancedMesh` renders only where stencil = 1 (`stencilFunc: EqualStencilFunc`); water renders normally underneath. The organic boundary clips **land** hex edges; water hex colors are preserved per-hex.

## Zoom system (4 tiers + d3-zoom)

| Tier | k (d3 scale) | Name | What's visible |
|------|--------------|------|----------------|
| 4 | k ≥ 15 | hero-local | Portraits, events, grid, signifiers, labels |
| 3 | k ≥ 5 | regional | Faction dots, signifiers, locations, labels, roads, rivers |
| 2 | k ≥ 1.5 | continental | Rivers, borders, retinue dots |
| 1 | k < 1.5 | full-world | Hex fill, coastlines, kingdom borders |

Authoritative table: [`ZoomVisibilityMatrix.ts`](../../src/components/HexMapV2/scene/ZoomVisibilityMatrix.ts). Cross-fade range `FADE_RANGE = 0.2`. Zoom-toward-selected-hex uses lerp: `ZOOM_TARGET_LERP_IN = 0.4` (in), `0.15` (out). The `zoom.on('zoom.labels')` secondary listener must be removed with `null` in cleanup; the primary `zoom.on('zoom', null)` does not cover it.

## Color pipeline (load-bearing renderer config)

- `renderer.toneMapping = THREE.NoToneMapping` — flat 2D map, not HDR. Default AgX/ACES compresses the gamut and washes 30 distinct terrain colors into one shade.
- `renderer.outputColorSpace = THREE.SRGBColorSpace` — so `#RRGGBB` strings display true to value.
- `color.setRGB(r, g, b, THREE.SRGBColorSpace)` — always specify the color space; without it, gamma is applied twice.
- Palettes: [`palette/terrainPalette.ts`](../../src/components/HexMapV2/palette/terrainPalette.ts) (30 land terrains + ±5% Simplex brightness noise), [`palette/waterPalette.ts`](../../src/components/HexMapV2/palette/waterPalette.ts) (depth bands, lake / river / shallows / ocean / deep_ocean).

## Visual verification (always two-tier)

Playwright `preview_snapshot` and `preview_inspect` see only a blank `<canvas>` element — they cannot read WebGL content. Use both:

| What to check | Tool |
|---|---|
| Console errors, network, DOM UI around canvas | Playwright: `preview_console_logs`, `preview_network`, `preview_snapshot` |
| Actual rendered hex map visuals | **Claude in Chrome:** `tabs_context_mcp` → `navigate` to `localhost:5173/?view=game&seeded` → `computer` with `action: "screenshot"` or `"zoom"` |

Always `preview_resize` to 1920×1080 before screenshots — default viewports vary.

## Active design plans

- [`2026-02-26-hex-map-mvp-design.md`](../plans/2026-02-26-hex-map-mvp-design.md) and [`-implementation.md`](../plans/2026-02-26-hex-map-mvp-implementation.md) — original MVP architecture. Status: implementation-log (foundational reference).
- [`2026-03-07-hex-map-visual-overhaul-plan.md`](../plans/2026-03-07-hex-map-visual-overhaul-plan.md) — visual overhaul lineage. Status: implementation-log.
- [`2026-03-23-stencil-coastline-wiring.md`](../plans/2026-03-23-stencil-coastline-wiring.md) — coastline stencil pipeline. Status: implementation-log.
- [`2026-03-16-region-labels-on-hex-map-design.md`](../plans/2026-03-16-region-labels-on-hex-map-design.md) — region label overlay. Status: implementation-log.
- [`2026-04-06-parchment-fog-of-war-design.md`](../plans/2026-04-06-parchment-fog-of-war-design.md) and [`-implementation.md`](../plans/2026-04-06-parchment-fog-of-war-implementation.md) — fog-of-war system. Status: implementation-log.
- [`2026-04-08-procedural-hex-vignettes.md`](../plans/2026-04-08-procedural-hex-vignettes.md) — hex vignette tooltip flow. Status: current.
- [`2026-04-24-hex-map-rarity-signifiers.md`](../plans/2026-04-24-hex-map-rarity-signifiers.md) — rarity-tier signifier work. Status: current.
- [`2026-05-05-canonical-documentation-strategy.md`](../plans/2026-05-05-canonical-documentation-strategy.md) — strategy plan for this Canon page (Phase 2b, THR-313).

## Exemplars and lessons learned

- **Renderer setup exemplar:** [`scene/HexSceneSetup.ts`](../../src/components/HexMapV2/scene/HexSceneSetup.ts) — `NoToneMapping` + `SRGBColorSpace` are load-bearing for palette fidelity.
- **Camera ownership exemplar:** [`camera/D3ZoomCamera.ts`](../../src/components/HexMapV2/camera/D3ZoomCamera.ts) — d3-zoom owns camera state; custom wheel handler required.
- **Coastline exemplar:** [`scene/CoastlineMesh.ts`](../../src/components/HexMapV2/scene/CoastlineMesh.ts) + [`scene/HexFillMesh.ts`](../../src/components/HexMapV2/scene/HexFillMesh.ts) — stencil-write then land clip is the current coastline architecture.
- **Debug/verification lesson:** Playwright snapshots cannot verify WebGL visuals; use Claude-in-Chrome screenshots for rendered map truth and Playwright for console/network/DOM checks only.

## Rejected approaches

- ❌ **React Three Fiber** — replaced by raw Three.js with a canvas ref. R3F's render-loop and InstancedMesh abstraction made stencil ops, d3-zoom integration, and per-instance attributes unnecessarily indirect. Settled; do not reintroduce.
- ❌ **KayKit GLTF 3D models per hex** — replaced by flat hex grid + 2D signifier art composited per-hex. 3D landmark models still ship via `blender-to-hexmap`, but at landmark scale, not per-hex.
- ❌ **V1 SVG hex map** (`HexMap.tsx`, `HexTile.tsx`, `AgentDots.tsx`, `MovementTrails.tsx`) — deleted in Phase 8. Constants like `HEX_SIZE = 30` and `hexToPixel` from V1 are stale; HexMapV2 uses `HEX_SIZE = 10` and the `src/lib/hexMath.ts` pipeline.
- ❌ **Location-hop awareness** (BFS over the location-graph distance matrix via `adjacent` edges) — replaced by hex-distance awareness (geometric, predictable, sublocation-agnostic). Don't use the distance matrix as the visibility oracle.
- ❌ **Opaque coastline contour fills** at z>0 covering the entire landmass — hid per-hex terrain colors underneath. Replaced by stencil clipping (write 1 into stencil, render land where stencil = 1). The opaque-fill approach is a known failed retry pattern.
- ❌ **`THREE.LineBasicMaterial` linewidth > 1** — WebGL clamps to 1px. Use mesh quad strips for thick lines (the river renderer does this).
- ❌ **d3-zoom default wheel handler** — produces wrong results under our `cx=-tx/k`, `cy=ty/k` Y-flipped mapping. Custom wheel handler is mandatory.
- ❌ **`resizeHexScene` touching camera frustum** — overwrites d3-zoom state and snaps the grid to the wrong position on resize. Resize updates renderer size only; camera is re-synced via d3-zoom.
- ❌ **Sharing a single geometry across multiple `InstancedMesh`es with per-instance attributes** — each `geometry.setAttribute('aUvRect', …)` overwrites the shared buffer; only the last mesh's data survives. Clone base geometry per mesh; set `frustumCulled = false`.
- ❌ **`fractalNoise`-based volcanic placement** — at seed 42 the range never reached the 0.95 threshold. Replaced by `mulberry32` integer-hash placement.
- ❌ **`Math.random()` in world-gen or render layers** — seeded PRNG only (NFP #3). Variant selection, jitter, brightness noise all key off `(col, row)` via `mulberry32`.

## Open questions

- **Per-frame agent sprite path** — currently one draw call per agent sprite (acceptable at 60K tiles, but not InstancedMesh). Future optimization candidate; profile first.
- **Tick-loop performance on `large` maps** with `?view=game&seeded` (THR-162/163/164/165) — the rendering side is healthy; the stalls are upstream in the engine. Use `?view=game&seeded&size=medium` for testing while those issues are open.
- **Shallow band coastline disabled** — see `coastline-system.md` in `hexmap-core/` for the full table of failed approaches and the current limitation. Re-enabling is open; the existing config constants (`COASTLINE_DEFAULTS`) are tuned for the active path only.
- **Distance matrix cap at 1200** — covers all current presets (`large` ~584, `epic` ~805); at the cap, a `console.warn` fires. Splitting the cache into encounter-scoring vs distance-only is a possible future refinement; not load-bearing today.

## Last-reviewed

2026-05-06 by Cowork. Review trigger: monthly, or when any linked plan moves to `superseded`, or when `src/components/HexMapV2/scene/RenderLayers.ts` / `ZoomVisibilityMatrix.ts` / `HexSceneSetup.ts` change shape.
