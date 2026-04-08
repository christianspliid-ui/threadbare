# Procedural Hex Vignettes — Architecture Design (Revised)

**Date:** 2026-04-08
**Updated:** 2026-04-08 — architecture redesigned after review findings
**Status:** Prototype slice 1 implemented in terrain lab; architecture remains the source of truth for further expansion
**Build target:** Terrain Texture Lab prototype (`?view=terrain-lab`) only. Do not wire into live `HexMapV2` until the prototype proves performance, clickability, and visual readability.
**References:** `HexMapV2.tsx`, `SettlementModelMesh.ts`, `SignifierMesh.ts`, `HexRaycaster.ts`, terrain lab shader/canvas implementation

---

## 1. Vision

Each hex becomes a **small, readable diorama**:

- a procedural terrain shader establishes the base surface
- low-poly filler models create terrain character
- landmark models occupy composition anchors
- agents remain directly clickable above the vignette

The target look is **miniature, low-poly, Chrome-friendly, and legible**. A forest hex should feel like a tiny landscape, not a handful of oversized props. A city or shrine should read as a landmark within the landscape, not consume the whole hex.

This system is explicitly **prototype-first**. We will validate the architecture in the terrain lab before touching the game renderer.

**Implementation note (2026-04-08):** The first prototype slice is now live in `?view=terrain-lab`: forest sample hexes can auto-generate a slot-aware village vignette using the current deciduous tree assets, with optional slot/zone/filler debug overlays and clickable landmark targets. The prototype still uses clone-based model placement in the lab; the chunked batch model below remains the planned production direction.

---

## 2. Revised Architectural Decisions

This revision resolves four issues in the previous draft:

1. **Keep the current slot system.** `CENTER` and ring-style anchors are a good inherited constraint and should stay.
2. **Replace single-center keepout with slot-aware zones.** Scatter must respond to actual occupied anchors and to unoccupied anchors differently.
3. **Use one explicit fog/material strategy.** Instanced GLB-derived filler and landmark batches will use a custom unlit instance shader, not plain `MeshBasicMaterial`.
4. **Choose chunked batching, not global batching.** Chunked batches make culling, caps, and distance-based degradation coherent.

---

## 3. Composition Model

### 3.1 Slot System

The vignette system inherits the current compositional anchor language from the game.

```typescript
type VignetteSlot =
  | 'CENTER'
  | 'N'
  | 'NE'
  | 'SE'
  | 'S'
  | 'SW'
  | 'NW';
```

These are not temporary placeholders. They are part of the visual language of the map and help keep landmark placement compatible with existing movement and selection expectations.

### 3.2 Zone Modes

A hex is not divided into “center keepout + everything else.” It is divided into **zone rules** derived from slot occupancy.

```typescript
type ZoneMode = 'hard_keepout' | 'soft_fill' | 'free_fill';

interface ZoneRule {
  slot: VignetteSlot;
  center: { x: number; y: number };
  radius: number;
  mode: ZoneMode;
  fillerProfileId: string | null;
  densityMultiplier: number;
}
```

#### Zone semantics

- `hard_keepout`
  Used for occupied landmarks. No filler scatter may spawn here.
- `soft_fill`
  Used for unoccupied composition anchors. These zones are reclaimed by smaller, lower-profile filler so empty slots do not become dead holes.
- `free_fill`
  The rest of the hex. Full terrain filler behavior applies.

This resolves the tension between symmetry and fullness:

- occupied ring slots stay clean
- unused ring slots still contribute to the scene
- the hex does not become uniform noise

### 3.3 Landmark and Filler Placement Flow

```typescript
interface LandmarkPlacement {
  entityId: string;
  entityType: 'location' | 'landmark';
  modelId: string;
  slot: VignetteSlot;
  center: { x: number; y: number };
  footprintRadius: number;
  scale: number;
  yawDegrees: number;
  clickRadiusPx: number;
}

interface FillerBatchSpec {
  modelId: string;
  transforms: Array<{
    x: number;
    y: number;
    z: number;
    scale: number;
    yawDegrees: number;
  }>;
}

interface VignetteSpec {
  terrain: {
    recipeId: string;
    paletteId: string;
    detailLevelBias: number;
  };
  zoneRules: ZoneRule[];
  landmarkPlacements: LandmarkPlacement[];
  fillerBatches: FillerBatchSpec[];
  clickTargets: LocationClickTarget[];
}
```

### 3.4 Resolver Passes

`VignetteResolver` is a pure function that runs in deterministic passes:

1. Resolve terrain recipe from hex terrain type.
2. Resolve landmark placements from location data using slot rules.
3. Derive `zoneRules`:
   - occupied landmark slots -> `hard_keepout`
   - unused composition slots -> `soft_fill`
   - background area -> `free_fill`
4. Scatter filler models by zone.
5. Register click targets for landmarks.

This means filler is always downstream of actual landmark placement.

---

## 4. Terrain and Filler Rules

### 4.1 Terrain Profiles

Each terrain type maps to:

- a terrain shader recipe
- a terrain palette
- one or more filler profiles

```typescript
interface TerrainVignetteRule {
  terrainType: TerrainType;
  shaderRecipeId: string;
  fillerProfileIds: {
    softFill: string;
    freeFill: string;
  };
}
```

### 4.2 Filler Profiles

Filler is driven by **zone-aware profiles**, not just “density per terrain.”

```typescript
interface FillerProfile {
  id: string;
  modelWeights: Array<{ modelId: string; weight: number }>;
  densityPerHexEquivalent: number;
  minSpacing: number;
  scaleMin: number;
  scaleMax: number;
  maxSlopeBias: number;
}
```

Example:

- `forest-free-fill`
  dense canopy, normal tree sizes, full density
- `forest-soft-fill`
  fewer trees, smaller trees, lower-profile shrubs/rocks allowed

**Density semantics:** `densityPerHexEquivalent` is normalized to a full hex, not an individual zone. Actual spawn count for a specific zone is:

```typescript
actualZoneTargetCount =
  densityPerHexEquivalent *
  zoneAreaFraction *
  zone.densityMultiplier;
```

This avoids the ambiguity where a soft-fill ring slot looked like it wanted "20-35 trees in a tiny circle." It does not. The soft-fill profile is lower-density, then prorated to the actual zone footprint.

### 4.3 Initial Density Targets

Calibrated from the Blender prototype and user feedback:

| Terrain | Free Fill | Soft Fill | Notes |
|--------|-----------|-----------|------|
| temperate_forest | 90-120 trees | 20-35 small trees / shrubs | Light/open forest around village is the current visual target |
| dense_forest | 110-140 trees | 25-40 small trees | Maximum canopy coverage |
| light_forest | 35-55 trees | 10-20 small trees | More ground visible |
| grassland | 12-24 clumps / rocks | 4-10 accents | Sparse |
| hills | 18-32 rocks / scrub | 6-12 accents | Mixed filler |
| mountains | 20-36 rocks / snow drifts | 6-12 accents | Rugged |
| desert | 6-14 cacti / rocks | 2-6 accents | Very sparse |
| swamp | 35-60 twisted trees / reeds | 10-18 accents | Uneven watery clutter |

These are starting ranges, not authored absolutes. PRNG and zone masks create the final variation.

### 4.4 Calibrated Forest Palette

The current forest filler prototype has already been art-directed in Blender. Preserve these canopy tones as the first-pass reference palette:

| Role | Color | Notes |
|------|-------|-------|
| shadow canopy | `#1A3318` | deep black-green mass |
| mid canopy | `#2B5E24` | dominant rich forest green |
| highlight canopy | `#4A8A32` | warm radiant green accent |
| trunk / branch | `#463828` | dark warm wood |

These belong to the filler profile/art reference, not just the Blender session history.

---

## 5. Rendering Architecture

### 5.1 Layer Structure

Prototype render layers in the terrain lab:

1. `TerrainShaderLayer`
2. `FillerChunkLayer`
3. `LandmarkChunkLayer`
4. `AgentOverlayLayer`
5. `SelectionOverlayLayer`

For the prototype, agents remain as the current overlay/sprite style. The vignette work is about terrain + landmarks first.

### 5.2 Chunked Batching Model

The previous “one global InstancedMesh per model type” approach is replaced with **chunked instancing**.

```typescript
interface VignetteChunkKey {
  chunkCol: number;
  chunkRow: number;
}

interface ChunkedBatchKey {
  chunk: VignetteChunkKey;
  modelId: string;
  materialSlot: string;
  batchKind: 'filler' | 'landmark';
}
```

#### Why chunked batching

It makes all of the following possible without contradiction:

- chunk-level frustum culling
- chunk-level memory ownership
- distance-aware degradation
- per-type instance caps that prefer distant chunks for dropping
- future incremental rebuilds when one part of the map changes

The terrain lab can run as a single chunk at first, but the architecture remains chunk-based so the prototype and later game renderer share the same shape.

**Cap sanity check:** A dense 12×12 forest chunk at 110 filler instances/hex implies ~15,840 filler instances before model split. With 3 tree archetypes × 2 material slots, the architecture must leave enough room per batch to avoid pathological truncation during ordinary dense-forest scenes. This is why the batch cap in §10 is set above the earlier draft.

### 5.3 Chunk Ownership

Each chunk owns:

- filler instanced meshes by model/material
- landmark instanced meshes by model/material
- click-target registry entries for landmarks
- bounds for culling and distance priority

```typescript
interface VignetteChunk {
  key: VignetteChunkKey;
  bounds: THREE.Box3;
  fillerBatches: Map<string, THREE.InstancedMesh>;
  landmarkBatches: Map<string, THREE.InstancedMesh>;
  clickTargets: LocationClickTarget[];
  priorityScore: number;
}
```

### 5.4 Material Strategy

The previous doc was ambiguous here. This revision is explicit:

#### Filler and landmark instanced batches use a custom unlit instance material

```typescript
interface VignetteInstanceUniforms {
  uRememberedTint: THREE.Color;
  uRememberedMix: number;
  uHoverColor: THREE.Color;
}
```

Per-instance attributes:

- `instanceMatrix`
- `aVisibilityState` (`0 = hidden`, `1 = remembered`, `2 = visible`)
- `aHoverMix`
- `aSelectionMix`

This is a purpose-built shader with `MeshBasicMaterial`-like output semantics:

- unlit
- no scene lights
- no tone mapping
- linear workflow
- explicit support for fog/remembered state and hover/selection tint

#### Why not plain `MeshBasicMaterial`

Because plain `MeshBasicMaterial` does not consume custom instanced attributes. The fog/remembered-state plan must be encoded in a shader path, not implied.

### 5.5 Asset Import Contract

To control draw count, both filler and landmark assets must follow a stricter export contract than the current clone-based location models:

| Asset Type | Max Material Slots | Requirement |
|-----------|--------------------|-------------|
| filler models | 2 | Merge by material in Blender |
| landmark models | 3 | Merge by material in Blender |
| exceptional hero assets | no hard rule | Not in prototype scope |

This changes the cost model from “locations” to “locations × material slots,” and keeps that multiplier bounded.

### 5.6 Buffer Lifecycle

All instance buffers are allocated once per chunk batch and updated in place.

```typescript
interface BatchBuffers {
  visibility: Float32Array;
  hover: Float32Array;
  selection: Float32Array;
}
```

No reallocation on hover, fog updates, or selection changes.

### 5.7 Color Pipeline

Validated pattern:

1. author colors in sRGB
2. convert to linear before passing into shader uniforms/attributes
3. blend in shader in linear space
4. let renderer output via `SRGBColorSpace`

No manual gamma hacks.

### 5.8 Context Loss

Prototype implementation must include:

- `webglcontextlost`
- `webglcontextrestored`
- full chunk rebuild on restore

This is required even in the lab, because the point of the prototype is to validate a Chrome-safe architecture.

---

## 6. Click and Selection Architecture

### 6.1 Priority Order

Click priority remains:

1. agents
2. armies
3. landmarks
4. hex fallback

This preserves current behavior while adding location-level direct selection.

### 6.2 Landmark Click Targets

Landmarks do not rely on tree-level raycasting. They use a lightweight click registry derived from resolved slot anchors.

```typescript
interface LocationClickTarget {
  entityId: string;
  entityType: 'location' | 'landmark';
  slot: VignetteSlot;
  worldPosition: THREE.Vector3;
  hitRadiusPx: number;
  chunkKey: VignetteChunkKey;
  batchKey: string;
  instanceIndex: number;
}
```

This means clickability is stable even if the visual model has multiple submeshes.

### 6.3 Hover and Selection Feedback

When the cursor is over a landmark target:

- cursor changes to pointer
- the relevant chunk batch updates `aHoverMix` for the specific instance
- selection updates `aSelectionMix`

Scatter/filler remains non-clickable.

### 6.4 UI / Visibility Phase

Prototype surfaces that must exist:

- visible hover feedback for landmarks
- selection callback panel in terrain lab
- debug overlay for slot anchors and zone rules
- debug toggle for filler/landmark/chunk bounds visibility
- `window.__TERRAIN_LAB` console API for rapid placement/camera/model iteration without sidebar clicking

Without these, the prototype cannot validate readability or click correctness.

---

## 7. Performance Model

### 7.1 Budget Framing

Budget by:

- visible chunks
- instanced batches per chunk
- material slots per asset

Not by “hex count only” or “location count only.”

### 7.2 Prototype Budget

Assume:

- one visible lab chunk
- 3-6 filler model families
- 2-5 material slots total across active filler archetypes
- 1-3 landmark archetypes active at once

Prototype target:

- filler batches: under 20 draw calls
- landmark batches: under 12 draw calls
- terrain shader + overlays: under 12 draw calls
- total: under 45 draw calls in terrain lab

The first profiling check should explicitly verify that a dense forest chunk does not hit the per-batch cap under ordinary usage. If it does, tune one of:

- `SCATTER_MAX_INSTANCES_PER_BATCH`
- chunk dimensions
- dense-forest free-fill density

### 7.3 Production-Oriented Budget

For future game integration:

- visible chunk window, not whole-map window
- filler degraded by zoom tier
- chunk priority used for caps

```typescript
priorityScore =
  visibilityWeight *
  zoomWeight *
  inverseDistanceWeight *
  landmarkPresenceWeight;
```

If over cap:

- drop lowest-priority filler chunks first
- never drop landmark batches before filler

This is only coherent because batching is chunked.

### 7.4 Zoom / LOD Rules

| Zoom Tier | Filler | Landmarks | Terrain Shader |
|----------|--------|-----------|----------------|
| hero-local | full | full 3D | full detail |
| regional | full | full 3D | full detail |
| continental | reduced filler or hidden | landmark silhouettes / icons | reduced octaves |
| full-world | hidden | icons only or hidden | flat color / very low detail |

Terrain shader detail reduction is driven by zoom. Filler degradation is chunk-priority aware.

---

## 8. PRNG and Determinism

### 8.1 PRNG Callouts

Seeded randomness is required at these exact points:

1. slot-level yaw variation for landmarks
2. filler model choice from weighted sets
3. filler transform jitter within allowed zones
4. filler scale variation
5. filler yaw variation

```typescript
hexSeed = hash(globalSeed, col, row);
zoneSeed = hash(hexSeed, slotId);
chunkSeed = hash(globalSeed, chunkCol, chunkRow);
```

Use `mulberry32` or the existing project PRNG helper consistently. Do not mix `Math.random()` into any part of placement.

### 8.2 Deterministic Pass Ordering

Resolver order must be fixed:

1. landmarks
2. zones
3. filler
4. click targets

Never let filler sampling run before landmark placement.

---

## 9. Implementation Phases

### Phase 1 — Terrain Lab Slot/Zones Prototype

- add slot anchor visualization
- implement `ZoneRule`
- build a debug view for `hard_keepout`, `soft_fill`, `free_fill`
- render simple placeholder dots/markers for free-fill vs soft-fill occupancy so zone sizing can be judged before real filler meshes land
- prove that unused slots are reclaimed cleanly

### Phase 2 — Chunked Filler Layer

- introduce chunk registry
- implement filler profiles
- build chunked instanced filler batches with custom unlit instance material
- validate density and readability

### Phase 3 — Landmark Batch Layer

- convert repeated landmark archetypes to chunked instanced landmark batches
- enforce Blender export limits for material slots
- register click targets from slot anchors

### Phase 4 — Interaction and UI Validation

- hover/selection feedback
- terrain-lab selection panel
- direct click on landmark instances
- debug toggles for chunk bounds and zones

### Phase 5 — Profiling and Resilience

- context loss recovery
- chunk-priority cap behavior
- zoom-driven LOD
- Chrome profiling on integrated GPU

### Phase 6 — Future Game Integration

Only after the prototype proves:

- readable vignettes
- correct click behavior
- acceptable draw-call behavior
- stable remembered/visible fog states

---

## 10. Constants Table

| Constant | Default | Purpose |
|---------|---------|---------|
| `VIGNETTE_CHUNK_COLS` | 12 | Chunk width in hexes |
| `VIGNETTE_CHUNK_ROWS` | 12 | Chunk height in hexes |
| `SCATTER_DENSITY_FOREST_FREE` | 110 | Forest filler density as full-hex equivalent for free-fill zones |
| `SCATTER_DENSITY_FOREST_SOFT` | 28 | Forest filler density as full-hex equivalent for soft-fill zones |
| `SCATTER_DENSITY_LIGHT_FOREST_FREE` | 45 | Light forest free-fill density as full-hex equivalent |
| `SCATTER_DENSITY_LIGHT_FOREST_SOFT` | 14 | Light forest soft-fill density as full-hex equivalent |
| `SCATTER_DENSITY_SWAMP_FREE` | 55 | Swamp free-fill density as full-hex equivalent |
| `SCATTER_DENSITY_SWAMP_SOFT` | 16 | Swamp soft-fill density as full-hex equivalent |
| `SCATTER_MIN_SPACING_FREE` | 0.11 | Minimum spacing in free-fill zones |
| `SCATTER_MIN_SPACING_SOFT` | 0.14 | Slightly wider spacing in soft-fill zones |
| `ZONE_RADIUS_CENTER` | 0.20 | Center slot radius as fraction of hex radius |
| `ZONE_RADIUS_RING` | 0.14 | Ring slot radius as fraction of hex radius |
| `SOFT_FILL_SCALE_MAX` | 0.72 | Max scale multiplier for soft-fill props |
| `LANDMARK_MAX_MATERIAL_SLOTS` | 3 | Blender export contract for landmarks |
| `FILLER_MAX_MATERIAL_SLOTS` | 2 | Blender export contract for filler |
| `LOCATION_CLICK_RADIUS_PX` | 24 | Minimum screen-space click radius |
| `REMEMBERED_TINT_MIX` | 0.55 | How strongly remembered landmarks/filler tint toward fog color |
| `FILLER_HIDE_ZOOM_THRESHOLD` | 5 | Below this zoom, filler starts degrading/hiding |
| `SHADER_REDUCED_OCTAVE_ZOOM_THRESHOLD` | 5 | Terrain shader detail reduction threshold |
| `SCATTER_MAX_INSTANCES_PER_BATCH` | 3072 | Safety cap per chunk batch; chosen to avoid routine dense-forest truncation at current chunk size |
| `PIXEL_RATIO_CAP` | 2 | Renderer DPR cap |

---

## 11. Tracing

```typescript
interface VignetteResolveTrace {
  type: 'vignette.resolve';
  hexCoord: HexCoord;
  terrainType: TerrainType;
  landmarkCount: number;
  zoneCount: number;
  fillerInstanceCount: number;
  buildTimeMs: number;
}

interface VignetteChunkTrace {
  type: 'vignette.chunk';
  chunkCol: number;
  chunkRow: number;
  fillerBatchCount: number;
  landmarkBatchCount: number;
  visible: boolean;
  priorityScore: number;
}

interface VignetteClickTrace {
  type: 'vignette.click';
  entityId: string | null;
  entityType: 'agent' | 'army' | 'landmark' | 'hex' | null;
  chunkCol: number | null;
  chunkRow: number | null;
}
```

---

## 12. Fail-Soft Table

| Failure | Fallback |
|--------|----------|
| filler GLB load fails | affected filler profile resolves to no filler; terrain shader still renders |
| landmark GLB load fails | use existing 2D icon fallback for that landmark |
| slot rule missing for a subtype | place landmark at `CENTER` and log warning |
| soft-fill profile missing | degrade to `free_fill` profile with reduced density |
| chunk over batch cap | drop lowest-priority filler within the chunk first; preserve landmarks |
| click registry stale | fall back to hex click |
| custom instance material compile fails | hide vignette batches and render terrain-only fallback in prototype |
| WebGL context lost | cancel loop, clear chunk refs, rebuild all chunks on restore |

---

## 13. Wiring Section

### Prototype modules to add

| Module | Responsibility | Surface |
|-------|----------------|---------|
| `lab/vignette/VignetteResolver.ts` | pure slot/zones/filler resolution | terrain lab only |
| `lab/vignette/VignetteSlots.ts` | slot anchor coordinates and radii | terrain lab only |
| `lab/vignette/FillerProfiles.ts` | terrain/zone filler rules | terrain lab only |
| `lab/vignette/ChunkedFillerLayer.ts` | chunked instanced filler rendering | terrain lab canvas |
| `lab/vignette/ChunkedLandmarkLayer.ts` | chunked instanced landmark rendering | terrain lab canvas |
| `lab/vignette/VignetteInstanceMaterial.ts` | custom unlit shader for instanced GLB batches | terrain lab canvas |
| `lab/vignette/VignetteClickRegistry.ts` | landmark click targets | terrain lab canvas |
| `lab/vignette/VignetteDebugOverlay.tsx` | slots / zones / chunk debug UI | terrain lab UI |

### Terrain lab UI / debug surfaces

| Surface | Purpose |
|--------|---------|
| zone debug toggle | inspect `hard_keepout`, `soft_fill`, `free_fill` visually |
| chunk bounds toggle | inspect batching/culling behavior |
| landmark selection panel | verify direct click on landmarks |
| density presets | tune filler profiles without code edits |

### Future game wiring

No game wiring in this phase. When the prototype is proven, the likely landing points are:

- `HexMapV2.tsx`
- new `scene/Vignette*` modules
- `HexRaycaster.ts` extension for landmark selection

But that is intentionally deferred.

---

## 14. NFP Compliance

| NFP | Status | Notes |
|-----|--------|-------|
| 1. Tunability | PASS | slot radii, densities, batching, fog tint, and LOD are all named constants |
| 2. Inspectability | PASS | explicit traces plus required prototype debug overlays |
| 3. Determinism | PASS | PRNG callouts and fixed resolver ordering |
| 4. Fail-soft | PASS | terrain-only and icon fallbacks are explicit |
| 5. Narrative > mechanical | PASS | landmarks remain primary story carriers; filler supports them |
| 6. Additive | PASS | prototype-first, no live-game replacement yet |
| 7. Performance budget | PASS with note | chunked batching resolves the earlier contradiction, but real profiling is still required |

---

## 15. Overall Verdict

This revised architecture keeps the right parts of the original idea:

- slot-based composition
- low-poly miniature vignettes
- terrain shader + models + clickability

while fixing the parts that were internally inconsistent:

- scatter now respects occupied and unoccupied slots differently
- fog/material behavior is explicit and implementable
- batching, culling, and instance caps now use the same chunk-based model
- draw-cost assumptions are tied to asset material-slot budgets instead of wishful location counts

This is now safe to prototype in the terrain lab.
