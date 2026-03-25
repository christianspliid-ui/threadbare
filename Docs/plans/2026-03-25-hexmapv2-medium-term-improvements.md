# TB-016 · HexMapV2 Medium-Term Improvements

> Design doc for three medium-effort, high-payoff refactors from the HexMapV2 Architectural Review.
> See Obsidian → `Systems/HexMapV2 Architectural Review.md` for full context.
>
> **Prerequisite:** TB-030 (Agent Sprite Scale Bug + Zoom Threshold Unification) should land first — it rewrites `updateZoomVisibility` and stores `baseScale` in `userData`, both of which this work builds on.

---

## 1. Extract Custom Hooks from HexMapV2.tsx

### Problem

HexMapV2.tsx is 1,243 lines with 12 responsibilities, 16+ `useRef` entries, and 5 `useEffect` blocks. Any change to agent animations requires understanding fog culling, scene init, and cleanup. The maintenance surface area is too wide for a single file.

### Design

Extract three pure side-effect hooks. Each receives scene refs and returns nothing — they encapsulate one concern and communicate only via shared refs.

#### useAgentAnimations

Encapsulates: agent position diffing, animation triggering, trail creation, follow-mode camera panning, and the `agents` useEffect (current lines 980–1123).

```typescript
interface UseAgentAnimationsParams {
  agents: AgentRenderData[] | undefined;
  seed: number | undefined;
  agentSpriteGroup: AgentSpriteGroup | null;
  trailGroup: THREE.Group | null;
  animStates: React.MutableRefObject<Map<string, AgentAnimState>>;
  prevAgentPositions: React.MutableRefObject<Map<string, AgentPrevPosition>>;
  locationOffsets: React.MutableRefObject<Map<string, { dx: number; dy: number }>>;
  followMode: React.MutableRefObject<FollowModeState>;
  zoomRef: React.MutableRefObject<d3.ZoomBehavior<HTMLCanvasElement, unknown> | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  cameraRef: React.MutableRefObject<THREE.OrthographicCamera | null>;
}

export function useAgentAnimations(params: UseAgentAnimationsParams): void
```

**Constants table:**

| Constant | Default | Purpose |
|----------|---------|---------|
| (none new) | — | This hook uses existing constants from `agentAnimationState.ts` and `agent-visual-content.ts` |

**Tracing:** No new trace types. Existing `AgentHexTransitionTrace` and `AgentRerouteTrace` remain unchanged.

**PRNG callouts:** Animation bezier seeding (from agent ID) is already deterministic. No new random calls.

**Fail-soft:**

| Failure case | Fallback |
|-------------|----------|
| `agentSpriteGroup` is null | Skip entire effect (already the pattern) |
| Agent ID not in spriteMap | Skip that agent, continue loop |
| Trail group is null | Skip trail creation, still animate |
| Follow mode target agent not found | Clear follow mode, log warning |

#### useFogCulling

Encapsulates: the fog update useEffect (current lines 871–951) — visibility map application to hex colors, signifier/location sprite culling.

```typescript
interface UseFogCullingParams {
  visibilityMap: VisibilityMap | undefined;
  fogEnabled: boolean;
  fillResult: HexFillMeshResult | null;
  globalToMeshMap: Map<number, { mesh: THREE.InstancedMesh; instanceIdx: number }> | null;
  originalColors: Float32Array | null;
  tileIndexByKey: Map<string, number> | null;
  signifierGroup: THREE.Group | null;
  locationGroup: THREE.Group | null;
  tiles: HexTile[];
}

export function useFogCulling(params: UseFogCullingParams): void
```

**Constants table:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `FOG_EXPLORED_DIMOUT` | 0.45 | Brightness multiplier for explored-but-not-visible hexes |
| `FOG_UNEXPLORED_COLOR` | `#1a1a2e` | Color for never-seen hexes |

(These already exist in `FOG_CONSTANTS`; no new ones needed.)

**Fail-soft:**

| Failure case | Fallback |
|-------------|----------|
| Any ref is null | Skip entire effect (existing pattern) |
| Tile key not found in `tileIndexByKey` | Skip that tile |
| Visibility entry missing for hex | Treat as unexplored |

#### useZoomLayerVisibility

Encapsulates: the zoom tier change handler currently wired inside the scene init effect. This is the callback that toggles layer groups' `.visible` based on `getZoomTier(k)` and `ZOOM_VISIBILITY_MATRIX`.

```typescript
interface UseZoomLayerVisibilityParams {
  zoomTier: ZoomTier;
  groups: {
    signifiers: THREE.Group | null;
    locations: THREE.Group | null;
    roads: THREE.Group | null;
    rivers: THREE.Group | null;
    gridLines: THREE.Mesh | null;
    elevTicks: THREE.Mesh | null;
    borderKingdom: THREE.Mesh | null;
    borderBarony: THREE.Mesh | null;
    coastline: THREE.Group | null;
  };
  agentSpriteGroup: AgentSpriteGroup | null;
}

export function useZoomLayerVisibility(params: UseZoomLayerVisibilityParams): void
```

**Key change:** `zoomTier` becomes a React state variable in HexMapV2, updated by the d3 zoom handler. The hook runs a `useEffect` on `zoomTier` changes instead of an imperative callback inside the zoom event handler. This makes tier transitions traceable and testable.

**Constants table:**

| Constant | Default | Purpose |
|----------|---------|---------|
| (none new) | — | Uses `ZOOM_VISIBILITY_MATRIX` and `ZOOM_TIER_THRESHOLDS` as-is |

**Fail-soft:**

| Failure case | Fallback |
|-------------|----------|
| Any group ref is null | Skip that layer, continue |
| Unknown zoom tier value | Default to `full-world` (most conservative) |

### File placement

```
src/components/HexMapV2/hooks/
  useAgentAnimations.ts
  useFogCulling.ts
  useZoomLayerVisibility.ts
```

### Post-extraction HexMapV2.tsx

After extraction, HexMapV2.tsx should contain only:
- Ref declarations (unchanged — hooks receive refs, don't own them)
- Scene init + cleanup effect
- Coastline toggle effect
- Selection ring + zoom target effect
- tileLookup builder effect
- Mouse event handlers
- `useImperativeHandle`
- The three hook calls

Target: ~600–700 lines (down from 1,243).

### Testing strategy

- **Unit tests per hook:** Mock refs, verify the effect runs and calls expected functions. These are lightweight — the hooks are side-effect wrappers, not logic.
- **Contract test:** `useAgentAnimations` output (position updates) matches what `AgentSpriteMesh.updateAgentPositions` expects.
- **Integration:** Existing orchestrator tests cover the engine side. Visual verification at `?view=game` confirms the hooks compose correctly.

---

## 2. Signifier Sprites → InstancedMesh with Texture Atlas

### Problem

`SignifierMesh.ts` creates one `THREE.Sprite` per land hex (~2,000–4,000 sprites), each with its own material. This works today but is the biggest draw-call bottleneck in the renderer. Converting to `InstancedMesh` collapses ~4K draw calls to ~20 (one per terrain type).

### Design

#### Texture Atlas Pipeline

Build a texture atlas at init time — one atlas per terrain type that has signifier variants.

```typescript
interface SignifierAtlasEntry {
  terrainType: string;
  variants: { texture: THREE.Texture; uvRect: { u: number; v: number; w: number; h: number } }[];
  atlas: THREE.Texture;       // The combined atlas texture
  atlasWidth: number;         // Atlas pixel width
  atlasHeight: number;        // Atlas pixel height
}

export function buildSignifierAtlas(
  registry: SignifierRegistry
): Map<string, SignifierAtlasEntry>
```

**Atlas layout:** Each terrain type gets its own atlas (typically 1–4 variants per type, so atlas sizes are small — 256×64 to 512×128). Group by terrain type, not by variant, so each InstancedMesh can use a single material.

**UV encoding:** Per-instance UV offset + scale is encoded in `InstancedBufferAttribute` (vec4: `uOffset, vOffset, uScale, vScale`). A custom ShaderMaterial reads these to sample the correct variant from the atlas.

#### InstancedMesh per Terrain Type

```typescript
export function createSignifierMesh(
  tiles: HexTile[],
  seed: number,
  centeredLocationHexes?: Set<string>,
): THREE.Group
```

Signature stays the same. Internal change: instead of N sprites, create one `InstancedMesh` per terrain type.

For each terrain type with signifiers:
1. Count qualifying hexes → `instanceCount`
2. Create `InstancedMesh(hexQuadGeometry, atlasMaterial, instanceCount)`
3. For each qualifying hex:
   - Compute position from `hexToWorld(col, row)` + jitter (via existing `getSignifierParams`)
   - Compute rotation from `getSignifierParams`
   - Encode in instance matrix: `compose(position, rotation, scale)`
   - Write UV rect for the selected variant into the `InstancedBufferAttribute`

#### Custom ShaderMaterial

```glsl
// Vertex shader
attribute vec4 aUvRect;  // (uOffset, vOffset, uScale, vScale)
varying vec2 vUv;

void main() {
  vUv = uv * aUvRect.zw + aUvRect.xy;
  // standard instanced vertex transform
}

// Fragment shader
uniform sampler2D uAtlas;
varying vec2 vUv;

void main() {
  vec4 texel = texture2D(uAtlas, vUv);
  if (texel.a < 0.01) discard;  // transparency cutout
  gl_FragColor = texel;
}
```

**Constants table:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `SIGNIFIER_SPRITE_SCALE` | 1.3 | World-size per hex (unchanged) |
| `SIGNIFIER_Z` | `LAYER_Z.SIGNIFIERS` (0.07) | Z position (unchanged) |
| `SIGNIFIER_SCALE_OVERRIDES` | (existing record) | Per-terrain scale overrides (unchanged) |
| `SIGNIFIER_OFFSET_OVERRIDES` | (existing record) | Per-terrain position offsets (unchanged) |
| `ATLAS_PADDING_PX` | 2 | Padding between atlas cells to prevent bleed |
| `ATLAS_MIN_SIZE` | 64 | Minimum atlas dimension |

**Tracing:** No new trace types. Signifier creation is a render-only concern.

**PRNG callouts:** `getSignifierParams(col, row, seed, variantCount)` — existing seeded mulberry32 PRNG. No changes needed; jitter and variant selection remain deterministic.

**Fail-soft:**

| Failure case | Fallback |
|-------------|----------|
| Terrain type has no signifier in registry | Skip — no InstancedMesh created for that type |
| Atlas build fails (texture load error) | Fall back to solid color instanced quad |
| Zero qualifying hexes for a terrain type | Skip — create no mesh |
| WebGL `MAX_VERTEX_ATTRIBS` exceeded | Log warning, fall back to current sprite approach |

#### Fog integration

Currently, fog culls signifier sprites by setting `sprite.visible = false` per hex. With instancing, per-instance visibility isn't natively supported. Two options:

**Chosen approach:** Per-instance alpha attribute. Add a `float aFogAlpha` instanced attribute. The fragment shader multiplies by this value. Fog culling updates the attribute buffer (1.0 = visible, 0.0 = hidden, 0.45 = explored). Buffer re-upload is cheap — it's a single float per instance vs. the current approach of toggling N sprite visibility flags.

### Testing strategy

- **Unit test:** `createSignifierMesh` returns a Group with one child per terrain type that has signifiers. Each child is an `InstancedMesh` with correct `instanceCount`.
- **Contract test:** Instance matrix positions match `hexToWorld` + jitter for the same seed.
- **Performance:** Compare draw call count before/after (DevTools → Three.js inspector or `renderer.info.render.calls`).
- **Visual:** `?view=game` at regional zoom — signifiers should look identical to current sprites.

---

## 3. Single Agent Sprite with Material Swap

### Problem

Each agent has three sprites (portrait, dot, continental), two of which are always invisible. For 100 agents that's 300 sprites, 300 materials — two-thirds wasted memory.

### Design

**Prerequisite:** TB-030 must land first. It stores `baseScale` in `sprite.userData` and rewrites `updateZoomVisibility` to use `ZOOM_VISIBILITY_MATRIX` + `ZoomTier`. This design builds directly on that.

#### Single sprite per agent

Replace the `portrait + dot + continental` triple with one sprite per agent. The sprite's material, scale, and texture change on zoom tier transitions.

```typescript
export interface AgentSpriteGroup {
  group: THREE.Group;                    // Single group (was three)
  spriteMap: Map<string, {
    sprite: THREE.Sprite;                // Single sprite (was three)
    materials: {
      portrait: THREE.SpriteMaterial;    // Pre-built, cached
      dot: THREE.SpriteMaterial;         // Pre-built, cached
      continental?: THREE.SpriteMaterial; // Pre-built for retinue only
    };
    scales: {
      portrait: number;                  // e.g. agentSpriteScale(AGENT_PORTRAIT_RADIUS)
      dot: number;                       // e.g. agentSpriteScale(AGENT_TOKEN_RADIUS)
      continental?: number;              // e.g. agentSpriteScale(AGENT_DOT_RADIUS)
    };
    isRetinue: boolean;
  }>;
  dispose: () => void;
}
```

#### Zoom swap function

On zoom tier change, iterate `spriteMap` and swap material + scale. **Instant swap** (no cross-fade — the existing `FADE_RANGE` on layer visibility already provides perceptual smoothing).

```typescript
export function updateZoomVisibility(
  group: AgentSpriteGroup,
  tier: ZoomTier
): void {
  // Determine which material tier to show
  const showPortrait = ZOOM_VISIBILITY_MATRIX.agents_portrait[tier];
  const showDot = ZOOM_VISIBILITY_MATRIX.agents_dot[tier];
  const showRetinue = ZOOM_VISIBILITY_MATRIX.agents_retinue[tier];

  for (const [, entry] of group.spriteMap) {
    if (showPortrait) {
      entry.sprite.material = entry.materials.portrait;
      entry.sprite.scale.setScalar(entry.scales.portrait);
      entry.sprite.visible = true;
    } else if (showDot) {
      entry.sprite.material = entry.materials.dot;
      entry.sprite.scale.setScalar(entry.scales.dot);
      entry.sprite.visible = true;
    } else if (showRetinue && entry.isRetinue) {
      entry.sprite.material = entry.materials.continental!;
      entry.sprite.scale.setScalar(entry.scales.continental!);
      entry.sprite.visible = true;
    } else {
      entry.sprite.visible = false;
    }
  }
}
```

#### Animation integration

The animation system (`tickAgentAnimations` in the render loop) currently operates on all three sprites. With single-sprite, it operates on `entry.sprite` only. The `baseScale` stored in `userData` must reflect the *currently active* scale tier so that settle bounce uses the right multiplier.

```typescript
// On zoom swap, also update userData.baseScale
entry.sprite.userData.baseScale = activeScale;
```

#### Portrait loading

`loadAgentPortraits` currently updates both portrait and dot sprite materials. With single-sprite, it updates `entry.materials.portrait` and `entry.materials.dot` (the pre-built material objects). If the current active material is one of those, the change is visible immediately — Three.js materials are shared by reference.

**Constants table:**

| Constant | Default | Purpose |
|----------|---------|---------|
| `AGENT_PORTRAIT_RADIUS` | (existing) | Portrait sprite world-size |
| `AGENT_TOKEN_RADIUS` | (existing) | Dot sprite world-size |
| `AGENT_DOT_RADIUS` | (existing) | Continental sprite world-size |

No new constants. All existing agent-visual-content constants remain unchanged.

**Tracing:** No new trace types. Agent sprite rendering is visual-only.

**PRNG callouts:** Ring slot assignment uses deterministic sorting by agent ID (unchanged).

**Fail-soft:**

| Failure case | Fallback |
|-------------|----------|
| Portrait texture load fails | Material falls back to faction-colored dot (existing behavior) |
| Zoom tier unknown | Default to `full-world` — all sprites hidden |
| Sprite disposal called during animation | Animation system checks `sprite.parent !== null` before updating |

#### Memory impact

| Metric | Before (100 agents) | After (100 agents) | Reduction |
|--------|---------------------|---------------------|-----------|
| Sprites | 300 | 100 | 67% |
| Materials | 300 | 300 (but 200 are cached, not attached) | Marginal GPU savings |
| Geometry refs | 300 | 100 | 67% |
| Draw calls (worst case) | 300 | 100 | 67% |

The main win is draw call reduction and simpler disposal.

### Testing strategy

- **Unit test:** `createAgentSpriteMesh` returns group with exactly one sprite per agent.
- **Contract test:** `updateZoomVisibility` at each tier → correct material and scale on each sprite.
- **Contract test:** Animation system preserves `baseScale` across zoom transitions.
- **Integration:** Hop + settle cycle at hero-local zoom, then zoom out to regional — sprite should swap to dot without visual glitch.
- **Visual:** `?view=game` across all three zoom tiers, with agents in motion.

---

## Implementation Order

1. **Hook extraction** (item 1) — pure refactor, no behavioral changes. Lowest risk. Do first to reduce file complexity before touching agent sprites.
2. **Single agent sprite** (item 3) — depends on TB-030 landing. Behavioral change but contained to `AgentSpriteMesh.ts` + `HexMapV2.tsx` animation wiring.
3. **Signifier instancing** (item 2) — most complex (custom shader, atlas pipeline). Do last. Benefits from the cleaner HexMapV2.tsx that hook extraction produces.

Each item can ship independently. No cross-dependencies between the three beyond the shared benefit of a cleaner main component.

---

## NFP Compliance Summary

| Priority | Verdict | Notes |
|----------|---------|-------|
| #1 Tunability | **PASS** | All existing constants preserved. Two new atlas constants named and defaulted. |
| #2 Inspectability | **PASS** | Hook extraction improves inspectability — each concern is isolated and testable. Zoom tier as React state makes transitions traceable. |
| #3 Determinism | **PASS** | No new random calls. All existing PRNG paths preserved. |
| #4 Fail-soft | **PASS** | Fail-soft tables inline for all three systems. Null ref → skip, missing texture → fallback. |
| #5 Narrative > mechanical | N/A | Renderer, not game logic. |
| #6 Additive > destructive | **PASS** | Hook extraction is additive (new files, shrinking existing). Sprite consolidation replaces interface shape but keeps external API. |
| #7 Performance budget | **PASS** | Signifier instancing is the primary performance improvement. Agent sprite consolidation reduces draw calls 67%. |
