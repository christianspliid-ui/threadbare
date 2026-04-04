# Coat of Arms & Icon System Design

**Date:** 2026-04-04
**Status:** Draft — awaiting review

## Summary

A procedural SVG system that generates coat of arms for factions (and kingdoms/armies by extension) plus canonical sphere and reach icons. All visuals are composed at runtime from entity properties — no pre-baked image library. Every faction gets a unique heraldic shield derived from its faction type, sphere alignment, and reach weights.

## Goals

1. Every faction, kingdom, and army has a visually distinct coat of arms
2. Sphere and reach icons replace Unicode glyphs throughout the UI
3. All icons use canonical cosmology colors from the established palette
4. SVG-based — infinitely scalable, no external assets, deterministic
5. Compositions are derived from existing entity properties, not random

## Non-Goals

- Full heraldic achievement (supporters, mantling, motto) — shield only
- AI-generated or raster images
- Animated coat of arms (static SVG; sphere icons may pulse in future)
- Player-customizable heraldry (procedural from world state only)

---

## 1. Coat of Arms Generator

### 1.1 Input Properties

The generator reads these properties from a faction's graph node and definition:

| Property | Source | Drives |
|----------|--------|--------|
| `factionType` | `FactionDefinition.factionType` | Shield division pattern |
| `reachWeights` | `FactionDefinition.reachWeights` | Primary charge symbol, secondary charges |
| Dominant sphere | Derived from highest `reachWeights` via reach→sphere mapping | Tincture (color) palette |
| `themeColor` | `FactionDefinition.themeColor` | Accent/override color (optional tint) |
| Faction power/rank | Runtime state (member count, territory) | Border ornamentation level |

### 1.2 Shield Division Patterns

Each `factionType` maps to a heraldic field division:

| Faction Type | Division | Heraldic Term | Visual |
|-------------|----------|---------------|--------|
| `military` | Vertical split | Per pale | Left/right halves |
| `guild` | Horizontal split | Per fess | Top/bottom halves |
| `religious` | Chevron | Per chevron | V-shaped division |
| `political` | Quartered | Quarterly | Four quadrants |
| `criminal` | Diagonal (sinister) | Per bend sinister | Diagonal split |
| `monster` | Solid field | Plain | Single color, no division |

**Constants:**

```typescript
const DIVISION_BY_FACTION_TYPE: Record<FactionType, DivisionType> = {
  military: 'per_pale',
  guild: 'per_fess',
  religious: 'per_chevron',
  political: 'quarterly',
  criminal: 'per_bend_sinister',
  monster: 'plain',
};
```

### 1.3 Tincture (Color) Palette

Colors are derived from the faction's dominant sphere via the cosmology color system. Each sphere has a canonical color defined in `cosmology-symmetry.html` and used throughout the game:

**Sphere → Color mapping (canonical):**

| Sphere | Color | Hex |
|--------|-------|-----|
| Force | Red | `#ff6b6b` |
| Matter | Amber | `#d4a87a` |
| Energy | Yellow | `#ffe44d` |
| Life | Green | `#33ff77` |
| Mind | Blue | `#44aaff` |
| Spirit | Purple | `#cc66ff` |
| Time | Orange | `#ffb355` |
| Entropy | Teal | `#8fd4c0` |
| Chaos | Silver | `#d4d4d8` |
| Order | Gold | `#fbbf24` |
| Light | Warm ivory | `#fef3c7` |
| Darkness | Violet | `#8b7fbf` |

**Foundation quadrant governs the secondary tincture:**

| Foundation | Governs | Quadrant Feel |
|-----------|---------|---------------|
| Chaos | Force + Entropy | Engines of change — silvers, reds, teals |
| Light | Matter + Energy | Engines of illumination — ambers, yellows, ivories |
| Order | Life + Mind | Engines of stability — greens, blues, golds |
| Darkness | Spirit + Time | Engines of mystery — purples, oranges, violets |

**Tincture derivation algorithm:**

1. Find dominant reach from `reachWeights` (highest weight)
2. Map reach → sphere (1:1 mapping: iron→force, gold→life, etc.)
3. Primary tincture = sphere canonical color
4. Secondary tincture = primary color at 30% brightness (HSL lightness × 0.3) for division contrast
5. Foundation quadrant color used for border/accent
6. Charge color = contrasting light or dark depending on primary tincture luminance

**Constants:**

```typescript
const REACH_TO_SPHERE: Record<ReachDomain, CreationSphereName> = {
  iron: 'force',
  stone: 'matter',
  eye: 'energy',
  gold: 'life',
  veil: 'mind',
  heart: 'spirit',
  star: 'time',
  shadow: 'entropy',
};

const SPHERE_TO_FOUNDATION: Record<CreationSphereName, FoundationSphereName> = {
  force: 'chaos',
  entropy: 'chaos',
  matter: 'light',
  energy: 'light',
  life: 'order',
  mind: 'order',
  spirit: 'darkness',
  time: 'darkness',
};

const SPHERE_COLORS: Record<SphereName, string> = {
  force: '#ff6b6b',
  matter: '#d4a87a',
  energy: '#ffe44d',
  life: '#33ff77',
  mind: '#44aaff',
  spirit: '#cc66ff',
  time: '#ffb355',
  entropy: '#8fd4c0',
  chaos: '#d4d4d8',
  order: '#fbbf24',
  light: '#fef3c7',
  darkness: '#8b7fbf',
};
```

### 1.4 Charges (Central Symbols)

Each reach domain maps to a distinctive SVG charge — a simple geometric symbol recognizable at small sizes:

| Reach | Charge | Description |
|-------|--------|-------------|
| Iron | Crossed swords | Two diagonal lines crossing with crossguard stubs |
| Stone | Anvil | Rectangular block with wider base |
| Eye | Radiant eye | Almond eye shape with radiating lines |
| Gold | Coin/bloom | Circle atop a small base (coin) or organic radial (bloom) |
| Veil | Crescent & veil | Crescent moon with trailing wisps |
| Heart | Heart | Classic heart shape |
| Star | Star | Five- or six-pointed star |
| Shadow | Dagger | Slim triangular blade pointing down |

Each charge is defined as an SVG path function that takes a center point and size, returning SVG elements. Charges are drawn in the contrasting tincture color for visibility against the field.

**Secondary charges:** If the faction has a strong secondary reach (weight within 20% of primary), a smaller secondary charge is placed in a subordinary position (chief, base, or canton depending on division type).

### 1.5 Border & Ornamentation

The shield border reflects faction prominence:

| Level | Condition | Border Style |
|-------|-----------|-------------|
| Base | Default | Simple 2px stroke in foundation quadrant color |
| Established | 5+ members or 2+ territories | Double-line border |
| Dominant | 10+ members or 4+ territories | Double-line with corner ornaments |

**Constants:**

```typescript
const BORDER_THRESHOLDS = {
  established: { members: 5, territories: 2 },
  dominant: { members: 10, territories: 4 },
} as const;
```

### 1.6 Generator Interface

```typescript
interface CoatOfArmsConfig {
  factionType: FactionType;
  dominantReach: ReachDomain;
  secondaryReach?: ReachDomain;       // if within 20% of dominant weight
  dominantSphere: CreationSphereName; // derived from dominantReach
  foundationSphere: FoundationSphereName; // derived from dominantSphere
  prominenceLevel: 'base' | 'established' | 'dominant';
}

/** Returns an SVG string for the coat of arms */
function generateCoatOfArms(config: CoatOfArmsConfig, size: number): string;

/** React component wrapper */
function CoatOfArms(props: { factionId: string; size: number; className?: string }): JSX.Element;
```

The generator is a **pure function** — same config = same SVG output. No PRNG needed since all inputs are deterministic from faction properties.

### 1.7 Rendering Sizes

| Context | Size (px) | Detail Level |
|---------|-----------|-------------|
| Hex map army marker | 24–32 | Shield silhouette + simplified charge |
| Chronicle entry | 24 | Shield silhouette + simplified charge |
| Agent detail badge | 32 | Shield + charge |
| Army sheet | 64 | Full detail |
| Faction sheet header | 128 | Full detail with border ornamentation |

At sizes below 32px, secondary charges and border ornaments are omitted for clarity. The `size` parameter controls this automatically.

---

## 2. Sphere Icons

### 2.1 Design

Each sphere gets a circular SVG icon with a geometric symbol inside:

- **Shape:** Circle (distinguishes from coat of arms shields and reach squares)
- **Background:** Dark tinted with sphere color
- **Symbol:** Geometric design unique to each sphere, drawn in sphere canonical color
- **Border:** 1.5px stroke in sphere canonical color

### 2.2 Sphere Symbol Catalog

| Sphere | Symbol Concept | Visual |
|--------|---------------|--------|
| Force | Radiating impact lines | Three crossed lines from center |
| Matter | Hexagonal crystal | Hexagon outline |
| Energy | Radiant burst | Circle with emanating rays |
| Life | Leaf/seed form | Organic teardrop curves |
| Mind | Concentric focus | Three concentric circles |
| Spirit | Irregular polygon | Six-pointed asymmetric star |
| Time | Hourglass/spiral | Spiral or hourglass form |
| Entropy | Dissolving fragments | Scattered geometric shards |
| Chaos | Starburst | Irregular multi-pointed burst |
| Order | Diamond grid | Overlapping diamond/square |
| Light | Solar disc | Circle with crown of rays |
| Darkness | Eclipse | Circle with occluding crescent |

### 2.3 Interface

```typescript
function SphereIcon(props: { sphere: SphereName; size: number; className?: string }): JSX.Element;

/** Raw SVG string for non-React contexts (hex map layer) */
function generateSphereIconSvg(sphere: SphereName, size: number): string;
```

---

## 3. Reach Icons

### 3.1 Design

Each reach gets a rounded-square SVG icon:

- **Shape:** Rounded rectangle (4px radius at 36px — distinguishes from circular spheres)
- **Background:** Dark tinted with reach canonical color (same as paired sphere)
- **Symbol:** The same charge used on coat of arms for that reach, simplified
- **Border:** 1.5px stroke in reach canonical color

### 3.2 Reach-to-Sphere Color Pairing

Each reach shares its color with its paired sphere — this is the 1:1 mapping from the cosmology:

| Reach | Paired Sphere | Canonical Color | Axiological Pair |
|-------|--------------|-----------------|-----------------|
| Iron | Force | `#ff6b6b` | Mercy ↔ Ruthlessness |
| Stone | Matter | `#d4a87a` | Humility ↔ Pride |
| Eye | Energy | `#ffe44d` | Frankness ↔ Propriety |
| Gold | Life | `#33ff77` | Asceticism ↔ Extravagance |
| Veil | Mind | `#44aaff` | Tradition ↔ Novelty |
| Heart | Spirit | `#cc66ff` | Loyalty ↔ Ambition |
| Star | Time | `#ffb355` | Sacrifice ↔ Survival |
| Shadow | Entropy | `#8fd4c0` | Honesty ↔ Cunning |

### 3.3 Interface

```typescript
function ReachIcon(props: { reach: ReachDomain; size: number; className?: string }): JSX.Element;

/** Raw SVG string for non-React contexts */
function generateReachIconSvg(reach: ReachDomain, size: number): string;
```

---

## 4. File Structure

```
src/components/icons/
  CoatOfArms.tsx          — React component + generator
  SphereIcon.tsx          — Sphere icon component + generator
  ReachIcon.tsx           — Reach icon component + generator
  heraldry/
    shields.ts            — Shield outline SVG path (shared)
    divisions.ts          — Field division patterns (per_pale, per_fess, etc.)
    charges.ts            — Charge symbol SVG paths (sword, anvil, eye, etc.)
    tinctures.ts          — Color derivation from sphere/foundation
    borders.ts            — Border ornamentation by prominence level
  constants.ts            — All named constants (SPHERE_COLORS, REACH_TO_SPHERE, etc.)
  index.ts                — Public exports
```

---

## 5. Integration Points

### 5.1 Hex Map (HexMapV2)

**Army markers:** Replace the current colored-circle army markers in `ArmyLayer.ts` with coat of arms shields. The SVG is rasterized to a texture at the army's display size and rendered as a sprite or decal on the Three.js layer. Since Three.js can't render SVG directly, the approach is:

1. Generate SVG string for the faction's coat of arms
2. Render SVG to an offscreen canvas via `Image` + `canvas.drawImage()`
3. Create `THREE.CanvasTexture` from the canvas
4. Apply to a `THREE.SpriteMaterial` or `PlaneGeometry` quad

Textures are cached per faction ID (factions don't change sphere/type mid-game).

**Territory markers:** At faction seat locations, display a small coat of arms on the hex.

### 5.2 UI Components

| Component | Current | After |
|-----------|---------|-------|
| `FactionSheet.tsx` | `iconGlyph` Unicode + `themeColor` | `<CoatOfArms>` at 128px + sphere/reach icons |
| `FactionEntry.tsx` (chronicle) | Hexagon symbol `⬡` | `<CoatOfArms>` at 24px inline |
| `ArmySheet.tsx` | Placeholder stub | `<CoatOfArms>` at 64px for owning faction |
| Agent detail panel | Faction name text | `<CoatOfArms>` at 32px badge |
| Action cards | Unicode sphere/reach symbols | `<SphereIcon>` and `<ReachIcon>` at 20px |
| Domain capability bars | Text labels | `<ReachIcon>` at 16px inline |
| Cosmology/mandate display | Colored dots/text | `<SphereIcon>` at 24–36px |
| Essence cost indicators | Text | `<SphereIcon>` at 16px inline |

### 5.3 Existing Properties

The `iconGlyph` and `themeColor` fields on `FactionDefinition` remain as fallbacks. The coat of arms system layers on top — if a faction has no resolvable reach weights (edge case), it falls back to rendering the `iconGlyph` on a plain shield with `themeColor`.

---

## 6. NFP Compliance

| Priority | NFP | Status | Notes |
|----------|-----|--------|-------|
| 1 | Tunability | PASS | All colors, thresholds, and mappings are named constants. Division patterns, charge symbols, and border levels are table-driven. |
| 2 | Inspectability | PASS | `CoatOfArmsConfig` is a traceable data structure. Debug panel can display the config that produced any coat of arms. |
| 3 | Determinism | PASS | Pure function — same faction properties = same SVG. No PRNG needed. |
| 4 | Fail-soft | PASS | Missing reach weights → plain shield with `iconGlyph` fallback. Missing sphere mapping → neutral gray tincture. |
| 5 | Narrative over mechanical | PASS | Colors and symbols carry cosmological meaning, not arbitrary decoration. |
| 6 | Additive | PASS | New components alongside existing. `iconGlyph`/`themeColor` preserved as fallbacks. |
| 7 | Performance | PASS | SVG generation is string concatenation — trivially fast. Hex map textures cached per faction. |

---

## 7. Fail-Soft Table

| Failure | Fallback |
|---------|----------|
| Faction has no `reachWeights` | Use `iconGlyph` on plain shield with `themeColor` |
| Reach not in `REACH_TO_SPHERE` map | Neutral gray tincture, generic diamond charge |
| Faction type not in division map | `plain` division (solid field) |
| SVG-to-canvas rasterization fails (hex map) | Fall back to current colored circle marker |
| Sphere/reach icon for unknown value | Return empty `<svg>` with gray circle/square |

---

## 8. Tracing

```typescript
interface CoatOfArmsTrace {
  type: 'coat_of_arms_generated';
  factionId: string;
  config: CoatOfArmsConfig;
  svgSize: number;
  cached: boolean;
}
```

Emitted on first generation per faction per session. Not emitted on cache hits after the first.

---

## 9. Wiring

| Surface | Wiring |
|---------|--------|
| Orchestrator | None — coat of arms generated lazily on first render, not in tick loop |
| UI components | `<CoatOfArms>`, `<SphereIcon>`, `<ReachIcon>` imported from `src/components/icons/` |
| GameState | `CoatOfArmsConfig` computed from faction node properties — not stored in state |
| HexMapV2 | `ArmyLayer.ts` updated to use cached coat of arms textures instead of colored circles |
| Traces | `coat_of_arms_generated` trace on first render |
| Debug visibility | Config inspector in debug panel for any faction |
| Prose pipeline | Not applicable — visual system only |
| Player controls | Not applicable — no player interaction with heraldry |
