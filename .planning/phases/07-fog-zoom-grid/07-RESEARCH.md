# Phase 7: Fog, Zoom & Grid - Research

**Researched:** 2026-03-22
**Domain:** Three.js InstancedMesh culling, d3-zoom tier transitions, hex pathfinding road rendering
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Fog reveal behavior:** Instant flip — hex immediately shows terrain when agent LOS reaches it. No fade animation, no radial wave.
- **Remembered hexes:** Render at full color with all static layers (terrain, signifiers, locations, labels) — NO agents or events. No desaturation, no sepia tint.
- **Fog boundary:** Hard boundary between explored and unexplored — no soft fringe, no gradient. Matches TERR-04 hard-edge terrain style.
- **Fog default:** Off by default (`?fog` enables). No change to default in this phase — Phase 8 integration decides final default.
- **Unexplored fill:** Solid dark fill (`#0a0a0c`) with NO terrain detail leaking through.
- **Zoom tiers:** 4 tiers with ~20% overlap fade range (hero-local ~300px/hex, regional ~100px, continental ~30px, full-world ~10px).
- **Visibility matrix:** Controls which render layers appear at each tier. Elements below threshold are not rendered (performance skip, not just transparency).
- **Road generation:** Pathfinding between settlements using `hexMovementPath.ts` infrastructure.
- **Bridge icons:** Where roads cross rivers.
- **Follow mode:** Camera auto-follows selected agent during movement, toggleable. `centerOn` API already exists.

### Claude's Discretion
- Zoom tier transition feel (smooth continuous vs snap-to-tier)
- Fade timing and easing for layer visibility changes
- Road rendering style details (color, width, dash patterns)
- Follow mode break-out gesture (click to stop? toggle button?)
- Bridge icon design
- Unexplored hex fill implementation (InstancedMesh color override vs overlay mesh)

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FOG-01 | Unexplored hexes render as solid dark fill only — no terrain, signifiers, icons, or grid lines | InstancedMesh setColorAt override pattern + per-hex culling gate |
| FOG-02 | Explored hexes render at full color with all static layers — NO agents or events | Visibility gate in zoom.labels event handler + AgentSpriteMesh.spriteMap per-hex skip |
| FOG-03 | Visible hexes render everything including dynamic content | Default full-render path unchanged |
| FOG-04 | Default sight range = 0 (own hex only). Elevated +1. Magic adds variable range. | `AVATAR_SIGHT_RANGE=0` already defined in `visibility.ts` |
| FOG-05 | Fog as per-hex culling, not post-process overlay | InstancedMesh color override + group.visible skip pattern |
| FOG-06 | Reveal animation: unexplored->explored ~300ms fade-in, visible->explored ~500ms dim-out | NOTE: CONTEXT.md locked "instant flip" for reveal. FOG-06 fade-out from visible->explored still applies per CONTEXT |
| ZOOM-01 | Four zoom tiers: hero-local (~300px/hex), regional (~100px), continental (~30px), full-world (~10px) | Existing d3-zoom k-values: full-world <1.5, continental <5, regional <15, hero-local >=15 |
| ZOOM-02 | Unified visibility matrix controls which render layers appear at each zoom tier | zoom.on('zoom.labels') pattern already established — extend with matrix |
| ZOOM-03 | Smooth fade transitions between zoom tiers (~20% overlap, no hard pop-in/out) | SpriteMaterial.opacity lerp in render loop or discrete fade state machine |
| ZOOM-04 | Elements below threshold not rendered (not just transparent) — performance skip | group.visible = false pattern already in use |
| ZOOM-05 | Default camera: centered on player's primary retinue agent, hero-local zoom | `animateCameraTo()` + `centerOn()` API already exist |
| ZOOM-06 | Follow mode: camera auto-follows selected agent during movement (toggleable) | `centerOn()` called on agent position update; follow toggle in HexMapV2 props or ref |
| GRID-03 | Road network connecting settlements via pathfinding (solid major, dotted trails) | `hexMovementPath.ts` + `findHexPath()` A* already implemented; RiverMesh quad-strip pattern reusable |
| GRID-04 | Bridge icons where roads cross rivers | River path intersection detection + sprite overlay at crossing point |
</phase_requirements>

---

## Summary

Phase 7 is the last rendering phase before integration. It adds three orthogonal systems to HexMapV2: (1) fog-of-war per-hex visibility culling, (2) a unified zoom LOD visibility matrix with smooth fade transitions, and (3) a road network connecting settlements with bridge icons at river crossings.

All three systems build directly on infrastructure established in prior phases. The fog system reuses the already-typed `VisibilityMap` / `HexVisibilityState` from `src/types/visibility.ts` and the InstancedMesh `setColorAt` pattern from `HexFillMesh.ts`. The zoom system extends the existing `zoom.on('zoom.labels')` event handler that already drives signifier and location group visibility. The road system reuses the quad-strip geometry pattern from `RiverMesh.ts` and the A* pathfinding from `hexMovementPath.ts`/`pathfinding.ts`.

The user locked all key design decisions: instant fog reveals (no animation for unexplored→explored transition), full-color remembered hexes, hard fog boundaries, fog off by default. The only animation that remains from FOG-06 is the visible→explored dim-out (~500ms) when an agent leaves a hex — the unexplored→explored transition is instant.

**Primary recommendation:** Implement fog as InstancedMesh color override for the unexplored fill (overwrite instance color to `#0a0a0c`), add a per-hex visibility gate to the zoom.labels handler to skip signifier/location/agent group contributions for non-visible hexes, extend the zoom handler with the full visibility matrix, and generate road geometry once at scene init using hexMovementPath pathfinding between all settlements.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| three | Already installed | InstancedMesh color override, Group.visible toggling, SpriteMaterial.opacity | All prior phases use raw Three.js |
| d3-zoom | Already installed | Zoom event handler already drives all tier switching | Established in Phase 1 |
| vitest | Already installed | TDD test pattern used across all phases | Project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| hexMath (internal) | — | `hexToPixel`, `hexNeighbors` for road routing and bridge detection | Road geometry + river crossing detection |
| pathfinding (internal) | — | `findHexPath` A* for road routes between settlements | GRID-03 road generation |
| hexMovementPath (internal) | — | `buildHexMovementPath`, terrain cost lookup | Road pathfinding |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| InstancedMesh color override for fog | Separate fog overlay InstancedMesh | Overlay mesh is simpler to reason about but adds a draw call. Color override avoids extra geometry entirely for unexplored hexes |
| SpriteMaterial opacity for fade | Three.js AnimationMixer | AnimationMixer is heavyweight for simple opacity tweens; manual lerp in render loop is simpler and follows project patterns |
| Discrete fade state machine | CSS transitions on HTML overlay | CSS can't drive Three.js opacity; state machine in render loop is consistent with agent animation approach |

**Installation:** No new packages required. All dependencies are already installed.

---

## Architecture Patterns

### Recommended Project Structure
```
src/components/HexMapV2/
├── scene/
│   ├── FogMesh.ts           # NEW: fog overlay or color-override implementation
│   ├── RoadMesh.ts          # NEW: road quad-strip geometry (mirrors RiverMesh.ts)
│   ├── ZoomVisibilityMatrix.ts  # NEW: unified visibility matrix constants + update fn
│   └── __tests__/
│       ├── FogMesh.test.ts      # NEW
│       ├── RoadMesh.test.ts     # NEW
│       └── ZoomVisibilityMatrix.test.ts  # NEW
├── camera/
│   └── FollowMode.ts        # NEW: follow-mode toggle + centerOn integration
└── HexMapV2.tsx             # MODIFIED: wire fog prop, zoom matrix, follow mode
```

### Pattern 1: Fog as InstancedMesh Color Override
**What:** When fog is enabled, iterate visible instances and override `setColorAt` for unexplored hexes with `#0a0a0c`. Store original colors in a parallel Float32Array so they can be restored on reveal.

**When to use:** Unexplored hex fill. Avoids a second draw call. Color is swapped once on fog state change, not per-frame.

```typescript
// Source: HexFillMesh.ts setColorAt pattern
const FOG_UNEXPLORED_COLOR = new THREE.Color('#0a0a0c');

export function applyFogToFillMesh(
  fillMesh: THREE.InstancedMesh,
  tileIndex: number,      // index into tiles array
  state: HexVisibilityState,
  originalColor: THREE.Color, // cached from getHexColor at init
): void {
  if (state === 'unexplored') {
    fillMesh.setColorAt(tileIndex, FOG_UNEXPLORED_COLOR);
  } else {
    fillMesh.setColorAt(tileIndex, originalColor);
  }
  // Caller must set fillMesh.instanceColor!.needsUpdate = true after batch
}
```

**Performance note:** `instanceColor.needsUpdate = true` uploads the entire color buffer to GPU. For reveal events (rare, ~1-3 hexes at a time), this is fine. Do NOT set needsUpdate every frame unless colors changed.

### Pattern 2: Per-Hex Layer Culling Gate
**What:** Before rendering/updating per-hex dynamic layers (agents, events), check the visibility state. For unexplored hexes, skip ALL layers. For explored hexes, skip agents and events only.

**When to use:** Extends the existing `zoom.on('zoom.labels')` handler.

```typescript
// Source: HexMapV2.tsx zoom.on('zoom.labels') pattern
function isLayerVisibleForHex(
  state: HexVisibilityState,
  layer: 'terrain' | 'signifier' | 'location' | 'agent' | 'event',
): boolean {
  if (state === 'unexplored') return layer === 'terrain'; // only dark fill
  if (state === 'remembered') return layer !== 'agent' && layer !== 'event';
  return true; // 'visible' — render everything
}
```

**Agent filtering:** The agent sprite group is built per-hex. For fog filtering, either (a) rebuild the group excluding unexplored/remembered hex agents, or (b) set per-sprite visibility by walking `spriteMap` entries and checking hex key against the visibility map. Option (b) is simpler and avoids rebuilding geometry.

### Pattern 3: Unified Zoom Visibility Matrix
**What:** A declarative table mapping (render layer, zoom tier) → visibility. The zoom handler reads this table to drive `group.visible` and sprite opacity.

**When to use:** Replace the scattered per-group threshold checks with a single source of truth.

```typescript
// Source: Design/brainstorm-hexmap-v2.md Layer 15
export const ZOOM_TIER_THRESHOLDS = {
  HERO_LOCAL:  15,   // k >= 15  (~300px/hex)
  REGIONAL:     5,   // k >= 5   (~100px/hex)
  CONTINENTAL:  1.5, // k >= 1.5 (~30px/hex)
  FULL_WORLD:   0,   // k < 1.5  (~10px/hex)
} as const;

export type ZoomTier = 'hero-local' | 'regional' | 'continental' | 'full-world';

export function getZoomTier(k: number): ZoomTier {
  if (k >= ZOOM_TIER_THRESHOLDS.HERO_LOCAL)  return 'hero-local';
  if (k >= ZOOM_TIER_THRESHOLDS.REGIONAL)    return 'regional';
  if (k >= ZOOM_TIER_THRESHOLDS.CONTINENTAL) return 'continental';
  return 'full-world';
}

// Visibility matrix: layer -> tier -> visible
export const ZOOM_VISIBILITY_MATRIX: Record<string, Record<ZoomTier, boolean>> = {
  signifiers:      { 'hero-local': true,  regional: true,  continental: false, 'full-world': false },
  locations:       { 'hero-local': true,  regional: true,  continental: false, 'full-world': false },
  agents_portrait: { 'hero-local': true,  regional: false, continental: false, 'full-world': false },
  agents_dot:      { 'hero-local': false, regional: true,  continental: false, 'full-world': false },
  agents_cont:     { 'hero-local': false, regional: false, continental: true,  'full-world': false },
  elev_ticks:      { 'hero-local': true,  regional: true,  continental: false, 'full-world': false },
  rivers:          { 'hero-local': true,  regional: true,  continental: true,  'full-world': false },
  roads:           { 'hero-local': true,  regional: true,  continental: true,  'full-world': false },
  grid_lines:      { 'hero-local': true,  regional: true,  continental: true,  'full-world': false },
  borders_kingdom: { 'hero-local': true,  regional: true,  continental: true,  'full-world': true  },
  borders_barony:  { 'hero-local': true,  regional: true,  continental: true,  'full-world': false },
  trails:          { 'hero-local': true,  regional: true,  continental: false, 'full-world': false },
} as const;
```

**Fade transitions:** For the ~20% overlap range, use a `getFadeAlpha(k, threshold, fadeRange)` helper that returns 0.0–1.0. Apply to `SpriteMaterial.opacity` for groups that support it. Groups with `group.visible = false` skip rendering entirely (no GPU cost).

### Pattern 4: Road Mesh (RiverMesh Pattern)
**What:** Road geometry mirrors `RiverMesh.ts` — a merged `THREE.Mesh` from quad-strip geometry along hex paths. Two geometry passes: one for solid major roads, one for dotted/dashed trails.

**When to use:** GRID-03 road network.

```typescript
// Source: RiverMesh.ts — buildQuadStripGeometry + merged geometry pattern
// Roads use same buildQuadStripGeometry, different width constants:
const ROAD_MAJOR_HALF_WIDTH = 0.4;   // world units
const ROAD_TRAIL_HALF_WIDTH = 0.2;
const ROAD_Z_OFFSET = 0.025;         // above rivers (0.03) is wrong — roads go UNDER rivers
// NOTE: ROADS render order = 5, RIVERS = 4. Roads sit below rivers in render order.
// Z = 0.025 places roads between coastline (0.01) and rivers (0.03) — intentional.

// For dotted/dashed trails: Use a custom shader or LineDashedMaterial.
// THREE.LineDashedMaterial supports dashSize/gapSize for dashed roads.
// But WebGL linewidth limitation applies (1px cap). Use quad-strip for width.
// Dashed quad strips: generate geometry with gaps (skip alternate segments).
```

**Bridge detection:** Iterate all road paths. For each road hex edge, check if a river path passes through the same hex pair. If yes, place a bridge sprite at the midpoint of that edge.

```typescript
// Bridge detection pattern
function findRiverCrossings(
  roadHexPairs: Array<[HexCoord, HexCoord]>,
  riverPaths: RiverPath[],
): Array<{ from: HexCoord; to: HexCoord; worldMidpoint: Point2D }> {
  const riverEdges = new Set<string>();
  for (const rp of riverPaths) {
    for (let i = 0; i < rp.hexes.length - 1; i++) {
      const a = rp.hexes[i], b = rp.hexes[i + 1];
      riverEdges.add(`${Math.min(a.col,b.col)},${Math.min(a.row,b.row)}-${Math.max(a.col,b.col)},${Math.max(a.row,b.row)}`);
    }
  }
  // Check each road pair against river edges
  return roadHexPairs.filter(([a, b]) => {
    const key = `${Math.min(a.col,b.col)},${Math.min(a.row,b.row)}-${Math.max(a.col,b.col)},${Math.max(a.row,b.row)}`;
    return riverEdges.has(key);
  }).map(([a, b]) => ({
    from: a, to: b,
    worldMidpoint: midpoint(hexToPixel(a, HEX_SIZE), hexToPixel(b, HEX_SIZE)),
  }));
}
```

### Pattern 5: Follow Mode
**What:** A ref-stored boolean `followMode` + a ref to the followed agent ID. After each agent position update in the `useEffect([agents, seed])` block, if follow mode is on and the followed agent moved, call `animateCameraTo` to the new position.

**When to use:** ZOOM-06.

```typescript
// Pattern: extend HexMapV2Handle or add prop
export interface HexMapV2Handle {
  centerOn: (x: number, y: number, scale?: number) => void;
  setFollowAgent: (agentId: string | null) => void; // NEW: null = disable follow mode
}
```

**Follow break-out recommendation:** Click anywhere on the canvas to break follow mode. This is the most natural gesture — if the user is panning manually, they've implicitly stopped auto-following. Implement by adding a `pointerdown` handler on the canvas that sets `followAgentRef.current = null`.

### Anti-Patterns to Avoid
- **Setting `instanceColor.needsUpdate = true` every frame:** Only set on actual state change (reveal event). Per-frame upload of 60K color entries is a full GPU buffer upload.
- **Post-process overlay for fog:** A full-screen quad with cutouts (stencil) is more complex than per-hex color override and can't do per-hex culling of other layers.
- **Rebuilding road geometry on every tile change:** Roads are static. Generate once at scene init from the locations prop. Re-generate only if the locations prop changes (check length or IDs).
- **Using THREE.LineDashedMaterial for wide dashed trails:** Line width is capped at 1px in WebGL. Use quad-strip geometry with gaps instead, following the river mesh pattern.
- **Fog as React state driving re-render:** Fog updates are per-hex events, potentially rapid. Store visibility map in a `useRef`, update Three.js directly (color override, group.visible). Avoid React state for per-frame concerns.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Hex A* pathfinding for roads | Custom BFS/DFS | `findHexPath` from `pathfinding.ts` | Already handles terrain costs, impassable ocean, grid dimensions |
| Quad-strip geometry | Custom triangle builder | `buildQuadStripGeometry` from `RiverMesh.ts` (copy or extract) | The pattern is proven — same winding order, same UV, same merge approach |
| Camera animation for follow mode | Custom lerp loop | `animateCameraTo` from `CameraAnimator.ts` | Already wired to d3-zoom, fires proper zoom events |
| Zoom event secondary listeners | Custom event system | `zoom.on('zoom.labelname', handler)` | Named secondary listener pattern established in Phase 4 |
| Sight range computation | Custom geometry | `hexNeighbors` + BFS from `hexMath.ts` | Hex neighbor math already handles odd-q offset grid correctly |
| Bridge icon rendering | Custom Three.js mesh | `THREE.Sprite` with a canvas-drawn texture | Same approach as location icons and agent dots — consistent with existing patterns |

**Key insight:** This phase is almost entirely wiring and extension of prior-phase patterns. The risk is not building wrong things — it's not knowing which existing utilities to use.

---

## Common Pitfalls

### Pitfall 1: Fog Prop Threading
**What goes wrong:** `HexMapV2.tsx` re-runs the entire Three.js `useEffect` when the `tiles` dep changes. If `visibilityMap` is passed as a prop it will trigger full scene rebuild on every fog state change.

**Why it happens:** The main `useEffect` dependency array includes `tiles` — adding `visibilityMap` there causes the entire scene to tear down and rebuild.

**How to avoid:** Store the visibility map in a `useRef`. Apply fog updates imperatively via a separate `useEffect([visibilityMap])` that walks the ref and calls `setColorAt` + sets `instanceColor.needsUpdate = true`. Never put `visibilityMap` in the scene-rebuild effect's deps.

**Warning signs:** Scene flicker, agent animation state reset, or performance drop on agent movement.

### Pitfall 2: instanceColor.needsUpdate Batching
**What goes wrong:** Calling `setColorAt` + `needsUpdate = true` once per revealed hex causes N GPU uploads for N reveals.

**Why it happens:** `needsUpdate` marks the buffer dirty for the next frame. If you set it inside a loop, it's only read once per frame anyway — but if reveals are batched as a list, apply all `setColorAt` calls first, then set `needsUpdate = true` once.

**How to avoid:** Process the entire fog state update list in one pass, then set `instanceColor.needsUpdate = true` a single time.

**Warning signs:** Performance drop when many hexes reveal simultaneously (large scry event).

### Pitfall 3: Tile Index vs Hex Coord Mapping
**What goes wrong:** `InstancedMesh` uses array index (0 to N-1) to identify instances. The visibility map uses `"col,row"` string keys. These must be kept in sync.

**Why it happens:** `createHexFillMesh` iterates `tiles` array and assigns instance index by array position. The VisibilityMap doesn't know array position.

**How to avoid:** Build a `Map<string, number>` of `"col,row" -> tileIndex` at scene init (same loop as `tileLookup` in `HexMapV2.tsx`). This is the bridge between visibility state and InstancedMesh instance index.

**Warning signs:** Wrong hexes turning dark, or color updates applied to the wrong hex.

### Pitfall 4: Road Pathfinding Through Ocean
**What goes wrong:** The A* pathfinder returns ocean paths because ocean hexes have a cost, not `Infinity`.

**Why it happens:** `getTerrainTax` may assign a finite cost to ocean terrain. Roads should never cross open ocean (they use bridges at rivers, not at coastlines).

**How to avoid:** Before running road pathfinding, pass a custom `isPassable` predicate to `findHexPath` (or filter the tile list) that returns `false` for water terrain. Verify `isWaterTerrain()` from `coastline.ts` covers all water types.

**Warning signs:** Roads rendering across water hexes, bridge icons on coastlines instead of river crossings only.

### Pitfall 5: Zoom Tier Threshold Mismatch
**What goes wrong:** `CAMERA_CONSTANTS.DEFAULT_ZOOM = 1.5` sits exactly on the `continental/full-world` boundary. If thresholds are `<1.5` for full-world, the default view starts at full-world instead of continental.

**Why it happens:** The existing decision log (`STATE.md`) states: "Zoom tier thresholds: full-world <1.5, continental <5, regional <15, hero-local >=15". The `DEFAULT_ZOOM = 1.5` sits at the continental boundary.

**How to avoid:** Use `>=` for continental tier check: `k >= 1.5 = continental`. Confirm the default view shows continental tier (terrain + major cities + borders, no signifiers). The `ZOOM-05` requirement says default should be "hero-local zoom" — this conflicts with `DEFAULT_ZOOM = 1.5`. Per CONTEXT.md, ZOOM-05 requires the camera to start centered on the retinue agent; the initial zoom level for that centering should be raised to hero-local (`k = 15`) when an agent is present.

**Warning signs:** Starting view shows full-world tier (no signifiers visible even at default zoom) or wrong tier label overlays visible.

### Pitfall 6: Follow Mode Loop with animateCameraTo
**What goes wrong:** If `animateCameraTo` fires on every frame while the agent is animating a bezier hop, the d3 transition competes with the bezier animation and produces jitter.

**Why it happens:** `animateCameraTo` uses a 500ms d3 transition. If called repeatedly while the agent is mid-animation, each call starts a new transition.

**How to avoid:** Only call `animateCameraTo` when the agent's HEX changes (not every animation frame). The existing agent position update logic in `useEffect([agents, seed])` already diffs hex positions — call follow mode pan there, not in the render loop tick.

**Warning signs:** Camera stuttering or jitter during agent movement.

---

## Code Examples

### Color Cache for Fog Override
```typescript
// Source: HexFillMesh.ts createHexFillMesh pattern
// Store original colors alongside tile index at scene init:
const originalColors = new Float32Array(tiles.length * 3); // r, g, b per tile
const tileIndexByKey = new Map<string, number>();
for (let i = 0; i < tiles.length; i++) {
  const tile = tiles[i];
  tileIndexByKey.set(`${tile.coord.col},${tile.coord.row}`, i);
  const [r, g, b] = getHexColor(tile.terrain, seed, tile.coord.col, tile.coord.row, {
    elevation: tile.geoParams.elevation,
    lakeId: lakeIds?.[i],
  });
  originalColors[i * 3]     = r;
  originalColors[i * 3 + 1] = g;
  originalColors[i * 3 + 2] = b;
}
```

### Fog Update (imperative, not reactive)
```typescript
// Source: pattern from AgentSpriteMesh.ts updateAgentPositions
// Called from a useEffect([visibilityMapRef.current]) with no scene rebuild:
export function updateFogColors(
  fillMesh: THREE.InstancedMesh,
  visibilityMap: VisibilityMap,
  tileIndexByKey: Map<string, number>,
  originalColors: Float32Array,
): void {
  const FOG_COLOR = new THREE.Color(UNEXPLORED_HEX_COLOR); // '#0a0a0c'
  const c = new THREE.Color();
  for (const [key, entry] of visibilityMap) {
    const idx = tileIndexByKey.get(key);
    if (idx === undefined) continue;
    if (entry.state === 'unexplored') {
      fillMesh.setColorAt(idx, FOG_COLOR);
    } else {
      c.setRGB(
        originalColors[idx * 3],
        originalColors[idx * 3 + 1],
        originalColors[idx * 3 + 2],
        THREE.SRGBColorSpace,
      );
      fillMesh.setColorAt(idx, c);
    }
  }
  if (fillMesh.instanceColor) fillMesh.instanceColor.needsUpdate = true;
}
```

### Zoom Tier Update (extending existing pattern)
```typescript
// Source: HexMapV2.tsx zoom.on('zoom.labels') pattern
zoom.on('zoom.visibility', (event: d3.D3ZoomEvent<HTMLCanvasElement, unknown>) => {
  const k = event.transform.k;
  const tier = getZoomTier(k);
  // Each group toggled from matrix:
  signifierGroup.visible   = ZOOM_VISIBILITY_MATRIX.signifiers[tier];
  elevTicksMesh.visible    = ZOOM_VISIBILITY_MATRIX.elev_ticks[tier];
  riverGroup.visible       = ZOOM_VISIBILITY_MATRIX.rivers[tier];
  roadGroup.visible        = ZOOM_VISIBILITY_MATRIX.roads[tier];
  borderKingdomMesh.visible = ZOOM_VISIBILITY_MATRIX.borders_kingdom[tier];
  borderBaronyMesh.visible  = ZOOM_VISIBILITY_MATRIX.borders_barony[tier];
  if (locationGroup) locationGroup.visible = ZOOM_VISIBILITY_MATRIX.locations[tier];
  updateZoomVisibility(agentSpriteGroup, k); // existing fn handles agent tiers
  // Fade transitions: handled via opacity lerp in render loop for sprite groups
});
```

### Road Path Generation
```typescript
// Source: hexMovementPath.ts + RiverMesh.ts patterns combined
// At scene init, generate road paths between all settlement pairs:
function generateRoadPaths(
  locations: LocationNode[],
  tiles: HexTile[],
  cols: number,
  rows: number,
): Array<Array<{ col: number; row: number }>> {
  const settlements = locations.filter(loc =>
    ['capital', 'city', 'town', 'hamlet', 'castle', 'fort'].includes(loc.locationType)
  );
  const paths: Array<Array<{ col: number; row: number }>> = [];
  // Connect each settlement to its nearest settlement neighbors (not fully connected)
  // Use findHexPath with water-exclusion predicate
  for (let i = 0; i < settlements.length; i++) {
    const nearest = findNearestSettlement(settlements[i], settlements, 3);
    for (const target of nearest) {
      const path = findHexPath(tiles, { col: settlements[i].hexCol, row: settlements[i].hexRow },
        { col: target.hexCol, row: target.hexRow }, cols, rows);
      if (path) paths.push(path.path);
    }
  }
  return paths;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fog as full-screen dark overlay with cutouts | Per-hex InstancedMesh color override | Phase 7 design | Single draw call for both terrain and fog, no stencil complexity |
| Hard snap zoom tiers | Smooth continuous d3-zoom with soft tier boundaries | Established Phase 1 | Elements fade over 20% zoom range rather than popping |
| React state driving Three.js updates | Refs + imperative Three.js mutation | Established Phase 6 (animStatesRef) | No React re-renders for render-loop updates |

**Deprecated/outdated:**
- V1 fog implementation in `GameView.tsx` with `effectiveVisibilityMap` proxy: reference only — do NOT copy the proxy pattern into HexMapV2. Read for the fog toggle behavior and color constant (`#0a0a0c`) only.
- `AGENT_ZOOM_THRESHOLDS` from `agentSpriteTypes.ts`: These constants (HERO_LOCAL=15, REGIONAL=5, CONTINENTAL=1.5) should be promoted to or referenced from the new `ZoomVisibilityMatrix.ts` constants to avoid duplication.

---

## Open Questions

1. **Road settlement selection strategy**
   - What we know: `findHexPath` exists and works. Locations are passed as `LocationNode[]` to HexMapV2.
   - What's unclear: Should roads connect ALL settlement pairs, or only nearest-neighbor? Fully connected graph at 100+ settlements = O(N²) paths.
   - Recommendation: Connect each settlement to its K=3 nearest land-reachable neighbors. This produces a sparse but sufficient network. Cap total roads at 500 paths to bound geometry size.

2. **ZOOM-05 conflict: DEFAULT_ZOOM vs hero-local requirement**
   - What we know: `DEFAULT_ZOOM = 1.5` (continental tier). ZOOM-05 requires "centered on player's primary retinue agent, hero-local zoom."
   - What's unclear: Does ZOOM-05 mean "jump to hero-local on load" or "start at hero-local always"? Phase 8 integration (not Phase 7) wires the real retinue agent — Phase 7 has a mock/test agent.
   - Recommendation: Phase 7 plan should specify that `ZOOM-05` is partially addressed — the `centerOn` call with `scale=15` is implemented, but wiring to the real retinue agent is Phase 8. For Phase 7 testing, use the mock agent from `HexV2View.tsx`.

3. **FOG-06 vs CONTEXT.md instant reveal conflict**
   - What we know: CONTEXT.md locked "instant flip — no fade animation" for the unexplored→explored transition. FOG-06 requires "unexplored->explored fade-in ~300ms."
   - What's unclear: Is FOG-06 overridden by the CONTEXT.md decision?
   - Recommendation: Honor CONTEXT.md (user's explicit decision). Implement instant reveal for unexplored→explored. Still implement the visible→explored dim-out (~500ms) which CONTEXT.md did not override. Mark FOG-06 as "partially complete" in the plan — the fade-out portion is implemented, fade-in is intentionally instant per user decision.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (vitest.config.ts) |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `npm test -- --run src/components/HexMapV2/scene/__tests__` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOG-01 | `updateFogColors` sets unexplored hex to `#0a0a0c` | unit | `npm test -- --run src/components/HexMapV2/scene/__tests__/FogMesh.test.ts` | ❌ Wave 0 |
| FOG-02 | `updateFogColors` restores original color for remembered/visible hex | unit | same | ❌ Wave 0 |
| FOG-03 | Visible hexes: no fog color override applied | unit | same | ❌ Wave 0 |
| FOG-04 | `computeVisibilityMap` returns only own hex as visible at range 0 | unit | `npm test -- --run src/components/HexMapV2/scene/__tests__/FogMesh.test.ts` | ❌ Wave 0 |
| FOG-05 | `updateFogColors` handles 60K tiles without per-frame call | unit (timing assertion) | same | ❌ Wave 0 |
| ZOOM-01 | `getZoomTier(15)` = hero-local, `getZoomTier(5)` = regional, etc. | unit | `npm test -- --run src/components/HexMapV2/scene/__tests__/ZoomVisibilityMatrix.test.ts` | ❌ Wave 0 |
| ZOOM-02 | `ZOOM_VISIBILITY_MATRIX` has entry for all 12 tracked layers | unit | same | ❌ Wave 0 |
| ZOOM-04 | `ZOOM_VISIBILITY_MATRIX.signifiers['full-world']` = false | unit | same | ❌ Wave 0 |
| GRID-03 | `createRoadMesh` with 2 settlements returns group with geometry | unit | `npm test -- --run src/components/HexMapV2/scene/__tests__/RoadMesh.test.ts` | ❌ Wave 0 |
| GRID-03 | `createRoadMesh` with no settlements returns empty group | unit | same | ❌ Wave 0 |
| GRID-04 | `findRiverCrossings` detects overlapping road/river hex pair | unit | same | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --run src/components/HexMapV2/scene/__tests__`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/components/HexMapV2/scene/__tests__/FogMesh.test.ts` — covers FOG-01 through FOG-05
- [ ] `src/components/HexMapV2/scene/__tests__/ZoomVisibilityMatrix.test.ts` — covers ZOOM-01, ZOOM-02, ZOOM-04
- [ ] `src/components/HexMapV2/scene/__tests__/RoadMesh.test.ts` — covers GRID-03, GRID-04

---

## Sources

### Primary (HIGH confidence)
- Source code: `src/types/visibility.ts` — complete HexVisibilityState type, VisibilityMap, LOSSource, sight range constants
- Source code: `src/components/HexMapV2/scene/RenderLayers.ts` — RENDER_ORDER with ROADS=5, FOG=12 slots
- Source code: `src/components/HexMapV2/HexMapV2.tsx` — zoom.on pattern, group.visible pattern, agent animation integration
- Source code: `src/components/HexMapV2/scene/HexFillMesh.ts` — InstancedMesh setColorAt pattern
- Source code: `src/components/HexMapV2/scene/RiverMesh.ts` — quad-strip geometry pattern reusable for roads
- Source code: `src/components/HexMapV2/camera/D3ZoomCamera.ts` — CAMERA_CONSTANTS, zoom tier thresholds
- Source code: `src/components/HexMapV2/camera/CameraAnimator.ts` — animateCameraTo API
- Source code: `src/components/HexMapV2/scene/AgentSpriteMesh.ts` — spriteMap, updateZoomVisibility, AGENT_ZOOM_THRESHOLDS
- Source code: `src/engine/hexMovementPath.ts` — buildHexMovementPath, A* pathfinding
- Source code: `src/engine/pathfinding.ts` — findHexPath Dijkstra implementation
- Source code: `src/components/HexMap/HexTile.tsx` — V1 UNEXPLORED_HEX_COLOR `#0a0a0c` reference
- Design: `Design/brainstorm-hexmap-v2.md` — Layer 14 (fog) and Layer 15 (zoom) full specification
- Requirements: `.planning/REQUIREMENTS.md` §FOG, §ZOOM, §GRID — full requirement definitions
- Context: `.planning/phases/07-fog-zoom-grid/07-CONTEXT.md` — locked decisions and canonical refs

### Secondary (MEDIUM confidence)
- State: `.planning/STATE.md` — zoom tier thresholds decision log (full-world <1.5, continental <5, regional <15, hero-local >=15)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all dependencies already installed and in use
- Architecture: HIGH — patterns verified directly from source files; fog, zoom, and road approaches all extend proven prior-phase code
- Pitfalls: HIGH — most derive from direct code inspection (instanceColor batching, tile index mapping, default zoom conflict)
- Open questions: MEDIUM — road settlement selection strategy and ZOOM-05/FOG-06 interpretation require planner decisions

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (30 days — stable Three.js patterns, no fast-moving dependencies)
