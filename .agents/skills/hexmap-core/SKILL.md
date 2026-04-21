---
name: hexmap-core
description: >
  Foundation guide for the HexMapV2 Three.js hex map renderer. Covers
  architecture, technology stack, coordinate systems, render layers, zoom
  system, coastline overview, color system, configuration constants,
  performance, lessons learned, and NFP compliance. Load BEFORE any
  HexMapV2 code work — this is the required foundation. hexmap-layers
  depends on this. Triggers on "hex map", "HexMapV2", "Three.js", "WebGL",
  "hex renderer", "d3-zoom", "hex coordinate", "hex grid", "coordinate
  system", "zoom tier", "render layer", "stencil", "InstancedMesh",
  "terrain palette".
---

# HexMap Core — Architecture & Foundation

Foundation reference for the HexMapV2 Three.js hex map renderer. This is the **sole map renderer** — the V1 SVG hex map was deleted in Phase 8. Load this before any HexMapV2 code work. Load `hexmap-layers` alongside this when building or modifying a specific visual layer.

---

## 1. Technology Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Three.js | ^0.183.2 | 3D rendering engine (raw — **no React Three Fiber**) |
| d3 (d3-zoom) | ^7.9.0 | Pan/zoom behavior, orthographic camera control |
| React | ^19.2.0 | Component lifecycle, canvas ref ownership, overlay rendering |
| TypeScript | ~5.9.3 | Type safety throughout |
| simplex-noise | ^4.0.3 | Seeded procedural noise for color variation |
| Vite | ^7.3.1 | Build tooling, HMR |
| Vitest | ^4.0.18 | Unit testing (jsdom environment) |

**Why raw Three.js instead of React Three Fiber?** Direct Three.js gives full control over InstancedMesh, the render loop, stencil buffer operations, and d3-zoom integration without R3F abstraction overhead. This is a settled architectural decision — do not reintroduce R3F.

---

## 2. Architecture Overview

### Component Ownership

```
React (HexMapV2.tsx)
  ├── Owns the <canvas> element via useRef
  ├── Manages component lifecycle (mount/unmount/resize)
  ├── Passes game state as props (tiles, agents, visibility)
  └── Renders HTML overlay components (labels, tooltip)

Three.js (scene modules)
  ├── Owns the scene graph (meshes, materials, textures)
  ├── Owns the render loop (requestAnimationFrame)
  └── All visual layers are separate factory modules

d3-zoom
  ├── Owns ALL camera state (position, scale)
  ├── Custom wheel handler (not d3 default — see Lessons Learned)
  └── Syncs to Three.js orthographic camera via syncCameraToZoom()
```

### Props & Handle Contract

```typescript
// Input: game state flows in via props
interface HexMapV2Props {
  tiles: HexTile[];
  cols: number;
  rows: number;
  seed?: number;
  hoveredHex: HexCoord | null;
  selectedHex: HexCoord | null;
  onHexClick: (coord: HexCoord) => void;
  onHexHover: (coord: HexCoord | null) => void;
  riverPaths?: RiverPath[];
  lakeIds?: Int16Array;
  regionData?: RegionData;
  locations?: LocationNode[];
  agents?: AgentRenderData[];
  visibilityMap?: VisibilityMap;
  fogEnabled?: boolean;
}

// Output: imperative handle for parent to control camera
interface HexMapV2Handle {
  centerOn(x: number, y: number, scale?: number): void;
  setFollowAgent(agentId: string | null): void;
  getDiagnostics(): WebGLDiagnosticsSnapshot | null;
}
```

### Key Entry Points

| File | Role |
|------|------|
| `src/components/HexMapV2/HexMapV2.tsx` | Main component — scene setup, d3-zoom, render loop, layer orchestration |
| `src/components/HexMapV2/HexV2View.tsx` | Standalone debug view (seed 42, no game state) |
| `src/components/Game/GameView.tsx` | Primary game view — imports HexMapV2 with full game chrome |

---

## 3. Coordinate System

### Hex Grid: Flat-Top Odd-Q Offset

- **Offset coordinates**: `HexCoord = { col, row }` — column-major, odd columns shifted down half a hex
- **Cube coordinates**: `CubeCoord = { q, r, s }` — used for hex math (distance, neighbors, rings)
- **Conversion**: `offsetToCube()` / `cubeToOffset()` in `src/lib/hexMath.ts`
- **Pixel position**: `hexToPixel(hex, size)` returns `{ x, y }` in SVG-space (y-down)
- **HEX_SIZE = 10** — fundamental scaling constant (10 world units per hex width)

### Y-Flip (Critical)

Three.js uses **y-up**; SVG/screen uses **y-down**. All coordinate conversions must account for this:

```
Three.js world position = (pixelX, -pixelY, 0)
```

- Winding order: positive SVG signed area (CCW in y-down) reverses after Y-flip to maintain CCW in Three.js y-up
- d3-zoom transform: `cx = -tx/k`, `cy = ty/k` — the Y-flip is embedded in the camera sync formula
- Raycasting: `HexRaycaster.ts` handles screen→world→hex with the flip

### Neighbors & Distance

```typescript
hexNeighbors(hex: HexCoord): HexCoord[]  // 6 neighbors (parity-aware for odd-q)
hexDistance(a: HexCoord, b: HexCoord): number  // Cube-based Manhattan distance
```

---

## 4. Render Layer System

### 13 Named Layers (RenderLayers.ts)

```typescript
RENDER_ORDER = {
  STENCIL_WRITE:   -1,  // CoastlineMesh stencil buffer write pass
  HEX_FILL:         0,  // Land & water InstancedMesh
  COASTLINE:         1,  // Shallow band, lake shores
  GRID:              2,  // Hex grid lines
  ELEVATION_TICKS:   3,
  RIVERS:            4,
  ROADS:             5,
  BORDERS:           6,  // Kingdom + barony political borders
  SIGNIFIERS:        7,  // Terrain art sprites
  LOCATIONS:         8,  // Settlement icons
  AGENTS:            9,  // Portraits + dots + continental dots
  EVENTS:           10,  // Event indicators
  LABELS:           11,  // Region + location names (HTML overlay)
  FOG:              12,  // Fog-of-war darkening
}
```

### Stencil Clipping Strategy

The coastline system uses a multi-pass stencil approach for organic coastlines:

1. **STENCIL_WRITE** (renderOrder -1): CoastlineMesh writes `1` into the stencil buffer using organic contour loops from marching squares. `colorWrite: false` — invisible, but marks land area.
2. **HEX_FILL** land InstancedMesh: `stencilFunc: EqualStencilFunc, stencilRef: 1` — land hexes render only where stencil = 1, clipping their edges to the organic coastline boundary.
3. **HEX_FILL** water InstancedMesh: Renders normally (no stencil test) — full hex shapes with water colors.

This gives organic coastlines without modifying hex geometry. The critical insight: **the organic boundary clips LAND hex edges, not water hex edges** — terrain colors are preserved per-hex.

### Adding a New Layer

1. Add a named constant to `RENDER_ORDER` in `RenderLayers.ts`
2. Add visibility entries to `ZOOM_VISIBILITY_MATRIX` in `ZoomVisibilityMatrix.ts`
3. Create a factory function in `scene/` (pattern: `create*Mesh(tiles, ...) → THREE.Group`)
4. Wire it into `HexMapV2.tsx` lifecycle (add to scene on mount, dispose on unmount)
5. Add tests in `scene/__tests__/`

---

## 5. Zoom System

### 4-Tier Zoom (ZoomVisibilityMatrix.ts)

| Tier | k (d3 scale) | Name | What's Visible |
|------|-------------|------|----------------|
| 4 | k >= 15 | hero-local | Everything: portraits, events, grid, signifiers, labels |
| 3 | k >= 5 | regional | Most: dots, signifiers, locations, labels, roads, rivers |
| 2 | k >= 1.5 | continental | Basic: rivers, borders, retinue dots |
| 1 | k < 1.5 | full-world | Coarse: hex fill, coastlines, kingdom borders |

### Visibility Matrix

`ZOOM_VISIBILITY_MATRIX` is a **complete truth table** — every layer x tier combination is explicit. Query it to determine if a layer should render at the current zoom.

### Fade Transitions

`getFadeAlpha(k, threshold, fadeRange)` provides smooth 0→1 transitions at tier boundaries. Default `FADE_RANGE = 0.2`.

### d3-Zoom Integration (Critical Details)

- **d3-zoom owns ALL camera state.** Never set camera position/zoom outside `syncCameraToZoom()`.
- **Custom wheel handler is mandatory.** The default d3-zoom wheel behavior produces wrong results with our non-standard coordinate mapping (`cx=-tx/k`, `cy=ty/k` with Y-flip).
- **`resizeHexScene` only updates renderer size.** Camera frustum is managed exclusively by d3-zoom. The caller must re-sync via `syncCameraToZoom()` after resize.
- **Zoom-toward-selected-hex** uses lerp: `ZOOM_TARGET_LERP_IN: 0.4` (fast) and `ZOOM_TARGET_LERP_OUT: 0.15` (slow).
- **`zoom.on('zoom.labels')` secondary listener** for decoupled zoom tracking; removed with `null` in cleanup.

---

## 6. Coastline System

Organic non-hexagonal shorelines via **stencil clipping**: `CoastlineMesh` writes a stencil using marching-squares contour loops; land `InstancedMesh` renders only where stencil = 1; water renders normally underneath.

Key files: `src/engine/coastline.ts` (full pipeline), `src/types/coastline.ts` (types + `COASTLINE_DEFAULTS`), `scene/CoastlineMesh.ts` (stencil write + Y-flip), `scene/HexFillMesh.ts` (dual instanced mesh).

**Read `coastline-system.md`** (in this skill directory) when working on coastline code — it has the full scalar field math, marching squares details, config constants table, lake handling, stencil threshold tuning, known limitations (shallow band disabled), and a table of failed approaches not to retry.

---

## 7. Color System

### Terrain Palette

- `TERRAIN_PALETTE` in `palette/terrainPalette.ts`: 30 terrain types → hex color strings
- Per-hex brightness noise: Seeded Simplex noise at `(col, row)` → ±5% multiplicative factor
- Water colors extracted from reference image: deep ocean `#3A7AB8`, ocean `#5098D0`, shallows `#78BCE0`, lake `#4A8FC0`, river `#68B0D8`

### Water Classification

`isWaterTerrain()` in `src/engine/coastline.ts` — canonical set:
```
ocean, deep_ocean, tropical_ocean, coastal_shallows, coast, lake, river, reef
```

### Water Depth Bands

`getHexColor()` in `colorUtils.ts` handles priority:
1. Lake hexes (lakeId >= 0) → lake color regardless of terrain type
2. Water terrain → WATER_PALETTE with depth-band lookup
3. Land terrain → TERRAIN_PALETTE with brightness noise

### Renderer Color Configuration (Critical)

```typescript
// In HexSceneSetup.ts — these settings are load-bearing:
renderer.toneMapping = THREE.NoToneMapping;      // We use flat 2D colors, not HDR
renderer.outputColorSpace = THREE.SRGBColorSpace; // So #RRGGBB displays correctly
```

**Why?** Default Three.js tone mapping (AgX/ACES) compresses the color gamut, making distinct terrain palette colors appear as the same washed-out shade. `NoToneMapping` + `SRGBColorSpace` ensures hex color strings render true to their values.

When setting colors programmatically:
```typescript
color.setRGB(r, g, b, THREE.SRGBColorSpace);  // Always specify SRGBColorSpace
```

---

## 8. Configuration & Constants

### NFP #1: Every Magic Number is Named

All tunable values are named constants in their respective modules. Key constant objects:

| Constant Object | Location | What It Controls |
|----------------|----------|------------------|
| `SCENE_CONSTANTS` | `HexSceneSetup.ts` | Background color, pixel ratio cap, near/far planes |
| `ZOOM_TIER_THRESHOLDS` | `ZoomVisibilityMatrix.ts` | k values for each zoom tier |
| `ZOOM_VISIBILITY_MATRIX` | `ZoomVisibilityMatrix.ts` | Layer visibility per tier |
| `FADE_RANGE` | `ZoomVisibilityMatrix.ts` | Cross-fade zone width at tier boundaries |
| `RENDER_ORDER` | `RenderLayers.ts` | Draw order for all 13 layers |
| `TERRAIN_PALETTE` | `terrainPalette.ts` | 30 terrain type → color mappings |
| `WATER_PALETTE` | `waterPalette.ts` | Water type → color + depth bands |
| `COASTLINE_DEFAULTS` | `src/types/coastline.ts` | Contour generation parameters |
| `DIAGNOSTICS_CONSTANTS` | `WebGLDiagnostics.ts` | Log buffer size, FPS sample window |
| `HEX_SIZE` | `HexMapV2.tsx` (+ duplicated in `regionLabels.ts`) | 10 — fundamental hex scale |
| Zoom target lerp | `D3ZoomCamera.ts` | `ZOOM_TARGET_LERP_IN: 0.4`, `ZOOM_TARGET_LERP_OUT: 0.15` |

All constants are also cataloged in `src/components/CMS/tunableConstants.ts` for the editor UI.

---

## 9. Performance Considerations

### Current Approach

- **Two InstancedMesh draw calls** for the entire hex grid (land + water) — extremely efficient
- **Sprites** for signifiers, agents, locations — one draw call each (acceptable for 60K tiles, future optimization: InstancedMesh)
- **Textures built once** at scene init — no per-frame canvas operations
- **Zoom visibility** culls layers at lower zoom tiers — reduces overdraw
- **WebGLDiagnostics** provides runtime FPS, draw call count, triangle count via debug panel

### Performance Anti-Patterns to Avoid

- Creating new geometries or textures per frame
- Traversing the scene graph in the render loop
- Using `THREE.LineBasicMaterial` linewidth > 1 (WebGL clamps to 1px — use quad strips instead)
- Forgetting `renderer.info.reset()` between frames if reading draw call counts
- Building CanvasTextures on every props change (build once, update instance transforms)

---

## 10. Lessons Learned (Hard-Won)

### d3-Zoom + Three.js Integration

1. **Never use d3-zoom's default wheel handler** with custom coordinate mapping. Our `syncCameraToZoom` uses `cx=-tx/k`, `cy=ty/k` with Y-flip — the default zoom-toward-cursor math silently produces wrong results.

2. **`resizeHexScene` must NOT touch camera frustum.** A ResizeObserver that resets the camera overwrites d3-zoom's state, causing the grid to snap to the wrong position. Only update renderer size; re-sync d3-zoom transform after.

3. **`zoom.on('zoom.labels')` secondary listener** must be explicitly removed with `null` in cleanup — `zoom.on('zoom', null)` only removes the primary listener.

### Three.js Color Pipeline

4. **Set `toneMapping = NoToneMapping` for flat 2D maps.** Default AgX/ACES tone mapping compresses the gamut, making 16 distinct terrain colors look like the same washed-out shade.

5. **Always specify `SRGBColorSpace` when calling `color.setRGB()`.** Without it, colors are treated as linear and get gamma-corrected twice.

6. **Opaque contour fills can occlude terrain colors.** CoastlineMesh originally rendered filled polygons covering the entire landmass at z>0, hiding per-hex colors underneath. The fix was stencil clipping instead of opaque fills.

### Coordinate System

7. **Odd-q offset grid parity matters for neighbors.** Elevation tick dedup must use hex-pair coord keys (not vertex-position keys) because the odd-q offset means vertex positions are not symmetric.

8. **Y-flip applies everywhere.** Contour loops from marching squares (SVG y-down) must be Y-flipped for Three.js. Winding order reverses. Label overlay positions must un-flip. Mouse raycasting must un-flip.

### Testing

9. **jsdom has no `Image` global.** Modules that use `new Image()` (portrait textures) need `vi.stubGlobal('Image', ...)` with `onerror` triggered via microtask on `src` setter.

10. **ESLint/Prettier reformats after Edit tool writes.** Re-read the file before every subsequent edit to get updated line positions.

### Build & Deploy

11. **Untracked new files break Vercel builds.** If a subagent creates a new `.ts` file imported by tracked files but doesn't `git add` it, the dev server works (file exists locally) but production build fails. Always verify new files are staged before committing.

### InstancedMesh

12. **NEVER share a single geometry across multiple InstancedMeshes that need per-instance attributes.** Each mesh's `geometry.setAttribute('aUvRect', ...)` overwrites the shared geometry's attribute buffer — only the last mesh's data survives. Clone the base geometry per mesh. Also set `frustumCulled = false` (no bounding sphere computed for instanced draws).

### Terrain & World Gen

13. **Volcanic placement** uses `mulberry32`-style integer hash, not `fractalNoise` — fractalNoise range with seed 42 never reached the 0.95 threshold.

14. **Wetland overrides** only apply below `ELEV.LOWLAND` (0.40) to prevent mid-elevation forest misclassification.

15. **`generateWorld()` returns `WorldGenResult`, not `HexTile[]`** — all call sites must use `.tiles`.

---

## 11. NFP Compliance Checklist

When adding or modifying hex map code, verify:

- [ ] **Tunability**: Every new magic number has a named constant
- [ ] **Inspectability**: New data structures are flat and inspectable; trace types defined if needed
- [ ] **Determinism**: Any randomness uses seeded PRNG (`mulberry32`)
- [ ] **Fail-soft**: Empty/null/undefined inputs produce graceful fallbacks, not throws
- [ ] **Performance**: No per-frame allocations, textures built once, draw calls minimized
- [ ] **Tests**: Unit test for mesh creation, fail-soft cases, and deterministic output
- [ ] **Visual verification**: Checked via Claude in Chrome (not just Playwright)
