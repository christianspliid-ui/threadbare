# Ascendant Portrait System — Design Spec

**Date:** 2026-04-07
**Status:** Draft — awaiting user review

## Problem

Ascendant portraits are keyed by primary sphere only (8 generic energy-being images). Every Mind ascendant looks identical regardless of origin. The portraits don't reflect the mortal the ascendant was before ascending, and they look nothing like a person — just abstract energy.

**Design direction:** "An ascendant doesn't look very different from the person they were before, unless you look closely." The portrait should read as a mortal first, with divine framing as the tell.

## Design

Two-layer composited portrait system:

1. **Origin portrait** (12 images) — the mortal they were. Shepherd, commander, healer, merchant, judge, rebel, scholar, ruler, wanderer, priest, dreamer, artisan. Rendered in Remembrance digital painting style: atmospheric dark fantasy, mortal person in their element, subtle magic thread hints.

2. **Sphere frame** (8 images) — ornate picture frame on black/transparent background. Each frame uses its sphere's signature colors and form language from STYLE.md (Mind = blue neural dendrites, Force = crimson angular streaks, Life = emerald organic branching, etc.).

**Runtime compositing:** Canvas draws origin portrait, then overlays sphere frame on top. Result is cached per identity (origin + sphere pair). 20 assets → 96 unique portraits.

## Assets

### Origin Portraits (12)

Pre-baked static PNGs, AI-generated in Remembrance style. Portrait orientation, ~512×640px.

| Origin ID | Subject |
|-----------|---------|
| `recent-shepherd` | Shepherd with crook, pastoral clothing, weathered face |
| `recent-commander` | Military commander, armor fragments, commanding posture |
| `recent-healer` | Healer with herbs/poultices, gentle hands, care-worn |
| `recent-merchant` | Merchant, rich but practical clothing, calculating eyes |
| `recent-judge` | Judge/magistrate, formal robes, stern bearing |
| `recent-rebel` | Rebel, rough clothing, defiant expression, scars |
| `ancient-scholar` | Scholar, ancient texts, ink-stained fingers, deep eyes |
| `ancient-ruler` | Ruler, crown/circlet, regal bearing, heavy burden |
| `ancient-wanderer` | Wanderer, travel-worn cloak, distant gaze, road dust |
| `ancient-priest` | Priest, ritual vestments, serene or haunted expression |
| `ancient-dreamer` | Dreamer, ethereal quality, unfocused eyes, soft features |
| `ancient-artisan` | Artisan, tool marks on hands, creative intensity |

**Art direction:**
- Remembrance style: atmospheric dark fantasy digital painting, clean rendering
- Subject fills most of the frame, head-and-shoulders to waist
- Dark background that dissolves at edges (will be covered by frame anyway)
- Subtle magic thread hints on clothing/skin (10–15% coverage, neutral/white — sphere color comes from frame)
- Emotionally grounded — the feeling comes from recognizing a real person

**Storage:** `/public/portraits/origin-{id}.png` (e.g., `origin-recent-shepherd.png`)

### Sphere Frames (8)

Pre-baked static PNGs with transparency, AI-generated. Same dimensions as portraits (~512×640px).

| Sphere | Colors | Form Language |
|--------|--------|---------------|
| Force | `#ff4444` / `#ff6b6b` | Sharp angular streaks, blade-like edges |
| Matter | `#8b6b4a` / `#a8886a` | Crystalline lattice, geometric facets |
| Energy | `#ffd700` / `#ffe44d` | Radiating spikes, corona flares |
| Life | `#00cc55` / `#33ff77` | Organic branching tendrils, vine-like |
| Mind | `#2288ff` / `#44aaff` | Neural dendrite patterns, branching filaments |
| Spirit | `#aa44dd` / `#cc66ff` | Ascending wisps, ethereal smoke curls |
| Time | `#ff9933` / `#ffb355` | Concentric ripples, layered rings |
| Entropy | `#5a8a7a` / `#7aaa9a` | Fracturing cracks, decay patterns |

**Art direction:**
- Ornate picture frame on black background (black = transparent after processing, or generate with alpha directly)
- Frame occupies the border region (~15–20% of image on each side)
- Center is fully transparent/black — portrait shows through
- Sphere colors and form language define the decorative motifs
- Should feel like a divine artifact, not a UI widget — weathered, ancient, magical

**Storage:** `/public/portraits/frame-{sphere}.png` (e.g., `frame-mind.png`)

## Compositing

### `composePortrait(originId, primarySphere, size?)` → `HTMLCanvasElement`

Canvas-based compositing utility:

1. Load origin portrait image
2. Load sphere frame image
3. Create canvas at target size (default 512×640)
4. Draw origin portrait (fills canvas)
5. Draw sphere frame on top (composited — black regions become transparent, or use alpha if generated with transparency)
6. Return canvas (or convert to data URL / ImageBitmap for texture use)

**Caching:** Results cached by `${originId}-${primarySphere}` key. Cache lives in `SimulationRuntime` (per-session, not module scope — per architectural decision).

### Circular crop variant

For hex map and identity chip, a circular crop is needed:

1. Compose full portrait (above)
2. Create circular canvas at target size (128×128 for hex, 28×28 for chip)
3. Clip to circle, draw composed portrait centered (head region)
4. Return circular canvas

## Integration Points

### 1. Asset Registry — `src/data/avatar-portrait-assets.ts`

**Current:** `AVATAR_PORTRAITS: Record<SphereName, string>` + `getAvatarPortraitUrl(sphere)`

**New:**
```typescript
// Origin portraits keyed by origin fragment ID
const ORIGIN_PORTRAITS: Record<string, string> = {
  'origin.recent-shepherd': '/portraits/origin-recent-shepherd.png',
  'origin.recent-commander': '/portraits/origin-recent-commander.png',
  // ... all 12
};

// Sphere frames keyed by sphere name
const SPHERE_FRAMES: Record<SphereName, string> = {
  force: '/portraits/frame-force.png',
  matter: '/portraits/frame-matter.png',
  // ... all 8
};

function getOriginPortraitUrl(originFragmentId: string): string;
function getSphereFrameUrl(primarySphere: SphereName): string;
```

**Deprecation:** `AVATAR_PORTRAITS` and `getAvatarPortraitUrl()` are replaced. Old `/portraits/avatar-*.png` files can be removed once migration is complete.

### 2. Hex Map Agent Rendering — `agentPortraitTextures.ts`

**Current:** `loadPortraitTexture(url, ringColor, isRetinue, options?)` loads a single portrait URL.

**Change:** The `portraitUrl` passed to this function changes from the sphere-keyed avatar to the origin-keyed portrait. The compositing with the sphere frame happens upstream — the hex map circular crop doesn't show the frame (the sphere-colored ring serves that purpose already).

Flow:
- `AgentRenderData.portraitUrl` = `getOriginPortraitUrl(identity.originFragmentId)`
- Existing `loadPortraitTexture()` handles circular crop + sphere ring as before
- No changes needed inside `agentPortraitTextures.ts` itself

### 3. Character Sheet Modal

**Current:** Shows the sphere-keyed energy-being portrait.

**Change:** Show full composed portrait (origin + sphere frame). This is the primary showcase surface where the frame is visible.

- Call `composePortrait(originId, primarySphere)`
- Render resulting canvas/image at ~200×250px in the character sheet header
- Replace current portrait display

### 4. Identity Chip — `IdentityChip.tsx`

**Current:** Shows sphere icon glyph + avatar name text. No portrait.

**Change:** Add small circular portrait thumbnail (28×28px) alongside or replacing the sphere icon.

- Use circular crop variant of composed portrait
- Sphere icon can remain as secondary indicator or be removed (user preference)

### 5. Data Flow

The origin fragment ID is already stored in `AscendantIdentity.originFragmentId` and the primary sphere in `AscendantIdentity.sphereAlignment.primary`. Both are available wherever the identity is consumed. No new game state fields needed.

## NFP Compliance

| Priority | NFP | Status |
|----------|-----|--------|
| 1 | Tunability | PASS — Portrait/frame sizes, cache strategy, and composition blend modes are named constants |
| 2 | Inspectability | PASS — Composed portrait is deterministic from originId + sphere. Debug bridge can expose `getOriginPortraitUrl()` |
| 3 | Determinism | PASS — Same identity always produces same portrait (no randomness in compositing) |
| 4 | Fail-soft | PASS — Missing portrait/frame falls back to current sphere-keyed avatar. Missing origin maps to a default portrait |
| 5 | Narrative > mechanical | PASS — Mortal-first portrait serves narrative identity |
| 6 | Additive | PASS — New asset registry functions added alongside existing. Old functions deprecated, not removed until migration complete |
| 7 | Performance | PASS — Composed portraits cached per identity. Only 1 composition per unique origin+sphere pair per session |

## Future Extensions (not in v1)

- **Hunger influence:** Could add a third layer (hunger-specific color grading or edge treatment) composited between portrait and frame
- **Secondary sphere:** Subtle secondary color accent in the frame corners
- **Drive expression:** Generate origin×drive portrait variants (mood/expression differences)
- **Time since ascension:** Recent origins look younger/fresher, ancient origins show age
- **Court emblem:** Small court symbol watermark in frame corner
