# Phase 4: Regions & Borders — Research

**Researched:** 2026-03-22
**Domain:** Hex grid region detection, border polyline rendering, HTML label overlay, Three.js, TypeScript
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Label Rendering: HTML Overlay with Viewport Culling**
- CSS-styled DOM elements positioned via Three.js `project()` world-to-screen mapping
- Labels are `<div>` elements in an overlay container (same pattern as existing tooltips)
- Each frame: project label world positions to screen, hide labels outside viewport
- Zoom-tier filtering: only create/show labels appropriate to current zoom
- CSS transitions for fade in/out between zoom tiers

**Label Style: Dark Text with Light Halo (Mystara Cartographic)**
- All three label tiers use dark (near-black) text with subtle light halo via `text-shadow`
- Kingdom labels: bold, all-caps or small-caps, 18-24px, serif
- Barony labels: regular weight, title case, 12-16px, serif
- Geographic feature labels: italic, 10-14px, serif
- Halo: `text-shadow` with 4-8 white shadows offset 1-2px in each direction

**Zoom Tiers Serve Player Intent**

| Zoom Tier | Player Intent | Labels Shown |
|-----------|--------------|-------------|
| Hero-local (1 region) | Planning movement, observing agents | Cities, villages, towns, POIs, current region name |
| Regional (multi-region) | Assessing a faction's kingdom, internal politics | Faction-linked POIs (guild cities, forts with armies), region/barony names |
| Continental | Grand strategy overview | Kingdom/province names, seats of power, faction centers only |
| Full world | Orientation | Kingdom names only (largest text) |

**Label Density: Graduated Reveal**
- `REGION_MAP_LABEL_MIN_SIZE` (30 hexes) still applies as floor
- Geographic feature labels only appear at regional zoom when player is "in" that area
- Barony/kingdom labels respect the graduated intent matrix

**Curved Text: Deferred**
- Flat centered text for all labels in Phase 4
- No path-following; place all labels at region centroid with horizontal text

### Design Doc Defaults (Using As-Is)

**Region Generation:**
- Border-cost watershed approach per Layer 6 of `Design/brainstorm-hexmap-v2.md`
- Upgrade existing `regionDetection.ts` flood-fill with border-cost splitting, size capping, natural boundary snapping
- Update `TERRAIN_TO_FEATURE` mapping for the new 27-type terrain list
- Constants: `REGION_TARGET_SIZE=120`, `REGION_MIN_SIZE=20`, `REGION_MAX_SIZE=200`
- Border costs: mountain=0.9, river=0.7, biome=0.4, coast=1.0, same-terrain=0.1

**Political Hierarchy:**
- Two tiers: kingdoms (groups of baronies) and baronies (groups of geographic regions)
- Political regions defined by travel-time from capital, not terrain type
- Boundaries follow geographic region boundaries
- Border geometry fixed at worldgen (dynamic borders deferred to V2/V3)
- Existing provinces from worldgen pass01 provide seed data

**River Labels (GRID-02):**
- Blue italic text along major rivers at regional zoom
- Implementation details left to researcher/planner

**Border Rendering:**
- Red polylines along hex edges: 3px kingdom borders, 1.5px barony borders
- Geographic features get NO border lines — text labels only (REGN-06)
- Continuous polyline per border segment (not per-hex), walked from boundary edges
- Capital markers: large red dot (6px) for kingdom capitals, small red dot (3px) for barony seats

### Deferred Ideas (OUT OF SCOPE)
- Curved text along elongated regions (mountain ranges, coastlines)
- Color-coded geographic labels (green for forests, blue for water)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| REGN-01 | Geographic regions auto-detected by flood-fill of similar terrain, bounded by natural features (mountains, rivers, coastline) | Existing `regionDetection.ts` flood-fill is the base; border-cost field drives natural boundaries |
| REGN-02 | Border cost field assigns weights to hex edges based on terrain difference, elevation change, rivers, mountains | Cost table defined in CONTEXT.md; computed per hex-pair using tile elevation + terrain + hasRiver + lakeIds |
| REGN-03 | Watershed segmentation from seed points with size capping (20-200 hexes per geographic region) | Priority-queue Dijkstra from seeds, stop at high-cost edges, merge undersized, split oversized |
| REGN-04 | Political regions group geographic regions under factions, defined by travel-time from capital | Province data in `WorldGenContext` (provinceIds, provinces[], capitalHexes) seeds political assignment |
| REGN-05 | Political borders rendered as red polylines along hex edges (3px kingdom, 1.5px barony) | Three.js `LineSegments` with `BufferGeometry`; walk boundary edges, collect shared edges where regionId differs |
| REGN-06 | Geographic features have NO border lines — text labels only | Skip `BorderMesh` for geographic region type; only political tier borders get mesh |
| REGN-07 | Region labels placed at centroids with hierarchy: kingdom (bold all-caps), barony (title case), geographic (italic) | HTML overlay `<div>`s positioned via `camera.project()`, styled via inline CSS per tier |
| REGN-08 | Label collision detection prevents overlapping labels | Axis-aligned bounding box (AABB) sweep in screen space after projection; hide lower-priority labels |
| REGN-09 | Capital markers rendered as red dots/icons at political region seats of power | `THREE.Points` or `THREE.Sprite` at capital hex world coords; 6px kingdom, 3px barony |
| GRID-02 | River labels (blue italic) along major rivers at regional zoom | Same HTML overlay system; label placed at midpoint of longest river path segment |
</phase_requirements>

---

## Summary

Phase 4 adds the region layer — geographic clustering, political grouping, border polylines, and a label overlay system — on top of the Three.js renderer built in Phases 1-3. The work divides into three natural modules: (1) engine work that detects and structures regions, (2) Three.js scene objects for border polylines and capital dots, and (3) a React HTML overlay for labels.

The region detection must be upgraded from the current simple flood-fill in `regionDetection.ts` to a weighted watershed approach. The existing code already has the right shape (flood-fill, RegionCluster, TERRAIN_TO_FEATURE) and only needs three additions: a border-cost edge weight function, size capping/merging logic, and political grouping on top of geographic output.

The label overlay follows the exact same `project()`-to-screen pattern already proven by `HexTooltip.tsx`. The main new concern is collision detection — at 80+ simultaneous labels, AABB deduplication in screen space is the correct lightweight approach. Border polylines use `THREE.LineSegments` at `RENDER_ORDER.BORDERS` (already scaffolded as layer 6).

**Primary recommendation:** Build in three sequential plans: (1) geographic region detection engine, (2) political grouping + border mesh + capital markers, (3) label overlay + collision detection + river labels. Each plan is independently testable.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| three | Already installed | `LineSegments` for border polylines, `Points`/`Sprite` for capitals | Project stack — no alternative |
| React | Already installed | HTML label overlay as `<div>` elements in overlay container | Project stack |
| vitest | Already installed | Unit tests for region detection algorithms | Project test framework |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| No new dependencies required | — | All needed primitives exist in Three.js + React | Phase 4 uses only existing installed packages |

**Installation:** No new packages needed.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── engine/
│   ├── regionDetection.ts          # UPGRADE: add border-cost watershed, size capping
│   ├── regionPolitical.ts          # NEW: group geographic regions into baronies/kingdoms
│   └── __tests__/
│       ├── regionDetection.test.ts # NEW: border-cost + watershed tests
│       └── regionPolitical.test.ts # NEW: political grouping tests
├── components/HexMapV2/
│   ├── scene/
│   │   ├── BorderMesh.ts           # NEW: political border polylines
│   │   └── CapitalMarkers.ts       # NEW: red dot markers at capital hexes
│   ├── overlay/
│   │   └── RegionLabelOverlay.tsx  # NEW: HTML label overlay component
│   └── HexMapV2.tsx               # UPDATE: accept RegionData prop, wire overlay + meshes
└── engine/hexGrid.ts              # UPDATE: add RegionData to WorldGenResult
```

### Pattern 1: Weighted Watershed Region Detection

**What:** Replace the simple same-feature flood-fill with a Dijkstra-style priority queue that respects edge border costs. Seeds are placed via province capital hexes (already available in `WorldGenContext.provinceCapitalHexes`). Expansion stops when cost threshold exceeded or size cap reached.

**When to use:** Called once per worldgen run, AFTER the full WorldGenPipeline (has terrain + rivers + lakes + provinces).

**Algorithm:**
```typescript
// Source: Design/brainstorm-hexmap-v2.md Layer 6 + CONTEXT.md
function detectRegionsBorderCost(
  tiles: HexTile[],
  riverPaths: RiverPath[],
  lakeIds: Int16Array,
  provinces: Province[],
  capitalHexes: HexCoord[],
  cols: number,
): RegionCluster[] {
  // 1. Build border cost field: for every hex-pair edge, compute cost [0,1]
  // 2. Priority-queue flood-fill from seed points (province capitals as seeds)
  // 3. Stop expanding into neighbor when edge cost > threshold
  // 4. Track cluster size; split clusters > REGION_MAX_SIZE along highest internal cost edges
  // 5. Merge clusters < REGION_MIN_SIZE into lowest-cost neighbor
  // 6. Return clusters with centroid, dominant terrain, featureType
}

function edgeBorderCost(a: HexTile, b: HexTile, hasRiverEdge: boolean): number {
  if (b.terrain === 'ocean' || b.terrain === 'deep_ocean') return 1.0; // coast
  if (isMountain(a.terrain) || isMountain(b.terrain)) return 0.9;       // mountain
  if (hasRiverEdge) return 0.7;                                          // river
  if (Math.abs(a.geoParams.elevation - b.geoParams.elevation) > 0.15) return 0.5; // elevation
  if (TERRAIN_TO_FEATURE[a.terrain] !== TERRAIN_TO_FEATURE[b.terrain]) return 0.4; // biome
  return 0.1;                                                             // same terrain
}
```

### Pattern 2: Political Region Grouping

**What:** Group geographic regions into political baronies and kingdoms based on proximity to province capitals. Travel-time (hex distance) from the capital determines assignment.

**When to use:** Runs after geographic region detection.

```typescript
// Source: CONTEXT.md Design Doc Defaults
interface BaronyRegion {
  id: number;
  cultureId: string | null;
  capitalHex: HexCoord;
  geographicRegionIds: number[];  // child geographic regions
  hexes: HexCoord[];
  centroid: { col: number; row: number };
}

interface KingdomRegion {
  id: number;
  cultureId: string | null;
  capitalHex: HexCoord;
  baronyIds: number[];            // child baronies
  centroid: { col: number; row: number };
}
```

### Pattern 3: Border Edge Walking

**What:** Walk all hex pairs in the grid. For each pair of adjacent hexes that belong to different political regions, collect the shared edge as two world-space vertices. Merge these into a single `BufferGeometry` for `THREE.LineSegments`.

**When to use:** Once at worldgen time; geometry is static.

```typescript
// Source: Established Three.js pattern for polyline borders
function buildBorderGeometry(
  tiles: HexTile[],
  baronies: BaronyRegion[],
  kingdoms: KingdomRegion[],
  hexSize: number,
): { kingdomGeo: THREE.BufferGeometry; baronyGeo: THREE.BufferGeometry } {
  // For each tile, check 3 of 6 neighbors (avoid double-counting)
  // If neighbor is different kingdom: add to kingdom edges array
  // Else if neighbor is different barony: add to barony edges array
  // hexEdgeVertices(a, b, hexSize) returns [v0x, v0y, v1x, v1y] for the shared edge
}
```

**Hex edge vertices for flat-top odd-q:** The shared edge between two adjacent hexes is the pair of hex vertices that both hexes share. For flat-top hexes, vertices are at angles `60°*i` from center. The shared edge between hex A and its neighbor in direction `d` is vertex `d` and vertex `(d+1)%6` of hex A.

### Pattern 4: HTML Label Overlay (same as HexTooltip)

**What:** A React component renders one `<div>` per visible label. On each animation frame (or zoom change), world-space centroid positions are projected to screen via `camera.project()`, and labels are repositioned absolutely. Labels outside the viewport are hidden via `display: none`.

**When to use:** Always-on overlay, updated every frame during pan/zoom, culled by viewport bounds.

```typescript
// Source: HexMapV2/interaction/HexTooltip.tsx — existing proven pattern
// camera.project() converts world Vector3 to NDC; then:
// screenX = (ndc.x + 1) / 2 * canvasWidth
// screenY = (1 - ndc.y) / 2 * canvasHeight
// Same pattern used by HexTooltip, RegionLabels.tsx in old HexMap

interface RegionLabel {
  id: string;
  tier: 'kingdom' | 'barony' | 'geographic' | 'river';
  text: string;
  worldX: number;  // centroid in Three.js world coords
  worldY: number;
  minZoomTier: ZoomTier;
  maxZoomTier: ZoomTier;
}
```

### Pattern 5: Label Collision Detection (AABB Sweep)

**What:** After projecting all labels to screen space, sort by priority (kingdom > barony > geographic), then for each label test against all previously placed labels. If AABB overlaps, mark as hidden.

**When to use:** Recomputed whenever zoom changes or camera moves significantly. Debounce to 60ms to avoid per-frame recomputation.

```typescript
// Source: Standard 2D label placement technique, widely used in map rendering
interface ScreenBBox { left: number; top: number; right: number; bottom: number; }

function removeOverlaps(labels: ScreenLabel[]): ScreenLabel[] {
  const placed: ScreenBBox[] = [];
  return labels.map(label => {
    const bbox = estimateBBox(label); // uses font-size estimate for width/height
    const overlaps = placed.some(p => intersects(bbox, p));
    if (!overlaps) { placed.push(bbox); return { ...label, visible: true }; }
    return { ...label, visible: false };
  });
}
```

### Pattern 6: Capital Marker Dots

**What:** `THREE.Points` with a `THREE.PointsMaterial` at `RENDER_ORDER.LOCATIONS` (8). Two sizes: 6px for kingdoms, 3px for baronies. Color: `#C83030`.

```typescript
// Source: Three.js docs — Points primitive
const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
const mat = new THREE.PointsMaterial({ color: 0xC83030, size: 6, sizeAttenuation: false });
const points = new THREE.Points(geo, mat);
points.renderOrder = RENDER_ORDER.LOCATIONS;
```

**Note:** `sizeAttenuation: false` makes the dot size in pixels, not world units — stays constant size regardless of zoom, which is the desired behavior for capital markers.

### Anti-Patterns to Avoid

- **Per-hex LineLoop for borders:** Creates one geometry object per hex. At 60K hexes, this is 60K draw calls. Use a single `LineSegments` with all border edges merged into one `BufferGeometry`.
- **Recomputing border geometry every frame:** Border geometry is static (fixed at worldgen). Compute once, store in ref. Only recompute when worldgen seed changes.
- **CSS `z-index` collision with Three.js canvas:** The label overlay `<div>` container must use `position: absolute; inset: 0; pointer-events: none` within the same container as the canvas. `z-index: 20` places it above the canvas.
- **Projecting all 60K hex centroids every frame:** Only project label centroids (max ~80-100). Not every hex.
- **Font not loaded before first render:** Use the project's existing CSS variable `--font-display` (Alegreya) for serif labels — already loaded via `index.css`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| World-to-screen projection | Custom matrix math | `camera.project(worldPos)` then NDC→pixel conversion | Three.js OrthographicCamera already owns this transform |
| Font halo/outline effect | Canvas rendering or SVG text | CSS `text-shadow` with multiple offsets | 4-8 shadows at 1-2px = crisp halo, zero canvas overhead |
| Hex vertex positions for edge walking | Recompute from angle formula | Use `hexToPixel()` + known vertex angles for flat-top | `hexMath.ts` already has the coordinate system |
| Priority queue for watershed | Array sort each step | Use a binary min-heap or array with `.sort()` on small grids | At 60K hexes Dijkstra with O(n log n) is needed; array sort is O(n²) at scale — use proper priority queue |

**Key insight:** The DOM/CSS layer handles typography (font loading, halo, kerning, text direction) far better than any canvas or WebGL text approach. Lean into this — HTML labels are the right tool for this density.

---

## Common Pitfalls

### Pitfall 1: `linewidth` > 1 Silently Clamps to 1px on WebGL

**What goes wrong:** `THREE.LineBasicMaterial({ linewidth: 3 })` renders as 1px on all WebGL2 contexts (the default). The 3px kingdom / 1.5px barony line widths specified in requirements will appear as 1px.

**Why it happens:** WebGL's `gl.lineWidth()` is capped to 1 on most GPU drivers (Chrome/WebGL2). Three.js `linewidth` property only works in WebGL1 with the ANGLE extension on some platforms.

**How to avoid:** Use `THREE.MeshBasicMaterial` with quad-strip geometry for lines (same technique as `RiverMesh.ts` which already solved this). Build a thin rectangle mesh for each border edge: two triangles spanning the edge, width set in world units.

**Warning signs:** If kingdom borders look identical thickness to barony borders, or if lines all appear 1px, the `linewidth` cap has hit.

**Confirmed pattern from codebase:** `RiverMesh.ts` line 13-16 shows the project already solved this for rivers — use the same quad-strip approach. `HexMapV2.tsx` also notes: "linewidth > 1 only works in WebGL1 with the ANGLE extension on some platforms."

### Pitfall 2: Odd-Q Offset Grid Neighbor Direction Error

**What goes wrong:** Using a fixed direction table for hex neighbors without accounting for column parity. Adjacent hex vertex calculation breaks for odd columns.

**Why it happens:** The grid is flat-top odd-q offset. Neighbor offsets for `col % 2 === 0` differ from `col % 2 === 1`. `hexMath.ts` already handles this correctly in `hexNeighbors()`.

**How to avoid:** Always call `hexNeighbors(hex)` from `hexMath.ts` for neighbor traversal. Never hardcode direction offsets without parity check.

**Warning signs:** Border segments appear offset by half a hex height on odd columns.

### Pitfall 3: Label Position Jitter During Pan/Zoom

**What goes wrong:** Labels flicker or jump when the camera moves if positions are recalculated at inconsistent times (e.g., after React re-render but before Three.js frame).

**Why it happens:** The label overlay updates on React state changes, but Three.js renders imperatively via `requestAnimationFrame`. If label projection runs at different times than canvas render, they're temporarily out of sync.

**How to avoid:** Update label positions in the same `requestAnimationFrame` callback as Three.js scene rendering. Store projected positions in a ref, then trigger a React state update with `useState` only after the frame completes. Or use a CSS `transform` approach: update label container `translate` synchronously in the RAF callback without React state.

**Warning signs:** Labels appear to "lag" 1-2 frames behind camera movement.

### Pitfall 4: Border Geometry Coordinates in Wrong Space

**What goes wrong:** Border polylines render at wrong positions because hex vertices are computed in world space but the camera frustum has a different scale.

**Why it happens:** `hexToPixel()` uses `HEX_CONSTANTS.HEX_SIZE = 10` as the base unit. Three.js world units = pixels at zoom 1. If border vertex positions use a different size multiplier, lines appear misaligned with the hex fill mesh.

**How to avoid:** Always use `HEX_CONSTANTS.HEX_SIZE` (imported from `HexFillMesh.ts`) when computing any world-space positions for the Three.js scene. Same size used by `HexFillMesh`, `RiverMesh`, `ElevationTicks`, `CoastlineMesh`.

**Warning signs:** Border lines offset from actual hex edges; drift worsens at high zoom.

### Pitfall 5: TERRAIN_TO_FEATURE Misses New 27-Type Terrain List

**What goes wrong:** Region flood-fill assigns no feature type to hexes with terrain types added in Phase 2 (27-type system), causing them to be silently skipped — creating holes in coverage.

**Why it happens:** The existing `TERRAIN_TO_FEATURE` in `regionDetection.ts` was written for the old terrain list. It includes stale entries (`jungle`, `evergreen_forest`, `light_forest`, `great_home_trees`, `farmland`, `arctic`, `tropical_ocean`) and misses some Phase 2 types (`woodland`, `plateau`, `sand_desert`, `sand_dunes`, `hardened_clay`, `lava`, `broken_lands`).

**How to avoid:** Audit `TERRAIN_TO_FEATURE` against `src/types/index.ts` `TerrainType` union before starting. Add all missing terrain types. Remove stale entries. Write a test that asserts `TERRAIN_TO_FEATURE` has an entry for every non-ocean terrain type.

**Warning signs:** Large patches of terrain produce no regions; map has visible "unclaimed" zones.

### Pitfall 6: Centroid Outside Region Boundary

**What goes wrong:** The computed centroid (arithmetic mean of hex col/row) may fall outside the region's actual hexes for concave or C-shaped regions. A label placed at this position floats over different terrain.

**Why it happens:** Simple centroid averaging doesn't account for concave shapes. A horseshoe-shaped mountain range has its centroid in the interior gap.

**How to avoid:** After computing centroid, snap it to the nearest hex that is actually in the region. This is the "pole of inaccessibility" approximation — cheap enough for offline worldgen.

**Warning signs:** Labels appear floating over sea or a different region's territory.

---

## Code Examples

Verified patterns from existing codebase:

### World-to-Screen Projection (from HexTooltip.tsx pattern)

```typescript
// Source: src/components/HexMapV2/interaction/HexRaycaster.ts (worldToScreen function)
// and src/components/HexMapV2/interaction/HexTooltip.tsx (usage pattern)
function projectToScreen(
  worldX: number, worldY: number,
  camera: THREE.OrthographicCamera,
  canvasWidth: number, canvasHeight: number,
): { sx: number; sy: number } {
  const vec = new THREE.Vector3(worldX, worldY, 0);
  vec.project(camera);  // NDC: [-1,1] x [-1,1]
  const sx = (vec.x + 1) / 2 * canvasWidth;
  const sy = (1 - vec.y) / 2 * canvasHeight;
  return { sx, sy };
}
```

### Hex Vertex Positions for Edge Walking (flat-top)

```typescript
// Source: src/lib/hexMath.ts + src/components/HexMapV2/scene/HexFillMesh.ts
// Flat-top hex: vertex i is at angle 60°*i from center
// Vertices: 0=right, 1=upper-right, 2=upper-left, 3=left, 4=lower-left, 5=lower-right
const HEX_SIZE = HEX_CONSTANTS.HEX_SIZE;

function hexVertices(worldX: number, worldY: number): [number, number][] {
  const verts: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i);
    verts.push([worldX + HEX_SIZE * Math.cos(angle), worldY + HEX_SIZE * Math.sin(angle)]);
  }
  return verts;
}

// Direction d (0-5) from hexNeighbors maps to edge between vertex d and (d+1)%6
// Edge shared with neighbor in direction d = [vertex[d], vertex[(d+1)%6]]
```

### Quad-Strip Line (from RiverMesh.ts pattern)

```typescript
// Source: src/components/HexMapV2/scene/RiverMesh.ts
// Build a thick line as two triangles (quad strip) to work around WebGL linewidth cap
function buildThickEdge(
  x0: number, y0: number,
  x1: number, y1: number,
  halfWidth: number,
  positions: number[],
): void {
  const dx = x1 - x0, dy = y1 - y0;
  const len = Math.sqrt(dx*dx + dy*dy);
  if (len === 0) return;
  const nx = -dy / len * halfWidth;  // perpendicular normal
  const ny =  dx / len * halfWidth;
  // Two triangles:
  positions.push(x0+nx, y0+ny, BORDER_Z,  x0-nx, y0-ny, BORDER_Z,  x1+nx, y1+ny, BORDER_Z);
  positions.push(x0-nx, y0-ny, BORDER_Z,  x1-nx, y1-ny, BORDER_Z,  x1+nx, y1+ny, BORDER_Z);
}
```

### CSS Label Halo

```typescript
// Source: CONTEXT.md locked decision — Mystara cartographic style
const KINGDOM_LABEL_STYLE = {
  fontFamily: 'var(--font-display)',  // Alegreya — already loaded
  fontSize: '20px',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  color: '#1a1410',
  textShadow: [
    '1px 0 0 rgba(240,235,220,0.9)',
    '-1px 0 0 rgba(240,235,220,0.9)',
    '0 1px 0 rgba(240,235,220,0.9)',
    '0 -1px 0 rgba(240,235,220,0.9)',
    '2px 0 0 rgba(240,235,220,0.6)',
    '-2px 0 0 rgba(240,235,220,0.6)',
  ].join(', '),
  pointerEvents: 'none' as const,
};
```

### RegionData Threading (WorldGenResult extension)

```typescript
// Source: src/engine/hexGrid.ts pattern — add to WorldGenResult alongside riverPaths/lakeIds
export interface RegionData {
  geographicRegions: RegionCluster[];   // upgraded from detectRegions()
  baronies: BaronyRegion[];
  kingdoms: KingdomRegion[];
  // hex → regionId lookup (for border walking)
  hexRegionId: Map<string, number>;     // "col,row" -> geographic region id
  hexBaronyId: Map<string, number>;     // "col,row" -> barony id
  hexKingdomId: Map<string, number>;    // "col,row" -> kingdom id
}

// WorldGenResult gains:
// regionData: RegionData  (computed after worldgen pipeline, before returning)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Simple flood-fill by terrain feature match | Weighted watershed with border-cost field | Phase 4 upgrade | Regions respect rivers, mountains, coastlines as natural borders |
| `RegionLabels.tsx` in old SVG map | HTML overlay on Three.js canvas via `project()` | Phase 4 | Consistent with HexTooltip pattern, full CSS control |
| `linewidth` for border width | Quad-strip `MeshBasicMaterial` | Phase 4 (inheriting Phase 3 river solution) | Actual visible thickness across all platforms |

**Deprecated/outdated:**
- Old `detectRegions()` signature (no border cost, no size capping, no political grouping) — superseded in Phase 4 but file is kept and upgraded in-place per NFP #6 (additive over destructive)
- Stale terrain entries in `TERRAIN_TO_FEATURE` (`jungle`, `evergreen_forest`, `light_forest`, `great_home_trees`, `farmland`, `arctic`, `tropical_ocean`) — must be audited and corrected

---

## Open Questions

1. **River-to-label assignment for GRID-02**
   - What we know: `riverPaths` are arrays of `HexCoord[]` in `WorldGenResult`; each river has a source and mouth
   - What's unclear: Rivers have no names yet (naming system not built). What label text do we use?
   - Recommendation: Generate placeholder names at worldgen time using a seeded adjective+noun pattern (e.g., `mulberry32(seed + riverIndex)` → pick from a small name list). Store in `RegionData`. Full name generation is deferred to content systems.

2. **Province-to-kingdom cardinality**
   - What we know: `WorldGenContext.provinces` gives province seeds; `provinceCapitalHexes` marks their centers
   - What's unclear: How many provinces become kingdoms vs. baronies? The design says kingdoms group baronies — but does one province = one kingdom, or do we cluster provinces?
   - Recommendation: One province = one barony. Kingdoms are formed by clustering baronies with the same `cultureId`. Wilderness provinces (cultureId null) form independent baronies with no kingdom parent.

3. **Performance of AABB collision detection at 80 labels**
   - What we know: O(n²) pairwise AABB at n=80 is 6,400 comparisons — trivially fast
   - What's unclear: At continental zoom with all kingdom labels visible, could label count exceed 80?
   - Recommendation: Cap total labels at 100 max per `REGION_MAP_LABEL_MIN_SIZE`. 100² = 10,000 comparisons at 60fps is still <1ms.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest (already installed, configured) |
| Config file | `vite.config.ts` (vitest block) |
| Quick run command | `npm test -- --reporter=verbose src/engine/__tests__/regionDetection.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REGN-01 | Flood-fill produces contiguous region clusters | unit | `npm test -- regionDetection` | ❌ Wave 0 |
| REGN-02 | Border cost function returns correct weights for each edge case | unit | `npm test -- regionDetection` | ❌ Wave 0 |
| REGN-03 | Watershed produces clusters within 20-200 hex size bounds | unit | `npm test -- regionDetection` | ❌ Wave 0 |
| REGN-04 | Political grouping assigns every land hex to a barony | unit | `npm test -- regionPolitical` | ❌ Wave 0 |
| REGN-05 | Border edge walking collects correct edges for a 3x3 test grid | unit | `npm test -- BorderMesh` | ❌ Wave 0 |
| REGN-06 | Geographic regions produce no border geometry entries | unit | `npm test -- BorderMesh` | ❌ Wave 0 |
| REGN-07 | Label tiers apply correct CSS style per tier | unit | `npm test -- RegionLabelOverlay` | ❌ Wave 0 |
| REGN-08 | AABB collision detection hides lower-priority overlapping label | unit | `npm test -- RegionLabelOverlay` | ❌ Wave 0 |
| REGN-09 | Capital markers created at province capitalHex world positions | unit | `npm test -- CapitalMarkers` | ❌ Wave 0 |
| GRID-02 | River label placed at midpoint of longest river path | unit | `npm test -- RegionLabelOverlay` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test -- --reporter=dot src/engine/__tests__/regionDetection.test.ts src/engine/__tests__/regionPolitical.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/engine/__tests__/regionDetection.test.ts` — covers REGN-01, REGN-02, REGN-03 (border cost function, watershed size bounds)
- [ ] `src/engine/__tests__/regionPolitical.test.ts` — covers REGN-04 (every land hex assigned to barony)
- [ ] `src/components/HexMapV2/scene/__tests__/BorderMesh.test.ts` — covers REGN-05, REGN-06 (edge walking, geographic skip)
- [ ] `src/components/HexMapV2/overlay/__tests__/RegionLabelOverlay.test.tsx` — covers REGN-07, REGN-08, GRID-02
- [ ] `src/components/HexMapV2/scene/__tests__/CapitalMarkers.test.ts` — covers REGN-09

---

## Sources

### Primary (HIGH confidence)

- `src/engine/regionDetection.ts` — existing flood-fill implementation, `RegionCluster` interface, `TERRAIN_TO_FEATURE`, `FEATURE_MIN_SIZE`
- `src/engine/worldgen/types.ts` — `WorldGenContext.provinces`, `provinceCapitalHexes`, `Province` interface
- `src/engine/hexGrid.ts` — `WorldGenResult` interface shape (pattern for adding `regionData`)
- `src/components/HexMapV2/scene/RiverMesh.ts` — quad-strip line pattern for thick borders
- `src/components/HexMapV2/interaction/HexTooltip.tsx` — `project()`-to-screen label positioning pattern
- `src/components/HexMapV2/scene/RenderLayers.ts` — `RENDER_ORDER.BORDERS = 6`, `RENDER_ORDER.LABELS = 11`, `RENDER_ORDER.LOCATIONS = 8`
- `src/lib/hexMath.ts` — `hexNeighbors()`, `hexToPixel()`, flat-top odd-q coordinate system
- `Design/brainstorm-hexmap-v2.md` Layer 6 — border cost table, algorithm steps, constants table
- `.planning/phases/04-regions-borders/04-CONTEXT.md` — all locked decisions

### Secondary (MEDIUM confidence)

- Three.js `THREE.Points` / `PointsMaterial` docs — `sizeAttenuation: false` for pixel-size dots — verified against Three.js API (Points primitive is standard, sizeAttenuation is well-documented)
- AABB label collision — standard technique verified in multiple map rendering libraries (Mapbox GL JS uses this exact approach)

### Tertiary (LOW confidence)

- River name placeholder generation approach — no official source; recommendation based on existing mulberry32 PRNG pattern in codebase

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; all libraries already in project
- Architecture: HIGH — patterns directly derived from existing proven code in `RiverMesh.ts`, `HexTooltip.tsx`, `hexMath.ts`
- Pitfalls: HIGH — `linewidth` cap and odd-q neighbor issue directly verified from codebase comments and existing workarounds
- Test map: HIGH — test framework and patterns verified from 90+ existing test files

**Research date:** 2026-03-22
**Valid until:** 2026-06-22 (stable stack — Three.js, React, vitest versions unlikely to change)
