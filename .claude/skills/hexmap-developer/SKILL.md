---
name: hexmap-developer
description: >
  Comprehensive developer guide for the HexMapV2 Three.js hex map renderer.
  Covers architecture, technology stack, coordinate systems, scene layers,
  zoom system, configuration, dependencies, testing strategies, debugging,
  and hard-won lessons. Load before writing any code in src/components/HexMapV2/
  or modifying hex-related engine code. Triggers on "hex map", "HexMapV2",
  "Three.js", "WebGL", "hex renderer", "d3-zoom", "coastline", "signifier",
  "terrain palette", "zoom tier", "InstancedMesh", "hex coordinate", "hex grid",
  "render layer", "stencil", "fog of war", or any hex renderer development work.
---

# HexMap Developer Guide

Comprehensive reference for developing the HexMapV2 Three.js hex map renderer. This is the **sole map renderer** — the V1 SVG hex map was deleted in Phase 8.

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
| `src/components/HexMapV2/HexV2View.tsx` | Standalone debug view (`?view=hexv2`, seed 42, no game state) |
| `src/components/Game/GameView.tsx` | Primary game view — imports HexMapV2 with full game chrome |

---

## 3. Directory Structure

```
src/components/HexMapV2/
├── HexMapV2.tsx              # Main component (canvas ref, lifecycle, render loop)
├── HexV2View.tsx             # Standalone debug route
├── camera/
│   ├── D3ZoomCamera.ts       # d3-zoom ↔ Three.js camera sync, custom wheel handler
│   ├── CameraAnimator.ts     # Smooth panning/zooming via rAF
│   └── FollowMode.ts         # Agent follow-mode state
├── scene/
│   ├── HexSceneSetup.ts      # Renderer, scene, orthographic camera init
│   ├── RenderLayers.ts       # Named render-order constants (13 layers)
│   ├── ZoomVisibilityMatrix.ts # 4-tier zoom thresholds + per-layer visibility
│   ├── HexFillMesh.ts        # Dual InstancedMesh (land + water) with stencil clipping
│   ├── CoastlineMesh.ts      # Organic coastline contours (stencil write + shallow fills)
│   ├── HexGridLines.ts       # Hex grid line overlay
│   ├── ElevationTicks.ts     # Elevation tick marks between hex pairs
│   ├── RiverMesh.ts          # River quad-strip geometry
│   ├── RoadMesh.ts           # Trade route lines
│   ├── BorderMesh.ts         # Kingdom + barony political borders
│   ├── SignifierMesh.ts       # Terrain signifier sprites (1 per land hex)
│   ├── LocationIconMesh.ts   # Settlement/location icon sprites
│   ├── CapitalMarkers.ts     # Red ring markers for capitals
│   ├── AgentSpriteMesh.ts    # Agent portrait/dot sprites (3-tier zoom)
│   ├── MovementTrailMesh.ts  # Agent movement path trails
│   └── FogCulling.ts         # Fog-of-war color overrides + visibility
├── interaction/
│   ├── HexRaycaster.ts       # Screen→hex and world↔screen coordinate conversion
│   └── HexTooltip.tsx        # React overlay for hex hover info
├── palette/
│   ├── terrainPalette.ts     # 30 terrain types → hex color strings
│   ├── waterPalette.ts       # Water terrain colors + depth-band system
│   └── colorUtils.ts         # Hex↔RGB conversion, brightness noise, water depth bands
├── signifiers/
│   ├── signifierRegistry.ts  # TerrainType → SVG path variants mapping
│   ├── signifierTextures.ts  # CanvasTexture builder from SVG paths
│   ├── compositionResolver.ts # Multi-layer composition logic
│   ├── compositionTypes.ts   # Composition type definitions
│   ├── bogPathData.ts        # Hand-drawn SVG path data
│   └── steppesPathData.ts    # Hand-drawn SVG path data
├── agents/
│   ├── agentSpriteTypes.ts   # AgentRenderData type, zoom thresholds, faction colors
│   ├── agentAnimationState.ts # Animation state machine
│   ├── agentPortraitTextures.ts # Portrait thumbnail builder
│   ├── activityIndicatorRegistry.ts # Activity/event icons
│   └── eventIndicatorRegistry.ts # Event notification icons
├── locations/
│   ├── locationIconRegistry.ts # LocationSubtype → icon sprites
│   └── locationIconTextures.ts # CanvasTexture builder for icons
├── overlay/
│   ├── RegionLabelOverlay.tsx # Region name labels (HTML overlay, collision detection)
│   ├── LocationLabelOverlay.tsx # Location name labels
│   └── labelCollision.ts     # Label collision avoidance algorithm
└── diagnostics/
    └── WebGLDiagnostics.ts   # FPS, draw calls, context loss tracking, debug panel integration
```

### Related Files Outside HexMapV2/

| File | Purpose |
|------|---------|
| `src/lib/hexMath.ts` | Coordinate conversion: offset↔cube, pixel↔hex, neighbors, distance |
| `src/engine/coastline.ts` | Marching squares contour generation, `isWaterTerrain()` |
| `src/engine/regionLabels.ts` | Region + river label generation |
| `src/types/index.ts` | HexCoord, HexTile, TerrainType definitions |
| `src/types/visibility.ts` | VisibilityMap, fog states |
| `src/types/coastline.ts` | ContourLoop, COASTLINE_DEFAULTS |
| `src/data/agent-visual-content.ts` | Agent visual constants (ring radius, token radius, portrait size) |
| `src/components/CMS/tunableConstants.ts` | All named constants cataloged for editor inspection |

---

## 4. Coordinate System

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

## 5. Render Layer System

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

## 6. Zoom System

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

## 7. Coastline System (Deep Dive)

The coastline system creates organic, non-hexagonal shorelines. This is one of the most complex parts of the renderer with multiple failed approaches before the current stencil solution.

### Pipeline: Engine → Renderer

```
Engine (src/engine/coastline.ts)                     Renderer (scene/CoastlineMesh.ts)
┌─────────────────────────────┐                      ┌────────────────────────────┐
│ 1. buildScalarField()       │                      │ 1. Stencil write pass      │
│    Metaball field from land  │                      │    contour → ShapeGeometry │
│    hex positions (quartic    │  CoastlineData       │    colorWrite: false       │
│    falloff: (1-d²/r²)²)     │  ─────────────►      │    stencilRef: 1           │
│ 2. extractContours()        │  .loops               │                            │
│    Marching squares at       │  .midLoops            │ 2. Land InstancedMesh      │
│    threshold                 │  .shallowLoops        │    stencilFunc: Equal      │
│ 3. chainSegmentsIntoLoops() │  .lakeLoops           │    Only where stencil = 1  │
│ 4. chaikinSmooth()           │                      │                            │
│ 5. displaceContour() (noise)│                      │ 3. Water InstancedMesh     │
│ 6. shiftLoops() (un-margin) │                      │    No stencil test         │
└─────────────────────────────┘                      └────────────────────────────┘
```

### Scalar Field (`buildScalarField`)

- Each **land hex** emits a quartic falloff: `(1 - d²/r²)²` with radius `blobRadius * hexSize`
- **Lake hexes** (lakeId >= 0) are treated as LAND for the field — coastline wraps around land+lakes together
- **Margin** around the field must be >= blobRadius to avoid triangular contour artifacts at edges
- Field resolution (`fieldResolution: 4`) controls grid granularity — lower = finer but slower

### Marching Squares Contour Extraction

- 16-case lookup table (`MARCHING_CASES`) for segment generation
- Linear interpolation at cell edges for smooth iso-contour
- Segments chained into closed loops via endpoint snapping (`SNAP_DISTANCE = 0.5`)
- Safety limit of 50,000 iterations prevents infinite loops

### Contour Processing Pipeline

For each threshold level (land boundary, mid-depth, shallows):

1. **Extract** raw segments via marching squares
2. **Chain** segments into closed loops
3. **Smooth** via Chaikin corner-cutting (2 passes default)
4. **Ensure winding** — consistent CCW in screen space
5. **Displace** with seeded Simplex noise for organic irregularity
6. **Filter** loops < `minLoopPoints` (20) to remove noise artifacts
7. **Shift** coordinates back from field-space to hexToPixel-space (subtract margin)

### CoastlineConfig Constants (COASTLINE_DEFAULTS)

| Parameter | Default | Purpose |
|-----------|---------|---------|
| `blobRadius` | 1.8 | Quartic falloff radius (× hexSize) |
| `threshold` | 0.35 | Iso-contour level for land boundary |
| `smoothPasses` | 2 | Chaikin smoothing iterations |
| `displacement` | 0.02 | Noise amplitude for organic irregularity |
| `noiseScale` | 0.02 | Noise frequency |
| `midWidth` | 0.15 | Threshold offset for mid-depth band |
| `shallowWidth` | 0.28 | Threshold offset for shallows band |
| `fieldResolution` | 4 | Scalar field grid cell size (px) |
| `minLoopPoints` | 20 | Minimum points to keep a loop |

### Stencil Threshold Tuning

- `STENCIL_THRESHOLD = 0.30` in CoastlineMesh.ts — slightly lower than the contour threshold (0.35)
- Lower value extends the stencil past outer land hex edges, ensuring full coverage of land hex interiors
- **Caution**: Using the lower threshold for `shallowLoops` causes them to cover the entire map — use `COASTLINE_DEFAULTS.threshold` for all visual contours

### Lake Handling

- Lake scalar field built separately (`buildLakeScalarField`) with lake hexes as blob emitters
- Lake displacement = 50% of coastline displacement (calmer shores)
- Lake seed offset = `seed + 7` so shores don't mirror coastline noise patterns
- Lake hexes render in the **water** InstancedMesh (below stencil) — hexagonal lake-blue fills

### Known Limitation: Shallow Band Disabled

The shallow band and lake shore overlays are currently **DISABLED** because:

- Stencil write uses contour loops that trace the coastline **boundary**, not a filled land interior
- Stencil = 1 only near the coast, not for inland hexes
- An inverse stencil test (`NotEqualStencilFunc`) on the shallow band would incorrectly render over inland hexes

**To fix** (future work): Either (a) add a separate full-land stencil fill pass using hex geometry, or (b) generate a filled polygon covering all land area. Water hexes already have per-hex depth-band colors from `getHexColor`, so visual impact is minimal.

### Failed Approaches (DO NOT Retry)

| Approach | Why It Failed |
|----------|---------------|
| Ocean mask with 65+ land contour holes | earcut triangulation silently fails at this complexity |
| Land contour fill overlay at z > 0 | Covers terrain with flat color despite z-ordering |
| Depth band fill shapes with land holes | earcut fails again |
| depthTest tricks | GPU-dependent, not portable |
| Coastal hex scaling (shrinking coastal hexes) | Creates white/colored gaps between hexes |

### Winding Order After Y-Flip

```
SVG y-down:   positive signedArea = CCW
After Y-flip: positive SVG area → CW in Three.js y-up → REVERSE to make CCW
              negative SVG area → CCW in Three.js y-up → KEEP
```

THREE.Shape expects CCW outer loops. The `loopToMesh` and `loopToStencilMesh` helpers handle this automatically.

### Key Coastline Source Files

| File | Purpose |
|------|---------|
| `src/engine/coastline.ts` | Full pipeline: scalar field, marching squares, chaining, smoothing, displacement |
| `src/types/coastline.ts` | Types (CoastlineData, CoastlineConfig, ContourLoop), COASTLINE_DEFAULTS |
| `src/components/HexMapV2/scene/CoastlineMesh.ts` | Three.js rendering: stencil write, Y-flip, ShapeGeometry |
| `src/components/HexMapV2/scene/HexFillMesh.ts` | Dual InstancedMesh (land with stencil test, water without) |

---

## 8. Color System

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

## 9. Signifier System (Terrain Art)


### How It Works

Each land hex gets one terrain signifier sprite — a multi-layer SVG composition rendered to a CanvasTexture.

### Registry (`signifierRegistry.ts`)

- Maps TerrainType → `SignifierVariant[]` (29 direct entries + 6 fallback mappings = all 34 land types covered)
- Variants have SVG path data, layer definitions, per-path opacity

### Deterministic Selection

Per-hex parameters are seeded by hex coordinates (via `mulberry32` PRNG):
- **Variant**: hash of `(col, row)` → consistent for same seed
- **Jitter**: ±10% of hex size (disabled for hand-drawn types)
- **Rotation**: Currently locked at 0 (upright)

### Adding New Signifier Art

1. Create SVG path data (hand-drawn or generated) in a `*PathData.ts` file
2. Register variants in `signifierRegistry.ts` with terrain type mapping
3. Define layer composition (fills, opacities) in the variant definition
4. Test: `signifierRegistry.test.ts` for coverage, visual check via Chrome

---

## 10. Agent Rendering

### 3-Tier Sprite System

| Zoom Tier | Agent Display | Visual |
|-----------|--------------|--------|
| hero-local (k >= 15) | Portrait thumbnails | Circular crops with faction heraldic ring + retinue marker |
| regional (k >= 5) | Faction dots | Colored circles |
| continental (k >= 1.5) | Retinue dots | Tiny dots |

### Multi-Agent Layout

Multiple agents on the same hex use **RING layout** (from `src/lib/movementPath.ts`). Agents sorted by ID for deterministic slot assignment.

### Portrait Textures

Built from agent portrait images via CanvasTexture. `onerror` fallback renders a faction-colored placeholder. The `Image` global is not available in jsdom — tests must use `vi.stubGlobal('Image', ...)` mock.

---

## 11. Fog-of-War

### Three Visibility States

| State | Hex Fill | Details (signifiers, agents, events) |
|-------|----------|------|
| `unexplored` | Dark fill | Hidden |
| `remembered` | Terrain visible (dimmed) | Signifiers visible, no agents/events |
| `visible` | Full brightness | Everything visible |

### Implementation

- `computeVisibilityFromSources()`: Computes LOS range from agent positions
- Per-frame color override on InstancedMesh land/water colors
- Enabled via `?fog` URL parameter (off by default)

---

## 12. Testing Strategy

### Test Environment: Vitest + jsdom

Tests run in **jsdom** — no real WebGL context. This means:
- Three.js objects can be instantiated and inspected (geometry, materials, positions)
- No actual rendering or pixel output
- Canvas operations (texture building) need mocking for browser-only APIs

### What to Test for Each Scene Module

| Aspect | How to Test | Example |
|--------|------------|---------|
| Mesh creation | Assert correct geometry/material types, instance counts | `expect(group.children[0]).toBeInstanceOf(THREE.InstancedMesh)` |
| Position accuracy | Check matrix transforms match `hexToPixel()` output | Extract position from `getMatrixAt()`, compare to expected |
| Color accuracy | Inspect material color or instance color buffer | `expect(color.getHexString()).toBe('3a7ab8')` |
| Fail-soft behavior | Pass empty/null/undefined inputs, assert no throws | `expect(() => createMesh([])).not.toThrow()` |
| Zoom visibility | Call `getZoomTier(k)` and check matrix lookup | `expect(matrix.signifiers['continental']).toBe(false)` |
| Determinism | Same seed + input → same output | Two calls with seed 42 produce identical results |

### Common jsdom Gotchas

1. **`Image` global missing**: Use `vi.stubGlobal('Image', class { ... })` — trigger `onerror` via microtask on `src` setter
2. **No `OffscreenCanvas`**: Three.js texture builders that use OffscreenCanvas need stubs
3. **No `requestAnimationFrame`**: Already polyfilled by vitest/jsdom, but be aware for timing tests
4. **Canvas 2D context**: jsdom provides a limited `getContext('2d')` — drawing operations are no-ops but don't throw

### Test File Locations

All tests live alongside their source in `__tests__/` directories:
```
scene/__tests__/          # ~12 test files for mesh factories
camera/__tests__/         # D3ZoomCamera.test.ts
interaction/__tests__/    # HexRaycaster.test.ts
palette/__tests__/        # terrainPalette.test.ts, waterPalette.test.ts
signifiers/__tests__/     # signifierRegistry.test.ts, compositionResolver.test.ts
agents/__tests__/         # agentSpriteTypes, agentAnimationState, agentPortraitTextures
locations/__tests__/      # locationIconRegistry.test.ts
overlay/__tests__/        # labelCollision.test.ts, LocationLabelOverlay.test.ts
```

### Running Tests

```bash
npm test                           # All tests
npm test -- --testPathPattern HexMap  # HexMapV2 tests only
npm run test:watch                  # Watch mode
```

---

## 13. Visual Verification (Critical)

### Playwright/Preview Tools CANNOT See WebGL

Playwright `preview_snapshot` and `preview_inspect` see only a blank `<canvas>` element — they cannot read WebGL canvas content. Use this two-tier approach:

| What to Verify | Tool |
|---------------|------|
| Console errors, network requests, DOM UI | Playwright: `preview_console_logs`, `preview_network`, `preview_snapshot` |
| Actual rendered hex map visuals | **Claude in Chrome**: `tabs_context_mcp` → `navigate` to `localhost:5173/?view=game` → `computer` with `action: "screenshot"` or `action: "zoom"` |

### Dev URLs for Testing

| URL | Purpose |
|-----|---------|
| `?view=game` | **Primary.** Full game with HexMapV2 + all chrome. Use for all testing. |
| `?view=hexv2` | Standalone renderer (seed 42, no game state). Isolated debugging only. |
| `?view=game&fog` | Game view with fog-of-war enabled |

### Screenshot Tips

- Always `preview_resize` to **1920x1080** before screenshots — default viewport varies
- `preview_screenshot` times out on WebGL content (headless compositing too slow) — use Claude in Chrome or Playwright MCP instead
- For detail inspection, use `action: "zoom"` with a region parameter in Claude in Chrome

---

## 14. Configuration & Constants

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

## 15. Performance Considerations

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

## 16. Lessons Learned (Hard-Won)

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

### Terrain & World Gen

12. **Volcanic placement** uses `mulberry32`-style integer hash, not `fractalNoise` — fractalNoise range with seed 42 never reached the 0.95 threshold.

13. **Wetland overrides** only apply below `ELEV.LOWLAND` (0.40) to prevent mid-elevation forest misclassification.

14. **`generateWorld()` returns `WorldGenResult`, not `HexTile[]`** — all call sites must use `.tiles`.

---

## 17. Debugging Toolkit

### WebGL Diagnostics (In-App)

The debug panel exposes `getDiagnostics()` via the handle:
- FPS (60-frame rolling average)
- Draw calls, triangles, points, lines per frame
- GPU vendor/renderer identification
- Texture/geometry/program counts
- Context loss/restore events
- Scene object count

### Browser DevTools

- **Three.js Inspector** (Chrome extension): Inspect scene graph, materials, textures
- **Spector.js**: Capture and replay WebGL calls frame-by-frame
- **Performance tab**: Profile render loop, identify jank sources

### Common Debug Scenarios

| Symptom | Likely Cause | Where to Look |
|---------|-------------|---------------|
| Map appears blank (canvas exists) | Scene not initialized, camera at wrong position, or stencil misconfiguration | `HexSceneSetup.ts`, `D3ZoomCamera.ts` |
| All terrain same color | Tone mapping on, or opaque layer occluding HexFillMesh | Check `renderer.toneMapping`, check z-order of layers |
| Zoom doesn't converge on cursor | Using d3-zoom default wheel handler | `D3ZoomCamera.ts` — must use custom handler |
| Grid snaps to corner on resize | `resizeHexScene` touching camera frustum | Ensure resize only calls `renderer.setSize()`, then re-sync d3-zoom |
| Signifiers missing for terrain type | No registry entry or fallback mapping | `signifierRegistry.ts` — check coverage |
| Agents not visible | Wrong zoom tier, or visibility matrix off | `ZoomVisibilityMatrix.ts`, current `k` value |
| Labels overlapping | Collision detection not running or stale data | `labelCollision.ts`, check label update trigger |
| Context lost on low-end GPU | Too many textures or draw calls | `WebGLDiagnostics.ts` — check texture/geometry count |

---

## 18. Integration Points

### Data Flow: Engine → Renderer

```
World Generation (engine/)
  └── generateWorld(seed, cols, rows)
        ├── tiles: HexTile[]         → HexFillMesh, SignifierMesh
        ├── riverPaths: RiverPath[]  → RiverMesh
        ├── lakeIds: Int16Array      → CoastlineMesh, waterPalette
        ├── regionData: RegionData   → BorderMesh, RegionLabelOverlay
        └── locations: LocationNode[] → LocationIconMesh, LocationLabelOverlay

Game State (game loop)
  ├── agents: AgentRenderData[]      → AgentSpriteMesh
  ├── visibilityMap: VisibilityMap   → FogCulling
  └── hoveredHex / selectedHex       → HexTooltip, highlight effects
```

### Events Out: Renderer → Game

```
onHexClick(coord: HexCoord)   → Opens hex action drawer, selects hex
onHexHover(coord: HexCoord)   → Updates tooltip, highlight state
```

---

## 19. NFP Compliance Checklist

When adding or modifying hex map code, verify:

- [ ] **Tunability**: Every new magic number has a named constant
- [ ] **Inspectability**: New data structures are flat and inspectable; trace types defined if needed
- [ ] **Determinism**: Any randomness uses seeded PRNG (`mulberry32`)
- [ ] **Fail-soft**: Empty/null/undefined inputs produce graceful fallbacks, not throws
- [ ] **Performance**: No per-frame allocations, textures built once, draw calls minimized
- [ ] **Tests**: Unit test for mesh creation, fail-soft cases, and deterministic output
- [ ] **Visual verification**: Checked via Claude in Chrome (not just Playwright)
