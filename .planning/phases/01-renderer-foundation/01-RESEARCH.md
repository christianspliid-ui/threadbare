# Phase 1: Renderer Foundation - Research

**Researched:** 2026-03-21
**Domain:** Three.js orthographic rendering, InstancedMesh hex grids, d3-zoom camera controls, React canvas integration
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Development workflow**
- New renderer lives at `?view=hexv2` as a separate route alongside the existing SVG map
- Uses real game state (same worldgen seed, agents, locations) — not synthetic test data
- Full game chrome from start (topbar, sidebar panels, hex chronicle) — not bare canvas
- Compare by switching between `?view=game` (SVG) and `?view=hexv2` (Three.js) via URL
- No split-screen comparison tool needed
- Phase 8 swaps the Three.js map into `?view=game` and removes the old SVG map

**Camera & interaction**
- d3-zoom drives the Three.js orthographic camera (familiar gesture handling, proven pinch-to-zoom)
- Free continuous zoom (no snapping to tier centers) — the 4 tiers are LOD thresholds only
- Click to select hex (same as current behavior) — no double-click zoom
- Drag-only panning, no edge-of-screen pan (avoids conflict with sidebar panels)
- Jump-to: smooth fly-to animation (~500ms) when clicking notifications/agents in sidebar
- Zoom speed: Claude's discretion — tune to feel natural across the 30x zoom range

**Hex grid appearance**
- Background color: #0a0a0c (same near-black as current)
- Grid lines visible from Phase 1 — thin lines at ~12% opacity black on hex edges
- Full Tait palette from day one (all 27 terrain type colors from Design/hex-terrain-palette-v2.html)
- Flat-top hex orientation (same as current SVG map, matches hexMath.ts)
- Selected hex: bright white or gold outline ring (2-3px). Hovered hex: subtler highlight.

**Three.js + React integration**
- Raw canvas ref in React component — direct Three.js, no React Three Fiber
- Event bridge: raycasting on click/hover → callback props (onHexClick, onHexHover)
- HexMapV2 component exposes same interface as current HexMap (HexMapProps + HexMapHandle)

### Claude's Discretion
- Zoom speed tuning across 30x range
- Three.js scene setup details (renderer config, pixel ratio, resize handling)
- Event bridge implementation (raycasting approach)
- Exact hover highlight treatment (color, opacity)
- InstancedMesh buffer setup and update strategy

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RNDR-01 | Three.js orthographic camera renders a 200x300 hex grid (60K hexes) at 60fps | InstancedMesh one-draw-call approach + frustum culling make 60K hexes feasible |
| RNDR-02 | Hex fills use InstancedMesh with per-instance color attributes (one draw call for all fills) | Covered: InstancedMesh + setColorAt() or per-instance color attribute patterns |
| RNDR-03 | Frustum culling skips off-screen hexes from all render passes | Covered: Three.js built-in frustum culling + manual visibility tracking pattern |
| RNDR-04 | Camera supports pan (drag), zoom (scroll/pinch), and jump-to (click notification) | Covered: d3-zoom → OrthographicCamera sync pattern + animate-to pattern |
| RNDR-05 | HTML overlay tooltips positioned via Three.js project() (world → screen coords) | Covered: Vector3.project() → CSS positioning pattern |
| RNDR-06 | 13-layer render order implemented (hex fill → grid → ticks → rivers → roads → borders → signifiers → locations → agents → events → labels → fog) | Covered: renderOrder property + multiple meshes pattern |
| TERR-01 | Type system defines exactly 27 base terrain types | Covered: new TerrainTypeV2 enum / const mapped to palette |
| TERR-02 | Tait-derived hex color palette maps each type to a distinct hex color | Covered: TERRAIN_PALETTE record from Design/hex-terrain-palette-v2.html — all 27 colors identified |
| TERR-03 | Water palette (shallows, ocean, deep_ocean, lake, river) separate from terrain palette | Covered: WATER_PALETTE record — all 5 colors identified |
| TERR-04 | Hard terrain transitions at hex boundaries — no blending | Natural with InstancedMesh per-hex colors |
| TERR-05 | Optional per-hex brightness noise (+/-5%) to break up uniform regions | Covered: multiply base color by seeded noise factor before setColorAt |
</phase_requirements>

---

## Summary

Phase 1 builds the Three.js rendering scaffold that every subsequent phase builds on. The core technical challenge is rendering 60,000 hex fills at 60fps. Three.js `InstancedMesh` solves this with a single draw call — all 60K hexes share one geometry (a flat-top hex polygon) and one material, with per-instance color provided via a `InstancedBufferAttribute` or `setColorAt()`. This is the standard pattern for this scale of 2D instanced rendering.

The second major concern is camera control. d3-zoom is already installed and used by the existing SVG HexMap. The pattern for driving an `OrthographicCamera` from d3-zoom events is well-established: treat the zoom transform's `x`, `y`, and `k` values as the camera's translation and scale, then map those to `camera.left/right/top/bottom`. The existing `HexMap.tsx` contains the exact d3-zoom setup pattern (including `centerOn` via `svg.transition().duration(500)`) that ports directly to Three.js with `TWEEN` or manual `requestAnimationFrame` interpolation.

For Phase 1's scope, the planner should treat RNDR-06's 13-layer render order as infrastructure scaffolding — the render order enum and layer constants need to exist from day one so subsequent phases can slot into them, even if only the hex fill layer is populated in Phase 1.

**Primary recommendation:** Install Three.js 0.183.x, build `HexMapV2` as a `forwardRef` component with a raw canvas, use `InstancedMesh` for fills, d3-zoom for camera, and establish the render layer enum before any layer-specific rendering work begins.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| three | 0.183.2 | WebGL scene, InstancedMesh, OrthographicCamera, raycasting | Only 3D/WebGL lib that solves 60K hexes in one draw call; already chosen by architecture decision |
| @types/three | 0.183.1 | TypeScript types for Three.js | Matches three version exactly |
| d3 | 7.9.0 (already installed) | Pan/zoom gesture handling | Already installed and used by SVG HexMap; d3-zoom gives pinch-to-zoom, consistent UX |
| @types/d3 | 7.4.3 (already installed) | TypeScript types for d3 | Already installed |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| simplex-noise | 4.0.3 (already installed) | Per-hex brightness noise (TERR-05) | Used in brightness variation pass to seed per-hex color offset |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| InstancedMesh | Canvas 2D | Canvas 2D is CPU-bound, would not sustain 60fps at 60K hexes with pan/zoom |
| InstancedMesh | Individual Mesh per hex | One Mesh per hex = 60K draw calls, GPU command overhead, not viable |
| d3-zoom | Custom pointer event handler | d3-zoom handles pinch-to-zoom, scroll normalization cross-platform; not worth reimplementing |
| TWEEN (for animate-to) | requestAnimationFrame lerp | Either works; manual rAF lerp has zero dependencies, preferred for simplicity |

**Installation:**
```bash
npm install three@0.183.2 @types/three@0.183.1
```

**Version verification:** three@0.183.2 and @types/three@0.183.1 confirmed on npm registry as of 2026-03-21.

---

## Architecture Patterns

### Recommended Project Structure

```
src/components/HexMapV2/
├── HexMapV2.tsx              # Main component: canvas ref, Three.js lifecycle, forwardRef
├── HexMapV2Handle.ts         # HexMapHandle interface (matches existing HexMap)
├── scene/
│   ├── HexSceneSetup.ts      # Renderer, camera, scene, resize observer
│   ├── HexFillMesh.ts        # InstancedMesh creation + color update helpers
│   ├── HexGridLines.ts       # Grid line geometry (LineSegments or thin mesh)
│   └── RenderLayers.ts       # RENDER_ORDER enum (13 layers, Phase 1 populates fill only)
├── camera/
│   ├── D3ZoomCamera.ts       # d3-zoom → OrthographicCamera sync
│   └── CameraAnimator.ts     # Smooth fly-to (animate centerOn calls)
├── interaction/
│   ├── HexRaycaster.ts       # Mouse/touch → world coords → hex coord conversion
│   └── HexTooltip.tsx        # HTML overlay component positioned by project()
├── palette/
│   ├── terrainPalette.ts     # TERRAIN_PALETTE: Record<TerrainTypeV2, string>
│   ├── waterPalette.ts       # WATER_PALETTE: Record<WaterType, string>
│   └── colorUtils.ts         # hexToThreeColor(), brightnessNoise()
└── __tests__/
    ├── terrainPalette.test.ts
    └── HexRaycaster.test.ts
```

### Pattern 1: InstancedMesh Hex Fill

**What:** One `THREE.InstancedMesh` holds all 60K hex instances. Each instance is a flat hex polygon. Per-instance color is set via `mesh.setColorAt(i, color)` or a custom `InstancedBufferAttribute`. The matrix for each instance positions it at the hex's world coordinate.

**When to use:** All hex fill rendering. This is the only approach that achieves one draw call for 60K hexes.

**Example:**
```typescript
// Source: Three.js InstancedMesh docs (threejs.org/docs/#api/en/objects/InstancedMesh)
import * as THREE from 'three';

// Flat-top hex polygon geometry (6 triangles from center)
function buildHexGeometry(size: number): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  const positions: number[] = [];
  for (let i = 0; i < 6; i++) {
    const a0 = (Math.PI / 180) * (60 * i);
    const a1 = (Math.PI / 180) * (60 * (i + 1));
    // Triangle: center, vertex i, vertex i+1
    positions.push(0, 0, 0);
    positions.push(size * Math.cos(a0), size * Math.sin(a0), 0);
    positions.push(size * Math.cos(a1), size * Math.sin(a1), 0);
  }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  return geo;
}

const hexGeo = buildHexGeometry(HEX_SIZE);
const hexMat = new THREE.MeshBasicMaterial({ vertexColors: true });
const mesh = new THREE.InstancedMesh(hexGeo, hexMat, HEX_COUNT);
mesh.instanceColor!.setUsage(THREE.DynamicDrawUsage); // colors update per tick

// Position each instance
const dummy = new THREE.Object3D();
const color = new THREE.Color();
tiles.forEach((tile, i) => {
  const { x, y } = hexToPixel(tile.coord, HEX_SIZE); // reuse existing hexMath.ts
  dummy.position.set(x, -y, 0); // flip Y: SVG y-down vs Three.js y-up
  dummy.updateMatrix();
  mesh.setMatrixAt(i, dummy.matrix);
  color.setStyle(TERRAIN_PALETTE[tile.terrain]);
  mesh.setColorAt(i, color);
});
mesh.instanceMatrix.needsUpdate = true;
mesh.instanceColor!.needsUpdate = true;
```

### Pattern 2: d3-zoom → OrthographicCamera Sync

**What:** d3-zoom fires `zoom` events with a `ZoomTransform` (x, y, k). Map this to the OrthographicCamera's frustum parameters so Three.js renders what d3-zoom says the viewport should show.

**When to use:** All camera pan/zoom operations.

**Example:**
```typescript
// Source: derived from existing HexMap.tsx d3-zoom pattern + Three.js ortho camera docs
import * as d3 from 'd3';
import * as THREE from 'three';

function syncCameraToZoom(
  camera: THREE.OrthographicCamera,
  transform: d3.ZoomTransform,
  canvasWidth: number,
  canvasHeight: number
) {
  // d3 transform: (x, y) = pan offset, k = zoom scale
  // Invert: camera sees a window of (width/k) x (height/k) centered at (-x/k, y/k)
  const halfW = canvasWidth / 2 / transform.k;
  const halfH = canvasHeight / 2 / transform.k;
  const cx = -transform.x / transform.k;
  const cy = transform.y / transform.k; // Y-flip: d3 y-down, Three.js y-up
  camera.left   = cx - halfW;
  camera.right  = cx + halfW;
  camera.top    = cy + halfH;
  camera.bottom = cy - halfH;
  camera.updateProjectionMatrix();
}

// d3-zoom setup on canvas element
const zoom = d3.zoom<HTMLCanvasElement, unknown>()
  .scaleExtent([MIN_ZOOM, MAX_ZOOM])
  .on('zoom', (event) => {
    syncCameraToZoom(camera, event.transform, canvas.width, canvas.height);
  });
d3.select(canvasRef.current).call(zoom);
```

### Pattern 3: Smooth Jump-To (centerOn)

**What:** When `centerOn(hexCoord)` is called via the imperative handle, animate the camera smoothly to center on that hex over ~500ms. No external animation library needed — a simple rAF loop with easing.

**When to use:** Notification clicks, agent sidebar clicks, avatar tracking.

**Example:**
```typescript
// Source: derived from existing HexMap.tsx centerOn pattern (svg.transition().duration(500))
function animateCameraTo(
  camera: THREE.OrthographicCamera,
  zoomBehavior: d3.ZoomBehavior<HTMLCanvasElement, unknown>,
  canvas: HTMLCanvasElement,
  targetX: number,
  targetY: number,  // Three.js world coords (Y already flipped)
  targetScale: number,
  duration = 500
) {
  const startTime = performance.now();
  const startTransform = d3.zoomTransform(canvas);

  // Target as d3 transform
  const canvasW = canvas.clientWidth;
  const canvasH = canvas.clientHeight;
  const tx = canvasW / 2 - targetX * targetScale;
  const ty = canvasH / 2 + targetY * targetScale; // re-flip for d3
  const targetTransform = d3.zoomIdentity.translate(tx, ty).scale(targetScale);

  function step(now: number) {
    const t = Math.min((now - startTime) / duration, 1);
    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // ease-in-out quad
    const interp = d3.interpolateZoom(startTransform, targetTransform);
    const current = interp(ease);
    d3.select(canvas).call(zoomBehavior.transform, current);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
```

### Pattern 4: Tooltip HTML Overlay (project())

**What:** On hover, convert the hovered hex's Three.js world position to screen coordinates using `Vector3.project(camera)`, then position an absolutely-placed React div over the canvas.

**When to use:** Hex coordinate + terrain type tooltip on hover (RNDR-05).

**Example:**
```typescript
// Source: Three.js Vector3.project docs + common React canvas overlay pattern
function worldToScreen(
  worldPos: THREE.Vector3,
  camera: THREE.OrthographicCamera,
  canvas: HTMLCanvasElement
): { x: number; y: number } {
  const projected = worldPos.clone().project(camera);
  return {
    x: (projected.x  * 0.5 + 0.5) * canvas.clientWidth,
    y: (-projected.y * 0.5 + 0.5) * canvas.clientHeight,
  };
}
// Position tooltip div with CSS: position: absolute, left: screenPos.x, top: screenPos.y
```

### Pattern 5: Hex Raycasting (click/hover → hex coord)

**What:** On mouse move / click, unproject the pointer position back to world coordinates using the inverse of the camera projection, then convert world coords to the nearest hex using the same `hexToPixel` math inverted.

**When to use:** All pointer event handling on the canvas.

**Example:**
```typescript
// Source: Three.js Raycaster docs + geometry knowledge
// For orthographic camera, unproject is simpler than perspective:
function screenToWorld(
  event: MouseEvent,
  camera: THREE.OrthographicCamera,
  canvas: HTMLCanvasElement
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const ndcX = ((event.clientX - rect.left) / rect.width)  *  2 - 1;
  const ndcY = ((event.clientY - rect.top)  / rect.height) * -2 + 1;
  const vec = new THREE.Vector3(ndcX, ndcY, 0).unproject(camera);
  return { x: vec.x, y: vec.y };
}

// Then invert hexToPixel to find nearest hex:
// hexToPixel: x = col * size * 1.5, y = row * size * sqrt(3) + (col%2 ? sqrt(3)*size/2 : 0)
// Inversion: col = round(worldX / (size * 1.5)), then derive row from y
```

### Pattern 6: Render Layer Constants

**What:** Define the 13-layer render order as named constants from day one. Three.js `renderOrder` controls draw order for transparent / overlapping objects.

**When to use:** Every new mesh added to the scene uses one of these constants.

**Example:**
```typescript
// Source: project design (Design/brainstorm-hexmap-v2.md layer specification)
export const RENDER_LAYERS = {
  HEX_FILL:    0,   // Phase 1: InstancedMesh
  COASTLINE:   1,   // Phase 3
  GRID_LINES:  2,   // Phase 1 (thin lines on hex edges)
  TICKS:       3,   // Phase 3 (elevation caterpillar marks)
  RIVERS:      4,   // Phase 3
  ROADS:       5,   // Phase 7
  BORDERS:     6,   // Phase 4
  SIGNIFIERS:  7,   // Phase 5
  LOCATIONS:   8,   // Phase 6
  AGENTS:      9,   // Phase 6
  EVENTS:      10,  // Phase 6
  LABELS:      11,  // Phase 4+
  FOG:         12,  // Phase 7
} as const;
```

### Anti-Patterns to Avoid

- **Individual Mesh per hex:** Never create one `THREE.Mesh` per hex — 60K objects × GPU draw call overhead = unusable frame rate. Always InstancedMesh.
- **Reading back from GPU:** Never call `renderer.readRenderTargetPixels()` for hit-testing. Use CPU-side raycasting (pattern 5 above).
- **Updating InstancedMesh every frame unconditionally:** Only set `instanceMatrix.needsUpdate = true` when hex data actually changes. Unnecessary uploads hurt performance.
- **Forgetting Y-axis flip:** Three.js Y is up; SVG/d3 Y is down. Every coordinate that comes from `hexToPixel` must have its Y negated before use in Three.js world space.
- **React state for camera position:** Never store camera state in React state — triggers re-render on every frame. Camera lives in a ref, updated by d3-zoom event handler directly.
- **ResizeObserver without debounce:** Canvas resize should call `renderer.setSize()` and update camera frustum. Without debounce, rapid resizes (font scaling, dev tools) produce excessive work.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pan/zoom gesture normalization | Custom pointer event handler | d3-zoom (already installed) | Cross-browser scroll normalization, pinch-to-zoom, momentum — subtle edge cases in every browser |
| Smooth animation between transforms | Custom spring physics | Manual rAF lerp with ease-in-out quad | Simple enough to inline; no dep needed |
| WebGL context management | Raw `canvas.getContext('webgl2')` | THREE.WebGLRenderer | Handles context loss, extension loading, device pixel ratio, fallback |
| Color math | Custom hex→RGB→Three.Color | THREE.Color.setStyle() | Handles all CSS color formats; already in Three.js |
| Seeded noise for brightness variation | Custom PRNG | simplex-noise (already installed) with mulberry32 seed | Consistent with rest of engine PRNG strategy |

**Key insight:** d3-zoom + Three.js OrthographicCamera is a well-established pairing. The hard work (gesture handling, transform interpolation) is already done.

---

## Common Pitfalls

### Pitfall 1: Y-Axis Inversion Between Coordinate Systems

**What goes wrong:** `hexToPixel` returns SVG-space coordinates (Y increases downward). Three.js world space has Y increasing upward. If you forget to negate Y when positioning hex instances, the map renders upside-down.

**Why it happens:** SVG, HTML Canvas, and d3-zoom all use top-left origin with Y-down. Three.js uses Y-up by convention.

**How to avoid:** Create a single adapter function `svgToWorld({ x, y }) → { x, y: -y }` used everywhere hex positions are fed to Three.js. Never transform coordinates inline.

**Warning signs:** Map appears flipped vertically; "north" is at the bottom of the screen.

---

### Pitfall 2: InstancedMesh Instance Count is Fixed

**What goes wrong:** `THREE.InstancedMesh` constructor takes `count` as a final parameter. You cannot add or remove instances after creation without recreating the mesh.

**Why it happens:** GPU buffer allocation is fixed at creation time.

**How to avoid:** Pre-allocate for the full 200×300 = 60,000 instances upfront. Never try to dynamically resize. Set `mesh.count` (not constructor count) to a lower value if you want to hide trailing instances — this is Three.js's way to "hide" instances without GPU realloc.

**Warning signs:** Attempting `mesh.count++` after construction has no effect on GPU allocation.

---

### Pitfall 3: d3-zoom Fighting React's Synthetic Events

**What goes wrong:** d3-zoom binds directly to DOM events (`wheel`, `mousedown`, `touchstart`). React's synthetic event system and Three.js's raycaster both also want these events. Conflicts produce double-zoom, missed clicks, or stuck drag states.

**Why it happens:** d3-zoom calls `event.preventDefault()` on wheel events; this can block React's handlers. The canvas must be the single owner of pointer events.

**How to avoid:** Bind d3-zoom to the canvas element (not the React root). Use `useRef<HTMLCanvasElement>` and `d3.select(canvasRef.current).call(zoom)`. For click/hover events needed by the raycaster, listen on `mousemove`/`click` separately — d3-zoom does not consume these for its own use.

**Warning signs:** Scroll zoom fires twice; clicking a hex also pans the camera.

---

### Pitfall 4: OrthographicCamera Frustum Must Be Updated After Resize

**What goes wrong:** When the canvas resizes (window resize, sidebar open/close), the camera's aspect ratio becomes wrong. Hexes appear stretched or the map doesn't fill the available space.

**Why it happens:** `THREE.OrthographicCamera` frustum parameters (`left`, `right`, `top`, `bottom`) are set at creation and do not automatically respond to canvas size changes.

**How to avoid:** Use `ResizeObserver` on the canvas container. On resize: call `renderer.setSize(w, h)`, then recalculate camera frustum from the current d3-zoom transform and new dimensions. Keep a "current transform" ref so you can re-sync after resize.

**Warning signs:** After toggling a sidebar panel, the map appears to zoom/shift unexpectedly.

---

### Pitfall 5: `instanceColor` Needs Explicit `needsUpdate`

**What goes wrong:** Terrain color changes (e.g., divine influence tinting, fog reveal) don't appear on screen even though `setColorAt` was called.

**Why it happens:** Three.js doesn't auto-detect when a buffer attribute changes. You must explicitly set `mesh.instanceColor.needsUpdate = true` after any `setColorAt` calls.

**How to avoid:** After any batch of `setColorAt` calls, always follow with `mesh.instanceColor!.needsUpdate = true`. Consider a dirty-flag pattern: mark tiles whose color changed during a tick, then update only those instances.

**Warning signs:** Colors from a previous frame persist even after calling `setColorAt`.

---

### Pitfall 6: Three.js `import` with Vite Tree-Shaking

**What goes wrong:** Importing `* as THREE from 'three'` imports the entire Three.js bundle (~600KB). This may be acceptable but warrants awareness.

**Why it happens:** Three.js is a large library. Named imports allow better tree-shaking.

**How to avoid:** Prefer named imports for tree-shaking: `import { WebGLRenderer, Scene, OrthographicCamera, InstancedMesh, ... } from 'three'`. Vite handles this well. For Phase 1 with limited Three.js surface area, named imports keep the bundle lean.

**Warning signs:** Build output unexpectedly large; Vite bundle analysis shows full three.js imported.

---

## Code Examples

### Verified Patterns from Existing Codebase

### HexMapHandle Interface (must match exactly)
```typescript
// Source: src/components/HexMap/HexMap.tsx line 57
export interface HexMapHandle {
  centerOn: (x: number, y: number, scale?: number) => void;
}
```

### hexToPixel (flat-top, odd-q offset — reuse verbatim)
```typescript
// Source: src/lib/hexMath.ts line 56
export function hexToPixel(hex: HexCoord, size: number): { x: number; y: number } {
  const x = hex.col * size * HEX_SCALE_X;              // HEX_SCALE_X = 1.5
  const y = hex.row * HEX_SCALE_Y * size               // HEX_SCALE_Y = sqrt(3)
          + (hex.col % 2 === 1 ? HEX_SCALE_Y * size / 2 : 0);
  return { x, y };
}
// In Three.js: position at (x, -y, 0) — negate Y for coordinate flip
```

### Full Tait Terrain Palette (all 27 types + 5 water)
```typescript
// Source: Design/hex-terrain-palette-v2.html PALETTE constant
export const TERRAIN_PALETTE_V2 = {
  // Lowland
  grassland:        '#8EB852',
  savanna:          '#B8B44E',
  steppe:           '#A0A048',
  floodplain:       '#7EA04A',
  // Forest
  woodland:         '#6A9E3A',   // maps to light_forest in existing TerrainType
  temperate_forest: '#4E8830',
  dense_forest:     '#3A6E24',
  boreal_forest:    '#3A6830',
  tropical_forest:  '#2E6E2C',
  // Wet
  marsh:            '#8A9850',
  swamp:            '#6E8838',
  moor_bog:         '#5A7840',
  // Highland
  hills:            '#C8A850',
  forested_hills:   '#5C8234',
  mountains:        '#9E7830',
  high_mountains:   '#8A6828',
  plateau:          '#B89848',
  mountain_pass:    '#A89060',
  // Desert
  sand_desert:      '#D4B878',
  sand_dunes:       '#CCAC60',
  rocky_desert:     '#C09050',
  hardened_clay:    '#D0A090',
  badlands:         '#C07844',
  // Cold
  tundra:           '#A8B0A0',
  snow_fields:      '#E8E8E8',
  glacier:          '#D0DDE8',
  // Volcanic
  volcanic:         '#8A8890',
  lava:             '#D06830',
  // Special
  broken_lands:     '#A09888',
  dead_forest:      '#98988A',
} as const;

export const WATER_PALETTE_V2 = {
  shallows:   '#88C0E0',
  ocean:      '#5898D0',
  deep_ocean: '#3870B0',
  lake:       '#5888B8',
  river:      '#4878A8',
} as const;
```

**Note on terrain type mapping:** The existing `TerrainType` in `src/types/index.ts` has 42 types, not 27. TERR-01 defines 27 for V2's Tait palette. Some V1 types (e.g., `light_forest`) map to palette names (`woodland`). The V2 component needs a mapping layer from the existing `TerrainType` to the 27-type palette key. This is a Phase 1 task.

### d3-zoom Setup (port from existing HexMap.tsx)
```typescript
// Source: src/components/HexMap/HexMap.tsx lines 99–133 (adapted for canvas)
useEffect(() => {
  if (!canvasRef.current) return;
  const canvas = canvasRef.current;

  const zoom = d3.zoom<HTMLCanvasElement, unknown>()
    .scaleExtent([MIN_ZOOM, MAX_ZOOM])
    .on('zoom', (event: d3.D3ZoomEvent<HTMLCanvasElement, unknown>) => {
      syncCameraToZoom(camera, event.transform, canvas.clientWidth, canvas.clientHeight);
      renderer.render(scene, camera);
    });

  d3.select(canvas).call(zoom);
  zoomRef.current = zoom;
  // Apply initial transform (same as existing HexMap initialCenter/initialScale pattern)
}, []);

// Expose centerOn via useImperativeHandle (same shape as existing HexMapHandle)
useImperativeHandle(ref, () => ({
  centerOn(x: number, y: number, scale = DEFAULT_ZOOM_SCALE) {
    animateCameraTo(camera, zoomRef.current!, canvasRef.current!, x, -y, scale);
  }
}));
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SVG per-hex elements | Three.js InstancedMesh | This phase | 60K→1 draw call; 60fps feasible |
| React Three Fiber | Direct Three.js | Project decision 2026-03-21 | Full control at 60K hexes; avoids R3F abstraction cost |
| Fixed zoom range (1x–4x) | 30x zoom range (10px–300px per hex) | This phase | Hero-local to full-world in one continuous zoom |
| Dark fallback biome colors (BIOME_COLORS) | Bright Tait palette | This phase | Map is now a "bright window" per design intent |

**Deprecated/outdated:**
- `BIOME_COLORS` in `src/engine/color.ts`: Old dark fallback palette, replaced by `TERRAIN_PALETTE_V2` in V2. Do not use in V2 component. V1 SVG map continues using it.

---

## Open Questions

1. **TerrainType V2 vs V1 reconciliation**
   - What we know: V1 has 42 terrain types; V2 Tait palette has 27. Some V1 types (e.g., `jungle`, `farmland`, `reef`) have no exact V2 palette match.
   - What's unclear: Should V2 define a new `TerrainTypeV2` type, or should it map V1 types to nearest palette color?
   - Recommendation: Create a `V1_TO_V2_TERRAIN_MAP: Record<TerrainType, keyof typeof TERRAIN_PALETTE_V2>` mapping in the palette file. V2 component uses V1 tiles (no engine change needed) but renders with Tait colors. Define mapping in Phase 1 Plan 02.

2. **Grid line approach for Three.js**
   - What we know: Thin hex grid lines at ~12% opacity are required from Phase 1.
   - What's unclear: Best approach — `THREE.LineSegments` (one per hex edge), `THREE.EdgesGeometry` on the hex mesh, or a second InstancedMesh with ring geometry?
   - Recommendation: Use `THREE.LineSegments` with all hex edge segments concatenated into one geometry buffer. One draw call for all grid lines. Rendered at `RENDER_LAYERS.GRID_LINES` order.

3. **Render loop strategy: continuous vs on-demand**
   - What we know: Three.js can render `requestAnimationFrame` every frame or only when dirty.
   - What's unclear: Game tick simulation triggers state updates; tooltip hover also needs renders. Is on-demand sufficient?
   - Recommendation: Start with `requestAnimationFrame` continuous loop for simplicity. Profile in Phase 1 — if idle frame cost is acceptable (it should be for a static scene), keep it. On-demand optimization can come later.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | vite.config.ts (vitest configured via Vite) |
| Quick run command | `npm test -- --reporter=verbose src/components/HexMapV2` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RNDR-01 | 60K hex InstancedMesh creation without error | unit | `npm test -- src/components/HexMapV2/__tests__/HexFillMesh.test.ts` | ❌ Wave 0 |
| RNDR-02 | InstancedMesh has count=60000, one draw call | unit | `npm test -- src/components/HexMapV2/__tests__/HexFillMesh.test.ts` | ❌ Wave 0 |
| RNDR-03 | Frustum culling: instances outside view not rendered | unit | `npm test -- src/components/HexMapV2/__tests__/HexFillMesh.test.ts` | ❌ Wave 0 |
| RNDR-04 | centerOn() updates camera without crash | unit | `npm test -- src/components/HexMapV2/__tests__/D3ZoomCamera.test.ts` | ❌ Wave 0 |
| RNDR-05 | worldToScreen() maps world coords to correct pixel | unit | `npm test -- src/components/HexMapV2/__tests__/HexTooltip.test.ts` | ❌ Wave 0 |
| RNDR-06 | RENDER_LAYERS constants are defined and unique | unit | `npm test -- src/components/HexMapV2/__tests__/RenderLayers.test.ts` | ❌ Wave 0 |
| TERR-01 | TERRAIN_PALETTE_V2 has exactly 27 keys | unit | `npm test -- src/components/HexMapV2/__tests__/terrainPalette.test.ts` | ❌ Wave 0 |
| TERR-02 | Each terrain type maps to a unique valid hex color | unit | `npm test -- src/components/HexMapV2/__tests__/terrainPalette.test.ts` | ❌ Wave 0 |
| TERR-03 | WATER_PALETTE_V2 has exactly 5 keys | unit | `npm test -- src/components/HexMapV2/__tests__/terrainPalette.test.ts` | ❌ Wave 0 |
| TERR-04 | No color blending between adjacent hex instances | unit | Covered by InstancedMesh color-per-instance — no gradient logic exists | N/A |
| TERR-05 | Brightness noise produces values within +/-5% of base | unit | `npm test -- src/components/HexMapV2/__tests__/terrainPalette.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- src/components/HexMapV2`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/components/HexMapV2/__tests__/terrainPalette.test.ts` — covers TERR-01, TERR-02, TERR-03, TERR-05
- [ ] `src/components/HexMapV2/__tests__/HexFillMesh.test.ts` — covers RNDR-01, RNDR-02, RNDR-03
- [ ] `src/components/HexMapV2/__tests__/D3ZoomCamera.test.ts` — covers RNDR-04
- [ ] `src/components/HexMapV2/__tests__/HexTooltip.test.ts` — covers RNDR-05
- [ ] `src/components/HexMapV2/__tests__/RenderLayers.test.ts` — covers RNDR-06

Note: Three.js requires a WebGL context for most operations. Tests should mock `THREE.WebGLRenderer` and test pure logic (color mapping, matrix math, coordinate transforms) without requiring a real GPU. Vitest runs in jsdom which has no WebGL — use `vi.mock('three')` or test only the non-WebGL utility functions.

---

## Sources

### Primary (HIGH confidence)
- `src/components/HexMap/HexMap.tsx` — d3-zoom setup, HexMapHandle interface, forwardRef pattern — read directly
- `src/lib/hexMath.ts` — hexToPixel, flat-top odd-q coordinate system — read directly
- `Design/hex-terrain-palette-v2.html` — complete PALETTE JavaScript object with all 27 terrain + 5 water colors — read directly
- `Design/brainstorm-hexmap-v2.md` — Layer 1 (rendering tech), Layer 2 (zoom tiers), Layer 15 (zoom rendering) — read directly
- `package.json` — confirmed d3@7.9.0, simplex-noise@4.0.3 installed; three not yet installed
- npm registry — three@0.183.2, @types/three@0.183.1 confirmed as current versions

### Secondary (MEDIUM confidence)
- Three.js official docs (threejs.org) — InstancedMesh, OrthographicCamera, Vector3.project API shapes confirmed via library knowledge + version check
- d3-zoom docs — ZoomTransform, scaleExtent, zoom.transform patterns confirmed via library knowledge (d3 v7)

### Tertiary (LOW confidence)
- None — all critical claims verified against codebase or package registry

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — package registry confirmed three@0.183.2; d3/simplex-noise already in package.json
- Architecture: HIGH — patterns derived from existing HexMap.tsx and Three.js fundamentals; InstancedMesh one-draw-call is canonical
- Pitfalls: HIGH — Y-axis flip, InstancedMesh fixed count, d3/React event conflicts are well-documented Three.js + d3 integration issues
- Terrain palette: HIGH — read directly from Design/hex-terrain-palette-v2.html source file

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (Three.js releases frequently but 0.183.x API is stable for this usage)
