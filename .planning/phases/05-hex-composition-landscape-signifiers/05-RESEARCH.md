# Phase 5: Hex Composition & Landscape Signifiers — Research

**Researched:** 2026-03-22
**Domain:** Three.js sprite/texture rendering, SVG-to-GPU pipeline, slot-based composition system, hand-drawn SVG asset creation
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Signifier color treatment:** Pure black (#1a1a1a) silhouettes — NOT terrain-tinted. Opacity 0.2–0.7 range for depth layers.
- **Lighting convention:** All signifiers have LEFT-SIDE SHADOW (sun from right). Baked into SVG paths, not post-process. Left side: solid/darker fill. Right side: thinner/lighter/open.
- **Multi-layer opacity depth:** Shadow/dark side ~0.2–0.3 opacity layers. Body/main shape ~0.5–0.7 opacity layers.
- **Art style standard:** The 4 hand-drawn SVGs in `Design/` ARE the style standard. Irregular paths, natural variation, cross-hatching for texture in some variants.
- **Asset quality:** Final custom art ships in this phase — no placeholders. All ~80+ SVG variants must be production quality.
- **Signifier rendering rules:**
  - Placement: centered on hex with ±10% position jitter (seeded by hex coordinates)
  - Rotation: ±15° random rotation (seeded) for organic feel
  - Size: scales with hex render size (~40–80px at hero-local ~300px, ~15–30px at regional ~100px)
  - Hidden below regional zoom threshold
  - Variant selection: deterministic per hex (seeded by hex coordinates)
  - Density: 1 primary signifier centered, optionally 1–2 smaller secondary in corners for dense terrain types
- **Phase boundary:** Settlement/location icons and agent rendering are Phase 6. COMP-05 (agent RING layout) is Phase 6.

### Claude's Discretion

- SVG-to-Three.js rendering approach (texture atlas, individual sprites, or shader-drawn)
- Specific production method per terrain type
- Performance optimization for 60K hexes with signifiers
- Exact zoom threshold for signifier visibility/hiding
- Secondary signifier placement rules for dense terrain types
- How to validate readability at small sizes (~12px at regional zoom)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| COMP-01 | Slot-based layout system (CENTER, N, NE, SE, S, SW, NW, FILL, RING) | Composition system architecture documented in brainstorm-hexmap-v2.md; TypeScript interfaces defined |
| COMP-02 | HexVisualManifest interface — preferredSlot, footprint, suppression rules, zoom visibility, priority, fallbacks | Interface spec from design doc; maps to existing render pipeline |
| COMP-03 | Composition resolver collects entities per hex, sorts by priority, assigns slots, evaluates suppression | Pure function pattern; no GPU work; inspectable output per NFP #2 |
| COMP-04 | Major locations suppress terrain signifiers when occupying the same hex | Suppression via SuppressRule within resolver; Phase 6 consumes this |
| LSIG-01 | Each of 27 terrain types has 2–5 SVG signifier variants | All 30 LART requirements map 1:1 to LART art requirements; terrain type name reconciliation needed |
| LSIG-02 | Variant selected deterministically per hex (seeded by hex coordinates) | mulberry32 seeded by `col * 374761393 + row * 668265263 + worldSeed`; same pattern as volcanic placement |
| LSIG-03 | Signifiers rendered with slight position jitter (+/-10%) and rotation (+/-15°) | Per-hex PRNG already established; same seed formula works |
| LSIG-04 | Signifier size scales with hex render size (hidden below regional zoom threshold) | Zoom tier thresholds from STATE.md: hero-local >=15, regional <15, hide below; CanvasTexture scales with sprite size |
| LSIG-05 | All signifiers share consistent stroke weight, detail level, and color treatment | 4 hand-drawn SVGs are the style standard; production method must match their character |
| LART-01 through LART-30 | SVG signifier sets for all 27 terrain types (note: requirements list 30 because some types have more variants listed) | Terrain name reconciliation required (see Pitfall 3); art production pipeline per type |
</phase_requirements>

---

## Summary

Phase 5 delivers two parallel workstreams: (1) a pure TypeScript composition system that assigns visual entities to hex slots, and (2) a Three.js sprite rendering pipeline backed by ~80+ hand-drawn SVG assets. These are largely independent — the composition system is CPU-only logic, while the rendering pipeline is GPU-side.

The critical technical decision left to Claude's discretion is the SVG-to-Three.js rendering approach. The options are texture atlas (all variants baked into one or a few large textures), per-type CanvasTexture (render each SVG variant to an offscreen canvas at startup, cache as THREE.Texture), or instanced sprites (InstancedMesh with UV offsets into atlas). Given that Three.js r183 is in use and the existing codebase relies on InstancedMesh for hex fills, a **texture atlas approach** using `OffscreenCanvas` (or a regular canvas) to rasterize SVG paths at startup, then packed into a sprite sheet, provides the best balance of performance and maintainability at 60K hexes. However, since signifiers are hidden at continental/full-world zoom and only one per hex at hero-local, the performance requirements are not extreme — individual cached `THREE.Sprite` objects per visible hex is also viable and simpler to implement.

The art production work (LART-01 through LART-30) dominates this phase by sheer volume. The four hand-drawn SVGs by Spliid in `Design/` establish the style: complex organic paths, asymmetric sun-from-right shadow baked as lighter right-side paths, and multi-layer opacity depth. Every new SVG must match these. The hex-icon-preview.html already contains 10+ SVG symbols that can serve as a starting point after a rework pass to add the asymmetric lighting treatment.

**Primary recommendation:** Build the composition system (COMP-01–04) first as a pure data module with no rendering dependencies, then build the signifier sprite pipeline (LSIG-01–05) as a scene module following the established `CoastlineMesh.ts` / `RiverMesh.ts` pattern. SVG assets can be developed in parallel in `Design/` and imported as inline path data into the signifier registry.

---

## Standard Stack

### Core (already in project)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| three | ^0.183.2 | THREE.Sprite, THREE.CanvasTexture, THREE.InstancedMesh | Already in project; established pattern from Phases 1–4 |
| TypeScript | ~5.9.3 | Composition system interfaces, signifier registry types | Already in project |

### No New Dependencies Required

This phase requires no new npm dependencies. All rendering primitives (THREE.Sprite, THREE.CanvasTexture, THREE.SpriteMaterial, OffscreenCanvas) are available in the existing Three.js version and browser environment.

**Installation:** None required.

**Version verification:** three@0.183.2 confirmed from package.json. THREE.Sprite and THREE.CanvasTexture are stable APIs present since Three.js r100+.

---

## Architecture Patterns

### Recommended Project Structure

```
src/components/HexMapV2/
├── scene/
│   ├── SignifierMesh.ts          # New: sprite rendering (LSIG-01–05)
│   └── __tests__/
│       └── SignifierMesh.test.ts # Unit tests
├── signifiers/
│   ├── compositionSystem.ts     # New: COMP-01–04 resolver
│   ├── hexVisualManifest.ts     # New: manifest registry per entity type
│   ├── signifierRegistry.ts     # New: SVG path data + metadata per terrain type
│   └── __tests__/
│       └── compositionSystem.test.ts
│       └── signifierRegistry.test.ts
Design/
├── signifiers/                  # New: SVG source files (one per terrain type)
│   ├── grassland-1.svg
│   ├── grassland-2.svg
│   └── ... (80+ files)
```

### Pattern 1: Composition Resolver (Pure Function)

**What:** Takes hex entities (terrain type, optional location, optional agents), returns `{ entity, slot, visible }[]` for that hex.
**When to use:** Called per-hex during render preparation to determine what to draw where.

```typescript
// Source: Design/brainstorm-hexmap-v2.md — "Hex Content Composition System"

export type HexSlot = 'CENTER' | 'N' | 'NE' | 'SE' | 'S' | 'SW' | 'NW' | 'FILL' | 'RING';
export type FootprintSize = 'full' | 'large' | 'medium' | 'small' | 'tiny';

export interface HexVisualManifest {
  entityType: string;           // 'terrain-signifier' | 'major-location' | etc.
  preferredSlot: HexSlot;
  footprint: FootprintSize;
  suppresses: SuppressRule[];
  visibleAt: ZoomTier[];
  priority: number;             // higher = rendered first, lower priority items may be hidden
  fallbackSlots?: HexSlot[];
}

export interface SuppressRule {
  target: 'terrain-signifier' | 'minor-location' | 'sublocation-markers';
  when: 'always' | 'same-slot' | 'footprint-overlap';
}

export interface CompositionResult {
  entity: string;               // entityType identifier
  slot: HexSlot;
  visible: boolean;
}

// Resolution algorithm (NFP #2: pure function — inspectable, traceable):
export function resolveHexComposition(
  entities: HexVisualManifest[],
): CompositionResult[] {
  // 1. Sort by priority desc
  // 2. Assign slots: preferred → fallback → hidden
  // 3. Evaluate suppression rules
  // 4. Return { entity, slot, visible }[]
}
```

### Pattern 2: Signifier Registry

**What:** Maps each terrain type to an array of SVG path data strings (variants). Variant count per terrain type matches REQUIREMENTS.md.
**When to use:** Consumed by SignifierMesh to build textures at startup.

```typescript
// signifierRegistry.ts
export interface SignifierVariant {
  paths: SignifierPath[];       // one or more SVG path elements
  viewBox: string;              // e.g. "0 0 100 100"
}

export interface SignifierPath {
  d: string;                    // SVG path data
  opacity: number;              // 0.2–0.7 per multi-layer depth decision
}

export type SignifierRegistry = Record<string, SignifierVariant[]>;

// Example entry (grassland has 3 variants):
// 'grassland': [
//   { paths: [{ d: '...tufts path...', opacity: 0.6 }], viewBox: '0 0 100 100' },
//   { paths: [{ d: '...wildflowers...', opacity: 0.5 }], viewBox: '0 0 100 100' },
//   { paths: [{ d: '...clean...', opacity: 0.0 }], viewBox: '0 0 100 100' },
// ]
```

### Pattern 3: SVG-to-CanvasTexture Pipeline

**What:** At scene startup, rasterize each SVG variant to an OffscreenCanvas (or regular Canvas), cache as THREE.CanvasTexture, use with THREE.SpriteMaterial.
**When to use:** Preferred approach for simplicity at this scale. 60K hexes but only hero-local + regional zoom show signifiers — total visible at any moment is ~300–5000 sprites.

```typescript
// Source: Three.js r183 official API — THREE.CanvasTexture, THREE.SpriteMaterial
import * as THREE from 'three';

export function buildSignifierTexture(
  variant: SignifierVariant,
  size: number, // pixel size, e.g. 128
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Rasterize SVG path data via Path2D
  for (const path of variant.paths) {
    ctx.globalAlpha = path.opacity;
    ctx.fillStyle = '#1a1a1a';
    ctx.fill(new Path2D(path.d));
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}
```

**Why not SVG-as-image approach:** Loading SVG as an Image and drawing to canvas works but requires async loading. Direct Path2D rasterization is synchronous and avoids network overhead.

**Why not raw shader approach:** Encoding all path data into shaders is complex and inflexible. CanvasTexture is GPU-resident after first draw — no per-frame CPU cost.

### Pattern 4: Per-Hex Seeded Variant Selection

**What:** Given hex coordinates and world seed, deterministically select signifier variant index and compute jitter/rotation values.
**When to use:** Called during SignifierMesh construction to assign a variant to each hex.

```typescript
// Uses existing mulberry32 pattern from src/lib/prng.ts
import { mulberry32 } from '../../../lib/prng';

export function getSignifierParams(
  col: number,
  row: number,
  worldSeed: number,
  variantCount: number,
): { variantIndex: number; jitterX: number; jitterY: number; rotation: number } {
  // Unique seed per hex — same pattern as existing volcanic placement
  const hexSeed = (col * 374761393 + row * 668265263 + worldSeed * 1274126177) | 0;
  const rng = mulberry32(hexSeed);

  const variantIndex = Math.floor(rng() * variantCount);
  const jitterX = (rng() - 0.5) * 0.2;   // ±10% of hex size
  const jitterY = (rng() - 0.5) * 0.2;
  const rotation = (rng() - 0.5) * (Math.PI / 6);  // ±15°

  return { variantIndex, jitterX, jitterY, rotation };
}
```

### Pattern 5: SignifierMesh Scene Module

**What:** Scene-level module (parallel to CoastlineMesh.ts, RiverMesh.ts) that creates THREE.Group of sprites for all visible signifier hexes.
**When to use:** Called from HexMapV2.tsx during scene initialization, same as other mesh modules.

```typescript
// Follows CoastlineMesh.ts / RiverMesh.ts structural pattern
import * as THREE from 'three';
import { RENDER_ORDER } from './RenderLayers';

// SIGNIFIERS render order is already defined: RENDER_ORDER.SIGNIFIERS = 7
export function createSignifierMesh(
  tiles: HexTile[],
  seed: number,
): THREE.Group {
  const group = new THREE.Group();
  group.renderOrder = RENDER_ORDER.SIGNIFIERS;
  // ... populate sprites per land hex
  return group;
}
```

### Pattern 6: Zoom-Based Visibility

**What:** Use existing zoom tier thresholds to show/hide signifier group.
**When to use:** Same pattern as region labels (zoom.on listener that sets group.visible).

From STATE.md (confirmed zoom tier thresholds):
- hero-local: zoom scale >= 15 (hex appears ~300px)
- regional: zoom scale >= 5 and < 15 (hex appears ~100px)
- continental: zoom scale >= 1.5 and < 5
- full-world: zoom scale < 1.5

Signifiers visible at hero-local + regional. Hidden at continental + full-world.

### Anti-Patterns to Avoid

- **One THREE.Sprite per hex at all zoom levels:** Creates 60K objects always in scene. Use group.visible to skip entirely at continental+.
- **Rebuilding sprite textures on every zoom change:** Textures should be built once at startup and reused.
- **Symmetric SVG silhouettes:** The existing hex-icon-preview.html icons are symmetric. They MUST get the asymmetric sun-from-right lighting treatment before use.
- **Stroke-based SVG paths:** The style standard uses fill-only paths (stroke="none"). Strokes scale poorly and break at small sizes.
- **CSS filter for hand-drawn wobble:** hex-icon-preview.html includes `feTurbulence` filter for sketch effect. This does NOT transfer to canvas rasterization via Path2D. All organic character must be in the path geometry itself, not filters.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SVG path rasterization | Custom parser | Browser `Path2D` API | Built-in, handles all SVG path commands (M, L, C, Q, Z), GPU-accelerated |
| Seeded per-hex PRNG | New hash function | `mulberry32` from `src/lib/prng.ts` | Already in project, same function used by existing volcanic placement |
| Slot conflict resolution | Complex grid logic | Priority sort + first-come-first-served per slot | Design doc specifies this exact algorithm |
| Texture atlas packing | Bin-packing algorithm | Simple grid layout (N variants × M terrain types, fixed cell size) | ~80 variants at 128px = 10240px wide, far under GPU limit; grid is trivial |

**Key insight:** The SVG rendering challenge in this phase is entirely solvable with browser-native Path2D + THREE.CanvasTexture. No additional libraries needed.

---

## Common Pitfalls

### Pitfall 1: CSS SVG Filters Don't Rasterize via Path2D

**What goes wrong:** The hex-icon-preview.html uses `feTurbulence`/`feDisplacementMap` filter for organic wobble. When you draw SVG path data onto a canvas via `ctx.fill(new Path2D(d))`, no filters are applied.
**Why it happens:** CSS SVG filters are DOM-level effects, not canvas 2D context effects.
**How to avoid:** Organic character must be in the path geometry itself (irregular vertices, hand-drawn curves). The 4 hand-drawn SVGs by Spliid use organic paths — they read as hand-drawn without any filter.
**Warning signs:** Signifiers look too geometric/perfect at preview stage.

### Pitfall 2: Symmetric SVG Icons from hex-icon-preview.html

**What goes wrong:** The AI-generated icons in hex-icon-preview.html (icon-hill, icon-desert, icon-swamp, icon-tundra, etc.) have symmetric silhouettes. The locked decision requires asymmetric sun-from-right shadow treatment.
**Why it happens:** Default AI art generation produces symmetric shapes; hand-drawn originals were asymmetric by intent.
**How to avoid:** Every icon from hex-icon-preview.html needs a rework pass: left side of shapes gets more filled/opaque paths; right side gets thinner/lighter/open treatment. This is editorial work, not just cleanup.
**Warning signs:** Icon appears identical whether viewed normally or mirrored horizontally.

### Pitfall 3: Terrain Type Name Mismatches

**What goes wrong:** The REQUIREMENTS.md lists terrain types (e.g., `woodland`, `sand_desert`, `hardened_clay`, `volcanic`, `lava`) that do NOT exist in `src/types/index.ts` TerrainType union.
**Why it happens:** Requirements were drafted from the design doc's conceptual terrain catalog; the actual TerrainType union was defined separately during Phase 1 implementation.
**Specific mismatches:**
- LART-05 wants `woodland` — TerrainType has `light_forest` (closest match)
- LART-19 wants `sand_desert` — TerrainType has `desert`
- LART-22 wants `hardened_clay` — no equivalent in TerrainType
- LART-27 wants `volcanic` — TerrainType has `volcano`
- LART-28 wants `lava` — no equivalent in TerrainType
- TerrainType also has: `farmland`, `jungle`, `evergreen_forest`, `arctic`, `great_home_trees`, `oasis` — these appear in the type system but have NO LART requirement
**How to avoid:** The signifier registry keys must use actual TerrainType values. Create a mapping table at the start of 05-01 that reconciles LART requirement names to actual TerrainType names, and flag any terrain types in TerrainType that have no signifier.
**Warning signs:** TypeScript type errors when indexing signifier registry by `tile.terrain`.

### Pitfall 4: Three.js Sprite Z-Ordering with renderOrder

**What goes wrong:** THREE.Sprite objects with the same z-position flicker or render in wrong order relative to other scene elements.
**Why it happens:** THREE.Sprite uses depthTest=false by default. When multiple sprites are at z=0 with SIGNIFIERS render order, they may sort arbitrarily relative to each other.
**How to avoid:** Set a small Z offset for signifier sprites (e.g., z = 0.07, above BORDERS at z=0.06). Use `depthWrite: false` on SpriteMaterial. Set explicit renderOrder = RENDER_ORDER.SIGNIFIERS.
**Warning signs:** Signifiers appear below or above wrong layers at certain zoom levels.

### Pitfall 5: Canvas Path2D Coordinate System vs SVG viewBox

**What goes wrong:** SVG paths defined in a 100×100 viewBox render at the wrong scale when drawn to a 128×128 canvas via Path2D.
**Why it happens:** Path2D uses absolute canvas coordinates — it does NOT respect SVG viewBox scaling.
**How to avoid:** Apply a canvas transform before drawing: `ctx.scale(canvasSize / 100, canvasSize / 100)` before `ctx.fill(new Path2D(d))`, then `ctx.restore()`.
**Warning signs:** Signifiers render as tiny shapes in the corner of the texture.

### Pitfall 6: CanvasTexture Memory at 60K Hexes

**What goes wrong:** Creating one CanvasTexture per hex (60K textures) exhausts GPU memory.
**Why it happens:** Confusion between "one variant per hex" and "one texture per hex."
**How to avoid:** Create only one texture per variant (≤ 5 variants × 27 terrain types = ≤ 135 textures). Many hexes share the same texture, addressed via variant index selection. Total texture memory: 135 × 128×128×4 bytes ≈ 11MB — well within budget.

---

## Code Examples

### Terrain Types Needing Signifiers (From TerrainType union — land types only)

```typescript
// Source: src/types/index.ts — TerrainType
// Water types (ocean, deep_ocean, tropical_ocean, coastal_shallows, coast, lake, river, reef) = NO signifier
// Land types that need signifiers:
const LAND_TERRAIN_TYPES = [
  // Lowlands
  'grassland', 'farmland', 'savanna', 'steppe', 'floodplain',
  // Forest
  'temperate_forest', 'dense_forest', 'boreal_forest', 'jungle',
  'tropical_forest', 'evergreen_forest', 'light_forest', 'dead_forest',
  // Wet
  'swamp', 'marsh', 'moor_bog',
  // Elevated
  'hills', 'mountains', 'high_mountains', 'plateau', 'badlands', 'mountain_pass',
  'forested_hills',
  // Special
  'great_home_trees', 'broken_lands', 'oasis',
  // Extreme
  'desert', 'rocky_desert', 'sand_dunes', 'tundra', 'glacier', 'volcano', 'arctic', 'snow_fields',
] as const;
// Total: 33 land terrain types — more than the 27 in requirements
// Plan 05-01 must decide on coverage (all 33 or just the 27 from requirements)
```

### Existing SVG Assets Available for Rework

From `Design/hex-icon-preview.html` — these 8 symbols exist and can be reworked for sun-from-right treatment:

| Symbol ID | Terrain Coverage | Status |
|-----------|-----------------|--------|
| icon-mountains | mountains | Hand-drawn by Spliid — STYLE STANDARD, production ready |
| icon-hills | hills | Hand-drawn by Spliid — STYLE STANDARD, production ready |
| icon-forest-dense | dense_forest | Hand-drawn by Spliid — STYLE STANDARD, production ready |
| icon-grassland | grassland/steppe | Hand-drawn by Spliid — STYLE STANDARD, production ready |
| icon-hill (single) | hills variant | AI-generated — needs sun-from-right rework |
| icon-forest-light | light_forest/woodland | AI-generated — needs rework |
| icon-forest-conifer | boreal_forest | AI-generated — needs rework |
| icon-desert | sand_dunes/desert | AI-generated — needs rework |
| icon-swamp | swamp | AI-generated — needs rework (uses ellipse+stroke, needs fill-only conversion) |
| icon-tundra | tundra | AI-generated — needs rework (uses circle+stroke) |

Note: `icon-swamp` and `icon-tundra` use `<ellipse>` and `<circle>` elements with stroke — these cannot be captured by Path2D as fill-only shapes. They need path conversion.

### Composition Resolution Example

```typescript
// Source: Design/brainstorm-hexmap-v2.md — composition system spec
// Example manifests and expected resolution:

const TERRAIN_SIGNIFIER_MANIFEST: HexVisualManifest = {
  entityType: 'terrain-signifier',
  preferredSlot: 'FILL',
  footprint: 'full',
  suppresses: [],
  visibleAt: ['hero-local', 'regional'],
  priority: 10,
};

const MAJOR_CITY_MANIFEST: HexVisualManifest = {
  entityType: 'major-location',
  preferredSlot: 'CENTER',
  footprint: 'full',
  suppresses: [{ target: 'terrain-signifier', when: 'always' }],
  visibleAt: ['hero-local', 'regional', 'continental'],
  priority: 90,
};

// When both exist on a hex:
// resolveHexComposition([MAJOR_CITY_MANIFEST, TERRAIN_SIGNIFIER_MANIFEST])
// → [
//     { entity: 'major-location', slot: 'CENTER', visible: true },
//     { entity: 'terrain-signifier', slot: 'FILL', visible: false }, // suppressed
//   ]
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SVG DOM elements per hex | Three.js sprites via CanvasTexture | Phase 1 (2026-03) | 60K hexes viable |
| Symmetric AI-generated icons | Asymmetric hand-drawn silhouettes with baked sun-from-right shadow | Phase 5 (this phase) | Style coherence |
| feTurbulence filter for organic feel | Organic paths in SVG geometry itself | Phase 5 (this phase) | Rasterizable to canvas |
| `<ellipse>` / `<circle>` SVG elements | Fill-only `<path>` elements | Phase 5 rework | Path2D compatible |

**Deprecated/outdated:**
- CSS SVG filter approach (feTurbulence in hex-icon-preview.html): works for HTML display, does not transfer to CanvasTexture rasterization.
- stroke-based SVG rendering: not compatible with fill-only Path2D canvas approach.

---

## Open Questions

1. **Terrain type reconciliation (33 actual vs 27 in requirements)**
   - What we know: TerrainType has 33 land types; REQUIREMENTS.md LART section covers only 27 (derived from design doc's original 27-type catalog)
   - What's unclear: Should farmland, jungle, evergreen_forest, arctic, great_home_trees, oasis each get a signifier set? Or do they fall back to a closest-match signifier?
   - Recommendation: In 05-01 (composition system plan), add a fallback mapping table: types not in signifier registry fall back to their nearest visual cousin (e.g., `jungle` → `tropical_forest`, `arctic` → `snow_fields`, `farmland` → `grassland`). This is a constants table change (NFP #1).

2. **Rendering approach: texture atlas vs individual CanvasTexture**
   - What we know: ≤135 total variants; at any zoom moment, max ~5000 visible hexes at regional
   - What's unclear: Whether THREE.Sprite (one sprite per hex, individual material) or InstancedMesh with UV atlas is worth the implementation complexity
   - Recommendation: Start with individual THREE.Sprite + CanvasTexture per variant (135 textures total, many hexes share same sprite material). Switch to InstancedMesh atlas only if profiling shows >5ms per frame at regional zoom with 5000+ sprites.

3. **Secondary signifier slots (dense terrain)**
   - What we know: Design doc mentions "optionally 1–2 smaller secondary signifiers in corners for denser terrain types"
   - What's unclear: Which terrain types get secondary signifiers; exact slot assignment within FILL
   - Recommendation: Claude's discretion per context — suggest dense_forest, tropical_forest, swamp, forested_hills for secondary signifiers; use NW + SE sub-positions within FILL at 50% scale.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 4.0.18 |
| Config file | `vitest.config.ts` (root) |
| Quick run command | `npm test -- --reporter=dot signifier` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COMP-01 | Slot enum contains CENTER, N, NE, SE, S, SW, NW, FILL, RING | unit | `npm test -- compositionSystem` | ❌ Wave 0 |
| COMP-02 | HexVisualManifest interface shape matches design doc spec | unit | `npm test -- compositionSystem` | ❌ Wave 0 |
| COMP-03 | resolveHexComposition sorts by priority, assigns slots, returns visible flags | unit | `npm test -- compositionSystem` | ❌ Wave 0 |
| COMP-04 | Major location suppresses terrain-signifier per SuppressRule | unit | `npm test -- compositionSystem` | ❌ Wave 0 |
| LSIG-01 | signifierRegistry has entry for each of 27 required terrain types with 2–5 variants | unit | `npm test -- signifierRegistry` | ❌ Wave 0 |
| LSIG-02 | getSignifierParams returns same variantIndex for same col/row/seed | unit | `npm test -- signifierRegistry` | ❌ Wave 0 |
| LSIG-03 | getSignifierParams jitterX/Y within ±0.1, rotation within ±π/12 | unit | `npm test -- signifierRegistry` | ❌ Wave 0 |
| LSIG-04 | createSignifierMesh returns THREE.Group with renderOrder = RENDER_ORDER.SIGNIFIERS | unit | `npm test -- SignifierMesh` | ❌ Wave 0 |
| LSIG-05 | All registry entries use fill-only paths (no stroke), opacity in 0.2–0.7 range | unit | `npm test -- signifierRegistry` | ❌ Wave 0 |
| LART-01–30 | Registry variant counts match REQUIREMENTS.md per terrain type | unit | `npm test -- signifierRegistry` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test -- --reporter=dot signifier composition`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/components/HexMapV2/signifiers/__tests__/compositionSystem.test.ts` — covers COMP-01 through COMP-04
- [ ] `src/components/HexMapV2/signifiers/__tests__/signifierRegistry.test.ts` — covers LSIG-01 through LSIG-05 and LART variant counts
- [ ] `src/components/HexMapV2/scene/__tests__/SignifierMesh.test.ts` — covers LSIG-04 (Three.js group + render order)

---

## Sources

### Primary (HIGH confidence)

- `Design/brainstorm-hexmap-v2.md` (Layer 10 + Hex Content Composition System sections) — composition system interfaces, signifier catalog, rendering rules
- `Design/deepforest-hand-drawn.svg`, `hills-hand-drawn.svg`, `mountain-hand-drawn.svg`, `steppes-hand-drawn.svg` — style standard SVGs, confirmed path structure (fill #1a1a1a, stroke none, viewBox 0 0 100 100)
- `Design/hex-icon-preview.html` — existing SVG symbol inventory (10 symbols, 4 hand-drawn, 6 AI-generated needing rework)
- `src/types/index.ts` — authoritative TerrainType union (33 land types)
- `src/components/HexMapV2/scene/RenderLayers.ts` — RENDER_ORDER.SIGNIFIERS = 7 confirmed
- `src/components/HexMapV2/scene/HexFillMesh.ts` — HEX_CONSTANTS, coordinate system, InstancedMesh pattern
- `src/lib/prng.ts` — mulberry32 PRNG, existing hex seed formula
- `.planning/STATE.md` — zoom tier thresholds (hero-local >=15, regional <15, continental <5, full-world <1.5)
- `.planning/phases/05-hex-composition-landscape-signifiers/05-CONTEXT.md` — locked decisions
- `package.json` — three@0.183.2, vitest@4.0.18 confirmed

### Secondary (MEDIUM confidence)

- `src/components/HexMapV2/scene/CoastlineMesh.ts` — established scene module pattern (imports, constants block, NFP annotations)
- `src/components/HexMapV2/scene/RiverMesh.ts` — mulberry32-based per-hex noise, scene module pattern
- Browser `Path2D` API — stable across all modern browsers; used for canvas-based SVG path rasterization

### Tertiary (LOW confidence)

- THREE.Sprite + THREE.SpriteMaterial performance at ~5000 sprites: training data suggests this is fine; not profiled against this specific codebase.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; Three.js already in use, Path2D is browser-native
- Architecture (composition system): HIGH — spec is fully defined in design doc; TypeScript interfaces are straightforward
- Architecture (rendering pipeline): HIGH — CanvasTexture + THREE.Sprite is well-established Three.js pattern; existing scene module conventions are clear
- SVG art production (LART): MEDIUM — style standard is clear but production of 80+ SVGs is a large creative workload; exact per-type approach is Claude's discretion
- Terrain type reconciliation: HIGH — mismatch is confirmed from direct code inspection; fallback strategy is clear

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable tech stack, no fast-moving libraries)
