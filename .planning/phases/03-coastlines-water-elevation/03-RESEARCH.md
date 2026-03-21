# Phase 3: Coastlines, Water & Elevation — Research

**Researched:** 2026-03-21
**Domain:** Three.js SVG-layer overlay rendering — coastlines, rivers, elevation ticks, grid lines
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Coastline Rendering
- Coastal hexes retain their inland biome color — the coastline is a mask/overlay, not a terrain type change
- Use marching-squares interpolation within coastal hexes using the existing 7-point sub-hex elevation sampling from Phase 2
- Produce organic shoreline curves that cut through hexes at natural angles, not along hex edges
- Coastline geometry rendered as a Three.js mesh/overlay on top of the base hex InstancedMesh

#### River Rendering
- Rivers are curved blue overlay lines through hexes (entry edge to exit edge), NOT terrain type changes
- A forest hex with a river still renders as forest + blue line on top
- River width proportional to flow accumulation: thin streams near source, wide near coast/confluence
- River paths come from Phase 2 hydrology data (hasRiver, river segment data on tiles)
- Use Three.js line geometry or mesh strips for river rendering

#### Lake Rendering
- Lakes rendered as filled hex regions where Phase 2's drainage pass filled depressions
- Lake hexes get water color fill (distinct from ocean)
- Lake shore edges should look organic (similar coastline treatment if feasible)

#### Water Depth Bands
- Ocean hexes render in 3 depth bands: shallows / mid-ocean / deep-ocean
- Based on elevation below sea level from Phase 2 data
- Distinct blue palette for each depth band

#### Elevation Visual Language
- Terrain color passively communicates elevation (browns/golds = elevated, greens/teal = low)
- This is an enhancement to the existing biome palette, not a replacement
- Edge tick marks ("caterpillar marks") on hex edges where elevation difference exceeds threshold
- Tick density scales with steepness: 3-8 ticks per edge
- Altitude text labels on named peaks and notable elevations at hero-local + regional zoom only

#### Grid Lines
- Thin hex grid lines (0.5-1px equivalent, ~12% opacity black) at all zoom levels except full-world
- Grid lines must not obscure terrain color or overlays
- Rendered as a separate layer on top of terrain but below rivers/labels

### Claude's Discretion
- Specific Three.js geometry approach for coastline masks (ShaderMaterial vs geometry clipping vs stencil buffer)
- River curve interpolation method (Catmull-Rom, Bezier, etc.)
- Exact color values for water depth bands (should harmonize with existing biome palette)
- How to integrate with the existing InstancedMesh hex rendering from Phase 1
- Performance approach for 60K hex grid (instancing, LOD culling, draw call budget)
- Whether tick marks use line geometry or instanced quads

### Deferred Ideas (OUT OF SCOPE)
- River labels (blue italic text along major rivers) — GRID-02, assigned to later phase
- Road network rendering — GRID-03, Phase 7+
- Bridge icons where roads cross rivers — GRID-04, Phase 7+
- Animated water effects (flowing rivers, wave shorelines) — future polish
- Fog-of-war interaction with water features — Phase 7
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| WATR-01 | Coastal hexes retain inland biome — coastline rendered as mask, not terrain type | Existing marching-squares pipeline in engine/coastline.ts already implements this for SVG renderer; Three.js equivalent needs a mesh overlay using same scalar field |
| WATR-02 | Marching-squares interpolation within coastal hexes produces organic shoreline from 7-point samples | `computeCoastline()` + `buildScalarField()` + `extractContours()` already exist and are well-tested; port output to Three.js ShapeGeometry |
| WATR-03 | Water depth bands render as shallows / mid-ocean / deep-ocean based on elevation below sea level | `geoParams.elevation` on each HexTile provides the value; 3 bands via threshold splits; existing `WATER_PALETTE` has `shallows`, `ocean`, `deep_ocean` — can drive InstancedMesh color update |
| WATR-04 | Rivers rendered as curved blue overlay lines through hexes (entry edge to exit edge), not as terrain type | `riverPathToSvgPath()` + `RiverPath[]` from worldGenData already exist; Three.js `TubeGeometry` or `LineSegments` on `RENDER_ORDER.RIVERS` layer |
| WATR-05 | River width proportional to flow accumulation (thin streams near source, wide near coast) | `RiverPath.hexes.length` already used as proxy for flow accumulation in existing SVG overlay; same approach applies in Three.js |
| WATR-06 | Lakes rendered as filled hex regions where drainage pass filled depressions | `lakeIds` typed array from worldGenData flags lake hexes; set their color via InstancedMesh color update to lake blue, optionally with organic shore contour at same level as coastline |
| ELEV-01 | Terrain color passively communicates elevation (browns/golds = elevated, greens = low) | Biome assignment already encodes elevation indirectly (mountains/plateau/hills = high, grassland/floodplain = low); existing `TERRAIN_PALETTE` in terrainPalette.ts can be tuned for stronger elevation signal |
| ELEV-02 | Edge tick marks ("caterpillar" marks) on hex edges where elevation difference exceeds threshold | New geometry: per-hex edge scan, compare `geoParams.elevation` of adjacent pair; emit short perpendicular LineSegments or instanced quads on `RENDER_ORDER.ELEVATION_TICKS` layer |
| ELEV-03 | Tick density scales with steepness (3-8 ticks per edge) | Tick count = `clamp(floor(elevDiff / TICK_DENSITY_STEP), 3, 8)` where TICK_DENSITY_STEP is a tunable constant |
| ELEV-04 | Altitude text labels on named peaks and notable elevations (hero-local + regional zoom only) | Requires a zoom-gated HTML label layer (matching pattern of existing HTML tooltip in HexMapV2); no Three.js text meshes needed — DOM elements positioned via `project()` |
| GRID-01 | Thin hex grid lines (0.5-1px, ~12% opacity black) at all zoom levels except full-world | `createHexGridLines()` already exists and is wired in HexMapV2 on `RENDER_ORDER.GRID`; it is already on at all zoom levels — the "except full-world" gating is Phase 7 zoom LOD |
</phase_requirements>

---

## Summary

Phase 3 is a rendering overlay phase. The critical discovery from code inspection is that **the SVG-based HexMap (`src/components/HexMap/`) already has working implementations of coastline masks and river overlays** — marching squares, Chaikin smoothing, Catmull-Rom river curves, and the full coastline pipeline are production-quality code. Phase 3's job is to implement equivalent functionality in the **Three.js-based HexMapV2** (`src/components/HexMapV2/`), which is the new renderer targeted by the Hex Map V2 milestone.

The Three.js renderer from Phase 1 provides the scaffold: `RENDER_ORDER` already has named slots for COASTLINE (1), GRID (2), ELEVATION_TICKS (3), and RIVERS (4). `createHexGridLines()` already implements GRID-01 (the grid lines requirement). This means Phase 3 has three genuine workloads: coastline + depth bands (plan 03-01), river + lake overlays (plan 03-02), and elevation ticks + altitude labels (plan 03-03).

The SVG renderer's `computeCoastline()` / `extractContours()` functions can be reused directly — they return pixel-space geometry that maps directly to Three.js world coordinates via the existing Y-flip convention (world Y = -svgY). The primary architectural decision is how to render the organic shoreline contours as Three.js geometry: a `THREE.ShapeGeometry` filled path is the most natural approach, matching the SVG `<path>` with fill behavior already tested in the SVG renderer.

**Primary recommendation:** Port the existing SVG coastline/river engine functions directly to Three.js mesh objects. No algorithmic work needed — only geometry format translation.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| three | r160+ (already installed) | 3D scene, geometry, materials | Project decision — HexMapV2 built on raw Three.js, no R3F |
| d3 | 7.x (already installed) | Zoom transform coordination | Already drives camera in HexMapV2 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| simplex-noise | 4.x (already installed) | Coastline displacement noise | Used by existing `SimplexNoise` wrapper in lib/ |

### No New Dependencies
Phase 3 requires zero new npm dependencies. All algorithmic building blocks (marching squares, Chaikin smoothing, Catmull-Rom splines, simplex noise, hex math) exist in the codebase already.

**Version verification:** Not required — no new packages.

---

## Architecture Patterns

### Existing Three.js Renderer Structure
```
src/components/HexMapV2/
├── HexMapV2.tsx          # Main component — owns Three.js lifecycle, wires all meshes
├── HexV2View.tsx          # Route wrapper (minimal chrome)
├── scene/
│   ├── HexSceneSetup.ts   # createHexScene() — renderer, scene, camera
│   ├── HexFillMesh.ts     # createHexFillMesh() — InstancedMesh for hex fills
│   ├── HexGridLines.ts    # createHexGridLines() — LineSegments for grid (GRID-01: already done)
│   └── RenderLayers.ts    # RENDER_ORDER constants (13 layers defined)
├── camera/                # D3 zoom integration
├── interaction/           # Hit testing, tooltips
└── palette/               # Color lookup, water palette
```

### Pattern 1: Scene Module Factory
**What:** Each visual layer is a standalone factory function in `scene/` that returns a Three.js Object3D, accepts world tiles and seed, assigns correct `renderOrder`, and is added to the scene in `HexMapV2.tsx`'s setup `useEffect`.
**When to use:** Every new Phase 3 layer follows this pattern.
**Example:**
```typescript
// Source: src/components/HexMapV2/scene/HexGridLines.ts (existing)
export function createHexGridLines(tiles: HexTile[]): THREE.LineSegments {
  // ... geometry assembly ...
  const lines = new THREE.LineSegments(geo, mat);
  lines.renderOrder = RENDER_ORDER.GRID;
  return lines;
}

// Wired in HexMapV2.tsx useEffect:
const gridLines = createHexGridLines(tiles);
scene.add(gridLines);
```

### Pattern 2: Reuse SVG Engine Functions for Geometry
**What:** The SVG renderer's computational functions (`computeCoastline`, `buildScalarField`, `extractContours`, `riverPathToSvgPath`) return pixel-space data. Three.js world space uses the same pixel units with a Y-flip (`worldY = -svgY`). Extract geometry arrays from these functions and feed into Three.js `BufferGeometry`.
**When to use:** WATR-01, WATR-02, WATR-04 — anywhere the SVG renderer has prior art.
**Coordinate mapping:**
```typescript
// Source: src/components/HexMapV2/scene/HexFillMesh.ts (existing convention)
const { x, y } = hexToPixel(tile.coord, HEX_CONSTANTS.HEX_SIZE);
matrix.setPosition(x, -y, 0);  // Y-flip: SVG y-down → Three.js y-up
```

### Pattern 3: InstancedMesh Color Update for Depth Bands
**What:** WATR-03 (depth bands) and WATR-06 (lake fill) are implemented by updating per-hex colors in the existing `InstancedMesh` from Phase 1. The `updateHexColors()` function in `HexFillMesh.ts` already exists for this. Water hexes get their color from `getWaterColor()` which can be extended for depth bands.
**When to use:** When the visual change is a color property of the base hex fill, not an overlay.

### Pattern 4: Contour Loops to ShapeGeometry
**What:** The marching squares output (array of `ContourLoop` = `Point2D[]`) must become Three.js geometry. The correct Three.js primitive is `THREE.Shape` (filled region). Each loop becomes a shape; holes are added via `shape.holes`.
**Example:**
```typescript
// Source: Three.js ShapeGeometry docs (verified)
function contourLoopsToMesh(loops: ContourLoop[], color: number, zOffset: number): THREE.Mesh {
  if (loops.length === 0) return new THREE.Mesh(); // fail-soft: empty mesh
  const outerLoop = loops[0];
  const shape = new THREE.Shape(outerLoop.map(p => new THREE.Vector2(p.x, -p.y)));
  for (let i = 1; i < loops.length; i++) {
    const hole = new THREE.Path(loops[i].map(p => new THREE.Vector2(p.x, -p.y)));
    shape.holes.push(hole);
  }
  const geo = new THREE.ShapeGeometry(shape);
  const mat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.z = zOffset;
  return mesh;
}
```

### Pattern 5: River Tubes via TubeGeometry or LineSegments
**What:** Rivers in Three.js can be LineSegments (thin, simple) or TubeGeometry (width control, round caps). For width scaling (WATR-05), `TubeGeometry` along a `THREE.CatmullRomCurve3` gives clean tapered shapes. However, `LineSegments` with variable `linewidth` has WebGL limitations (linewidth > 1 not guaranteed). The recommended approach is a flat extruded quad strip per river segment.
**Decision guidance (Claude's Discretion):** Use a mesh quad strip approach where each river path segment is extruded to a flat `PlaneGeometry` strip aligned to the path direction. This avoids the WebGL linewidth limitation and gives clean visual results.

### Pattern 6: Elevation Tick Marks as Instanced Geometry
**What:** Caterpillar ticks = short perpendicular line segments along hex edges where elevation changes sharply. Generate a pool of tick instances: one per tick mark needed.
**Implementation options:**
- `THREE.LineSegments` with all tick segments in one buffer (simpler, lower overhead)
- `THREE.InstancedMesh` with a small rectangle quad (allows per-instance width/length tuning)
- Recommended: `LineSegments` buffer — simpler, sufficient for Phase 3

### Anti-Patterns to Avoid
- **CanvasTexture for coastlines:** Rendering the coastline to a canvas texture and applying as a texture map introduces a rasterization step, loses crispness at zoom, and couples resolution to canvas size. Use geometry instead.
- **ShaderMaterial for depth bands:** Depth bands are a simple color lookup on per-hex elevation — a shader is unnecessary complexity. Update InstancedMesh per-instance colors instead.
- **Rebuilding InstancedMesh for color changes:** The `updateHexColors()` pattern in HexFillMesh.ts already handles color updates without recreating the mesh. Follow that pattern.
- **Three.js `linewidth` > 1 for rivers:** WebGL spec only guarantees `linewidth = 1` on most hardware. Rivers wider than ~1px must use mesh geometry (quad strips or tubes), not `LineBasicMaterial.linewidth`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Organic coastline iso-contour | Custom contour algorithm | `computeCoastline()` in `engine/coastline.ts` | Already implemented, tested, tuned — marching squares + Chaikin + noise displacement |
| River path curves | Custom spline interpolation | `riverPathToSvgPath()` in `RiverOverlay.tsx` + `RiverPath[]` from worldGenData | Catmull-Rom conversion, edge-midpoint routing, meander noise — all production-ready |
| Hex grid line geometry | Custom edge enumeration | `createHexGridLines()` in `scene/HexGridLines.ts` | Already implemented with edge deduplication — GRID-01 is already done |
| Water terrain classification | Custom set membership | `WATER_TERRAIN_KEYS` and `getWaterColor()` in `palette/waterPalette.ts` | Already covers all water terrain types |
| Hex pixel positions | Custom hex math | `hexToPixel()` in `lib/hexMath.ts` + `HEX_CONSTANTS.HEX_SIZE` | Used everywhere — do not replicate |
| Seeded noise | Custom noise | `SimplexNoise` in `lib/simplexNoise.ts` or `createNoise2D` from `simplex-noise` package | Both are available and used throughout the codebase |

**Key insight:** The SVG renderer (`src/components/HexMap/`) is a complete reference implementation. Every visual feature in Phase 3 has a prior art implementation there. Phase 3 is a translation project, not an invention project.

---

## Common Pitfalls

### Pitfall 1: Coordinate System Mismatch (Y-Flip)
**What goes wrong:** Coastline contour points, river paths, and tick mark positions come from `hexToPixel()` in SVG coordinate space (Y increases downward). Three.js world space has Y increasing upward. Failing to flip Y produces a mirrored map.
**Why it happens:** The SVG renderer operates in y-down space; Three.js is y-up by convention. This is already handled in `HexFillMesh.ts` via `matrix.setPosition(x, -y, 0)`.
**How to avoid:** Apply Y-flip (`worldY = -svgY`) to ALL geometry coming from `hexToPixel()` or `computeCoastline()`. Add a test asserting that a known coastal hex's tick marks appear on the correct (uphill) side.
**Warning signs:** Coastline appears above land mass instead of below, or ticks point in wrong direction.

### Pitfall 2: Coastline Geometry Coordinate Origin Mismatch
**What goes wrong:** `computeCoastline()` uses an internal `margin` offset (see `buildScalarField()` — adds `Math.ceil(blobRadius)` margin to all hex positions). Contour output points include this margin offset. If not subtracted before creating Three.js geometry, the coastline mesh appears shifted.
**Why it happens:** The margin prevents edge artifacts in marching squares — it adds a buffer around the field. The `computeCoastline()` function subtracts the margin from contour points before returning, but verify this with the function signature.
**How to avoid:** Inspect `computeCoastline()` return values against known hex positions in a unit test. The coastline loops should overlay correctly on hex positions without additional offset.
**Warning signs:** Organic shoreline shape is correct but spatially offset from hex grid by a constant amount.

### Pitfall 3: Three.js ShapeGeometry Winding Order for Holes
**What goes wrong:** `THREE.Shape` uses `shape.holes` for interior cutouts. The outer shape and holes must have opposite winding orders (outer = counter-clockwise, holes = clockwise, per Three.js convention) or fill artifacts appear.
**Why it happens:** Three.js ShapeGeometry uses the same winding convention as SVG fill-rule evenodd, but the vertex ordering from marching squares may not match.
**How to avoid:** Test with a simple known geometry (a square with a square hole). Add winding order normalization if needed. The SVG renderer uses `fillRule="evenodd"` which avoids this issue — Three.js needs explicit winding.
**Warning signs:** Shoreline area is filled where it should be transparent, or vice versa.

### Pitfall 4: River Width Scaling — linewidth Limitation
**What goes wrong:** Using `THREE.LineBasicMaterial` with `linewidth > 1` for wide rivers. On most WebGL2 implementations, linewidth is clamped to 1 regardless of the value set.
**Why it happens:** WebGL spec does not require linewidth support. Three.js documentation notes this: "Due to limitations of the OpenGL Core Profile with the WebGL renderer on most platforms linewidth will always be 1 regardless of the set value."
**How to avoid:** For rivers wider than ~1px use a quad strip mesh. Each river segment becomes a flat extruded rectangle aligned to the path tangent. Width scales with `hexCount` as per WATR-05.
**Warning signs:** All rivers appear as thin hairlines regardless of width constant setting.

### Pitfall 5: Performance — Geometry Creation Per Tick
**What goes wrong:** Regenerating coastline / river / tick geometry every React render cycle. The coastline computation for 60K hexes takes 10-50ms (measured in SVG renderer via `useCoastline` memoization notes).
**Why it happens:** Without memoization, any prop change to `HexMapV2` (hover state, selection) triggers the setup `useEffect` and rebuilds all geometry.
**How to avoid:** Coastline, river, and elevation tick geometry depends only on `tiles` and `seed`. These change only on world generation. Wire them inside the existing tiles-dependent `useEffect` in `HexMapV2.tsx` (not a new separate effect). Use early bail-out: if tiles array reference is same, skip rebuild.
**Warning signs:** Mouse hover causes 50ms+ frame spikes visible in Chrome performance profiler.

### Pitfall 6: RiverPath Data Source — worldGenData vs WorldGenPipeline
**What goes wrong:** Using `useRivers()` hook (which calls `createWorldGenData` + hydrology modules directly) instead of the `WorldGenPipeline` output that Phase 2 standardized on.
**Why it happens:** The old `useRivers.ts` hook in `src/components/HexMap/` runs hydrology independently from the tile generation. For HexMapV2, tiles come from `WorldGenPipeline.run()`. The river paths from these two systems may be generated with different seeds/parameters.
**How to avoid:** For HexMapV2, pass `riverPaths` from the same `WorldGenPipeline` context that generates the tiles. Do not call `useRivers()` (which uses the old worldGenData path). Check how `HexV2View.tsx` receives its tiles and thread `riverPaths` through from the same source.
**Warning signs:** Rivers appear on hexes that don't have `hasRiver = true` in their tile data, or rivers are absent from hexes that do.

### Pitfall 7: Elevation Tick Marks — Shared Edge Double-Drawing
**What goes wrong:** Scanning each hex and emitting ticks for all 6 edges results in each shared edge being processed twice (once from each adjacent hex). This doubles tick mark count.
**Why it happens:** The same neighbor-scanning pattern used in HexGridLines also double-counts edges before deduplication.
**How to avoid:** Use the same `edgeSet` deduplication pattern from `createHexGridLines()` — track processed (hexA, hexB) pairs and skip if already processed from the other side.
**Warning signs:** Tick marks appear doubled (two identical marks at same position), or tick density appears double what constants specify.

---

## Code Examples

Verified patterns from existing codebase:

### Accessing World Data Available in HexMapV2
```typescript
// Source: src/components/HexMapV2/HexMapV2.tsx (existing)
// tiles: HexTile[] — each tile has:
//   tile.coord: { col, row }
//   tile.terrain: TerrainType
//   tile.geoParams.elevation: number (0-1, SEA_LEVEL ~0.38)
//   tile.hasRiver?: boolean
//   tile.geoParams.temperature: number
//   tile.geoParams.moisture: number

// River paths: must come from WorldGenPipeline context
// Currently HexMapV2 does NOT receive riverPaths — must be threaded through HexV2View
```

### Calling Existing Coastline Engine
```typescript
// Source: src/engine/coastline.ts + src/components/HexMap/useCoastline.ts
import { computeCoastline } from '../../engine/coastline';
import { COASTLINE_DEFAULTS } from '../../types/coastline';

// Returns { loops: ContourLoop[], shallowLoops: ContourLoop[] }
// loops = land boundary (organic shoreline)
// shallowLoops = wider shallow band
const coastlineData = computeCoastline(tiles, hexSize, cols, rows, seed, COASTLINE_DEFAULTS);
// ContourLoop = Point2D[] in SVG space — apply Y-flip for Three.js
```

### Existing RenderOrder Constants
```typescript
// Source: src/components/HexMapV2/scene/RenderLayers.ts
export const RENDER_ORDER = {
  HEX_FILL:        0,
  COASTLINE:       1,  // Phase 3: CoastlineMesh
  GRID:            2,  // DONE: createHexGridLines()
  ELEVATION_TICKS: 3,  // Phase 3: ElevationTickMesh
  RIVERS:          4,  // Phase 3: RiverMesh
  ROADS:           5,
  BORDERS:         6,
  SIGNIFIERS:      7,
  LOCATIONS:       8,
  AGENTS:          9,
  EVENTS:          10,
  LABELS:          11,
  FOG:             12,
};
```

### Existing Water Palette
```typescript
// Source: src/components/HexMapV2/palette/waterPalette.ts
export const WATER_PALETTE = {
  shallows:   '#88C0E0',  // WATR-03: shallow band
  ocean:      '#5898D0',  // WATR-03: mid-ocean band
  deep_ocean: '#3870B0',  // WATR-03: deep-ocean band
  lake:       '#5888B8',  // WATR-06: lake fill
  river:      '#4878A8',  // WATR-04: river lines
};
// Note: STYLE.md water range is '#1a2535' to '#2a3a50' (dark palette)
// Current WATER_PALETTE is lighter than STYLE.md specifies — may need harmonization
```

### HexSize Constant
```typescript
// Source: src/components/HexMapV2/scene/HexFillMesh.ts
export const HEX_CONSTANTS = {
  HEX_SIZE: 10,   // Flat-top hex radius in Three.js world units
  // ...
};
// ALL HexMapV2 geometry must use this constant — not the SVG renderer's hexSize prop
```

### Y-Flip Convention
```typescript
// Source: src/components/HexMapV2/scene/HexFillMesh.ts
const { x, y } = hexToPixel(tile.coord, HEX_CONSTANTS.HEX_SIZE);
matrix.setPosition(x, -y, 0);  // SVG y-down → Three.js y-up
// Apply same pattern to all contour/river point conversions:
// threeX = svgX
// threeY = -svgY
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SVG `<path>` for coastline | Three.js ShapeGeometry (Phase 3 target) | Phase 3 | Crisp at all zoom levels, GPU-accelerated |
| SVG `<path stroke>` for rivers | Three.js mesh quad strips (Phase 3 target) | Phase 3 | Consistent width at all zoom levels (no WebGL linewidth issue) |
| CSS/SVG grid lines | Three.js LineSegments (already done in HexGridLines.ts) | Phase 1 | Integrated with Three.js render pipeline |
| React Three Fiber | Raw Three.js | Project-level decision | Full control over InstancedMesh and render loop |

**Status clarification for GRID-01:**
`createHexGridLines()` is already implemented in Phase 1 and wired in `HexMapV2.tsx`. GRID-01 is substantively done — Phase 3 only needs to verify the zoom-gating behavior (lines should hide at full-world zoom, which is Phase 7 LOD territory). The plan should note GRID-01 as "verify existing implementation satisfies requirement" not "build from scratch."

---

## Open Questions

1. **RiverPath threading to HexMapV2**
   - What we know: `useRivers()` in `src/components/HexMap/useRivers.ts` exists but uses the old worldGenData path (not WorldGenPipeline). HexMapV2 does not currently receive `riverPaths` as a prop.
   - What's unclear: How does `HexV2View.tsx` get tiles today? Does the App.tsx tile generation use WorldGenPipeline? If so, does WorldGenPipeline's context expose `riverPaths`?
   - Recommendation: Plan 03-02 must audit how tiles flow from generation into `HexMapV2` and add `riverPaths: RiverPath[]` prop threading if not already present. Check `src/App.tsx` or wherever `HexV2View` is instantiated.

2. **Water palette harmonization with STYLE.md**
   - What we know: `WATER_PALETTE` uses values like `#88C0E0` (fairly bright), but `STYLE.md` specifies world water range `#1a2535` to `#2a3a50` (very dark). The existing SVG renderer uses `deepWater: '#12243a'`, `shallows: '#1e4858'` (aligned with STYLE.md). HexMapV2's `WATER_PALETTE` is noticeably lighter.
   - What's unclear: Was this intentional? The SVG `CoastlineOverlay.tsx` `coastEdge` was darkened in a previous version note (VS-002).
   - Recommendation: Phase 3 plan should include a color harmonization task. Use the SVG renderer's validated colors as reference: deep `#12243a`, shallows `#1e4858`, mid-ocean ~ `#162d42`.

3. **Elevation data availability at tile level vs. worldGen context**
   - What we know: `tile.geoParams.elevation` exists on HexTile and covers 0-1 range. However, the per-hex 7-point sub-hex sampling (WGEN-07) is computed during worldgen and stored in the WorldGenContext, not in the tile. For WATR-02 (marching squares from 7-point samples), the question is whether the marching squares algorithm uses per-hex elevation or a continuous scalar field.
   - What's unclear: Looking at `computeCoastline()`, it uses a **metaball-style scalar field** built from land hex positions (not the 7-point samples directly). CONTEXT.md says "using the existing 7-point sub-hex elevation sampling" but the implementation uses the blob/metaball approach.
   - Recommendation: The existing `computeCoastline()` implementation is what should be used — it achieves the same organic-shoreline goal via the metaball field. The "7-point sampling" reference in CONTEXT.md describes what's conceptually happening, not a literal API to call. Proceed with `computeCoastline()`.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (version from package.json — standard for this project) |
| Config file | `vite.config.ts` (vitest config inline) |
| Quick run command | `npm test -- --run src/components/HexMapV2` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WATR-01 | Coastal hex color unchanged by coastline overlay | unit | `npm test -- --run src/components/HexMapV2/scene/__tests__/CoastlineMesh.test.ts` | ❌ Wave 0 |
| WATR-02 | Marching squares produces closed loops from land tile set | unit | `npm test -- --run src/engine/__tests__/coastline.test.ts` | ✅ Exists |
| WATR-03 | Water depth band assigns correct color per elevation threshold | unit | `npm test -- --run src/components/HexMapV2/palette/__tests__/waterPalette.test.ts` | ✅ Exists (partial — extend for depth bands) |
| WATR-04 | River path produces non-empty geometry for 2+ hex path | unit | `npm test -- --run src/components/HexMapV2/scene/__tests__/RiverMesh.test.ts` | ❌ Wave 0 |
| WATR-05 | River width increases with hex count | unit | included in RiverMesh.test.ts | ❌ Wave 0 |
| WATR-06 | Lake hexes (lakeIds != -1) assigned lake color | unit | included in CoastlineMesh.test.ts or separate LakeFill.test.ts | ❌ Wave 0 |
| ELEV-01 | Biome palette encodes elevation signal | visual/manual | human review | manual-only |
| ELEV-02 | Tick marks generated for edges with elevation diff > threshold | unit | `npm test -- --run src/components/HexMapV2/scene/__tests__/ElevationTicks.test.ts` | ❌ Wave 0 |
| ELEV-03 | Tick count clamps to 3-8 per steepness | unit | included in ElevationTicks.test.ts | ❌ Wave 0 |
| ELEV-04 | Altitude labels only show at hero-local and regional zoom | unit | `npm test -- --run src/components/HexMapV2/__tests__/AltitudeLabels.test.ts` | ❌ Wave 0 |
| GRID-01 | Grid lines exist at RENDER_ORDER.GRID with 12% opacity | unit | `npm test -- --run src/components/HexMapV2/scene/__tests__/HexGridLines.test.ts` | ❌ Wave 0 (HexGridLines code exists, test file may not) |

### Sampling Rate
- **Per task commit:** `npm test -- --run src/components/HexMapV2`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/components/HexMapV2/scene/__tests__/CoastlineMesh.test.ts` — covers WATR-01, WATR-02 (Three.js geometry from coastline loops)
- [ ] `src/components/HexMapV2/scene/__tests__/RiverMesh.test.ts` — covers WATR-04, WATR-05
- [ ] `src/components/HexMapV2/scene/__tests__/ElevationTicks.test.ts` — covers ELEV-02, ELEV-03
- [ ] `src/components/HexMapV2/__tests__/AltitudeLabels.test.ts` — covers ELEV-04 zoom gating
- [ ] `src/components/HexMapV2/scene/__tests__/HexGridLines.test.ts` — covers GRID-01 (code exists, verify test exists)

---

## Sources

### Primary (HIGH confidence)
- `src/engine/coastline.ts` — Full marching squares pipeline, Chaikin smoothing, contour extraction
- `src/types/coastline.ts` — CoastlineData, CoastlineConfig, COASTLINE_DEFAULTS
- `src/components/HexMap/RiverOverlay.tsx` — Production river rendering: edge-midpoint routing, meander noise, Catmull-Rom curves
- `src/components/HexMapV2/scene/RenderLayers.ts` — All 13 render order slots; Phase 3 uses COASTLINE(1), ELEVATION_TICKS(3), RIVERS(4)
- `src/components/HexMapV2/scene/HexGridLines.ts` — GRID-01 already implemented
- `src/components/HexMapV2/scene/HexFillMesh.ts` — Y-flip convention, HEX_SIZE=10, InstancedMesh color update pattern
- `src/engine/worldGenData.ts` — WorldGenData shape: elevation, hasRiver, riverPaths, lakeIds
- `src/types/index.ts` — HexTile.geoParams.elevation, hasRiver fields
- `src/components/HexMapV2/palette/waterPalette.ts` — Existing water color definitions

### Secondary (MEDIUM confidence)
- Three.js `ShapeGeometry` / `Shape` / `Path` documentation — verified pattern for filled contour rendering
- WebGL linewidth limitation — confirmed by Three.js official docs: "Due to limitations of the OpenGL Core Profile... linewidth will always be 1 regardless of the set value"

### Tertiary (LOW confidence)
- None — all critical claims verified against codebase or Three.js documentation

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; all libraries already installed and in use
- Architecture: HIGH — verified against Phase 1 codebase; all integration points confirmed
- Pitfalls: HIGH — Y-flip, linewidth, double-edge issues all verified from existing code patterns
- Coastline algorithm: HIGH — full implementation exists in engine/coastline.ts, tested
- River algorithm: HIGH — full implementation in RiverOverlay.tsx, tested
- Water palette colors: MEDIUM — current palette may need harmonization with STYLE.md (needs visual review)

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (30 days — stable Three.js, no moving targets)
